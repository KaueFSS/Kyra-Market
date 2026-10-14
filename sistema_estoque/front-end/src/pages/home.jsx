import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { cachedGet } from "../utils/apiCache";
import { formatarData, formatarFormaPagamento, formatarMoeda } from "../utils/formatadores";
import {
  IconProdutos, IconCompras, IconClientes, IconFornecedores, IconFuncionarios, IconDespesas,
  IconAlerta, IconGrafico, IconCarteira, IconDinheiro, IconPlus,
} from "../components/Icons";

const atalhos = [
  { label: "Nova compra",      to: "/compras/novo",      Icon: IconCompras },
  { label: "Novo produto",     to: "/produtos/novo",     Icon: IconProdutos },
  { label: "Novo cliente",     to: "/clientes/novo",     Icon: IconClientes },
  { label: "Nova despesa",     to: "/despesas/novo",     Icon: IconDespesas },
  { label: "Novo fornecedor",  to: "/fornecedores/novo", Icon: IconFornecedores },
  { label: "Novo funcionário", to: "/funcionarios/novo", Icon: IconFuncionarios },
];

function Home() {
  const navigate = useNavigate();
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

  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const lucro = lucroMensal ? Number(lucroMensal.lucro) : null;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Visão geral</h1>
          <p className="page-subtitle">{hoje.charAt(0).toUpperCase() + hoje.slice(1)}</p>
        </div>
        <div className="page-header-actions">
          <Link to="/dashboard" className="btn btn-secondary"><IconGrafico width={16} height={16} />Análises</Link>
          <Link to="/vendas/novo" className="btn-add"><IconPlus width={16} height={16} />Nova venda</Link>
        </div>
      </div>

      {carregando ? (
        <p className="loading-text">Carregando...</p>
      ) : (
        <>
          <div className="stats-grid">
            <Indicador
              Icon={IconDinheiro}
              label="Vendas hoje"
              valor={formatarMoeda(vendasHoje.total)}
              detalhe={`${vendasHoje.count} venda${vendasHoje.count !== 1 ? "s" : ""} registrada${vendasHoje.count !== 1 ? "s" : ""}`}
              to="/vendas"
            />
            <Indicador
              Icon={IconGrafico}
              label={lucroMensal ? `Lucro de ${lucroMensal.mes}` : "Lucro do mês"}
              valor={lucro === null ? "—" : formatarMoeda(lucro)}
              tom={lucro !== null && lucro < 0 ? "negativo" : ""}
              detalhe={lucroMensal ? `Receita de ${formatarMoeda(lucroMensal.receita)}` : "Sem dados do mês"}
              to="/dashboard"
            />
            <Indicador
              Icon={IconAlerta}
              label="Estoque baixo"
              valor={alertasEstoque.length}
              tom={alertasEstoque.length > 0 ? "alerta" : ""}
              detalhe={semEstoque > 0 ? `${semEstoque} sem estoque` : "produtos abaixo do mínimo"}
              to="/estoques"
            />
            <Indicador
              Icon={IconCarteira}
              label="Fiado em aberto"
              valor={formatarMoeda(clientesFiado.total)}
              detalhe={`${clientesFiado.count} cliente${clientesFiado.count !== 1 ? "s" : ""} com saldo`}
              to="/clientes"
            />
            <Indicador
              Icon={IconClientes}
              label="Clientes"
              valor={totalClientes}
              detalhe="cadastrados"
              to="/clientes"
            />
          </div>

          <h2 className="section-heading">Atalhos</h2>
          <div className="quicknav-grid">
            {atalhos.map((item) => (
              <Link key={item.to} to={item.to} className="quicknav-card">
                <span className="quicknav-icon"><item.Icon width={18} height={18} /></span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="home-bottom">
            <section className="home-panel">
              <div className="home-panel-header">
                <h2 className="home-panel-title">Últimas vendas</h2>
                <Link to="/vendas" className="home-panel-ver-todas">Ver todas</Link>
              </div>
              <div className="home-panel-body">
                {ultimasVendas.length === 0 ? (
                  <p className="empty-state">Nenhuma venda registrada.</p>
                ) : (
                  <table className="data-table data-table-compact">
                    <thead>
                      <tr>
                        <th>Venda</th>
                        <th>Data</th>
                        <th>Pagamento</th>
                        <th className="cell-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ultimasVendas.map((v) => {
                        const fp = formatarFormaPagamento(v.forma_pagamento);
                        return (
                          <tr key={v.id_venda} onClick={() => navigate(`/vendas/${v.id_venda}`)}>
                            <td className="cell-id">{v.id_venda}</td>
                            <td className="cell-muted">
                              {formatarData(v.data_venda)}{v.hora ? `, ${v.hora.slice(0, 5)}` : ""}
                            </td>
                            <td><span className={`badge ${fp.cls}`}>{fp.label}</span></td>
                            <td className="cell-num cell-strong cell-right">{formatarMoeda(v.total || 0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="home-panel">
              <div className="home-panel-header">
                <h2 className="home-panel-title">
                  Estoque baixo
                  {alertasEstoque.length > 0 && <span className="home-panel-count">{alertasEstoque.length}</span>}
                </h2>
                <Link to="/estoques" className="home-panel-ver-todas">Ver estoque</Link>
              </div>
              <div className="home-panel-body">
                {alertasEstoque.length === 0 ? (
                  <p className="empty-state">Nenhum produto abaixo do mínimo.</p>
                ) : (
                  <ul className="stock-list">
                    {alertasEstoque.map((e) => {
                      const atual = Number(e.quantidade_atual);
                      const minimo = Number(e.quantidade_minima);
                      const pct = minimo > 0 ? Math.min(100, Math.round((atual / minimo) * 100)) : 0;
                      const critico = atual === 0;
                      return (
                        <li key={e.id_estoque} className="stock-row">
                          <div className="stock-row-top">
                            <span className="stock-name">{String(e.produto_nome || e.produto || "").replace(/\s+/g, " ")}</span>
                            <span className={`badge ${critico ? "badge-red" : "badge-orange"}`}>
                              {critico ? "Sem estoque" : "Baixo"}
                            </span>
                          </div>
                          <div className="stock-row-bottom">
                            <div className="progress-bar">
                              <div className="progress-bar-fill warn" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="stock-qty">{atual} de {minimo} un</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Indicador({ Icon, label, valor, detalhe, tom = "", to }) {
  const corpo = (
    <>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon"><Icon width={16} height={16} /></span>
      </div>
      <div className={`stat-value${tom ? ` ${tom}` : ""}`}>{valor}</div>
      <div className="stat-sub">{detalhe}</div>
    </>
  );
  return to
    ? <Link to={to} className="stat-card">{corpo}</Link>
    : <div className="stat-card">{corpo}</div>;
}

export default Home;