import { useEffect, useState, useRef } from "react";

const METABASE_HOST  = typeof window !== "undefined" ? window.location.hostname : "localhost";
const METABASE_URL   = `http://${METABASE_HOST}:3000`;
const DASHBOARD_URL  = `${METABASE_URL}/public/dashboard/9e121adb-41a6-4aef-acfe-26dafdabceca`;
const CHECK_INTERVAL = 4000;  // ms entre verificações
const GRACE_PERIOD   = 120000; // 2 min antes de mostrar "offline"

function usarMetabaseStatus() {
  // "conectando" → enquanto está no grace period e nunca respondeu
  // "offline"    → grace period expirou e ainda não respondeu
  // "online"     → respondeu
  const [status, setStatus] = useState("conectando");
  const timer     = useRef(null);
  const startedAt = useRef(Date.now());
  const jáOnline  = useRef(false);

  useEffect(() => {
    let ativo = true;

    async function checar() {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3500);
        await fetch(`${METABASE_URL}/api/health`, { mode: "no-cors", signal: ctrl.signal });
        clearTimeout(t);
        if (ativo) { setStatus("online"); jáOnline.current = true; }
      } catch {
        if (ativo) {
          const elapsed = Date.now() - startedAt.current;
          // Se nunca ficou online e passou o grace period → offline
          if (!jáOnline.current && elapsed > GRACE_PERIOD) setStatus("offline");
          // Se ficou online antes e agora caiu → offline imediato
          else if (jáOnline.current) setStatus("offline");
          // Dentro do grace period → mantém "conectando"
          else setStatus("conectando");
        }
      } finally {
        if (ativo) timer.current = setTimeout(checar, CHECK_INTERVAL);
      }
    }

    checar();
    return () => { ativo = false; clearTimeout(timer.current); };
  }, []);

  return status;
}

function DashboardMercadinho() {
  const status = usarMetabaseStatus();
  const [iframeOk, setIframeOk] = useState(false);

  // Quando o metabase voltar a ficar online, reseta o estado do iframe
  useEffect(() => {
    if (status === "online") setIframeOk(false);
  }, [status]);

  return (
    <div className="page-container">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Visão geral do sistema via Metabase
          </p>
        </div>

        {/* Badge de status */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600,
            background: status === "online" ? "rgba(16,185,129,0.12)"
              : status === "offline"       ? "rgba(239,68,68,0.12)"
              :                              "rgba(245,158,11,0.12)",
            color: status === "online" ? "var(--accent-green)"
              : status === "offline"   ? "var(--accent-red)"
              :                          "var(--accent-orange)",
            border: `1px solid ${status === "online" ? "rgba(16,185,129,0.3)"
              : status === "offline"                  ? "rgba(239,68,68,0.3)"
              :                                         "rgba(245,158,11,0.3)"}`,
          }}>
            {status === "conectando"
              ? <span className="dash-spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
              : <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor",
                  animation: status !== "online" ? "pulse-dot 1.2s ease-in-out infinite" : "none" }} />
            }
            {status === "online"     ? "Metabase online"
             : status === "offline"  ? "Metabase offline"
             :                        "Metabase iniciando..."}
          </span>

          {status === "online" && (
            <a href={METABASE_URL} target="_blank" rel="noreferrer"
               className="btn btn-back" style={{ fontSize: "0.8rem", padding: "5px 12px" }}>
              ↗ Abrir em nova aba
            </a>
          )}
        </div>
      </div>

      {/* ─── ONLINE: iframe ─── */}
      {status === "online" && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-card)", overflow: "hidden",
          boxShadow: "var(--shadow-card)", position: "relative", minHeight: 520,
        }}>
          {!iframeOk && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 2,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 14, background: "var(--bg-card)",
            }}>
              <div className="dash-spinner" />
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: 0 }}>
                Carregando dashboard...
              </p>
            </div>
          )}
          <iframe key={status} src={DASHBOARD_URL} frameBorder="0"
            width="100%" height="900" allowTransparency="true" title="Dashboard Metabase"
            style={{ display: "block", opacity: iframeOk ? 1 : 0, transition: "opacity 0.4s" }}
            onLoad={() => setIframeOk(true)} />
        </div>
      )}

      {/* ─── CONECTANDO: animação de carregamento ─── */}
      {status === "conectando" && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "var(--radius-card)", padding: "64px 40px",
          textAlign: "center", boxShadow: "var(--shadow-card)",
        }}>
          {/* Ícone animado */}
          <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 24px" }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "2px solid rgba(245,158,11,0.15)",
              animation: "dash-spin 3s linear infinite",
            }} />
            <div style={{
              position: "absolute", inset: 4, borderRadius: "50%",
              border: "2px solid transparent",
              borderTopColor: "var(--accent-orange)",
              borderRightColor: "rgba(245,158,11,0.4)",
              animation: "dash-spin 1s linear infinite",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.8rem",
            }}>📊</div>
          </div>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8, color: "var(--accent-orange)" }}>
            Metabase iniciando...
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", maxWidth: 380, margin: "0 auto 28px" }}>
            Aguarde enquanto o servidor de análise carrega.<br />
            Isso leva aproximadamente <strong style={{ color: "var(--text-primary)" }}>30–60 segundos</strong>.
          </p>

          {/* Barra de progresso indeterminada */}
          <div style={{
            width: 280, height: 4, background: "rgba(255,255,255,0.05)",
            borderRadius: 999, margin: "0 auto 20px", overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              height: "100%", width: "40%", borderRadius: 999,
              background: "linear-gradient(90deg, transparent, var(--accent-orange), transparent)",
              animation: "dash-indeterminate 1.6s ease-in-out infinite",
            }} />
          </div>

          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: "var(--text-muted)", fontSize: "0.78rem",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--accent-orange)",
              animation: "pulse-dot 1.2s ease-in-out infinite",
              display: "inline-block",
            }} />
            Verificando a cada {CHECK_INTERVAL / 1000}s — abrirá automaticamente
          </span>
        </div>
      )}

      {/* ─── OFFLINE: instruções ─── */}
      {status === "offline" && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "var(--radius-card)", padding: "52px 40px",
          textAlign: "center", boxShadow: "var(--shadow-card)",
        }}>
          <div style={{ fontSize: "3.2rem", marginBottom: 16 }}>📊</div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 8 }}>
            Metabase não está rodando
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: 420, margin: "0 auto 24px" }}>
            Use o <strong style={{ color: "var(--text-primary)" }}>INICIAR.py</strong> para
            subir todos os serviços de uma vez.
          </p>
          <div style={{
            display: "inline-flex", flexDirection: "column", gap: 10,
            background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "16px 24px",
            textAlign: "left", border: "1px solid var(--border)",
            fontFamily: "monospace", fontSize: "0.82rem",
            color: "var(--accent-green)", marginBottom: 28,
          }}>
            <span style={{ color: "var(--text-muted)", fontFamily: "inherit" }}># No terminal, na pasta do projeto:</span>
            <span>python INICIAR.py</span>
          </div>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.8rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-orange)",
                animation: "pulse-dot 1.2s ease-in-out infinite", display: "inline-block" }} />
              Verificando a cada {CHECK_INTERVAL / 1000}s... reconectará automaticamente
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardMercadinho;
