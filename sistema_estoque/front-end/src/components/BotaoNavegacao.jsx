import { useNavigate } from "react-router-dom";

function BotaoNavegacao({ urlPagina, texto }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={() => navigate(urlPagina)}
    >
      {texto}
    </button>
  );
}

export default BotaoNavegacao;
