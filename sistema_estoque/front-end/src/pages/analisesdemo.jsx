import { useEffect, useState } from "react";
import api from "../services/api";
import { formatarFormaPagamento, formatarMoeda } from "../utils/formatadores";

// Tela de análises da demonstração. No sistema instalado, esta página
// mostra os painéis do Metabase; no GitHub Pages não há Metabase, então os
// números são calculados no navegador a partir dos mesmos dados.

function GraficoDias({ dias }) {
  const max = Math.max(1, ...dias.map((d) => d.total));
  const largura = 100 / dias.length;
  return (
    <div className="chart">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="chart-svg" role="img" aria-label="Vendas por dia">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2="100" y1={40 - f * 38} y2={40 - f * 38} className="chart-grid" />
        ))}
        {dias.map((d, i) => {
          const h = (d.total / max) * 38;
          return (
            <rect key={d.data} x={i * largura + largura * 0.18} width={largura * 0.64} y={40 - h} height={h}
              className={i === dias.length - 1 ? "chart-bar chart-bar-hoje" : "chart-bar"}>
              <title>{`${d.data.split("-").reverse().join("/")}: ${formatarMoeda(d.total)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="chart-eixo">
        <span>{dias[0].data.split("-").reverse().slice(0, 2).join("/")}</span>
        <span>{dias[Math.floor(dias.length / 2)].data.split("-").reverse().slice(0, 2).join("/")}</span>
        <span>Hoje</span>
      </div>
    </div>
  );
}

function Barras({ itens }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  const soma = itens.reduce((s, i) => s + i.valor, 0) || 1;
  return (
    <ul className="hbar-list">
      {itens.map((i) => (
        <li key={i.rotulo} className="hbar-row">
          <div className="hbar-top">
            <span className="hbar-label">{i.rotulo}</span>
            <span className="hbar-value">
              {formatarMoeda(i.valor)}
              <span className="hbar-pct">{Math.round((i.valor / soma) * 100)}%</span>
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill ok" style={{ width: `${(i.valor / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function AnalisesDemo() {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    api.get("/demo-analises/").then((res) => setDados(res.data)).catch(() => setDados(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Análises</h1>
          <p className="page-subtitle">Últimos 30 dias de vendas.</p>
        </div>
        <span className="status-pill" title="No sistema instalado, esta tela mostra os painéis do Metabase.">
          <span className="status-dot" style={{ background: "#2f9e64" }} />
          Resumo da demonstração
        </span>
      </div>

      {dados === null && <p className="loading-text">Carregando...</p>}
      {dados === false && <div className="alert-msg">Não foi possível calcular as análises.</div>}

      {dados && (
        <>
          <div className="stats-grid stats-grid-4">
            <div className="stat-card">
              <div className="stat-top"><span className="stat-label">Receita em 30 dias</span></div>
              <div className="stat-value">{formatarMoeda(dados.receita30)}</div>
              <div className="stat-sub">{dados.vendas30} vendas</div>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span className="stat-label">Ticket médio</span></div>
              <div className="stat-value">{formatarMoeda(dados.ticketMedio)}</div>
              <div className="stat-sub">por venda</div>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span className="stat-label">Receita de {dados.lucroMes.mes}</span></div>
              <div className="stat-value">{formatarMoeda(dados.lucroMes.receita)}</div>
              <div className="stat-sub">compras {formatarMoeda(dados.lucroMes.compras)} · despesas {formatarMoeda(dados.lucroMes.despesas)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span className="stat-label">Lucro de {dados.lucroMes.mes}</span></div>
              <div className={`stat-value${dados.lucroMes.lucro < 0 ? " negativo" : ""}`}>{formatarMoeda(dados.lucroMes.lucro)}</div>
              <div className="stat-sub">receita − compras − despesas</div>
            </div>
          </div>

          <section className="home-panel analises-panel">
            <div className="home-panel-header">
              <h2 className="home-panel-title">Vendas por dia</h2>
            </div>
            <GraficoDias dias={dados.dias} />
          </section>

          <div className="home-bottom analises-bottom">
            <section className="home-panel">
              <div className="home-panel-header">
                <h2 className="home-panel-title">Formas de pagamento</h2>
              </div>
              <Barras itens={dados.formas.map((f) => ({ rotulo: formatarFormaPagamento(f.forma).label, valor: f.total }))} />
            </section>
            <section className="home-panel">
              <div className="home-panel-header">
                <h2 className="home-panel-title">Produtos que mais faturaram</h2>
              </div>
              <Barras itens={dados.topProdutos.map((p) => ({ rotulo: p.produto, valor: p.total }))} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default AnalisesDemo;
