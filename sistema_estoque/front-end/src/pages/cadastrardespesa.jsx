import { useState, useEffect } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import FormSelectSearch from "../components/FormSelectSearch";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";

function gerarIdDespesa() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const sufixo = Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `DSP${sufixo}`;
}

function CadastrarDespesa() {
  const hoje = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    funcionario: "", compra: "", data: hoje, categoria: "",
    descricao: "", valor: "0.00", recorrente: "false",
  });

  const [funcionarios, setFuncionarios] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    listarDados("/funcionarios/").then((data) => setFuncionarios(data));
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    const payload = { ...form, recorrente: form.recorrente === "true", compra: form.compra || null };
    try {
      await criarDado("/despesas/", { ...payload, id_despesa: gerarIdDespesa() });
      setMensagem("Despesa cadastrada com sucesso!");
      setForm({ funcionario: "", compra: "", data: hoje, categoria: "", descricao: "", valor: "0.00", recorrente: "false" });
    } catch {
      setErro("Erro ao cadastrar despesa. Verifique os campos.");
      setMensagem("");
    }
  }

  const opcoesFuncionarios = funcionarios.map((f) => ({
    value: f.id_funcionario,
    label: `${f.id_funcionario} - ${f.nome}`,
  }));

  return (
    <div className="page-container">
      <h1 className="page-title">Cadastrar Despesa</h1>
      <p className="page-subtitle">Formulário para cadastrar uma nova despesa.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit} className="form-container">
        <FormSelectSearch
          label="Funcionário Responsável"
          name="funcionario"
          value={form.funcionario}
          onChange={handleChange}
          options={opcoesFuncionarios}
          placeholder="Selecione um funcionário..."
          required={true}
        />
        <FormInput label="ID da Compra Vinculada (opcional)" name="compra" value={form.compra} onChange={handleChange} placeholder="Deixe em branco se não houver" />
        <FormInput label="Data" name="data" type="date" value={form.data} onChange={handleChange} required />
        <FormInput label="Categoria" name="categoria" value={form.categoria} onChange={handleChange} required placeholder="Ex: Aluguel, Luz, Água..." />
        <FormInput label="Descrição" name="descricao" value={form.descricao} onChange={handleChange} placeholder="Descrição adicional (opcional)" />
        <FormInput label="Valor (R$)" name="valor" type="number" value={form.valor} onChange={handleChange} required />
        <FormSelect label="Recorrente?" name="recorrente" value={form.recorrente} onChange={handleChange}
          options={[{ value: "false", label: "Não" }, { value: "true", label: "Sim" }]}
        />

        <div className="form-actions">
          <BotaoSalvar texto="Cadastrar Despesa" />
        </div>
      </form>
    </div>
  );
}

export default CadastrarDespesa;
