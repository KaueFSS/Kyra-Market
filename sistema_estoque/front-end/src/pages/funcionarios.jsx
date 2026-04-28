import { useEffect, useState } from "react";
import api from "../services/api";
import Paginacao from "../components/Paginacao";

function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/funcionarios/")
      .then((response) => {
        setErro("");

        if (Array.isArray(response.data)) {
          setFuncionarios(response.data);
        } else if (response.data.results) {
          setFuncionarios(response.data.results);
        } else {
          setFuncionarios([]);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar funcionarios:", error);
        setErro("Não foi possível carregar os funcionários.");
      });
  }, []);

  return (
    <div style={{ color: "white", padding: "20px" }}>
      <h1>Funcionários</h1>

      {erro && <p>{erro}</p>}

      {funcionarios.length === 0 && !erro ? (
        <p>Nenhum funcionário encontrado.</p>
      ) : (
        <ul>
          {funcionarios.map((funcionario) => (
            <li key={funcionario.id_funcionario}>
              {funcionario.nome} - {funcionario.cargo}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Funcionarios;