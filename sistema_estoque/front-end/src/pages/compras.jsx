import { useEffect, useState } from "react";
import api from "../services/api";

function Compras() {
  const [compras, setCompras] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/compras/")
      .then((response) => {
        setErro("");

        if (Array.isArray(response.data)) {
          setCompras(response.data);
        } else if (response.data.results) {
          setCompras(response.data.results);
        } else {
          setCompras([]);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar compras:", error);
        setErro("Não foi possível carregar as compras.");
      });
  }, []);

  return (
    <div style={{ color: "white", padding: "20px" }}>
      <h1>Compras</h1>

      {erro && <p>{erro}</p>}

      {compras.length === 0 && !erro ? (
        <p>Nenhuma compra encontrada.</p>
      ) : (
        <ul>
          {compras.map((compra) => (
            <li key={compra.id_compra}>
              Compra {compra.id_compra} - Total: R$ {compra.valor_total}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Compras;