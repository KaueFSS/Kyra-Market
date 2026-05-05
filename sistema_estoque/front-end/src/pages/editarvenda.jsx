import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
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
      await api.patch(`/vendas/${id}/`, { ...form, cliente: form.cliente || null });
      invalidateCache("/vendas/?page=1");
      showToast("Venda atualizada com sucesso!", "success");
      setTimeout(() => navigate(`/vendas?highlight=${id}`), 900);
      setErro("");
    } catch {
      setErro("Erro ao atualizar venda.");
    }
  }

  if (!form) return <div className="page-container"><p className="loading-text">Carregando...</p></div>;

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
        <FormSelect label="Funcionário" name="funcionario" value={form.funcionario} onChange={handleChange}
          options={funcionarios.map((f) => ({ value: f.id_funcionario, label: `${f.nome} — ${f.cargo}` }))}
        />
        <FormSelect label="Cliente (opcional)" name="cliente" value={form.cliente || ""} onChange={handleChange}
          options={[{ value: "", label: "Sem cliente" }, ...clientes.map((c) => ({ value: c.id_cliente, label: c.nome }))]}
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
