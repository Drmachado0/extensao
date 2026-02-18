import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Verificar se o elemento root existe
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Mostrar spinner imediato para evitar flash de tela branca
rootElement.innerHTML = `
  <div id="initial-loader" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a12;">
    <div style="width:32px;height:32px;border-radius:50%;border:2px solid rgba(139,92,246,0.2);border-top-color:#8b5cf6;animation:spin 0.8s linear infinite;"></div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  </div>
`;

// Renderizar com tratamento de erro
try {
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error("Erro ao renderizar aplicação:", error);
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #0a0a12; color: #fff; padding: 20px; font-family: system-ui, sans-serif;">
      <div style="text-align: center; max-width: 500px;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Erro ao carregar aplicação</h1>
        <p style="margin-bottom: 24px; color: #888;">
          Erro crítico ao inicializar a aplicação. Verifique o console para mais detalhes.
        </p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background-color: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Recarregar página
        </button>
      </div>
    </div>
  `;
}
