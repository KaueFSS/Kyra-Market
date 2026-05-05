function BotaoEditar({ onClick }) {
  return (
    <button type="button" className="btn btn-warning btn-sm" onClick={onClick}>
      ✏️ Editar
    </button>
  );
}

export default BotaoEditar;
