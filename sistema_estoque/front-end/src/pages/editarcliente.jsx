import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";

function EditarCliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get(`/clientes/${id}/`).then((res) => setForm(res.data));
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.patch(`/clientes/${id}/`, {
        nome: form.nome,
        telefone: form.telefone,
        bairro: form.bairro,
        data_cadastro: form.data_cadastro,
      });
      setMensagem("Cliente atualizado com sucesso!");
      setErro("");
    } catch {
      setErro("Erro ao atualizar cliente.");
      setMensagem("");
    }
  }

  if (!form) return <div style={{ color: "white", padding: "30px" }}>Carregando...</div>;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Editar Cliente</h1>
      <p style={{ color: "#aaa" }}>ID: {id}</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <div style={{ background: "#1f1f2e", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px" }}>
        <p style={{ margin: 0, color: "#aaa", fontSize: "14px" }}>Saldo Fiado atual: <strong style={{ color: form.saldo_fiado > 0 ? "#f87171" : "#4ade80" }}>R$ {parseFloat(form.saldo_fiado).toFixed(2)}</strong></p>
        <p style={{ margin: "4px 0 0", color: "#aaa", fontSize: "14px" }}>Total em compras: <strong style={{ color: "white" }}>R$ {parseFloat(form.total_valor).toFixed(2)}</strong></p>
      </div>

      <form onSubmit={handleSubmit}>
        <FormInput label="Nome" name="nome" value={form.nome} onChange={handleChange} required />
        <FormInput label="Telefone" name="telefone" value={form.telefone || ""} onChange={handleChange} placeholder="Ex: 21999999999" />
        <FormInput label="Bairro" name="bairro" value={form.bairro || ""} onChange={handleChange} />
        <FormInput label="Data de Cadastro" name="data_cadastro" type="date" value={form.data_cadastro} onChange={handleChange} required />

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" onClick={() => navigate("/clientes")} style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarCliente;
