import { useState } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado } from "../services/crudService";
import { formatarErroAPI } from "../utils/errosApi";
import { invalidateCache } from "../utils/apiCache";

function gerarIdFuncionario() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const sufixo = Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `FNC${sufixo}`;
}

const estadoInicial = {
  nome: "", cargo: "",
  data_admissao: new Date().toISOString().split("T")[0],
  turno: "Manhã", salario: "0.00", horas_semanais: "0.00", ativo: "true",
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
      invalidateCache("/funcionarios/");
      setMensagem("Funcionário cadastrado com sucesso!");
      setErro("");
      setFuncionario(estadoInicial);
    } catch (err) {
      setErro(formatarErroAPI(err, "Erro ao cadastrar funcionário. Verifique os campos."));
      setMensagem("");
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Cadastrar Funcionário</h1>
      <p className="page-subtitle">Formulário para cadastrar um novo funcionário.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit} className="form-container">
        <FormInput label="Nome" name="nome" value={funcionario.nome} onChange={handleChange} required />
        <FormInput label="Cargo" name="cargo" value={funcionario.cargo} onChange={handleChange} required />
        <FormInput label="Data de Admissão" name="data_admissao" type="date" value={funcionario.data_admissao} onChange={handleChange} required />
        <FormSelect label="Turno" name="turno" value={funcionario.turno} onChange={handleChange}
          options={[{ value: "Manhã", label: "Manhã" }, { value: "Tarde", label: "Tarde" }, { value: "Noite", label: "Noite" }]}
        />
        <FormInput label="Salário (R$)" name="salario" type="number" value={funcionario.salario} onChange={handleChange} required />
        <FormInput label="Horas Semanais" name="horas_semanais" type="number" value={funcionario.horas_semanais} onChange={handleChange} required />
        <FormSelect label="Ativo?" name="ativo" value={funcionario.ativo} onChange={handleChange}
          options={[{ value: "true", label: "Sim" }, { value: "false", label: "Não" }]}
        />

        <div className="form-actions">
          <BotaoSalvar texto="Cadastrar Funcionário" />
        </div>
      </form>
    </div>
  );
}

export default CadastrarFuncionario;
