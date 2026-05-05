function Paginacao({ paginaAtual, totalPaginas, onMudarPagina }) {
  if (!totalPaginas || totalPaginas <= 1) return null;

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        onClick={() => onMudarPagina(paginaAtual - 1)}
        disabled={paginaAtual === 1}
      >
        ← Anterior
      </button>
      <span className="pagination-info">
        Página {paginaAtual} de {totalPaginas}
      </span>
      <button
        className="pagination-btn"
        onClick={() => onMudarPagina(paginaAtual + 1)}
        disabled={paginaAtual === totalPaginas}
      >
        Próxima →
      </button>
    </div>
  );
}

export default Paginacao;
