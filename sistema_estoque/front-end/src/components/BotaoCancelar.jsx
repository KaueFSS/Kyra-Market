function BotaoCancelar({ texto = "Cancelar", onClick }) {
  return (
    <button type="button" className="btn btn-secondary" onClick={onClick}>
      {texto}
    </button>
  );
}

export default BotaoCancelar;
