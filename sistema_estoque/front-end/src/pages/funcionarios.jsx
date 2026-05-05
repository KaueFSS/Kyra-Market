import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Paginacao from "../components/Paginacao";
import FormSelectSearch from "../components/FormSelectSearch";

function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [erro, setErro] = useState("");
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");

  const POR_PAGINA = 15;

  useEffect(() => {
    setFuncionarioSelecionado("");
    api.get(`/funcionarios/?page=${pagina}`)
      .then((response) => {
        setErro("");
        const data = response.data;
        if (Array.isArray(data)) {
          setFuncionarios(data);
        } else {
          setFuncionarios(data.results ?? []);
          if (data.count) setTotalPaginas(Math.ceil(data.count / POR_PAGINA));
        }
      })
      .catch(() => setErro("Não foi possível carregar os funcionários."));
  }, [pagina]);

  function alterarFuncionarioSelecionado(event) {
    setFuncionarioSelecionado(event.target.value);
  }

  function mudarPagina(novaPagina) {
    setFuncionarioSelecionado("");
    setPagina(novaPagina);
  }

  const opcoesFuncionarios = funcionarios.map((funcionario) => ({
    value: funcionario.id_funcionario,
    label: `${funcionario.id_funcionario} - ${funcionario.nome}`,
  }));

  const funcionariosFiltrados = funcionarioSelecionado
    ? funcionarios.filter((funcionario) => funcionario.id_funcionario === funcionarioSelecionado)
    : funcionarios;

  const thStyle = {
    padding: "10px 14px",
    textAlign: "left",
    borderBottom: "1px solid #444",
    color: "#aaa",
    fontWeight: "600",
    whiteSpace: "nowrap",
  };

  const tdStyle = {
    padding: "10px 14px",
    borderBottom: "1px solid #2a2a3e",
    color: "white",
  };

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Funcionários</h1>

      {erro && <p style={{ color: "#f87171" }}>{erro}</p>}

      {funcionarios.length === 0 && !erro ? (
        <p>Nenhum funcionário encontrado.</p>
      ) : (
        <>
          <FormSelectSearch
            label="Pesquisar funcionario"
            name="funcionarioSelecionado"
            value={funcionarioSelecionado}
            onChange={alterarFuncionarioSelecionado}
            options={opcoesFuncionarios}
            placeholder="Selecione um funcionario..."
            isClearable={true}
          />

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#1f1f2e", borderRadius: "8px" }}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Nome</th>
                  <th style={thStyle}>Cargo</th>
                  <th style={thStyle}>Turno</th>
                  <th style={thStyle}>Salário</th>
                  <th style={thStyle}>Horas/sem</th>
                  <th style={thStyle}>Admissão</th>
                  <th style={thStyle}>Ativo</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {funcionariosFiltrados.map((f) => (
                  <tr key={f.id_funcionario} style={{ backgroundColor: "#1a1a2e" }}>
                    <td style={tdStyle}>{f.id_funcionario}</td>
                    <td style={tdStyle}>{f.nome}</td>
                    <td style={tdStyle}>{f.cargo}</td>
                    <td style={tdStyle}>{f.turno}</td>
                    <td style={tdStyle}>R$ {parseFloat(f.salario).toFixed(2)}</td>
                    <td style={tdStyle}>{f.horas_semanais}h</td>
                    <td style={tdStyle}>{f.data_admissao}</td>
                    <td style={tdStyle}>{f.ativo ? "✓" : "✗"}</td>
                    <td style={tdStyle}><Link to={`/funcionarios/${f.id_funcionario}/editar`} style={{ color: "#60a5fa" }}>Editar</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacao paginaAtual={pagina} totalPaginas={totalPaginas} onMudarPagina={mudarPagina} />
        </>
      )}
    </div>
  );
}

export default Funcionarios;
