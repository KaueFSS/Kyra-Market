function FormInput({ label, name, value, onChange, type = "text", required = false, placeholder = "", step, error, hint }) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label} {required && <span style={{ color: "var(--accent-red)" }}>*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        step={step}
        className={`form-input${error ? " form-input-error" : ""}`}
      />
      {error && <span className="form-field-error">{error}</span>}
      {hint && !error && <span className="form-field-hint">{hint}</span>}
    </div>
  );
}

export default FormInput;
