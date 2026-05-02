import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { listarDados } from "../services/crudService";

function EditarVenda() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get(`/vendas/${id}/`).then((res) => setForm(res.data));
    listarDados("/funcionarios/").then(setFuncionarios);
    listarDados("/clientes/").then(setClientes);
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.patch(`/vendas/${id}/`, { ...form, cliente: form.cliente || null });
      setMensagem("Venda atualizada com sucesso!");
      setErro("");
    } catch {
      setErro("Erro ao atualizar venda.");
      setMensagem("");
    }
  }

  if (!form) return <div style={{ color: "white", padding: "30px" }}>Carregando...</div>;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Editar Venda</h1>
      <p style={{ color: "#aaa" }}>ID: {id}</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <FormInput label="Nome da Venda" name="nome" value={form.nome || ""} onChange={handleChange} placeholder="Ex: Venda Balcão - Manhã" />
        <FormInput label="Data da Venda" name="data_venda" type="date" value={form.data_venda} onChange={handleChange} required />
        <FormInput label="Hora" name="hora" type="time" value={form.hora} onChange={handleChange} required />
        <FormSelect label="Forma de Pagamento" name="forma_pagamento" value={form.forma_pagamento} onChange={handleChange}
          options={[
            { value: "dinheiro", label: "Dinheiro" },
            { value: "pix", label: "PIX" },
            { value: "cartao_debito", label: "Cartão de Débito" },
            { value: "cartao_credito", label: "Cartão de Crédito" },
            { value: "fiado", label: "Fiado" },
          ]}
        />
        <FormSelect label="Funcionário" name="funcionario" value={form.funcionario} onChange={handleChange}
          options={funcionarios.map((f) => ({ value: f.id_funcionario, label: `${f.nome} — ${f.cargo}` }))}
        />
        <FormSelect label="Cliente (opcional)" name="cliente" value={form.cliente || ""} onChange={handleChange}
          options={[{ value: "", label: "Sem cliente" }, ...clientes.map((c) => ({ value: c.id_cliente, label: c.nome }))]}
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" onClick={() => navigate("/vendas")} style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarVenda;
