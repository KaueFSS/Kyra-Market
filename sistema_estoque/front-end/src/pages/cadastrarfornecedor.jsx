import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import { criarDado } from "../services/crudService";
import { mascaraCNPJ, mascaraTelefone, mascaraCEP, limparMascara } from "../utils/mascaras";
import { useCEP } from "../utils/useCEP";
import { useFormShortcuts } from "../utils/useFormShortcuts";
import { invalidateCache } from "../utils/apiCache";
import { formatarErroAPI } from "../utils/errosApi";

function gerarIdFornecedor() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return "FOR" + Array.from({ length: 7 }, () => chars[Math.floor(Math.random()*chars.length)]).join("");
}

const estadoInicial = {
  razao_social: "", nome_fantasia: "", cnpj: "", telefone: "",
  email: "", cidade: "", uf: "", prazo_de_entraga: "", avaliacao: "",
};

function validar(f) {
  const erros = {};
  if (!f.razao_social.trim()) erros.razao_social = "Razão Social é obrigatória.";
  const cnpjDigits = limparMascara(f.cnpj);
  if (!cnpjDigits) erros.cnpj = "CNPJ é obrigatório.";
  else if (cnpjDigits.length !== 14) erros.cnpj = "CNPJ deve ter 14 dígitos.";
  if (f.telefone && limparMascara(f.telefone).length < 10) erros.telefone = "Telefone incompleto.";
  return erros;
}

function CadastrarFornecedor() {
  const navigate = useNavigate();
  const [fornecedor, setFornecedor] = useState(estadoInicial);
  const [cep, setCep]   = useState("");
  const [erros, setErros] = useState({});
  const [erro, setErro]   = useState("");
  const [salvando, setSalvando] = useState(false);

  const { buscarCEP, buscandoCEP, erroCEP } = useCEP(({ cidade, uf }) => {
    setFornecedor(prev => ({ ...prev, cidade, uf }));
  });

  function handleChange(e) {
    const { name, value } = e.target;
    let val = value;
    if (name === "cnpj")     val = mascaraCNPJ(value);
    if (name === "telefone") val = mascaraTelefone(value);
    setFornecedor(prev => ({ ...prev, [name]: val }));
    if (erros[name]) setErros(prev => ({ ...prev, [name]: "" }));
  }

  function handleCEP(e) {
    const masked = mascaraCEP(e.target.value);
    setCep(masked);
    if (limparMascara(masked).length === 8) buscarCEP(masked);
  }

  async function salvar() {
    const e = validar(fornecedor);
    if (Object.keys(e).length) { setErros(e); return; }
    setSalvando(true);
    try {
      const criado = await criarDado("/fornecedores/", {
        ...fornecedor,
        cnpj: fornecedor.cnpj,           // backend aceita com máscara
        id_fornecedor: gerarIdFornecedor(),
      });
      invalidateCache("/fornecedores/");
      navigate(`/fornecedores?highlight=${criado.id_fornecedor}`);
    } catch (err) {
      setErro(formatarErroAPI(err, "Erro ao cadastrar fornecedor. Verifique os campos."));
    } finally {
      setSalvando(false);
    }
  }

  function handleSubmit(e) { e.preventDefault(); salvar(); }

  useFormShortcuts({
    onSubmit: salvar,
    onCancel: () => navigate("/fornecedores"),
  });

  return (
    <div className="page-container">
      <h1 className="page-title">Cadastrar Fornecedor</h1>
      <p className="page-subtitle">
        Formulário para cadastrar um novo fornecedor.&nbsp;
        <kbd style={{ fontSize:"0.72rem", background:"rgba(255,255,255,0.07)", border:"1px solid var(--border)", borderRadius:4, padding:"1px 5px" }}>Ctrl+Enter</kbd> para salvar
      </p>

      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit} className="form-container">
        <FormInput label="Razão Social" name="razao_social" value={fornecedor.razao_social} onChange={handleChange} required error={erros.razao_social} />
        <FormInput label="Nome Fantasia" name="nome_fantasia" value={fornecedor.nome_fantasia} onChange={handleChange} />
        <FormInput label="CNPJ" name="cnpj" value={fornecedor.cnpj} onChange={handleChange} required placeholder="XX.XXX.XXX/XXXX-XX" error={erros.cnpj} hint="Formatado automaticamente" />
        <FormInput label="Telefone" name="telefone" value={fornecedor.telefone} onChange={handleChange} placeholder="(21) 99999-9999" error={erros.telefone} hint="Formatado automaticamente" />
        <FormInput label="Email" name="email" type="email" value={fornecedor.email} onChange={handleChange} />

        {/* CEP com autocomplete */}
        <div className="cep-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">CEP <span style={{ fontSize:"0.72rem", color:"var(--text-muted)" }}>(preenche cidade e UF)</span></label>
            <input
              type="text"
              value={cep}
              onChange={handleCEP}
              placeholder="XXXXX-XXX"
              className="form-input"
              maxLength={9}
            />
            {erroCEP && <span className="form-field-error">{erroCEP}</span>}
          </div>
          <button type="button" className="btn-buscar-cep" onClick={() => buscarCEP(cep)} disabled={buscandoCEP || limparMascara(cep).length !== 8}>
            {buscandoCEP ? "Buscando…" : "🔍 Buscar"}
          </button>
        </div>

        <FormInput label="Cidade" name="cidade" value={fornecedor.cidade} onChange={handleChange} />
        <FormInput label="UF" name="uf" value={fornecedor.uf} onChange={handleChange} />
        <FormInput label="Prazo de Entrega (dias)" name="prazo_de_entraga" type="number" value={fornecedor.prazo_de_entraga} onChange={handleChange} />
        <FormSelect label="Avaliação" name="avaliacao" value={fornecedor.avaliacao} onChange={handleChange}
          options={[
            { value: "1", label: "1 - Ruim" }, { value: "2", label: "2 - Regular" },
            { value: "3", label: "3 - Bom" },  { value: "4", label: "4 - Muito Bom" },
            { value: "5", label: "5 - Excelente" },
          ]}
        />

        <div className="form-actions">
          <BotaoSalvar texto={salvando ? "Salvando…" : "Cadastrar Fornecedor"} />
          <button type="button" className="btn btn-back" onClick={() => navigate("/fornecedores")}>← Voltar</button>
        </div>
      </form>
    </div>
  );
}

export default CadastrarFornecedor;
