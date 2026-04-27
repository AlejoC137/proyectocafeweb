import React from "react";

/**
 * ErrorBoundary — captura errores en el árbol hijo y muestra un fallback
 * en lugar de romper toda la app.
 *
 * Uso básico:
 *   <ErrorBoundary>
 *     <MiComponente />
 *   </ErrorBoundary>
 *
 * Uso con sección nombrada:
 *   <ErrorBoundary section="Inventario">
 *     <GestionAlmacen />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // En producción Vite elimina console.log pero mantiene console.error
    console.error(
      `[ErrorBoundary]${this.props.section ? ` (${this.props.section})` : ""}`,
      error,
      info.componentStack
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const section = this.props.section ?? "esta sección";

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 border border-red-300 rounded bg-red-50 text-red-800 font-SpaceGrotesk gap-3">
          <p className="text-lg font-bold">⚠️ Error en {section}</p>
          <p className="text-sm text-center max-w-md">
            {this.state.error?.message ?? "Ocurrió un error inesperado."}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-2 px-4 py-2 border border-red-500 text-red-700 hover:bg-red-100 rounded text-sm"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
