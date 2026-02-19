import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

// Spinner nativo injetado antes do React inicializar — previne tela branca
root.innerHTML = `
  <div id="app-init-loader" style="
    position: fixed; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: hsl(240, 14%, 4%);
    z-index: 9999;
  ">
    <div style="
      width: 36px; height: 36px;
      border: 2px solid rgba(99,102,241,0.2);
      border-top-color: hsl(252,62%,60%);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    "></div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  </div>
`;

createRoot(root).render(
  <ErrorBoundary context="Aplicação">
    <App />
  </ErrorBoundary>
);
