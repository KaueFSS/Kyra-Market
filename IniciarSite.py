"""
Mercadinho — Hospedagem em rede (Radmin VPN / LAN).

Diferente do INICIAR.py (que só roda local), esse script:
  - Detecta automaticamente seu IP do Radmin VPN (26.x.x.x)
  - Detecta IPs de LAN como fallback (192.168.x.x / 10.x.x.x)
  - Sobe Django, Vite e Metabase escutando em 0.0.0.0
  - Mostra os links que você pode mandar pros amigos da rede

Funcionará em qualquer pessoa conectada ao mesmo Radmin VPN.
"""

import json
import os
import platform
import re
import shutil
import signal
import socket
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

if IS_WINDOWS:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

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

PORT_DJANGO   = 8000
PORT_VITE     = 5173
PORT_METABASE = 3000


# ─────────────────────────────────────────────────────────────────────────────
# Detecção de IPs (Radmin / LAN)
# ─────────────────────────────────────────────────────────────────────────────
def listar_ips_locais():
    """Retorna todos os IPs IPv4 da máquina (cross-platform, sem libs externas)."""
    ips = set()

    # 1. Truque do socket UDP — pega o IP "default" usado pra sair pra internet
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ips.add(s.getsockname()[0])
        s.close()
    except Exception:
        pass

    # 2. Hostname → tenta resolver pra todos os IPs
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if ip and not ip.startswith("127."):
                ips.add(ip)
    except Exception:
        pass

    # 3. ipconfig (Windows) ou ip addr / ifconfig (Linux/Mac) — captura interfaces
    try:
        if IS_WINDOWS:
            out = subprocess.run(
                ["ipconfig"], capture_output=True, text=True,
                encoding="cp850", errors="ignore",
            ).stdout
            for ip in re.findall(r"IPv4[^\n:]*:\s*(\d+\.\d+\.\d+\.\d+)", out):
                ips.add(ip)
        else:
            cmd = ["ip", "-4", "addr"] if shutil.which("ip") else ["ifconfig"]
            try:
                out = subprocess.run(cmd, capture_output=True, text=True).stdout
                for ip in re.findall(r"inet\s+(\d+\.\d+\.\d+\.\d+)", out):
                    if not ip.startswith("127."):
                        ips.add(ip)
            except FileNotFoundError:
                pass
    except Exception:
        pass

    return sorted(ips)


def classificar_ip(ip):
    """Devolve um nome legível pro tipo de rede do IP."""
    if ip.startswith("26."):
        return "Radmin VPN"
    if ip.startswith("192.168."):
        return "LAN doméstica"
    if ip.startswith("10."):
        return "LAN corporativa"
    if re.match(r"^172\.(1[6-9]|2\d|3[01])\.", ip):
        return "LAN privada"
    if ip.startswith("169.254."):
        return "Link-local (não roteável)"
    return "público / externo"


def escolher_ip_principal(ips):
    """Prioriza Radmin (26.x), depois LAN (192/10/172), depois qualquer."""
    for prefixo in ("26.",):
        for ip in ips:
            if ip.startswith(prefixo):
                return ip
    for ip in ips:
        if ip.startswith(("192.168.", "10.")):
            return ip
    for ip in ips:
        if re.match(r"^172\.(1[6-9]|2\d|3[01])\.", ip):
            return ip
    return ips[0] if ips else "127.0.0.1"


# ─────────────────────────────────────────────────────────────────────────────
# Pré-flight
# ─────────────────────────────────────────────────────────────────────────────
def comando_existe(cmd):
    return shutil.which(cmd) is not None


def abortar(msg, ajuda=""):
    print("\n" + "=" * 60)
    print(f"  ✗ ERRO: {msg}")
    if ajuda:
        print(f"\n  {ajuda}")
    print("=" * 60)
    sys.exit(1)


print("=" * 60)
print("  MERCADINHO — Hospedagem em Rede (Radmin / LAN)")
print(f"  Plataforma: {platform.system()} {platform.release()}")
print("=" * 60)

# Verificações
if not comando_existe("node"):
    abortar("Node.js não encontrado.", "Instale em https://nodejs.org/ (LTS).")
if not comando_existe("npm"):
    abortar("npm não encontrado.", "Reinstale o Node.js.")
java_disponivel = comando_existe("java")

# Detectar IPs
print("\n[INFO] Detectando interfaces de rede...")
ips = listar_ips_locais()

