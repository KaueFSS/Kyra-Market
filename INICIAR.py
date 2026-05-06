import subprocess
import os
import sys
import time
import webbrowser
import threading
import json
import urllib.request

# ───────────────────────────────────────────────
# Caminhos
# ───────────────────────────────────────────────
pasta           = os.path.dirname(os.path.abspath(__file__))
pasta_backend   = os.path.join(pasta, "sistema_estoque")
pasta_frontend  = os.path.join(pasta, "sistema_estoque", "front-end")
pasta_metabase  = os.path.join(pasta, "sistema_estoque", "metabase")
requirements    = os.path.join(pasta, "Materiais", "requirements.txt")
node_modules    = os.path.join(pasta_frontend, "node_modules")
creds_path      = os.path.join(pasta_metabase, "metabase_creds.json")
metabase_jar    = os.path.join(pasta_metabase, "metabase.jar")
metabase_db     = os.path.join(pasta_metabase, "metabase.db")
django_sqlite   = os.path.join(pasta_backend, "db.sqlite3")

METABASE_PORT   = 3000
METABASE_URL    = f"http://localhost:{METABASE_PORT}"

# ───────────────────────────────────────────────
# Dependências Python
# ───────────────────────────────────────────────
print("=" * 55)
print("  MERCADINHO — Sistema de Gestão")
print("=" * 55)
print("\n[1/5] Verificando dependências Python...")
subprocess.run([sys.executable, "-m", "pip", "install", "-r", requirements],
               check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print("      ✓ OK")

# ───────────────────────────────────────────────
# Dependências Node
# ───────────────────────────────────────────────
print("\n[2/5] Verificando dependências Node.js...")
if not os.path.exists(node_modules):
    print("      Executando npm install...")
    subprocess.run(["npm", "install"], cwd=pasta_frontend, shell=True, check=True)
else:
    print("      ✓ OK")

# ───────────────────────────────────────────────
# Iniciar Backend Django
# ───────────────────────────────────────────────
print("\n[3/5] Iniciando Backend Django (porta 8000)...")
backend = subprocess.Popen(
    [sys.executable, "manage.py", "runserver"],
    cwd=pasta_backend,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
time.sleep(2)
print("      ✓ http://localhost:8000")

# ───────────────────────────────────────────────
# Iniciar Frontend Vite
# ───────────────────────────────────────────────
print("\n[4/5] Iniciando Frontend React (porta 5173)...")
frontend = subprocess.Popen(
    ["npm", "run", "dev"],
    cwd=pasta_frontend,
    shell=True,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
print("      ✓ http://localhost:5173")

# ───────────────────────────────────────────────
# Iniciar Metabase (silencioso — sem abrir browser)
# ───────────────────────────────────────────────
metabase = None

if os.path.exists(metabase_jar):
    print(f"\n[5/5] Iniciando Metabase em background (porta {METABASE_PORT})...")
    env = os.environ.copy()
    env["MB_DB_TYPE"]    = "h2"
    env["MB_DB_FILE"]    = metabase_db
    env["MB_JETTY_PORT"] = str(METABASE_PORT)

    metabase = subprocess.Popen(
        ["java", "-jar", metabase_jar],
        cwd=pasta_metabase,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print("      Metabase iniciando em background...")
else:
    print("\n[5/5] metabase.jar não encontrado — ignorado.")

# ───────────────────────────────────────────────
# Abrir apenas o sistema no navegador
# ───────────────────────────────────────────────
time.sleep(3)
webbrowser.open("http://localhost:5173")
print("\n      ✓ Sistema aberto em http://localhost:5173")

# ───────────────────────────────────────────────
# Rotina em background: aguarda Metabase e
# atualiza o caminho do banco Django automaticamente
# ───────────────────────────────────────────────
def api_call(method, path, data=None, token=None):
    url = f"{METABASE_URL}{path}"
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["X-Metabase-Session"] = token
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    r = urllib.request.urlopen(req, timeout=10)
    return json.loads(r.read())


def esperar_metabase(timeout=180):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = urllib.request.urlopen(f"{METABASE_URL}/api/health", timeout=4)
            if r.status == 200:
                return True
        except Exception:
            pass
        time.sleep(5)
    return False


def corrigir_banco_metabase(token):
    """
    Encontra a conexão SQLite no Metabase e atualiza o caminho
    para apontar para o db.sqlite3 atual do Django.
    """
    try:
        databases = api_call("GET", "/api/database", token=token)
        dbs = databases if isinstance(databases, list) else databases.get("data", [])

        for db in dbs:
            engine = db.get("engine", "")
            if engine == "sqlite":
                db_id = db["id"]
                details = db.get("details", {})
                caminho_atual = details.get("db", "")

                # Normaliza barras para comparar
                caminho_norm = caminho_atual.replace("\\", "/").lower()
                django_norm  = django_sqlite.replace("\\", "/").lower()

                if caminho_norm != django_norm:
                    print(f"\n      [Metabase] Atualizando caminho do banco:")
                    print(f"      De: {caminho_atual}")
                    print(f"      Para: {django_sqlite}")
                    details["db"] = django_sqlite
                    api_call("PUT", f"/api/database/{db_id}",
                             data={"details": details}, token=token)
                    # Força re-sync do schema
                    api_call("POST", f"/api/database/{db_id}/sync_schema", token=token)
                    print("      ✓ Banco atualizado e sincronizado!")
                else:
                    print("\n      [Metabase] ✓ Caminho do banco já está correto.")
                    # Sincroniza de qualquer forma para garantir dados atualizados
                    api_call("POST", f"/api/database/{db_id}/sync_schema", token=token)
                return

        print("\n      [Metabase] Nenhuma conexão SQLite encontrada.")
    except Exception as e:
        print(f"\n      [Metabase] Erro ao corrigir banco: {e}")


def rotina_metabase():
    if metabase is None:
        return

    print("\n      [Metabase] Aguardando inicialização (pode levar ~60s)...")
    if not esperar_metabase(timeout=180):
        print("      [Metabase] Timeout — verifique se Java está instalado.")
        return

    print("      [Metabase] ✓ Online!")

    # Login
    if not os.path.exists(creds_path):
        print("      [Metabase] Credenciais não encontradas.")
        return

    with open(creds_path) as f:
        creds = json.load(f)

    try:
        result = api_call("POST", "/api/session", data={
            "username": creds["email"],
            "password": creds["password"],
        })
        token = result.get("id")
    except Exception as e:
        print(f"      [Metabase] Erro no login: {e}")
        return

    if not token:
        print("      [Metabase] Login falhou.")
        return

    print("      [Metabase] ✓ Login OK")

    # Corrige o caminho do banco
    corrigir_banco_metabase(token)


threading.Thread(target=rotina_metabase, daemon=True).start()

# ───────────────────────────────────────────────
# Status e manter vivo
# ───────────────────────────────────────────────
print("\n" + "=" * 55)
print("  Tudo rodando! Ctrl+C para encerrar.")
print(f"  • Sistema:   http://localhost:5173")
print(f"  • API:       http://localhost:8000")
print(f"  • Metabase:  http://localhost:{METABASE_PORT}  (background)")
print("=" * 55 + "\n")


def aguardar(proc, nome):
    proc.wait()
    print(f"\n  [{nome}] Processo encerrado.")


processos = [(backend, "Django"), (frontend, "Vite")]
if metabase:
    processos.append((metabase, "Metabase"))

threads = [threading.Thread(target=aguardar, args=p, daemon=True) for p in processos]
for t in threads:
    t.start()

try:
    for t in threads:
        t.join()
except KeyboardInterrupt:
    print("\n  Encerrando...")
    for proc, nome in processos:
        proc.terminate()
        print(f"  [{nome}] encerrado.")
