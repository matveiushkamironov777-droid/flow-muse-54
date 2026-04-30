import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            letterSpacing: "-0.05em",
            color: "var(--border-strong)",
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          404
        </div>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Страница не найдена</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
          Возможно, ссылка устарела или страница была перемещена.
        </div>
        <button
          onClick={() => navigate("/")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: "var(--r-md)",
            background: "var(--primary)",
            color: "var(--accent-fg)",
            border: "none",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          На главную
        </button>
      </div>
    </div>
  );
}
