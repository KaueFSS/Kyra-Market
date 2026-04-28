import { useEffect, useState } from "react";
import api from "../services/api";
import Paginacao from "../components/Paginacao";

function Despesas() {
  const [despesas, setDespesas] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/despesas/")
      .then((response) => {
        setErro("");

        if (Array.isArray(response.data)) {
          setDespesas(response.data);
        } else if (response.data.results) {
          setDespesas(response.data.results);
        } else {
          setDespesas([]);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar despesas:", error);
        setErro("Não foi possível carregar as despesas.");
      });
  }, []);

  return (
    <div style={{ color: "white", padding: "20px" }}>
      <h1>Despesas</h1>

      {erro && <p>{erro}</p>}

      {despesas.length === 0 && !erro ? (
        <p>Nenhuma despesa encontrada.</p>
      ) : (
        <ul>
          {despesas.map((despesa) => (
            <li key={despesa.id_despesa}>
              {despesa.categoria} - R$ {despesa.valor}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Despesas;