function MensagemSucesso({ mensagem }) {
  if (!mensagem) return null;
  return (
    <div className="success-msg">
      ✅ {mensagem}
    </div>
  );
}

export default MensagemSucesso;
