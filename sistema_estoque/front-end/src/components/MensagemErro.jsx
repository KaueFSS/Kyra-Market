function MensagemErro({ mensagem }) {
  if (!mensagem) return null;
  return (
    <div className="alert-msg">
      ⚠️ {mensagem}
    </div>
  );
}

export default MensagemErro;
