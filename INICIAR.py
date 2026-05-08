"""
Mercadinho — Inicializador cross-platform.

Funciona em Windows, macOS e Linux (incluindo distros com PEP 668 ativado).
- Verifica Python, Node e NPM antes de começar
- Instala dependências Python (com fallback pra --user e --break-system-packages no Linux)
- Instala dependências Node se faltar node_modules
- Sobe Django, Vite e (opcional) Metabase em paralelo
- Encerra todos os processos no Ctrl+C
"""

import json
import os
import platform
import shutil
import signal
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser

# ─────────────────────────────────────────────────────────────────────────────
# Plataforma
# ─────────────────────────────────────────────────────────────────────────────
IS_WINDOWS = platform.system() == "Windows"
IS_LINUX   = platform.system() == "Linux"
IS_MAC     = platform.system() == "Darwin"

# Garante UTF-8 no stdout pra emojis funcionarem em qualquer terminal
if IS_WINDOWS:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# No Windows, npm é npm.cmd — só roda via shell. Em Linux/Mac, shell direto não.
NPM_SHELL = IS_WINDOWS

# ─────────────────────────────────────────────────────────────────────────────
# Caminhos
# ─────────────────────────────────────────────────────────────────────────────
pasta          = os.path.dirname(os.path.abspath(__file__))
pasta_backend  = os.path.join(pasta, "sistema_estoque")
pasta_frontend = os.path.join(pasta, "sistema_estoque", "front-end")
pasta_metabase = os.path.join(pasta, "sistema_estoque", "metabase")
requirements   = os.path.join(pasta, "Materiais", "requirements.txt")
node_modules   = os.path.join(pasta_frontend, "node_modules")
creds_path     = os.path.join(pasta_metabase, "metabase_creds.json")
metabase_jar   = os.path.join(pasta_metabase, "metabase.jar")
metabase_db    = os.path.join(pasta_metabase, "metabase.db")
django_sqlite  = os.path.join(pasta_backend, "db.sqlite3")

METABASE_PORT = 3000
METABASE_URL  = f"http://localhost:{METABASE_PORT}"

# ─────────────────────────────────────────────────────────────────────────────
# Verificação de pré-requisitos
# ─────────────────────────────────────────────────────────────────────────────
def comando_existe(cmd):
    """Verifica se um comando existe no PATH (cross-platform)."""
    return shutil.which(cmd) is not None


def abortar(msg, ajuda=""):
    print("\n" + "=" * 60)
    print(f"  ✗ ERRO: {msg}")
    if ajuda:
        print(f"\n  Como resolver:\n  {ajuda}")
    print("=" * 60)
    sys.exit(1)


print("=" * 60)
print("  MERCADINHO — Sistema de Gestão")
print(f"  Plataforma: {platform.system()} {platform.release()}")
print("=" * 60)

# Python
print(f"\n  • Python  : {sys.version.split()[0]}")

# Node
if not comando_existe("node"):
    abortar(
        "Node.js não encontrado.",
        "Instale em https://nodejs.org/ (LTS, versão 18 ou superior).\n"
        "  No Linux:  sudo apt install nodejs npm  (ou equivalente)",
    )
node_ver = subprocess.run(["node", "--version"], capture_output=True, text=True).stdout.strip()
print(f"  • Node    : {node_ver}")

# NPM
if not comando_existe("npm"):
    abortar(
        "npm não encontrado.",
        "Geralmente vem com o Node.js. Reinstale o Node se necessário.",
    )
npm_ver = subprocess.run(["npm", "--version"], capture_output=True, text=True, shell=NPM_SHELL).stdout.strip()
print(f"  • NPM     : {npm_ver}")

# Java (opcional, só pro Metabase)
java_disponivel = comando_existe("java")
if java_disponivel:
    try:
        java_ver = subprocess.run(
            ["java", "-version"], capture_output=True, text=True
        ).stderr.split("\n")[0]
        print(f"  • Java    : {java_ver}")
    except Exception:
        pass

# ─────────────────────────────────────────────────────────────────────────────
# Instalar dependências Python (com fallback pra PEP 668)
# ─────────────────────────────────────────────────────────────────────────────
def instalar_pacotes_python():
    base_cmd = [sys.executable, "-m", "pip", "install", "-r", requirements]

    # Detecta se está dentro de um virtualenv
    em_venv = (
        hasattr(sys, "real_prefix")
        or (hasattr(sys, "base_prefix") and sys.base_prefix != sys.prefix)
        or os.environ.get("VIRTUAL_ENV") is not None
    )

    tentativas = []

    if em_venv:
        # Virtualenv: install normal
        tentativas.append(base_cmd)
    else:
        # Sem venv: tenta sem flags primeiro
        tentativas.append(base_cmd)
        # Linux com PEP 668 (Debian/Ubuntu 23.04+, Fedora 38+):
        # exige --user OU --break-system-packages
        tentativas.append(base_cmd + ["--user"])
        tentativas.append(base_cmd + ["--user", "--break-system-packages"])

    ultimo_erro = None
    for cmd in tentativas:
        try:
            subprocess.run(
                cmd,
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
            )
            return  # sucesso
        except subprocess.CalledProcessError as e:
            ultimo_erro = e.stderr.decode(errors="ignore") if e.stderr else str(e)
            continue

    abortar(
        "Não foi possível instalar pacotes Python.",
        f"Erro: {ultimo_erro[:300] if ultimo_erro else 'desconhecido'}\n"
        f"  Tente manualmente:\n"
        f"  {sys.executable} -m pip install -r \"{requirements}\"",
    )


print("\n[1/5] Verificando dependências Python...")
instalar_pacotes_python()
print("      ✓ OK")

