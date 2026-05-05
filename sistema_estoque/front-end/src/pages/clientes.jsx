import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import FormSelectSearch from "../components/FormSelectSearch";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(false);
  const [temAnterior, setTemAnterior] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState("");

  useEffect(() => {
    setCarregando(true);
    setClienteSelecionado("");
    api.get(`/clientes/?page=${pagina}`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setClientes(response.data);
          setTemProxima(false);
          setTemAnterior(false);
        } else if (response.data.results) {
          setClientes(response.data.results);
          setTemProxima(response.data.next !== null);
          setTemAnterior(response.data.previous !== null);
        } else {
          setClientes([]);
        }
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar os clientes."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  function alterarClienteSelecionado(event) {
    setClienteSelecionado(event.target.value);
  }

  const opcoesClientes = clientes.map((cliente) => ({
    value: cliente.id_cliente,
    label: `${cliente.id_cliente} - ${cliente.nome}`,
  }));

  const clientesFiltrados = clienteSelecionado
    ? clientes.filter((cliente) => cliente.id_cliente === clienteSelecionado)
    : clientes;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Clientes</h1>
      <p>Lista de clientes cadastrados no sistema.</p>

      {carregando && <p>Carregando clientes...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {!carregando && !erro && clientes.length === 0 && <p>Nenhum cliente encontrado.</p>}

      {clientes.length > 0 && (
        <>
          <FormSelectSearch
            label="Pesquisar cliente"
            name="clienteSelecionado"
            value={clienteSelecionado}
            onChange={alterarClienteSelecionado}
            options={opcoesClientes}
            placeholder="Selecione um cliente..."
            isClearable={true}
          />

          <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", marginTop: "20px", width: "100%" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Bairro</th>
                <th>Possui Fiado</th>
                <th>Saldo Fiado</th>
                <th>Data Cadastro</th>
                <th>Total em Compras</th>
                <th>Última Compra</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((c) => (
                <tr key={c.id_cliente}>
                  <td>{c.id_cliente}</td>
                  <td>{c.nome}</td>
                  <td>{c.telefone}</td>
                  <td>{c.bairro}</td>
                  <td>{c.possui_fiado ? "Sim" : "Não"}</td>
                  <td>R$ {parseFloat(c.saldo_fiado).toFixed(2)}</td>
                  <td>{c.data_cadastro}</td>
                  <td>R$ {parseFloat(c.total_valor).toFixed(2)}</td>
                  <td>{c.ultima_compra || "—"}</td>
                  <td><Link to={`/clientes/${c.id_cliente}/editar`} style={{ color: "#60a5fa" }}>Editar</Link></td>
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

export default Clientes;
