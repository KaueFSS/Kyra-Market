import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import FormSelectSearch from "../components/FormSelectSearch";

function ItensVenda() {
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(false);
  const [temAnterior, setTemAnterior] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState("");

  useEffect(() => {
    setCarregando(true);
    setItemSelecionado("");

    api
      .get(`/itens-venda/?page=${pagina}`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setItens(response.data);
          setTemProxima(false);
          setTemAnterior(false);
        } else if (response.data.results) {
          setItens(response.data.results);
          setTemProxima(response.data.next !== null);
          setTemAnterior(response.data.previous !== null);
        } else {
          setItens([]);
        }

        setErro("");
      })
      .catch(() => setErro("Nao foi possivel carregar os itens de venda."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  function alterarItemSelecionado(event) {
    setItemSelecionado(event.target.value);
  }

  const opcoesItens = itens.map((item) => ({
    value: item.id_item_venda,
    label: `${item.id_item_venda} - ${item.produto_nome || item.produto}`,
  }));

  const itensFiltrados = itemSelecionado
    ? itens.filter((item) => item.id_item_venda === itemSelecionado)
    : itens;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Itens de Venda</h1>

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {!carregando && !erro && itens.length === 0 && <p>Nenhum item encontrado.</p>}

      {itens.length > 0 && (
        <>
          <FormSelectSearch
            label="Pesquisar item de venda"
            name="itemSelecionado"
            value={itemSelecionado}
            onChange={alterarItemSelecionado}
            options={opcoesItens}
            placeholder="Selecione um item..."
            isClearable={true}
          />

          <table
            border="1"
            cellPadding="10"
            style={{ borderCollapse: "collapse", marginTop: "20px", width: "100%" }}
          >
            <thead>
              <tr>
                <th>Venda</th>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Desconto</th>
                <th>Subtotal</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {itensFiltrados.map((item) => (
                <tr key={item.id_item_venda}>
                  <td>{item.venda}</td>
                  <td>{item.produto_nome || item.produto}</td>
                  <td>{item.quantidade_vendida}</td>
                  <td>R$ {parseFloat(item.desconto_aplicado || 0).toFixed(2)}</td>
                  <td>R$ {parseFloat(item.subtotal || 0).toFixed(2)}</td>
                  <td>
                    <Link to={`/itens-venda/${item.id_item_venda}/editar`} style={{ color: "#60a5fa" }}>
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button onClick={() => setPagina(pagina - 1)} disabled={!temAnterior}>
              Pagina anterior
            </button>
            <span>Pagina {pagina}</span>
            <button onClick={() => setPagina(pagina + 1)} disabled={!temProxima}>
              Proxima pagina
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ItensVenda;
