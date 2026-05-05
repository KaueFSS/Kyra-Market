import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import { mascaraCNPJ, mascaraTelefone, mascaraCEP, limparMascara } from "../utils/mascaras";
import { useCEP } from "../utils/useCEP";
import { useFormShortcuts } from "../utils/useFormShortcuts";
import { invalidateCache } from "../utils/apiCache";
import { showToast } from "../utils/toast";

function validar(f) {
  const erros = {};
  if (!f.razao_social?.trim()) erros.razao_social = "Razão Social é obrigatória.";
  const d = limparMascara(f.cnpj || "");
  if (!d) erros.cnpj = "CNPJ é obrigatório.";
  else if (d.length !== 14) erros.cnpj = "CNPJ deve ter 14 dígitos.";
  if (f.telefone && limparMascara(f.telefone).length < 10) erros.telefone = "Telefone incompleto.";
  return erros;
}

function EditarFornecedor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm]     = useState(null);
  const [cep, setCep]       = useState("");
  const [erros, setErros]   = useState({});
  const [erro, setErro]     = useState("");
  const [salvando, setSalvando] = useState(false);

  const { buscarCEP, buscandoCEP, erroCEP } = useCEP(({ cidade, uf }) => {
    setForm(prev => ({ ...prev, cidade, uf }));
  });

  useEffect(() => {
    api.get(`/fornecedores/${id}/`).then((res) => setForm(res.data));
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    let val = value;
    if (name === "cnpj")     val = mascaraCNPJ(value);
    if (name === "telefone") val = mascaraTelefone(value);
    setForm(prev => ({ ...prev, [name]: val }));
    if (erros[name]) setErros(prev => ({ ...prev, [name]: "" }));
  }

  function handleCEP(e) {
    const masked = mascaraCEP(e.target.value);
    setCep(masked);
    if (limparMascara(masked).length === 8) buscarCEP(masked);
  }

  async function salvar() {
    const e = validar(form);
    if (Object.keys(e).length) { setErros(e); return; }
    setSalvando(true);
    try {
      await api.patch(`/fornecedores/${id}/`, form);
      invalidateCache("/fornecedores/?page=1");
      showToast("Fornecedor atualizado com sucesso!", "success");
      setTimeout(() => navigate(`/fornecedores?highlight=${id}`), 900);
    } catch {
      setErro("Erro ao atualizar fornecedor.");
    } finally {
      setSalvando(false);
    }
  }

  function handleSubmit(e) { e.preventDefault(); salvar(); }

  useFormShortcuts({ onSubmit: salvar, onCancel: () => navigate("/fornecedores") });

  if (!form) return <div className="page-container"><p className="loading-text">Carregando...</p></div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Editar Fornecedor</h1>
      <p className="page-subtitle">ID: {id}</p>

      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit} className="form-container">
        <FormInput label="Razão Social" name="razao_social" value={form.razao_social} onChange={handleChange} required error={erros.razao_social} />
        <FormInput label="Nome Fantasia" name="nome_fantasia" value={form.nome_fantasia || ""} onChange={handleChange} />
        <FormInput label="CNPJ" name="cnpj" value={mascaraCNPJ(form.cnpj || "")} onChange={handleChange} required placeholder="XX.XXX.XXX/XXXX-XX" error={erros.cnpj} hint="Formatado automaticamente" />
        <FormInput label="Telefone" name="telefone" value={mascaraTelefone(form.telefone || "")} onChange={handleChange} placeholder="(21) 99999-9999" error={erros.telefone} hint="Formatado automaticamente" />
        <FormInput label="Email" name="email" type="email" value={form.email || ""} onChange={handleChange} />

        <div className="cep-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">CEP <span style={{ fontSize:"0.72rem", color:"var(--text-muted)" }}>(preenche cidade e UF)</span></label>
            <input type="text" value={cep} onChange={handleCEP} placeholder="XXXXX-XXX" className="form-input" maxLength={9} />
            {erroCEP && <span className="form-field-error">{erroCEP}</span>}
          </div>
          <button type="button" className="btn-buscar-cep" onClick={() => buscarCEP(cep)} disabled={buscandoCEP || limparMascara(cep).length !== 8}>
            {buscandoCEP ? "Buscando…" : "🔍 Buscar"}
          </button>
        </div>

        <FormInput label="Cidade" name="cidade" value={form.cidade || ""} onChange={handleChange} />
        <FormInput label="UF" name="uf" value={form.uf || ""} onChange={handleChange} />
        <FormInput label="Prazo de Entrega (dias)" name="prazo_de_entraga" type="number" value={form.prazo_de_entraga || ""} onChange={handleChange} />
        <FormSelect label="Avaliação" name="avaliacao" value={String(form.avaliacao)} onChange={handleChange}
          options={[
            { value: "1", label: "1 - Ruim" }, { value: "2", label: "2 - Regular" },
            { value: "3", label: "3 - Bom" },  { value: "4", label: "4 - Muito Bom" },
            { value: "5", label: "5 - Excelente" },
          ]}
        />

        <div className="form-actions">
          <BotaoSalvar texto={salvando ? "Salvando…" : "Salvar Alterações"} />
          <button type="button" className="btn btn-back" onClick={() => navigate("/fornecedores")}>← Voltar</button>
        </div>
      </form>
    </div>
  );
}

export default EditarFornecedor;
