function SearchBarPage({
  label = "Pesquisar",
  value,
  onChange,
  placeholder = "Digite para pesquisar...",
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "bold",
            color: "white",
          }}
        >
          {label}
        </label>
      )}

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          maxWidth: "550px",
          padding: "12px 14px",
          borderRadius: "8px",
          border: "1px solid #415e98",
          backgroundColor: "#1f2246",
          color: "#ffffff",
          outline: "none",
          fontSize: "1rem",
        }}
      />
    </div>
  );
}

export default SearchBarPage;