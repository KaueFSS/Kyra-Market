function Paginacao({ paginaAtual, totalPaginas, onMudarPagina }) {
  if (!totalPaginas || totalPaginas <= 1) return null;

  return (
    <div style={{ display: "flex", gap: "8px", marginTop: "20px", alignItems: "center" }}>
      <button
        onClick={() => onMudarPagina(paginaAtual - 1)}
        disabled={paginaAtual === 1}
        style={{ padding: "6px 12px", cursor: "pointer" }}
      >
        Anterior
      </button>

      <span style={{ color: "white" }}>
        Página {paginaAtual} de {totalPaginas}
      </span>

      <button
        onClick={() => onMudarPagina(paginaAtual + 1)}
        disabled={paginaAtual === totalPaginas}
        style={{ padding: "6px 12px", cursor: "pointer" }}
      >
        Próxima
      </button>
    </div>
  );
}

export default Paginacao;
