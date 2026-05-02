import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Vendas() {
  const [vendas, setVendas] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(false);
  const [temAnterior, setTemAnterior] = useState(false);

  useEffect(() => {
    setCarregando(true);

    api.get(`/vendas/?page=${pagina}`)
      .then((response) => {
        console.log("Vendas:", response.data);

        if (Array.isArray(response.data)) {
          setVendas(response.data);
          setTemProxima(false);
          setTemAnterior(false);
        } else if (response.data.results) {
          setVendas(response.data.results);
          setTemProxima(response.data.next !== null);
          setTemAnterior(response.data.previous !== null);
        } else {
          setVendas([]);
        }

        setErro("");
      })
      .catch((error) => {
        console.error("Erro ao buscar vendas:", error);
        setErro("Não foi possível carregar as vendas.");
      })
      .finally(() => {
        setCarregando(false);
      });
  }, [pagina]);

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Vendas</h1>
      <p>Lista de vendas registradas no sistema.</p>

      {carregando && <p>Carregando vendas...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}

      {!carregando && !erro && vendas.length === 0 && (
        <p>Nenhuma venda encontrada.</p>
      )}

      {vendas.length > 0 && (
        <>
          <table
            border="1"
            cellPadding="10"
            style={{
              borderCollapse: "collapse",
              marginTop: "20px",
              width: "100%",
            }}
          >
            <thead>
              <tr>
                <th>ID Venda</th>
                <th>Data</th>
                <th>Hora</th>
                <th>Forma de Pagamento</th>
                <th>Funcionário</th>
                <th>Cliente</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {vendas.map((venda) => (
                <tr key={venda.id_venda}>
                  <td>{venda.id_venda}</td>
                  <td>{venda.data_venda}</td>
                  <td>{venda.hora}</td>
                  <td>{venda.forma_pagamento}</td>
                  <td>{venda.funcionario}</td>
                  <td>{venda.cliente || "Cliente não informado"}</td>
                  <td>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <Link to={`/vendas/${venda.id_venda}`} style={{ color: "#60a5fa" }}>
                        Ver detalhes
                      </Link>
                      <Link to={`/vendas/${venda.id_venda}/editar`} style={{ color: "#60a5fa" }}>
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => setPagina(pagina - 1)}
              disabled={!temAnterior}
            >
              Página anterior
            </button>

            <span>Página {pagina}</span>

            <button
              onClick={() => setPagina(pagina + 1)}
              disabled={!temProxima}
            >
              Próxima página
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Vendas;
