import { useState, useEffect } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";

const estadoInicial = {
  venda: "",
  produto: "",
  quantidade: "",
  preco_unitario: "",
  desconto: "0",
};

function CadastrarItemVenda() {
  const [item, setItem] = useState(estadoInicial);
  const [vendas, setVendas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        const ven = await listarDados("/vendas/");
        const prod = await listarDados("/produtos/");

        setVendas(ven.results || ven);
        setProdutos(prod.results || prod);
      } catch (err) {
        console.error(err);
      }
    }
    carregarDados();
  }, []);

  function handleChange(e) {
    setItem({ ...item, [e.target.name]: e.target.value });
  }

  const qtdNum = parseInt(item.quantidade, 10) || 0;
  const precoNum = parseFloat(item.preco_unitario) || 0;
  const descNum = parseFloat(item.desconto) || 0;
  
  const subtotalCalculado = (qtdNum * precoNum) - descNum;

  async function handleSubmit(e) {
    e.preventDefault();

    // Verificação de segurança (Regra de Negócio)
    if (subtotalCalculado < 0) {
        setErro("O desconto não pode ser maior que o valor total dos produtos.");
        return; // Impede o envio para o banco
    }

    const dadosParaEnviar = {
      ...item,
      quantidade: qtdNum,
      preco_unitario: precoNum,
      desconto: descNum,
      subtotal: subtotalCalculado,
    };

    try {
      await criarDado("/itens-venda/", dadosParaEnviar); 
      
      setMensagem("Item adicionado à venda com sucesso!");
      setErro("");
      setItem(estadoInicial);
    } catch (err) {
      console.error(err.response?.data);
      setErro("Erro ao cadastrar o item da venda.");
      setMensagem("");
    }
  }

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Cadastrar Item de Venda</h1>
      <p>Formulário para adicionar produtos a uma venda existente.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <FormSelect
          label="ID da Venda"
          name="venda"
          value={item.venda}
          onChange={handleChange}
          options={vendas.map((v) => ({
            value: v.id_venda,
            label: `Venda ${v.id_venda}`,
          }))}
        />

        <FormSelect
          label="Produto"
          name="produto"
          value={item.produto}
          onChange={handleChange}
          options={produtos.map((p) => ({
            value: p.id_produto,
            label: p.nome,
          }))}
        />

        <FormInput
          label="Quantidade"
          name="quantidade"
          type="number"
          value={item.quantidade}
          onChange={handleChange}
        />

        <FormInput
          label="Preço Unitário (R$)"
          name="preco_unitario"
          type="number"
          step="0.01"
          value={item.preco_unitario}
          onChange={handleChange}
        />

        <FormInput
          label="Desconto (R$)"
          name="desconto"
          type="number"
          step="0.01"
          value={item.desconto}
          onChange={handleChange}
        />

        <FormInput
          label="Subtotal Calculado (R$)"
          name="subtotal"
          type="number"
          value={subtotalCalculado.toFixed(2)}
          disabled={true}
          onChange={() => {}}
        />

        <BotaoSalvar texto="Adicionar à Venda" />
      </form>
    </div>
  );
}

export default CadastrarItemVenda;