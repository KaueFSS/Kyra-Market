import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import { useFormShortcuts } from "../utils/useFormShortcuts";
import { invalidateCache } from "../utils/apiCache";
import { showToast } from "../utils/toast";

function EditarFuncionario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [erro, setErro] = useState("");
  useFormShortcuts({ onSubmit: salvar, onCancel: () => navigate("/funcionarios") });

  useEffect(() => {
    api.get(`/funcionarios/${id}/`).then((res) => setForm({ ...res.data, ativo: String(res.data.ativo) }));
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar() {
    try {
      await api.patch(`/funcionarios/${id}/`, { ...form, ativo: form.ativo === "true" });
      invalidateCache("/funcionarios/?page=1");
      showToast("Funcionário atualizado com sucesso!", "success");
      setTimeout(() => navigate(`/funcionarios?highlight=${id}`), 900);
      setErro("");
    } catch {
      setErro("Erro ao atualizar funcionário.");
    }
  }

  if (!form) return <div className="page-container"><p className="loading-text">Carregando...</p></div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Editar Funcionário</h1>
      <p className="page-subtitle">ID: {id}</p>

      <MensagemErro mensagem={erro} />

      <form onSubmit={e => { e.preventDefault(); salvar(); }} className="form-container">
        <FormInput label="Nome" name="nome" value={form.nome} onChange={handleChange} required />
        <FormInput label="Cargo" name="cargo" value={form.cargo} onChange={handleChange} required />
        <FormInput label="Data de Admissão" name="data_admissao" type="date" value={form.data_admissao} onChange={handleChange} required />
        <FormSelect label="Turno" name="turno" value={form.turno} onChange={handleChange}
          options={[{ value: "Manhã", label: "Manhã" }, { value: "Tarde", label: "Tarde" }, { value: "Noite", label: "Noite" }]}
        />
        <FormInput label="Salário (R$)" name="salario" type="number" value={form.salario} onChange={handleChange} required />
        <FormInput label="Horas Semanais" name="horas_semanais" type="number" value={form.horas_semanais} onChange={handleChange} required />
        <FormSelect label="Ativo?" name="ativo" value={form.ativo} onChange={handleChange}
          options={[{ value: "true", label: "Sim" }, { value: "false", label: "Não" }]}
        />

        <div className="form-actions">
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" className="btn btn-back" onClick={() => navigate("/funcionarios")}>← Voltar</button>
        </div>
      </form>
    </div>
  );
}

export default EditarFuncionario;
