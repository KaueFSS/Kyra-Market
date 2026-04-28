import { useState } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado } from "../services/crudService";

function CadastrarDespesa() {
  const hoje = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    id_despesa: "",
    funcionario: "",
    compra: "",
    data: hoje,
    categoria: "",
    descricao: "",
    valor: "0.00",
    recorrente: "false",
  });

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    const payload = {
      ...form,
      recorrente: form.recorrente === "true",
      compra: form.compra || null,
    };

    try {
      await criarDado("/despesas/", payload);
      setMensagem("Despesa cadastrada com sucesso!");
      setForm({ id_despesa: "", funcionario: "", compra: "", data: hoje, categoria: "", descricao: "", valor: "0.00", recorrente: "false" });
    } catch {
      setErro("Erro ao cadastrar despesa. Verifique os campos.");
      setMensagem("");
    }
  }

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Cadastrar Despesa</h1>
      <p>Formulário para cadastrar uma nova despesa.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <FormInput
          label="ID da Despesa"
          name="id_despesa"
          value={form.id_despesa}
          onChange={handleChange}
          required={true}
          placeholder="Ex: DESP001"
        />

        <FormInput
          label="ID do Funcionário Responsável"
          name="funcionario"
          value={form.funcionario}
          onChange={handleChange}
          required={true}
          placeholder="Ex: FUNC001"
        />

        <FormInput
          label="ID da Compra Vinculada (opcional)"
          name="compra"
          value={form.compra}
          onChange={handleChange}
          placeholder="Deixe em branco se não houver"
        />

        <FormInput
          label="Data"
          name="data"
          type="date"
          value={form.data}
          onChange={handleChange}
          required={true}
        />

        <FormInput
          label="Categoria"
          name="categoria"
          value={form.categoria}
          onChange={handleChange}
          required={true}
          placeholder="Ex: Aluguel, Luz, Água..."
        />

        <FormInput
          label="Descrição"
          name="descricao"
          value={form.descricao}
          onChange={handleChange}
          placeholder="Descrição adicional (opcional)"
        />

        <FormInput
          label="Valor (R$)"
          name="valor"
          type="number"
          value={form.valor}
          onChange={handleChange}
          required={true}
        />

        <FormSelect
          label="Recorrente?"
          name="recorrente"
          value={form.recorrente}
          onChange={handleChange}
          options={[
            { value: "false", label: "Não" },
            { value: "true", label: "Sim" },
          ]}
        />

        <BotaoSalvar texto="Cadastrar Despesa" />
      </form>
    </div>
  );
}

export default CadastrarDespesa;
