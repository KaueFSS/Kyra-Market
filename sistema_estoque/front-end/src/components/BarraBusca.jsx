function BarraBusca({ valor, onChange, placeholder = "Buscar..." }) {
  return (
    <div style={{ marginTop: "20px", marginBottom: "20px" }}>
      <input
        type="text"
        value={valor}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          padding: "10px",
          width: "300px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />
    </div>
  );
}

export default BarraBusca;