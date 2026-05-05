import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import { criarDado, listarDados } from "../services/crudService";
import { gerarIdSequencial } from "../utils/gerarIdSequencial";
import { mascaraTelefone } from "../utils/mascaras";
import { useFormShortcuts } from "../utils/useFormShortcuts";
import { invalidateCache } from "../utils/apiCache";

const estadoInicial = {
  nome: "",
  telefone: "",
  bairro: "",
  possui_fiado: "false",
  saldo_fiado: "0.00",
  data_cadastro: new Date().toISOString().split("T")[0],
  total_valor: "0.00",
  ultima_compra: "",
};

function validar(c) {
  const erros = {};
  if (!c.nome.trim()) erros.nome = "Nome é obrigatório.";
  if (c.telefone && c.telefone.replace(/\D/g,"").length < 10) erros.telefone = "Telefone incompleto.";
  return erros;
}

function CadastrarCliente() {
  const navigate = useNavigate();
  const [cliente, setCliente]   = useState(estadoInicial);
  const [clientes, setClientes] = useState([]);
  const [erros, setErros]       = useState({});
  const [erro, setErro]         = useState("");
  const [salvando, setSalvando] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    listarDados("/clientes/").then((data) => setClientes(data.results || data));
  }, []);

  function alterarCampo(e) {
    const { name, value } = e.target;
    let val = value;
    if (name === "telefone") val = mascaraTelefone(value);
    setCliente(prev => ({ ...prev, [name]: val }));
    if (erros[name]) setErros(prev => ({ ...prev, [name]: "" }));
  }

  async function salvar() {
    const e = validar(cliente);
    if (Object.keys(e).length) { setErros(e); return; }
    setSalvando(true);
    const dados = {
      ...cliente,
      id_cliente:   gerarIdSequencial(clientes, "id_cliente", "CLI"),
      possui_fiado: cliente.possui_fiado === "true",
      saldo_fiado:  Number(cliente.saldo_fiado || 0).toFixed(2),
      total_valor:  Number(cliente.total_valor || 0).toFixed(2),
      ultima_compra: cliente.ultima_compra || null,
    };
    try {
      const criado = await criarDado("/clientes/", dados);
      invalidateCache("/clientes/?page=1");
      setClientes(prev => [...prev, criado]);
      navigate(`/clientes?highlight=${criado.id_cliente}`);
    } catch {
      setErro("Erro ao cadastrar cliente. Verifique os campos.");
    } finally {
      setSalvando(false);
    }
  }

  function salvarForm(e) { e.preventDefault(); salvar(); }

  useFormShortcuts({
    onSubmit: salvar,
    onCancel: () => navigate("/clientes"),
  });

  return (
    <div className="page-container">
      <h1 className="page-title">Cadastrar Cliente</h1>
      <p className="page-subtitle">Formulário para cadastrar um novo cliente. <kbd style={{ fontSize:"0.72rem", background:"rgba(255,255,255,0.07)", border:"1px solid var(--border)", borderRadius:4, padding:"1px 5px" }}>Ctrl+Enter</kbd> para salvar</p>

      <MensagemErro mensagem={erro} />

      <form ref={formRef} onSubmit={salvarForm} className="form-container">
        <FormInput label="Nome" name="nome" value={cliente.nome} onChange={alterarCampo} required placeholder="Ex: João Silva" error={erros.nome} />
        <FormInput label="Telefone" name="telefone" value={cliente.telefone} onChange={alterarCampo} placeholder="(21) 99999-9999" error={erros.telefone} hint="Formatado automaticamente" />
        <FormInput label="Bairro" name="bairro" value={cliente.bairro} onChange={alterarCampo} placeholder="Ex: Copacabana" />
        <FormSelect label="Possui Fiado" name="possui_fiado" value={cliente.possui_fiado} onChange={alterarCampo}
          options={[{ value: "false", label: "Não" }, { value: "true", label: "Sim" }]}
        />
        <FormInput label="Saldo Fiado (R$)" name="saldo_fiado" type="number" step="0.01" value={cliente.saldo_fiado} onChange={alterarCampo} placeholder="0.00" />
        <FormInput label="Data de Cadastro" name="data_cadastro" type="date" value={cliente.data_cadastro} onChange={alterarCampo} required />
        <FormInput label="Total em Compras (R$)" name="total_valor" type="number" step="0.01" value={cliente.total_valor} onChange={alterarCampo} placeholder="0.00" />
        <FormInput label="Última Compra" name="ultima_compra" type="date" value={cliente.ultima_compra} onChange={alterarCampo} />

        <div className="form-actions">
          <BotaoSalvar texto={salvando ? "Salvando…" : "Cadastrar Cliente"} />
          <button type="button" className="btn btn-back" onClick={() => navigate("/clientes")}>← Voltar</button>
        </div>
      </form>
    </div>
  );
}

export default CadastrarCliente;
