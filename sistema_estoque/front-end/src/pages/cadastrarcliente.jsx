import { useState } from "react";
import FormInput from "../components/FormInput";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado } from "../services/crudService";

function gerarIdCliente() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const sufixo = Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `CLI${sufixo}`;
}

const estadoInicial = {
  nome: "",
  telefone: "",
  bairro: "",
  data_cadastro: new Date().toISOString().split("T")[0],
};

function CadastrarCliente() {
  const [cliente, setCliente] = useState(estadoInicial);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  function alterarCampo(event) {
    const { name, value } = event.target;
    setCliente({ ...cliente, [name]: value });
  }

  async function salvarCliente(event) {
    event.preventDefault();

    const dadosParaEnviar = {
      ...cliente,
      id_cliente: gerarIdCliente(),
      possui_fiado: false,
      saldo_fiado: "0.00",
      total_valor: "0.00",
      ultima_compra: null,
    };

    try {
      await criarDado("/clientes/", dadosParaEnviar);
      setMensagem("Cliente cadastrado com sucesso!");
      setErro("");
      setCliente(estadoInicial);
    } catch (error) {
      console.error(error.response?.data);
      setErro("Erro ao cadastrar cliente. Verifique os campos.");
      setMensagem("");
    }
  }

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Cadastrar Cliente</h1>
      <p>Formulário para cadastrar um novo cliente.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={salvarCliente}>
        <FormInput
          label="Nome"
          name="nome"
          value={cliente.nome}
          onChange={alterarCampo}
          required={true}
          placeholder="Ex: João Silva"
        />

        <FormInput
          label="Telefone"
          name="telefone"
          value={cliente.telefone}
          onChange={alterarCampo}
          placeholder="Ex: 21999999999"
        />

        <FormInput
          label="Bairro"
          name="bairro"
          value={cliente.bairro}
          onChange={alterarCampo}
          placeholder="Ex: Copacabana"
        />

        <FormInput
          label="Data de Cadastro"
          name="data_cadastro"
          type="date"
          value={cliente.data_cadastro}
          onChange={alterarCampo}
          required={true}
        />

        <BotaoSalvar texto="Cadastrar Cliente" />
      </form>
    </div>
  );
}

export default CadastrarCliente;
