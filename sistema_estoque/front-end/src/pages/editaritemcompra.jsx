import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";

function EditarItemCompra() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get(`/itens-compra/${id}/`).then((res) => setForm(res.data));
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.patch(`/itens-compra/${id}/`, {
        quantidade: parseInt(form.quantidade),
        valor_unitario: parseFloat(form.valor_unitario),
      });
      setMensagem("Item atualizado com sucesso!");
      setErro("");
    } catch {
      setErro("Erro ao atualizar item de compra.");
      setMensagem("");
    }
  }

  if (!form) return <div style={{ color: "white", padding: "30px" }}>Carregando...</div>;

  const total = (parseInt(form.quantidade) || 0) * (parseFloat(form.valor_unitario) || 0);

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Editar Item de Compra</h1>
      <p style={{ color: "#aaa" }}>Compra: <strong style={{ color: "white" }}>{form.compra}</strong> | Produto: <strong style={{ color: "white" }}>{form.produto_nome || form.produto}</strong></p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <FormInput label="Quantidade" name="quantidade" type="number" min="1" value={form.quantidade} onChange={handleChange} required />
        <FormInput label="Valor Unitário (R$)" name="valor_unitario" type="number" step="0.01" value={form.valor_unitario} onChange={handleChange} required />

        <div style={{ marginBottom: "15px" }}>
          <label>Total</label><br />
          <input type="text" value={`R$ ${total.toFixed(2)}`} disabled
            style={{ padding: "8px", width: "270px", borderRadius: "6px", border: "1px solid #555", marginTop: "5px", backgroundColor: "#2a2a3e", color: "#4ade80", fontWeight: "bold" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" onClick={() => navigate("/itens-compra")} style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarItemCompra;
