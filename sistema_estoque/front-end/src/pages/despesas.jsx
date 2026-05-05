import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import FormSelectSearch from "../components/FormSelectSearch";

function Despesas() {
  const [despesas, setDespesas] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(false);
  const [temAnterior, setTemAnterior] = useState(false);
  const [despesaSelecionada, setDespesaSelecionada] = useState("");

  useEffect(() => {
    setCarregando(true);
    setDespesaSelecionada("");
    api.get(`/despesas/?page=${pagina}`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setDespesas(response.data);
          setTemProxima(false);
          setTemAnterior(false);
        } else if (response.data.results) {
          setDespesas(response.data.results);
          setTemProxima(response.data.next !== null);
          setTemAnterior(response.data.previous !== null);
        } else {
          setDespesas([]);
        }
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar as despesas."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  function alterarDespesaSelecionada(event) {
    setDespesaSelecionada(event.target.value);
  }

  const opcoesDespesas = despesas.map((despesa) => ({
    value: despesa.id_despesa,
    label: `${despesa.id_despesa} - ${despesa.categoria} - ${despesa.data}`,
  }));

  const despesasFiltradas = despesaSelecionada
    ? despesas.filter((despesa) => despesa.id_despesa === despesaSelecionada)
    : despesas;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Despesas</h1>

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {!carregando && !erro && despesas.length === 0 && <p>Nenhuma despesa encontrada.</p>}

      {despesas.length > 0 && (
        <>
          <FormSelectSearch
            label="Pesquisar despesa"
            name="despesaSelecionada"
            value={despesaSelecionada}
            onChange={alterarDespesaSelecionada}
            options={opcoesDespesas}
            placeholder="Selecione uma despesa..."
            isClearable={true}
          />

          <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", marginTop: "20px", width: "100%" }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Funcionário</th>
                <th>Recorrente</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {despesasFiltradas.map((d) => (
                <tr key={d.id_despesa}>
                  <td>{d.data}</td>
                  <td>{d.categoria}</td>
                  <td>{d.descricao || "—"}</td>
                  <td>R$ {parseFloat(d.valor).toFixed(2)}</td>
                  <td>{d.funcionario_nome || d.funcionario}</td>
                  <td>{d.recorrente ? "Sim" : "Não"}</td>
                  <td><Link to={`/despesas/${d.id_despesa}/editar`} style={{ color: "#60a5fa" }}>Editar</Link></td>
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

export default Despesas;
