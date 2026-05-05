import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import FormSelectSearch from "../components/FormSelectSearch";

function Compras() {
  const [compras, setCompras] = useState([]);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [compraAtualizando, setCompraAtualizando] = useState("");
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(false);
  const [temAnterior, setTemAnterior] = useState(false);
  const [compraSelecionada, setCompraSelecionada] = useState("");

  useEffect(() => {
    setCarregando(true);
    setCompraSelecionada("");
    api.get(`/compras/?page=${pagina}`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setCompras(response.data);
          setTemProxima(false);
          setTemAnterior(false);
        } else if (response.data.results) {
          setCompras(response.data.results);
          setTemProxima(response.data.next !== null);
          setTemAnterior(response.data.previous !== null);
        } else {
          setCompras([]);
        }
        setErro("");
        setMensagem("");
      })
      .catch(() => setErro("Não foi possível carregar as compras."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  function alterarCompraSelecionada(event) {
    setCompraSelecionada(event.target.value);
  }

  async function marcarComoEntregue(idCompra) {
    setErro("");
    setMensagem("");
    setCompraAtualizando(idCompra);

    try {
      const response = await api.post(`/compras/${idCompra}/entregar/`);
      setCompras((comprasAtuais) =>
        comprasAtuais.map((compra) =>
          compra.id_compra === idCompra ? response.data : compra
        )
      );
      setMensagem("Compra marcada como entregue e estoque atualizado com sucesso!");
    } catch (error) {
      setErro(error.response?.data?.erro || "Nao foi possivel marcar a compra como entregue.");
    } finally {
      setCompraAtualizando("");
    }
  }

  const opcoesCompras = compras.map((compra) => ({
    value: compra.id_compra,
    label: `${compra.id_compra} - ${compra.fornecedor_nome || compra.fornecedor} - ${compra.data_compra}`,
  }));

  const comprasFiltradas = compraSelecionada
    ? compras.filter((compra) => compra.id_compra === compraSelecionada)
    : compras;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Compras</h1>

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {mensagem && <p style={{ color: "#22c55e" }}>{mensagem}</p>}
      {!carregando && !erro && compras.length === 0 && <p>Nenhuma compra encontrada.</p>}

      {compras.length > 0 && (
        <>
          <FormSelectSearch
            label="Pesquisar compra"
            name="compraSelecionada"
            value={compraSelecionada}
            onChange={alterarCompraSelecionada}
            options={opcoesCompras}
            placeholder="Selecione uma compra..."
            isClearable={true}
          />

          <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", marginTop: "20px", width: "100%" }}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Fornecedor</th>
                <th>Funcionário</th>
                <th>Data</th>
                <th>Status</th>
                <th>Entregue</th>
                <th>Valor Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {comprasFiltradas.map((c) => (
                <tr key={c.id_compra}>
                  <td>{c.nome || "—"}</td>
                  <td>{c.fornecedor_nome || c.fornecedor}</td>
                  <td>{c.funcionario_nome || c.funcionario}</td>
                  <td>{c.data_compra}</td>
                  <td>{c.status}</td>
                  <td>{c.entregue ? "✓ Sim" : "✗ Não"}</td>
                  <td>R$ {parseFloat(c.valor_total).toFixed(2)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <Link to={`/compras/${c.id_compra}`} style={{ color: "#60a5fa" }}>
                        Ver detalhes
                      </Link>
                      <Link to={`/compras/${c.id_compra}/editar`} style={{ color: "#60a5fa" }}>
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => marcarComoEntregue(c.id_compra)}
                        disabled={c.entregue || compraAtualizando === c.id_compra}
                      >
                        {c.entregue
                          ? "Entregue"
                          : compraAtualizando === c.id_compra
                            ? "Atualizando..."
                            : "Marcar entregue"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button onClick={() => setPagina(pagina - 1)} disabled={!temAnterior}>Página anterior</button>
            <span>Página {pagina}</span>
            <button onClick={() => setPagina(pagina + 1)} disabled={!temProxima}>Próxima página</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Compras;
