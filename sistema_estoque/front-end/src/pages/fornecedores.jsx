import { useEffect, useState } from "react";
import api from "../services/api";
import Paginacao from "../components/Paginacao";

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/fornecedores/")
      .then((response) => {
        setErro("");

        if (Array.isArray(response.data)) {
          setFornecedores(response.data);
        } else if (response.data.results) {
          setFornecedores(response.data.results);
        } else {
          setFornecedores([]);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar fornecedores:", error);
        setErro("Não foi possível carregar os fornecedores.");
      });
  }, []);

  return (
    <div style={{ color: "white", padding: "20px" }}>
      <h1>Fornecedores</h1>

      {erro && <p>{erro}</p>}

      {fornecedores.length === 0 && !erro ? (
        <p>Nenhum fornecedor encontrado.</p>
      ) : (
        <ul>
          {fornecedores.map((fornecedor) => (
            <li key={fornecedor.id_fornecedor}>
              {fornecedor.nome_fantasia} - {fornecedor.cidade}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Fornecedores;