# ─────────────────────────────────────────────────────────────────────────────
# Instalar dependências Node
# ─────────────────────────────────────────────────────────────────────────────
print("\n[2/5] Verificando dependências Node.js...")
if not os.path.exists(node_modules):
    print("      Executando npm install (pode levar alguns minutos)...")
    try:
        subprocess.run(
            ["npm", "install"],
            cwd=pasta_frontend,
            shell=NPM_SHELL,
            check=True,
        )
    except subprocess.CalledProcessError as e:
        abortar(
            "Falha ao executar npm install.",
            f"Verifique sua conexão e rode manualmente:\n"
            f"  cd \"{pasta_frontend}\"\n  npm install",
        )
print("      ✓ OK")

# ─────────────────────────────────────────────────────────────────────────────
# Backend Django
# ─────────────────────────────────────────────────────────────────────────────
print("\n[3/5] Iniciando Backend Django (porta 8000)...")
backend = subprocess.Popen(
    [sys.executable, "manage.py", "runserver"],
    cwd=pasta_backend,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
time.sleep(2)
print("      ✓ http://localhost:8000")

# ─────────────────────────────────────────────────────────────────────────────
# Frontend Vite
# ─────────────────────────────────────────────────────────────────────────────
print("\n[4/5] Iniciando Frontend React (porta 5173)...")
frontend = subprocess.Popen(
    ["npm", "run", "dev"],
    cwd=pasta_frontend,
    shell=NPM_SHELL,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
print("      ✓ http://localhost:5173")

# ─────────────────────────────────────────────────────────────────────────────
# Metabase (opcional — só se Java + .jar existirem)
# ─────────────────────────────────────────────────────────────────────────────
metabase = None

if java_disponivel and os.path.exists(metabase_jar):
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
elif not java_disponivel:
    print("\n[5/5] Java não encontrado — Metabase ignorado (opcional).")
else:
    print("\n[5/5] metabase.jar não encontrado — Metabase ignorado (opcional).")

# ─────────────────────────────────────────────────────────────────────────────
# Abrir o sistema no navegador
# ─────────────────────────────────────────────────────────────────────────────
time.sleep(3)
try:
    webbrowser.open("http://localhost:5173")
    print("\n      ✓ Sistema aberto em http://localhost:5173")
except Exception:
    print("\n      ⚠ Navegador não abriu. Acesse manualmente: http://localhost:5173")

# ─────────────────────────────────────────────────────────────────────────────
# Rotina em background: corrige caminho do banco no Metabase
# ─────────────────────────────────────────────────────────────────────────────
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
    try:
        databases = api_call("GET", "/api/database", token=token)
        dbs = databases if isinstance(databases, list) else databases.get("data", [])

        for db in dbs:
            if db.get("engine", "") != "sqlite":
                continue

            db_id = db["id"]
            details = db.get("details", {})
            caminho_atual = details.get("db", "")

            caminho_norm = caminho_atual.replace("\\", "/").lower()
            django_norm  = django_sqlite.replace("\\", "/").lower()

            if caminho_norm != django_norm:
                print(f"\n      [Metabase] Atualizando caminho do banco:")
                print(f"      De  : {caminho_atual}")
                print(f"      Para: {django_sqlite}")
                details["db"] = django_sqlite
                api_call("PUT", f"/api/database/{db_id}",
                         data={"details": details}, token=token)
                api_call("POST", f"/api/database/{db_id}/sync_schema", token=token)
                print("      ✓ Banco atualizado e sincronizado!")
            else:
                print("\n      [Metabase] ✓ Caminho do banco já correto.")
                api_call("POST", f"/api/database/{db_id}/sync_schema", token=token)
            return

        print("\n      [Metabase] Nenhuma conexão SQLite encontrada.")
    except Exception as e:
        print(f"\n      [Metabase] Erro ao corrigir banco: {e}")


def rotina_metabase():
    if metabase is None:
        return

    print("\n      [Metabase] Aguardando inicialização (~60s)...")
    if not esperar_metabase(timeout=180):
        print("      [Metabase] Timeout — verifique se Java está instalado.")
        return

    print("      [Metabase] ✓ Online!")

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
    corrigir_banco_metabase(token)


threading.Thread(target=rotina_metabase, daemon=True).start()

# ─────────────────────────────────────────────────────────────────────────────
# Status e manter vivo
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  Tudo rodando! Ctrl+C para encerrar.")
print(f"  • Sistema  : http://localhost:5173")
print(f"  • API      : http://localhost:8000")
if metabase:
    print(f"  • Metabase : http://localhost:{METABASE_PORT}  (background)")
print("=" * 60 + "\n")


def aguardar(proc, nome):
    proc.wait()
    print(f"\n  [{nome}] Processo encerrado.")


processos = [(backend, "Django"), (frontend, "Vite")]
if metabase:
    processos.append((metabase, "Metabase"))

threads = [threading.Thread(target=aguardar, args=p, daemon=True) for p in processos]
for t in threads:
    t.start()


def encerrar(*_):
    print("\n  Encerrando...")
    for proc, nome in processos:
        try:
            if IS_WINDOWS:
                proc.terminate()
            else:
                # Em Linux/Mac, manda SIGTERM e dá tempo pra cleanup
                proc.send_signal(signal.SIGTERM)
            print(f"  [{nome}] encerrado.")
        except Exception:
            pass
    sys.exit(0)


# Captura SIGINT (Ctrl+C) e SIGTERM em todas as plataformas
signal.signal(signal.SIGINT, encerrar)
if not IS_WINDOWS:
    signal.signal(signal.SIGTERM, encerrar)

try:
    for t in threads:
        t.join()
except KeyboardInterrupt:
    encerrar()
