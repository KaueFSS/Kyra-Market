import { useState } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect"; 
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado } from "../services/crudService";

function Cadastrarvendas() {
    const [vendas, setVendas] = useState({
        id_venda: "",
        data_venda: new Date().toISOString().split("T")[0],
        hora: "",
        forma_pagamento: "",
        funcionario: "",
        cliente: "",
    });

    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");

    function alterarCampo(event) {
        const { name, value } = event.target;

        setVendas({
            ...vendas,
            [name]: value,
        });
    }

    async function salvarVendas(event) {
        event.preventDefault();

        const dadosParaEnviar = {
            ...vendas
        };

        try {
            await criarDado("/vendas/", dadosParaEnviar);

            setMensagem("Venda cadastrada com sucesso!");
            setErro("");

            // Limpa o formulário após o sucesso
            setVendas({
                id_venda: "",
                data_venda: new Date().toISOString().split("T")[0],
                hora: "",
                forma_pagamento: "",
                funcionario: "",
                cliente: "",
            });
        } catch (error) {
            console.error(error.response?.data);
            setErro("Erro ao cadastrar venda. Verifique os campos.");
            setMensagem("");
        }
    } // A função salvarVendas termina AQUI!

    return (
        <div style={{ color: "white", padding: "30px" }}>
            <h1>Cadastrar Venda</h1>
            <p>Formulário para registrar uma nova venda no sistema.</p>

            <MensagemSucesso mensagem={mensagem} />
            <MensagemErro mensagem={erro} />

            <form onSubmit={salvarVendas}>
                <FormInput
                    label="ID da Venda"
                    name="id_venda"
                    value={vendas.id_venda}
                    onChange={alterarCampo}
                    required={true}
                    placeholder="Ex: V000001"
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
                    options={[
                        { value: "pix", label: "PIX" },
                        { value: "cartao_debito", label: "Cartão de Débito" },
                        { value: "cartao_credito", label: "Cartão de Crédito" },
                        { value: "dinheiro", label: "Dinheiro" },
                    ]}
                />

                <FormInput
                    label="Funcionário Responsável"
                    name="funcionario"
                    value={vendas.funcionario}
                    onChange={alterarCampo}
                    placeholder="Ex: FUNC001"
                />

                <FormInput
                    label="Cliente"
                    name="cliente"
                    value={vendas.cliente}
                    onChange={alterarCampo}
                    placeholder="Ex: CLI0001"
                />

                <BotaoSalvar texto="Cadastrar Venda" />
            </form>
        </div>
    );
}

export default Cadastrarvendas;