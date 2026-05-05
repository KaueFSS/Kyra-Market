function BarraBusca({ valor, onChange, placeholder = "Buscar..." }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <input
        type="text"
        value={valor}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="search-bar"
      />
    </div>
  );
}

export default BarraBusca;