if not ips:
    abortar(
        "Não foi possível detectar nenhum IP de rede.",
        "Verifique se o Radmin VPN ou alguma rede está ativa.",
    )

print("       IPs detectados:")
for ip in ips:
    tag = classificar_ip(ip)
    marca = "  ← Radmin VPN!" if tag == "Radmin VPN" else ""
    print(f"         • {ip:<16}  ({tag}){marca}")

ip_principal = escolher_ip_principal(ips)
tipo_rede = classificar_ip(ip_principal)

print(f"\n       IP escolhido para compartilhamento: {ip_principal}  ({tipo_rede})")
if tipo_rede != "Radmin VPN":
    print("       ⚠ Aviso: Radmin VPN não foi detectado.")
    print("         Se quiser usar Radmin, abra o app, conecte-se à rede e rode de novo.")
    print(f"         Por enquanto vou usar o IP {tipo_rede}.")


# ─────────────────────────────────────────────────────────────────────────────
# Instalar dependências Python (com PEP 668 fallback)
# ─────────────────────────────────────────────────────────────────────────────
def instalar_pacotes_python():
    base_cmd = [sys.executable, "-m", "pip", "install", "-r", requirements]
    em_venv = (
        hasattr(sys, "real_prefix")
        or (hasattr(sys, "base_prefix") and sys.base_prefix != sys.prefix)
        or os.environ.get("VIRTUAL_ENV") is not None
    )

    tentativas = [base_cmd]
    if not em_venv:
        tentativas.append(base_cmd + ["--user"])
        tentativas.append(base_cmd + ["--user", "--break-system-packages"])

    ultimo_erro = None
    for cmd in tentativas:
        try:
            subprocess.run(cmd, check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            return
        except subprocess.CalledProcessError as e:
            ultimo_erro = e.stderr.decode(errors="ignore") if e.stderr else str(e)

    abortar(
        "Falha ao instalar pacotes Python.",
        f"Erro: {ultimo_erro[:300] if ultimo_erro else 'desconhecido'}",
    )


print("\n[1/4] Verificando dependências Python...")
instalar_pacotes_python()
print("      ✓ OK")

# ─────────────────────────────────────────────────────────────────────────────
# NPM install
# ─────────────────────────────────────────────────────────────────────────────
print("\n[2/4] Verificando dependências Node.js...")
if not os.path.exists(node_modules):
    print("      Executando npm install (pode levar alguns minutos)...")
    try:
        subprocess.run(["npm", "install"], cwd=pasta_frontend,
                       shell=NPM_SHELL, check=True)
    except subprocess.CalledProcessError:
        abortar("Falha no npm install.", f"Tente manualmente: cd \"{pasta_frontend}\" && npm install")
print("      ✓ OK")

# ─────────────────────────────────────────────────────────────────────────────
# Backend Django em 0.0.0.0
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n[3/4] Iniciando Django em 0.0.0.0:{PORT_DJANGO} (acessível em rede)...")
backend = subprocess.Popen(
    [sys.executable, "manage.py", "runserver", f"0.0.0.0:{PORT_DJANGO}"],
    cwd=pasta_backend,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
time.sleep(2)
print(f"      ✓ http://{ip_principal}:{PORT_DJANGO}")

# ─────────────────────────────────────────────────────────────────────────────
# Frontend Vite em 0.0.0.0
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n[4/4] Iniciando Vite em 0.0.0.0:{PORT_VITE} (acessível em rede)...")
frontend = subprocess.Popen(
    ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", str(PORT_VITE)],
    cwd=pasta_frontend,
    shell=NPM_SHELL,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
print(f"      ✓ http://{ip_principal}:{PORT_VITE}")

# ─────────────────────────────────────────────────────────────────────────────
# Metabase (opcional)
# ─────────────────────────────────────────────────────────────────────────────
metabase = None

if java_disponivel and os.path.exists(metabase_jar):
    print(f"\n[+]   Iniciando Metabase em 0.0.0.0:{PORT_METABASE}...")
    env = os.environ.copy()
    env["MB_DB_TYPE"]    = "h2"
    env["MB_DB_FILE"]    = metabase_db
    env["MB_JETTY_HOST"] = "0.0.0.0"
    env["MB_JETTY_PORT"] = str(PORT_METABASE)

    metabase = subprocess.Popen(
        ["java", "-jar", metabase_jar],
        cwd=pasta_metabase,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print("      ✓ Metabase iniciando em background...")
elif not java_disponivel:
    print("\n[+]   Java não encontrado — Metabase ignorado (opcional).")
else:
    print("\n[+]   metabase.jar não encontrado — Metabase ignorado.")

# ─────────────────────────────────────────────────────────────────────────────
# Abrir navegador local
# ─────────────────────────────────────────────────────────────────────────────
time.sleep(3)
try:
    webbrowser.open(f"http://localhost:{PORT_VITE}")
except Exception:
    pass


# ─────────────────────────────────────────────────────────────────────────────
# Rotina Metabase (corrige caminho do banco)
# ─────────────────────────────────────────────────────────────────────────────
def api_call(method, path, data=None, token=None):
    url = f"http://localhost:{PORT_METABASE}{path}"
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["X-Metabase-Session"] = token
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    return json.loads(urllib.request.urlopen(req, timeout=10).read())


def esperar_metabase(timeout=180):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = urllib.request.urlopen(
                f"http://localhost:{PORT_METABASE}/api/health", timeout=4
            )
            if r.status == 200:
                return True
        except Exception:
            pass
        time.sleep(5)
    return False


def rotina_metabase():
    if metabase is None:
        return
    print("\n      [Metabase] Aguardando inicialização (~60s)...")
    if not esperar_metabase(timeout=180):
        print("      [Metabase] Timeout.")
        return
    print("      [Metabase] ✓ Online!")
    if not os.path.exists(creds_path):
        return
    try:
        with open(creds_path) as f:
            creds = json.load(f)
        result = api_call("POST", "/api/session", data={
            "username": creds["email"], "password": creds["password"],
        })
        token = result.get("id")
        if not token:
            return
        databases = api_call("GET", "/api/database", token=token)
        dbs = databases if isinstance(databases, list) else databases.get("data", [])
        for db in dbs:
            if db.get("engine") == "sqlite":
                details = db.get("details", {})
                if details.get("db", "").replace("\\", "/").lower() != \
                   django_sqlite.replace("\\", "/").lower():
                    details["db"] = django_sqlite
                    api_call("PUT", f"/api/database/{db['id']}",
                             data={"details": details}, token=token)
                api_call("POST", f"/api/database/{db['id']}/sync_schema", token=token)
                break
    except Exception as e:
        print(f"      [Metabase] {e}")


threading.Thread(target=rotina_metabase, daemon=True).start()

# ─────────────────────────────────────────────────────────────────────────────
# Resumo bonitão pra compartilhar
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "═" * 60)
print(f"  🚀 Sistema rodando em rede ({tipo_rede})")
print("═" * 60)
print(f"\n  Para você (esta máquina):")
print(f"     → http://localhost:{PORT_VITE}")
print(f"\n  Para os outros usuários da rede:")
print(f"     → http://{ip_principal}:{PORT_VITE}    ← compartilhe este link")
if metabase:
    print(f"\n  Dashboards Metabase:")
    print(f"     → http://{ip_principal}:{PORT_METABASE}")

if len(ips) > 1:
    print(f"\n  Outros IPs disponíveis (caso o Radmin não funcione):")
    for ip in ips:
        if ip != ip_principal:
            print(f"     • http://{ip}:{PORT_VITE}  ({classificar_ip(ip)})")

print("\n" + "═" * 60)
print("  ⚠ Importante: o firewall do Windows pode pedir autorização")
print("    nas portas 8000, 5173 e 3000 — clique em \"Permitir acesso\".")
print("═" * 60)
print("\n  Ctrl+C para encerrar tudo.\n")


# ─────────────────────────────────────────────────────────────────────────────
# Encerramento limpo
# ─────────────────────────────────────────────────────────────────────────────
processos = [(backend, "Django"), (frontend, "Vite")]
if metabase:
    processos.append((metabase, "Metabase"))


def aguardar(proc, nome):
    proc.wait()
    print(f"\n  [{nome}] Processo encerrado.")


threads = [threading.Thread(target=aguardar, args=p, daemon=True) for p in processos]
for t in threads:
    t.start()


def encerrar(*_):
    print("\n  Encerrando todos os serviços...")
    for proc, nome in processos:
        try:
            if IS_WINDOWS:
                proc.terminate()
            else:
                proc.send_signal(signal.SIGTERM)
            print(f"  [{nome}] encerrado.")
        except Exception:
            pass
    sys.exit(0)


signal.signal(signal.SIGINT, encerrar)
if not IS_WINDOWS:
    signal.signal(signal.SIGTERM, encerrar)

try:
    for t in threads:
        t.join()
except KeyboardInterrupt:
    encerrar()
