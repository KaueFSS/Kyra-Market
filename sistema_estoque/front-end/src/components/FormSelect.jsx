function FormSelect({ label, name, value, onChange, options = [], required = false }) {
  return (
    <div style={{ marginBottom: "15px" }}>
      <label>{label}</label>
      <br />

      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        style={{
          padding: "8px",
          width: "340px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          marginTop: "5px",
        }}
      >
        <option value="">Selecione...</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FormSelect;