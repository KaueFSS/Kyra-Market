import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import FormSelectSearch from "../components/FormSelectSearch";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import { listarDados } from "../services/crudService";
import { useFormShortcuts } from "../utils/useFormShortcuts";
import { invalidateCache } from "../utils/apiCache";
import { showToast } from "../utils/toast";

function EditarVenda() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [erro, setErro] = useState("");
  useFormShortcuts({ onSubmit: salvar, onCancel: () => navigate("/vendas") });

  useEffect(() => {
    api.get(`/vendas/${id}/`).then((res) => setForm(res.data));
    listarDados("/funcionarios/").then(setFuncionarios);
    listarDados("/clientes/").then(setClientes);
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar() {
    try {
      const dadosParaEnviar = {
        nome: form.nome || "",
        data_venda: form.data_venda,
        hora: form.hora,
        forma_pagamento: form.forma_pagamento,
        funcionario: form.funcionario,
        cliente: form.cliente || null,
      };

      await api.patch(`/vendas/${id}/`, dadosParaEnviar);
      invalidateCache("/vendas/?page=1");
      showToast("Venda atualizada com sucesso!", "success");
      setTimeout(() => navigate(`/vendas?highlight=${id}`), 900);
      setErro("");
    } catch (error) {
      console.error(error.response?.data);
      setErro(error.response?.data?.erro || "Erro ao atualizar venda.");
    }
  }

  if (!form) return <div className="page-container"><p className="loading-text">Carregando...</p></div>;

  const opcoesFuncionarios = funcionarios.map((f) => ({
    value: f.id_funcionario,
    label: `${f.id_funcionario} - ${f.nome}`,
  }));

  const opcoesClientes = clientes.map((c) => ({
    value: c.id_cliente,
    label: `${c.id_cliente} - ${c.nome}`,
  }));

  return (
    <div className="page-container">
      <h1 className="page-title">Editar Venda</h1>
      <p className="page-subtitle">ID: {id}</p>

      <MensagemErro mensagem={erro} />

      <form onSubmit={e => { e.preventDefault(); salvar(); }} className="form-container">
        <FormInput label="Nome da Venda" name="nome" value={form.nome || ""} onChange={handleChange} placeholder="Ex: Venda Balcão - Manhã" />
        <FormInput label="Data da Venda" name="data_venda" type="date" value={form.data_venda} onChange={handleChange} required />
        <FormInput label="Hora" name="hora" type="time" value={form.hora} onChange={handleChange} required />
        <FormSelect label="Forma de Pagamento" name="forma_pagamento" value={form.forma_pagamento} onChange={handleChange}
          options={[
            { value: "dinheiro", label: "Dinheiro" },
            { value: "pix", label: "PIX" },
            { value: "cartao_debito", label: "Cartão de Débito" },
            { value: "cartao_credito", label: "Cartão de Crédito" },
            { value: "fiado", label: "Fiado" },
          ]}
        />
        <FormSelectSearch
            label="Funcionário Responsável"
            name="funcionario"
            value={form.funcionario}
            onChange={handleChange}
            options={opcoesFuncionarios}
            placeholder="Selecione um funcionário..."
            required={true}
        />
        <FormSelectSearch
            label="Cliente (opcional)"
            name="cliente"
            value={form.cliente}
            onChange={handleChange}
            options={opcoesClientes}
            placeholder="Selecione um cliente..."
            isClearable={true}
        />

        <div className="form-actions">
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" className="btn btn-back" onClick={() => navigate("/vendas")}>← Voltar</button>
        </div>
      </form>
    </div>
  );
}

export default EditarVenda;
