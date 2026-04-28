import { useState } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado } from "../services/crudService";

function CadastrarCliente() {
  const hoje = new Date().toISOString().split("T")[0];

  const [cliente, setCliente] = useState({
    id_cliente: "",
    nome: "",
    telefone: "",
    bairro: "",
    data_cadastro: hoje,
    total_valor: "0.00",
    ultima_compra: "",
    possui_fiado: "false",
    saldo_fiado: "0.00",
  });

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  function alterarCampo(event) {
    const { name, value } = event.target;

    setCliente({
      ...cliente,
      [name]: value,
    });
  }

  async function salvarCliente(event) {
    event.preventDefault();

    const dadosParaEnviar = {
      ...cliente,
      possui_fiado: cliente.possui_fiado === "true",
      ultima_compra: cliente.ultima_compra || null,
    };

    try {
      await criarDado("/clientes/", dadosParaEnviar);

      setMensagem("Cliente cadastrado com sucesso!");
      setErro("");

      setCliente({
        id_cliente: "",
        nome: "",
        telefone: "",
        bairro: "",
        data_cadastro: hoje,
        total_valor: "0.00",
        ultima_compra: "",
        possui_fiado: "false",
        saldo_fiado: "0.00",
      });
    } catch (error) {
      console.error(error.response?.data);
      setErro("Erro ao cadastrar cliente. Verifique os campos.");
      setMensagem("");
    }
  }

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Cadastrar Cliente</h1>
      <p>Formulário para cadastrar um novo cliente pelo front-end.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={salvarCliente}>
        <FormInput
          label="ID do Cliente"
          name="id_cliente"
          value={cliente.id_cliente}
          onChange={alterarCampo}
          required={true}
          placeholder="Ex: CLI9999"
        />

        <FormInput
          label="Nome"
          name="nome"
          value={cliente.nome}
          onChange={alterarCampo}
          required={true}
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
        />

        <FormInput
          label="Data de Cadastro"
          name="data_cadastro"
          type="date"
          value={cliente.data_cadastro}
          onChange={alterarCampo}
          required={true}
        />

        <FormInput
          label="Total em Compras"
          name="total_valor"
          type="number"
          value={cliente.total_valor}
          onChange={alterarCampo}
          required={true}
        />

        <FormInput
          label="Última Compra"
          name="ultima_compra"
          type="date"
          value={cliente.ultima_compra}
          onChange={alterarCampo}
        />

        <FormSelect
          label="Possui Fiado?"
          name="possui_fiado"
          value={cliente.possui_fiado}
          onChange={alterarCampo}
          options={[
            { value: "false", label: "Não" },
            { value: "true", label: "Sim" },
          ]}
        />

        <FormInput
          label="Saldo Fiado"
          name="saldo_fiado"
          type="number"
          value={cliente.saldo_fiado}
          onChange={alterarCampo}
          required={true}
        />

        <BotaoSalvar texto="Cadastrar Cliente" />
      </form>
    </div>
  );
}

export default CadastrarCliente;