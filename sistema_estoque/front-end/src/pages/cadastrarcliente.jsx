import { useEffect, useState } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";
import { gerarIdSequencial } from "../utils/gerarIdSequencial";

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

function CadastrarCliente() {
  const [cliente, setCliente] = useState(estadoInicial);
  const [clientes, setClientes] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    listarDados("/clientes/").then((data) => setClientes(data));
  }, []);

  function alterarCampo(event) {
    const { name, value } = event.target;
    setCliente({ ...cliente, [name]: value });
  }

  async function salvarCliente(event) {
    event.preventDefault();

    const dadosParaEnviar = {
      ...cliente,
      id_cliente: gerarIdSequencial(clientes, "id_cliente", "CLI"),
      possui_fiado: cliente.possui_fiado === "true",
      saldo_fiado: Number(cliente.saldo_fiado || 0).toFixed(2),
      total_valor: Number(cliente.total_valor || 0).toFixed(2),
      ultima_compra: cliente.ultima_compra || null,
    };

    try {
      const clienteCriado = await criarDado("/clientes/", dadosParaEnviar);
      setClientes((clientesAtuais) => [...clientesAtuais, clienteCriado]);
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

        <FormSelect
          label="Possui Fiado"
          name="possui_fiado"
          value={cliente.possui_fiado}
          onChange={alterarCampo}
          options={[
            { value: "false", label: "NÃ£o" },
            { value: "true", label: "Sim" },
          ]}
        />

        <FormInput
          label="Saldo Fiado"
          name="saldo_fiado"
          type="number"
          step="0.01"
          value={cliente.saldo_fiado}
          onChange={alterarCampo}
          placeholder="Ex: 0.00"
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
          step="0.01"
          value={cliente.total_valor}
          onChange={alterarCampo}
          placeholder="Ex: 0.00"
        />

        <FormInput
          label="Ãšltima Compra"
          name="ultima_compra"
          type="date"
          value={cliente.ultima_compra}
          onChange={alterarCampo}
        />

        <BotaoSalvar texto="Cadastrar Cliente" />
      </form>
    </div>
  );
}

export default CadastrarCliente;
