import { useEffect, useState } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";
import { gerarIdSequencial } from "../utils/gerarIdSequencial";

const estadoInicial = {
  nome: "",
  cargo: "",
  data_admissao: new Date().toISOString().split("T")[0],
  turno: "Manhã",
  salario: "0.00",
  horas_semanais: "0.00",
  ativo: "true",
};

function CadastrarFuncionario() {
  const [funcionario, setFuncionario] = useState(estadoInicial);
  const [funcionarios, setFuncionarios] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    listarDados("/funcionarios/").then((data) => setFuncionarios(data));
  }, []);

  function handleChange(e) {
    setFuncionario({ ...funcionario, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const funcionarioCriado = await criarDado("/funcionarios/", {
        ...funcionario,
        id_funcionario: gerarIdSequencial(funcionarios, "id_funcionario", "FNC"),
        ativo: funcionario.ativo === "true",
      });
      setFuncionarios((funcionariosAtuais) => [...funcionariosAtuais, funcionarioCriado]);

      setMensagem("Funcionário cadastrado com sucesso!");
      setErro("");
      setFuncionario(estadoInicial);
    } catch (err) {
      setErro("Erro ao cadastrar funcionário. Verifique os campos.");
      setMensagem("");
    }
  }

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Cadastrar Funcionário</h1>
      <p>Formulário para cadastrar um novo funcionário.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <FormInput
          label="Nome"
          name="nome"
          value={funcionario.nome}
          onChange={handleChange}
          required={true}
        />

        <FormInput
          label="Cargo"
          name="cargo"
          value={funcionario.cargo}
          onChange={handleChange}
          required={true}
        />

        <FormInput
          label="Data de Admissão"
          name="data_admissao"
          type="date"
          value={funcionario.data_admissao}
          onChange={handleChange}
          required={true}
        />

        <FormSelect
          label="Turno"
          name="turno"
          value={funcionario.turno}
          onChange={handleChange}
          options={[
            { value: "Manhã", label: "Manhã" },
            { value: "Tarde", label: "Tarde" },
            { value: "Noite", label: "Noite" },
          ]}
        />

        <FormInput
          label="Salário (R$)"
          name="salario"
          type="number"
          value={funcionario.salario}
          onChange={handleChange}
          required={true}
        />

        <FormInput
          label="Horas Semanais"
          name="horas_semanais"
          type="number"
          value={funcionario.horas_semanais}
          onChange={handleChange}
          required={true}
        />

        <FormSelect
          label="Ativo?"
          name="ativo"
          value={funcionario.ativo}
          onChange={handleChange}
          options={[
            { value: "true", label: "Sim" },
            { value: "false", label: "Não" },
          ]}
        />

        <BotaoSalvar texto="Cadastrar Funcionário" />
      </form>
    </div>
  );
}

export default CadastrarFuncionario;
