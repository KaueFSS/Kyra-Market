import { useEffect, useState } from "react";
import api from "../services/api";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get("/clientes/")
      .then((response) => {
        console.log("Clientes:", response.data);

        if (Array.isArray(response.data)) {
          setClientes(response.data);
        } else if (response.data.results) {
          setClientes(response.data.results);
        } else {
          setClientes([]);
        }

        setErro("");
      })
      .catch((error) => {
        console.error("Erro ao buscar clientes:", error);
        setErro("Não foi possível carregar os clientes.");
      })
      .finally(() => {
        setCarregando(false);
      });
  }, []);

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Clientes</h1>
      <p>Lista de clientes cadastrados no sistema.</p>

      {carregando && <p>Carregando clientes...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}

      {!carregando && !erro && clientes.length === 0 && (
        <p>Nenhum cliente encontrado.</p>
      )}

      {clientes.length > 0 && (
        <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", marginTop: "20px" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Bairro</th>
              <th>Possui Fiado</th>
              <th>Saldo Fiado</th>
              <th>Última Compra</th>
            </tr>
          </thead>

          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id_cliente}>
                <td>{cliente.id_cliente}</td>
                <td>{cliente.nome}</td>
                <td>{cliente.telefone}</td>
                <td>{cliente.bairro}</td>
                <td>{cliente.possui_fiado ? "Sim" : "Não"}</td>
                <td>R$ {cliente.saldo_fiado}</td>
                <td>{cliente.ultima_compra || "Sem registro"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Clientes;