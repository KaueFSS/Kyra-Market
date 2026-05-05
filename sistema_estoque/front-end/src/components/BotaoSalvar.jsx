function BotaoSalvar({ texto = "Salvar" }) {
  return (
    <button type="submit" className="btn btn-primary">
      💾 {texto}
    </button>
  );
}

export default BotaoSalvar;
