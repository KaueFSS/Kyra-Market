import { useEffect, useState } from "react";

const PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.8,
  delay: Math.random() * 6,
  duration: Math.random() * 8 + 5,
  opacity: Math.random() * 0.5 + 0.15,
}));

function SplashScreen({ steps, fading }) {
  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = doneCount === total;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`splash-overlay${fading ? " splash-fading" : ""}`}>

      {/* Aurora background orbs */}
      <div className="splash-aurora splash-aurora-1" />
      <div className="splash-aurora splash-aurora-2" />
      <div className="splash-aurora splash-aurora-3" />

      {/* Floating particles */}
      <div className="splash-particles" aria-hidden="true">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="splash-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Grid overlay for sci-fi feel */}
      <div className="splash-grid" aria-hidden="true" />

      {/* Main card */}
      <div className={`splash-card${mounted ? " splash-card-in" : ""}`}>

        {/* Logo zone */}
        <div className="splash-logo-wrap">
          <div className="splash-halo" />
          <div className="splash-ring splash-ring-1" />
          <div className="splash-ring splash-ring-2" />
          <div className="splash-ring splash-ring-3" />
          <div className="splash-logo-frame">
            <img
              src="/icons/icon-mercado.png"
              alt="Mercadinho"
              className="splash-logo-img"
            />
          </div>
        </div>

        {/* Titles */}
        <div className="splash-text-block">
          <h1 className="splash-title">Mercadinho</h1>
          <p className="splash-tagline">Sistema de Gestão</p>
        </div>

        {/* Status */}
        <p className="splash-status">
          {allDone ? (
            <span className="splash-status-done">
              <span className="splash-check-badge">✓</span>
              Tudo pronto! Abrindo o sistema…
            </span>
          ) : (
            <>
              <span className="splash-spinner" />
              Conectando ao banco de dados
              <span className="splash-dots" />
            </>
          )}
        </p>

        {/* Progress bar */}
        <div className="splash-bar-wrap">
          <div className="splash-bar-track">
            <div className="splash-bar-fill" style={{ width: `${pct}%` }}>
              <div className="splash-bar-shimmer" />
              {pct > 1 && <div className="splash-bar-orb" />}
            </div>
          </div>
          <span className="splash-pct">{pct}%</span>
        </div>

        {/* Steps chips */}
        <div className="splash-steps">
          {steps.map((s, i) => (
            <div key={i} className={`splash-step${s.done ? " done" : ""}`}>
              <span className="splash-step-dot">{s.done ? "✓" : ""}</span>
              <span className="splash-step-label">{s.label}</span>
            </div>
          ))}
        </div>

        <p className="splash-counter">{doneCount} / {total} módulos carregados</p>
      </div>
    </div>
  );
}

export default SplashScreen;
