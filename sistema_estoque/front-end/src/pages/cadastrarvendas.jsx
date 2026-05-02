import { useState, useEffect } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";

function gerarIdVenda() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const sufixo = Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `VND${sufixo}`;
}

const estadoInicial = {
    nome: "",
    data_venda: new Date().toISOString().split("T")[0],
    hora: "",
    forma_pagamento: "",
    funcionario: "",
    cliente: "",
};

function Cadastrarvendas() {
    const [vendas, setVendas] = useState(estadoInicial);
    const [funcionarios, setFuncionarios] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");

    useEffect(() => {
        listarDados("/funcionarios/").then((data) => setFuncionarios(data));
        listarDados("/clientes/").then((data) => setClientes(data));
    }, []);

    function alterarCampo(event) {
        const { name, value } = event.target;
        setVendas({ ...vendas, [name]: value });
    }

    async function salvarVendas(event) {
        event.preventDefault();

        const dadosParaEnviar = {
            ...vendas,
            id_venda: gerarIdVenda(),
            cliente: vendas.cliente || null,
        };

        try {
            await criarDado("/vendas/", dadosParaEnviar);
            setMensagem("Venda cadastrada com sucesso!");
            setErro("");
            setVendas(estadoInicial);
        } catch (error) {
            console.error(error.response?.data);
            setErro("Erro ao cadastrar venda. Verifique os campos.");
            setMensagem("");
        }
    }

    return (
        <div style={{ color: "white", padding: "30px" }}>
            <h1>Cadastrar Venda</h1>
            <p>Formulário para registrar uma nova venda no sistema.</p>

            <MensagemSucesso mensagem={mensagem} />
            <MensagemErro mensagem={erro} />

            <form onSubmit={salvarVendas}>
                <FormInput
                    label="Nome da Venda"
                    name="nome"
                    value={vendas.nome}
                    onChange={alterarCampo}
                    required={true}
                    placeholder="Ex: Venda Balcão - Manhã"
                />

                <FormInput
                    label="Data de Venda"
                    name="data_venda"
                    type="date"
                    value={vendas.data_venda}
                    onChange={alterarCampo}
                    required={true}
                />

                <FormInput
                    label="Hora da Venda"
                    name="hora"
                    type="time"
                    value={vendas.hora}
                    onChange={alterarCampo}
                    required={true}
                />

                <FormSelect
                    label="Forma de Pagamento"
                    name="forma_pagamento"
                    value={vendas.forma_pagamento}
                    onChange={alterarCampo}
                    required={true}
                    options={[
                        { value: "dinheiro", label: "Dinheiro" },
                        { value: "pix", label: "PIX" },
                        { value: "cartao_debito", label: "Cartão de Débito" },
                        { value: "cartao_credito", label: "Cartão de Crédito" },
                        { value: "fiado", label: "Fiado" },
                    ]}
                />

                <FormSelect
                    label="Funcionário Responsável"
                    name="funcionario"
                    value={vendas.funcionario}
                    onChange={alterarCampo}
                    required={true}
                    options={funcionarios.map((f) => ({
                        value: f.id_funcionario,
                        label: `${f.nome} — ${f.cargo}`,
                    }))}
                />

                <FormSelect
                    label="Cliente (opcional)"
                    name="cliente"
                    value={vendas.cliente}
                    onChange={alterarCampo}
                    options={[
                        { value: "", label: "Sem cliente" },
                        ...clientes.map((c) => ({
                            value: c.id_cliente,
                            label: c.nome,
                        })),
                    ]}
                />

                <BotaoSalvar texto="Cadastrar Venda" />
            </form>
        </div>
    );
}

export default Cadastrarvendas;
