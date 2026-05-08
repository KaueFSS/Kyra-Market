import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { cachedGet } from "../utils/apiCache";
import { formatarFormaPagamento, formatarMoeda } from "../utils/formatadores";

const quickNav = [
  { label: "Produtos",      to: "/produtos",     icon: "/icons/Produto_Botão.png" },
  { label: "Estoque",       to: "/estoques",     icon: "/icons/Estoque_botão.png" },
  { label: "Vendas",        to: "/vendas",       icon: "/icons/Vendas_botão.png" },
  { label: "Clientes",      to: "/clientes",     icon: "/icons/Clientes.png" },
  { label: "Fornecedores",  to: "/fornecedores", icon: "/icons/Fornecedores_Botão.png" },
  { label: "Funcionários",  to: "/funcionarios", icon: "/icons/funcionario_botão.png" },
];

function Home() {
  const [vendasHoje, setVendasHoje] = useState({ count: 0, total: 0 });
  const [ultimasVendas, setUltimasVendas] = useState([]);
  const [alertasEstoque, setAlertasEstoque] = useState([]);
  const [semEstoque, setSemEstoque] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [clientesFiado, setClientesFiado] = useState({ count: 0, total: 0 });
  const [lucroMensal, setLucroMensal] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [resVendas, resVendasHoje, resAlertas, resResumo, resLucro] = await Promise.allSettled([
          cachedGet(api, "/vendas/"),
          cachedGet(api, "/vendas/hoje/"),
          cachedGet(api, "/estoques/alerta-minimo/"),
          cachedGet(api, "/clientes/resumo/"),
          cachedGet(api, "/lucro-mensal/"),
        ]);

        if (resVendas.status === "fulfilled") {
          const lista = Array.isArray(resVendas.value.data)
            ? resVendas.value.data
            : (resVendas.value.data.results || []);
          setUltimasVendas(lista.slice(0, 10));
        }

        if (resVendasHoje.status === "fulfilled") {
          setVendasHoje(resVendasHoje.value.data);
        }

        // alerta-minimo retorna { total, resultados: [...] }
        if (resAlertas.status === "fulfilled") {
          const d = resAlertas.value.data;
          const lista = Array.isArray(d)
            ? d
            : (d.resultados || d.results || []);
          if (lista.length > 0) {
            setAlertasEstoque(lista.slice(0, 10));
            setSemEstoque(lista.filter((e) => Number(e.quantidade_atual) === 0).length);
          } else {
            // fallback: busca todos os estoques e filtra client-side
            try {
              const todos = await cachedGet(api, "/estoques/");
              const listaAll = Array.isArray(todos.data) ? todos.data : (todos.data.results || []);
              const baixos = listaAll.filter((e) => Number(e.quantidade_atual) < Number(e.quantidade_minima));
              setAlertasEstoque(baixos.slice(0, 10));
              setSemEstoque(baixos.filter((e) => Number(e.quantidade_atual) === 0).length);
            } catch (_) {}
          }
        } else {
          try {
            const todos = await cachedGet(api, "/estoques/");
            const listaAll = Array.isArray(todos.data) ? todos.data : (todos.data.results || []);
            const baixos = listaAll.filter((e) => Number(e.quantidade_atual) < Number(e.quantidade_minima));
            setAlertasEstoque(baixos.slice(0, 10));
            setSemEstoque(baixos.filter((e) => Number(e.quantidade_atual) === 0).length);
          } catch (_) {}
        }

        // /clientes/resumo/ retorna totais agregados em uma única query
        if (resResumo.status === "fulfilled") {
          const r = resResumo.value.data;
          setTotalClientes(r.total_clientes || 0);
          setClientesFiado({ count: r.count_fiado, total: r.total_fiado });
        }

        if (resLucro.status === "fulfilled") {
          setLucroMensal(resLucro.value.data);
        }
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  return (
    <div className="page-container">
      {carregando ? (
        <p className="loading-text">Carregando dashboard...</p>
      ) : (
        <>
          {/* Stats Row */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon green">
                <img src="/icons/Vendas Hoje.png" alt="Vendas" style={{ width: 54, height: 54, objectFit: "contain" }} />
              </div>
              <div className="stat-body">
                <div className="stat-label">Vendas Hoje</div>
                <div className="stat-value green">{formatarMoeda(vendasHoje.total)}</div>
                <div className="stat-sub">{vendasHoje.count} venda{vendasHoje.count !== 1 ? "s" : ""} registrada{vendasHoje.count !== 1 ? "s" : ""}</div>
                {lucroMensal !== null && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 2 }}>
                      Lucro de {lucroMensal.mes}
                    </div>
                    <div style={{
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: lucroMensal.lucro >= 0 ? "var(--accent-green)" : "var(--accent-red)",
                    }}>
                      {lucroMensal.lucro >= 0 ? "▲ " : "▼ "}{formatarMoeda(Math.abs(lucroMensal.lucro))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">
                <img src="/icons/estroque_aviso.png" alt="Estoque" style={{ width: 54, height: 54, objectFit: "contain" }} />
              </div>
              <div className="stat-body">
                <div className="stat-label">Estoque Baixo</div>
                <div className="stat-value orange">{alertasEstoque.length}</div>
                <div className="stat-sub">produtos abaixo do mínimo</div>
                {semEstoque > 0 && (
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{
                      background: "rgba(239,68,68,0.15)",
                      color: "var(--accent-red)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 5,
                      letterSpacing: "0.02em",
                    }}>
                      🔴 {semEstoque} sem estoque
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">
                <img src="/icons/Clientes.png" alt="Clientes" style={{ width: 54, height: 54, objectFit: "contain" }} />
              </div>
              <div className="stat-body">
                <div className="stat-label">Clientes</div>
                <div className="stat-value blue">{totalClientes}</div>
                <div className="stat-sub">clientes cadastrados</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                <img src="/icons/Fiado.png" alt="Fiado" style={{ width: 54, height: 54, objectFit: "contain" }} />
              </div>
              <div className="stat-body">
                <div className="stat-label">Clientes com Fiado</div>
                <div className="stat-value purple">{clientesFiado.count}</div>
                <div className="stat-sub">total {formatarMoeda(clientesFiado.total)}</div>
              </div>
            </div>

            <Link to="/dashboard" className="stat-card stat-card-dash">
              <div className="stat-icon" style={{ background: "rgba(16,185,129,0.15)" }}>
                <img src="/icons/Dashboard.png" alt="Dashboard" style={{ width: 54, height: 54, objectFit: "contain" }} />
              </div>
              <div className="stat-body">
                <div className="stat-label">Metabase</div>
                <div className="stat-value" style={{ fontSize: "1.1rem", color: "var(--accent-green)", marginTop: 6 }}>Ver Dashboard →</div>
                <div className="stat-sub">gráficos e relatórios</div>
              </div>
            </Link>
          </div>

          {/* Quick Navigation */}
          <div className="quicknav-grid">
            {quickNav.map((item) => (
              <Link key={item.to} to={item.to} className="quicknav-card">
                <div className="quicknav-icon">
                <img src={item.icon} alt={item.label} style={{ width: 44, height: 44, objectFit: "contain" }} />
              </div>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Bottom Panels */}
          <div className="home-bottom">
            {/* Últimas Vendas */}
            <div className="home-panel home-panel-flex">
              <div className="home-panel-header">
                <span className="home-panel-title">📋 Últimas Vendas</span>
                <Link to="/vendas" className="home-panel-ver-todas">Ver todas</Link>
              </div>
              <div className="home-panel-body">
                {ultimasVendas.length === 0 ? (
                  <p className="empty-state">Nenhuma venda registrada.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Hora</th>
                        <th>Pagamento</th>
                        <th>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ultimasVendas.map((v) => {
                        const fp = formatarFormaPagamento(v.forma_pagamento);
                        return (
                          <tr key={v.id_venda}>
                            <td>#{v.id_venda}</td>
                            <td>{v.hora ? v.hora.slice(0, 5) : "—"}</td>
                            <td><span className={`badge ${fp.cls}`}>{fp.icon} {fp.label}</span></td>
                            <td style={{ color: "var(--accent-green)", fontWeight: 600 }}>
                              {formatarMoeda(v.total || 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <Link to="/vendas" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Ver todas as vendas →
                </Link>
              </div>
            </div>

            {/* Produtos com Estoque Baixo */}
            <div className="home-panel home-panel-flex">
              <div className="home-panel-header">
                <span className="home-panel-title" style={{ color: "var(--accent-orange)" }}>
                  ⚠️ Estoque Baixo
                </span>
                <Link to="/estoques" className="home-panel-ver-todas">Ver todos</Link>
              </div>
              <div className="home-panel-body">
                {alertasEstoque.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>✅</div>
                    <p style={{ color: "var(--accent-green)", fontWeight: 600 }}>Estoque em dia!</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 4 }}>
                      Nenhum produto abaixo do mínimo.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {alertasEstoque.map((e) => {
                      const atual = Number(e.quantidade_atual);
                      const minimo = Number(e.quantidade_minima);
                      const pct = minimo > 0 ? Math.min(100, Math.round((atual / minimo) * 100)) : 0;
                      const critico = atual === 0;
                      const cor = critico ? "var(--accent-red)" : "var(--accent-orange)";

                      return (
                        <div key={e.id_estoque} style={{
                          background: "#f3f5f9",
                          border: "1px solid #e1e5ed",
                          borderRadius: 10,
                          padding: "11px 16px",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                              {e.produto_nome || e.produto}
                            </span>
                            <span style={{
                              background: critico ? "var(--accent-red-bg)" : "var(--accent-orange-bg)",
                              color: cor,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 5,
                            }}>
                              {critico ? "🔴 SEM ESTOQUE" : "🟡 BAIXO"}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              flex: 1,
                              height: 8,
                              background: "#dde2eb",
                              borderRadius: 999,
                              overflow: "hidden",
                              position: "relative",
                            }}>
                              <div style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
                                borderRadius: 999,
                                transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
                                boxShadow: "0 1px 3px rgba(245,158,11,0.3)",
                              }} />
                            </div>
                            <span style={{ color: cor, fontWeight: 700, fontSize: "0.85rem", minWidth: 64, textAlign: "right" }}>
                              {atual} / {minimo} un
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <Link to="/estoques" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Ver todos os estoques →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;