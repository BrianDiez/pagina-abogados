import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Evita la pantalla blanca: si algo del árbol crashea (p. ej. Clerk no puede
 *  inicializar en un dominio no autorizado), muestra el error en vez de nada. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("LegalHub ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error.message ?? String(this.state.error);
      const clerkLikely = /clerk|publishable|frontend api|host|origin|domain/i.test(msg);
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F8F7F4",
            fontFamily: "system-ui, sans-serif",
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 540, textAlign: "center" }}>
            <div style={{ fontSize: 40 }}>⚖️</div>
            <h1 style={{ color: "#1A2B4B", fontSize: 22, margin: "12px 0 6px" }}>
              Algo falló al cargar la aplicación
            </h1>
            <p style={{ color: "#5f6b7a", fontSize: 14, lineHeight: 1.5 }}>
              {clerkLikely
                ? "El sistema de cuentas (Clerk) no pudo inicializarse en este dominio. Probablemente falta autorizar el dominio en el panel de Clerk."
                : "Ocurrió un error inesperado. Recargá la página; si persiste, avisanos."}
            </p>
            <pre
              style={{
                marginTop: 16,
                textAlign: "left",
                background: "#fff",
                border: "1px solid #e2e6ee",
                borderRadius: 10,
                padding: 12,
                fontSize: 12,
                color: "#c0392b",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 16,
                background: "#1A2B4B",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
