import { useState, useEffect } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";

function gerarIdCompra() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const sufixo = Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `CMP${sufixo}`;
}

const estadoInicial = {
  nome: "",
  fornecedor: "",
  funcionario: "",
  data_compra: new Date().toISOString().split("T")[0],
  status: "Pendente",
  data_entrega: "",
  nota_fiscal: "",
  valor_total: "0.00",
};

function CadastrarCompra() {
  const [compra, setCompra] = useState(estadoInicial);
  const [fornecedores, setFornecedores] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        const forn = await listarDados("/fornecedores/");
        const func = await listarDados("/funcionarios/");

        setFornecedores(forn.results || forn);
        setFuncionarios(func.results || func);
      } catch (err) {
        console.error(err);
      }
    }

    carregarDados();
  }, []);

  function handleChange(e) {
    setCompra({ ...compra, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await criarDado("/compras/", { ...compra, id_compra: gerarIdCompra() });
      setMensagem("Compra cadastrada com sucesso!");
      setErro("");
      setCompra(estadoInicial);
    } catch (err) {
      setErro("Erro ao cadastrar compra.");
      setMensagem("");
    }
  }

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Cadastrar Compra</h1>
      <p>Formulário para registrar uma nova compra.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <FormInput
          label="Nome da Compra"
          name="nome"
          value={compra.nome}
          onChange={handleChange}
          required={true}
          placeholder="Ex: Reposição de Laticínios - Maio"
        />

        <FormSelect
          label="Fornecedor"
          name="fornecedor"
          value={compra.fornecedor}
          onChange={handleChange}
          options={fornecedores.map((f) => ({
            value: f.id_fornecedor,
            label: f.nome_fantasia,
          }))}
        />

        <FormSelect
          label="Funcionário"
          name="funcionario"
          value={compra.funcionario}
          onChange={handleChange}
          options={funcionarios.map((f) => ({
            value: f.id_funcionario,
            label: f.nome,
          }))}
        />

        <FormInput
          label="Data da Compra"
          name="data_compra"
          type="date"
          value={compra.data_compra}
          onChange={handleChange}
        />

        <FormSelect
          label="Status"
          name="status"
          value={compra.status}
          onChange={handleChange}
          options={[
            { value: "Pendente", label: "Pendente" },
            { value: "Entregue", label: "Entregue" },
          ]}
        />

        <FormInput
          label="Data de Entrega"
          name="data_entrega"
          type="date"
          value={compra.data_entrega}
          onChange={handleChange}
        />

        <FormInput
          label="Nota Fiscal"
          name="nota_fiscal"
          value={compra.nota_fiscal}
          onChange={handleChange}
        />

        <FormInput
          label="Valor Total"
          name="valor_total"
          type="number"
          value={compra.valor_total}
          onChange={handleChange}
        />

        <BotaoSalvar texto="Cadastrar Compra" />
      </form>
    </div>
  );
}

export default CadastrarCompra;