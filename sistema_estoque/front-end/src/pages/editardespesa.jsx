import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { listarDados } from "../services/crudService";

function EditarDespesa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get(`/despesas/${id}/`).then((res) => setForm({ ...res.data, recorrente: String(res.data.recorrente) }));
    listarDados("/funcionarios/").then(setFuncionarios);
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.patch(`/despesas/${id}/`, { ...form, recorrente: form.recorrente === "true" });
      setMensagem("Despesa atualizada com sucesso!");
      setErro("");
    } catch {
      setErro("Erro ao atualizar despesa.");
      setMensagem("");
    }
  }

  if (!form) return <div style={{ color: "white", padding: "30px" }}>Carregando...</div>;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Editar Despesa</h1>
      <p style={{ color: "#aaa" }}>ID: {id}</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={handleSubmit}>
        <FormSelect label="Funcionário Responsável" name="funcionario" value={form.funcionario} onChange={handleChange}
          options={funcionarios.map((f) => ({ value: f.id_funcionario, label: `${f.nome} — ${f.cargo}` }))}
        />
        <FormInput label="Data" name="data" type="date" value={form.data} onChange={handleChange} required />
        <FormInput label="Categoria" name="categoria" value={form.categoria} onChange={handleChange} required placeholder="Ex: Aluguel, Luz, Água..." />
        <FormInput label="Descrição" name="descricao" value={form.descricao || ""} onChange={handleChange} />
        <FormInput label="Valor (R$)" name="valor" type="number" step="0.01" value={form.valor} onChange={handleChange} required />
        <FormSelect label="Recorrente?" name="recorrente" value={form.recorrente} onChange={handleChange}
          options={[{ value: "false", label: "Não" }, { value: "true", label: "Sim" }]}
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <BotaoSalvar texto="Salvar Alterações" />
          <button type="button" onClick={() => navigate("/despesas")} style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarDespesa;
