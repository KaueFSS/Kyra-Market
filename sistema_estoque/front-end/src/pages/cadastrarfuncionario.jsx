import { useState } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado } from "../services/crudService";

function gerarIdFuncionario() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const sufixo = Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `FNC${sufixo}`;
}

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
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  function handleChange(e) {
    setFuncionario({ ...funcionario, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await criarDado("/funcionarios/", {
        ...funcionario,
        id_funcionario: gerarIdFuncionario(),
        ativo: funcionario.ativo === "true",
      });

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
