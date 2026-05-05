function BotaoExcluir({ onClick, texto = "Excluir" }) {
  return (
    <button type="button" className="btn btn-danger btn-sm" onClick={onClick}>
      🗑️ {texto}
    </button>
  );
}

export default BotaoExcluir;
