import { useState, useEffect, useRef } from "react";

function SearchBarPage({
  label = "Pesquisar",
  value,
  onChange,
  placeholder = "Digite para pesquisar...",
}) {
  // Estado interno → input nunca trava (atualiza no ato).
  // O onChange do pai só é chamado depois de 120ms parado de digitar.
  const [localValue, setLocalValue] = useState(value ?? "");
  const timerRef = useRef(null);
  const lastEmittedRef = useRef(value ?? "");

  // Sincroniza valor externo → interno (ex.: pai limpou o filtro)
  useEffect(() => {
    if (value !== lastEmittedRef.current && value !== localValue) {
      setLocalValue(value ?? "");
      lastEmittedRef.current = value ?? "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Cleanup do timer quando desmonta
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function handleChange(e) {
    const newVal = e.target.value;
    setLocalValue(newVal);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lastEmittedRef.current = newVal;
      onChange({ target: { value: newVal } });
    }, 120);
  }

  function handleClear() {
    setLocalValue("");
    if (timerRef.current) clearTimeout(timerRef.current);
    lastEmittedRef.current = "";
    onChange({ target: { value: "" } });
  }

  return (
    <div className="searchbar-page-wrap">
      {label && <label className="searchbar-page-label">{label}</label>}
      <div className="searchbar-page-input-wrap">
        <span className="searchbar-page-icon" aria-hidden="true">🔍</span>
        <input
          type="text"
          className="searchbar-page-input"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
        />
        {localValue && (
          <button
            type="button"
            className="searchbar-page-clear"
            onClick={handleClear}
            aria-label="Limpar pesquisa"
            title="Limpar"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchBarPage;
