import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import { formatarMoeda } from "../utils/formatadores";
import { mascaraTelefone } from "../utils/mascaras";
import { useFormShortcuts } from "../utils/useFormShortcuts";
import { invalidateCache } from "../utils/apiCache";
import { showToast } from "../utils/toast";

function validar(f) {
  const erros = {};
  if (!f.nome?.trim()) erros.nome = "Nome é obrigatório.";
  if (f.telefone && f.telefone.replace(/\D/g,"").length < 10) erros.telefone = "Telefone incompleto.";
  return erros;
}

function EditarCliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm]     = useState(null);
  const [erros, setErros]   = useState({});
  const [erro, setErro]     = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.get(`/clientes/${id}/`).then((res) => setForm(res.data));
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    let val = name === "telefone" ? mascaraTelefone(value) : value;
    setForm(prev => ({ ...prev, [name]: val }));
    if (erros[name]) setErros(prev => ({ ...prev, [name]: "" }));
  }

  async function salvar() {
    const e = validar(form);
    if (Object.keys(e).length) { setErros(e); return; }
    setSalvando(true);
    try {
      await api.patch(`/clientes/${id}/`, {
        nome: form.nome, telefone: form.telefone,
        bairro: form.bairro, data_cadastro: form.data_cadastro,
      });
      invalidateCache("/clientes/?page=1");
      showToast("Cliente atualizado com sucesso!", "success");
      setTimeout(() => navigate(`/clientes?highlight=${id}`), 900);
    } catch {
      setErro("Erro ao atualizar cliente.");
    } finally {
      setSalvando(false);
    }
  }

  function handleSubmit(e) { e.preventDefault(); salvar(); }

  useFormShortcuts({ onSubmit: salvar, onCancel: () => navigate("/clientes") });

  if (!form) return <div className="page-container"><p className="loading-text">Carregando...</p></div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Editar Cliente</h1>
      <p className="page-subtitle">ID: {id}</p>

      <div className="card" style={{ maxWidth: 400, marginBottom: 20 }}>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Saldo Fiado: <strong style={{ color: form.saldo_fiado > 0 ? "var(--accent-purple)" : "var(--accent-green)" }}>
            {formatarMoeda(form.saldo_fiado)}
          </strong>
        </p>
        <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Total em compras: <strong style={{ color: "var(--accent-green)" }}>{formatarMoeda(form.total_valor)}</strong>
        </p>
      </div>

      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit} className="form-container">
        <FormInput label="Nome" name="nome" value={form.nome} onChange={handleChange} required error={erros.nome} />
        <FormInput label="Telefone" name="telefone" value={form.telefone || ""} onChange={handleChange} placeholder="(21) 99999-9999" error={erros.telefone} hint="Formatado automaticamente" />
        <FormInput label="Bairro" name="bairro" value={form.bairro || ""} onChange={handleChange} />
        <FormInput label="Data de Cadastro" name="data_cadastro" type="date" value={form.data_cadastro} onChange={handleChange} required />

        <div className="form-actions">
          <BotaoSalvar texto={salvando ? "Salvando…" : "Salvar Alterações"} />
          <button type="button" className="btn btn-back" onClick={() => navigate("/clientes")}>← Voltar</button>
        </div>
      </form>
    </div>
  );
}

export default EditarCliente;
