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

  const rotulo = status === "online" ? "Metabase online"
    : status === "offline" ? "Metabase offline"
    : "Metabase iniciando";

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Análises</h1>
          <p className="page-subtitle">Painéis do Metabase com vendas, estoque e financeiro.</p>
        </div>
        <div className="page-header-actions">
          <span className={`status-pill status-${status}`}>
            <span className="status-dot" />
            {rotulo}
          </span>
          {status === "online" && (
            <a href={METABASE_URL} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
              Abrir em nova aba
            </a>
          )}
        </div>
      </div>

      {status === "online" && (
        <div className="dash-frame">
          {!iframeOk && (
            <div className="dash-frame-loading">
              <div className="dash-spinner" />
              <p>Carregando painel...</p>
            </div>
          )}
          <iframe key={status} src={DASHBOARD_URL} frameBorder="0"
            width="100%" height="900" allowTransparency="true" title="Painel do Metabase"
            style={{ display: "block", opacity: iframeOk ? 1 : 0, transition: "opacity 0.3s" }}
            onLoad={() => setIframeOk(true)} />
        </div>
      )}

      {status === "conectando" && (
        <div className="dash-state">
          <div className="dash-spinner" />
          <h2>O Metabase está iniciando</h2>
          <p>Isso costuma levar de 30 a 60 segundos. O painel abre sozinho quando estiver pronto.</p>
          <div className="dash-progress"><div className="dash-progress-bar" /></div>
          <span className="dash-hint">Verificando a cada {CHECK_INTERVAL / 1000} segundos</span>
        </div>
      )}

      {status === "offline" && (
        <div className="dash-state">
          <h2>O Metabase não está rodando</h2>
          <p>Os painéis de análise são opcionais. Para ativá-los, inicie o sistema pelo script abaixo, na pasta do projeto:</p>
          <code className="dash-code">python INICIAR.py</code>
          <span className="dash-hint">Verificando a cada {CHECK_INTERVAL / 1000} segundos; a página reconecta sozinha.</span>
        </div>
      )}
    </div>
  );
}

export default DashboardMercadinho;
