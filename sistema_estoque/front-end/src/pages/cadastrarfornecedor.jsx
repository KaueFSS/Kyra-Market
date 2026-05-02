import { useState } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado } from "../services/crudService";


function gerarIdFornecedor() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const sufixo = Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `FOR${sufixo}`;
}

const estadoInicial = {
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  telefone: "",
  email: "",
  cidade: "",
  uf: "",
  prazo_de_entraga: "",
  avaliacao: "",
};
function CadastrarFornecedor() {

  const [fornecedor, setFornecedor] = useState(estadoInicial);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  function handleChange(e) {
    setFornecedor({ ...fornecedor, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await criarDado("/fornecedores/", { ...fornecedor, id_fornecedor: gerarIdFornecedor() });

      setMensagem("Fornecedor cadastrado com sucesso!");
      setErro("");
      setFornecedor(estadoInicial);
    } catch (err) {
      setErro("Erro ao cadastrar fornecedor. Verifique os campos.");
      setMensagem("");
    }
  }

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Cadastrar Fornecedor</h1>
      <p>Formulário para cadastrar um novo fornecedor.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>

        <FormInput
          label="Razão Social"
          name="razao_social"
          value={fornecedor.razao_social}
          onChange={handleChange}
          required={true}
        />

        <FormInput
          label="Nome Fantasia"
          name="nome_fantasia"
          value={fornecedor.nome_fantasia}
          onChange={handleChange}
          required={true}
        />

        <FormInput
          label="CNPJ"
          name="cnpj"
          value={fornecedor.cnpj}
          onChange={handleChange}
          required={true}
        />

        <FormInput
          label="Telefone"
          name="telefone"
          value={fornecedor.telefone}
          onChange={handleChange}
        />

        <FormInput
          label="Email"
          name="email"
          type="email"
          value={fornecedor.email}
          onChange={handleChange}
        />

        <FormInput
          label="Cidade"
          name="cidade"
          value={fornecedor.cidade}
          onChange={handleChange}
        />

        <FormInput
          label="UF"
          name="uf"
          value={fornecedor.uf}
          onChange={handleChange}
        />

        <FormInput
          label="Prazo de Entrega (dias)"
          name="prazo_de_entraga"
          type="number"
          value={fornecedor.prazo_de_entraga}
          onChange={handleChange}
        />

        <FormSelect
          label="Avaliação"
          name="avaliacao"
          value={fornecedor.avaliacao}
          onChange={handleChange}
          options={[
            { value: "1", label: "1 - Ruim" },
            { value: "2", label: "2 - Regular" },
            { value: "3", label: "3 - Bom" },
            { value: "4", label: "4 - Muito Bom" },
            { value: "5", label: "5 - Excelente" },
          ]}
        />

        <BotaoSalvar texto="Cadastrar Fornecedor" />

      </form>
    </div>
  );
}

export default CadastrarFornecedor;