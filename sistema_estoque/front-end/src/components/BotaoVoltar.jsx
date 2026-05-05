import { useNavigate } from "react-router-dom";

function BotaoVoltar({ texto = "← Voltar" }) {
  const navigate = useNavigate();
  return (
    <button type="button" className="btn btn-back" onClick={() => navigate(-1)}>
      {texto}
    </button>
  );
}

export default BotaoVoltar;
