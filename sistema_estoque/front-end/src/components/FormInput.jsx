function FormInput({ label, name, value, onChange, type = "text", required = false, placeholder = "" }) {
  return (
    <div style={{ marginBottom: "15px" }}>
      <label>{label}</label>
      <br />

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        style={{
          padding: "8px",
          width: "320px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          marginTop: "5px",
        }}
      />
    </div>
  );
}

export default FormInput;