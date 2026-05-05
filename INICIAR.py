import subprocess
import os
import sys
import time
import webbrowser
import threading

pasta = os.path.dirname(os.path.abspath(__file__))
pasta_backend = os.path.join(pasta, "sistema_estoque")
pasta_frontend = os.path.join(pasta, "sistema_estoque", "front-end")
requirements = os.path.join(pasta, "Materiais", "requirements.txt")
node_modules = os.path.join(pasta_frontend, "node_modules")

print("Verificando dependências Python...")
subprocess.run([sys.executable, "-m", "pip", "install", "-r", requirements], check=True)

print("\nVerificando dependências Node.js...")
if not os.path.exists(node_modules):
    print("node_modules não encontrado, rodando npm install...")
    subprocess.run(["npm", "install"], cwd=pasta_frontend, shell=True, check=True)
else:
    print("node_modules já existe, pulando npm install.")

print("\nIniciando o backend...")
backend = subprocess.Popen(
    [sys.executable, "manage.py", "runserver"],
    cwd=pasta_backend
)

# da um tempinho pro django subir antes de iniciar o front
time.sleep(2)

print("Iniciando o frontend...")
frontend = subprocess.Popen(
    ["npm", "run", "dev"],
    cwd=pasta_frontend,
    shell=True
)

# abre o navegador automaticamente
time.sleep(3)
webbrowser.open("http://localhost:5173")

print("Tudo rodando! Feche essa janela ou aperte Ctrl+C pra parar.")

def aguardar(proc, nome):
    proc.wait()
    print(f"\n{nome} encerrou.")

t1 = threading.Thread(target=aguardar, args=(backend, "Backend"), daemon=True)
t2 = threading.Thread(target=aguardar, args=(frontend, "Frontend"), daemon=True)
t1.start()
t2.start()

try:
    t1.join()
    t2.join()
except KeyboardInterrupt:
    print("Encerrando...")
    backend.terminate()
    frontend.terminate()
