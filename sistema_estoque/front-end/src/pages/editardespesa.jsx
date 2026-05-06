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

function EditarDespesa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [erro, setErro] = useState("");
  useFormShortcuts({ onSubmit: salvar, onCancel: () => navigate("/despesas") });

  useEffect(() => {
    api.get(`/despesas/${id}/`).then((res) => setForm({ ...res.data, recorrente: String(res.data.recorrente) }));
    listarDados("/funcionarios/").then(setFuncionarios);
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar() {
    try {
      await api.patch(`/despesas/${id}/`, { ...form, recorrente: form.recorrente === "true" });
      invalidateCache("/despesas/?page=1");
      showToast("Despesa atualizada com sucesso!", "success");
      setTimeout(() => navigate(`/despesas?highlight=${id}`), 900);
      setErro("");
    } catch {
      setErro("Erro ao atualizar despesa.");
    }
  }

  if (!form) return <div className="page-container"><p className="loading-text">Carregando...</p></div>;

  const opcoesFuncionarios = funcionarios.map((f) => ({
    value: f.id_funcionario,
    label: `${f.id_funcionario} - ${f.nome}`,
  }));

  return (
    <div className="page-container">
      <h1 className="page-title">Editar Despesa</h1>
      <p className="page-subtitle">ID: {id}</p>

      <MensagemErro mensagem={erro} />

      <form onSubmit={e => { e.preventDefault(); salvar(); }} className="form-container">
        <FormSelectSearch
          label="Funcionário Responsável"
          name="funcionario"
          value={form.funcionario}
          onChange={handleChange}
          options={opcoesFuncionarios}
          placeholder="Selecione um funcionário..."
          required={true}
        />
        <FormInput label="Data" name="data" type="date" value={form.data} onChange={handleChange} required />
        <FormInput label="Categoria" name="categoria" value={form.categoria} onChange={handleChange} required placeholder="Ex: Aluguel, Luz, Água..." />
        <FormInput label="Descrição" name="descricao" value={form.descricao || ""} onChange={handleChange} />
        <FormInput label="Valor (R$)" name="valor" type="number" step="0.01" value={form.valor} onChange={handleChange} required />
        <FormSelect label="Recorrente?" name="recorrente" value={form.recorrente} onChange={handleChange}
          options={[{ value: "false", label: "Não" }, { value: "true", label: "Sim" }]}
        />

        <div className="form-actions">
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" className="btn btn-back" onClick={() => navigate("/despesas")}>← Voltar</button>
        </div>
      </form>
    </div>
  );
}

export default EditarDespesa;
