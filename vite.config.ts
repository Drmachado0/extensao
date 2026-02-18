import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações máximas para produção no Lovable
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
    cssMinify: true,
    cssCodeSplit: true,
    reportCompressedSize: false, // Acelera build no Lovable
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Otimização agressiva de chunks para melhor cache no Lovable
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "react-vendor";
            }
            if (id.includes("@radix-ui")) {
              return "ui-vendor";
            }
            if (id.includes("@tanstack/react-query")) {
              return "query-vendor";
            }
            if (id.includes("@supabase")) {
              return "supabase-vendor";
            }
            if (id.includes("recharts") || id.includes("date-fns")) {
              return "charts-vendor";
            }
            // Outros vendors menores juntos
            return "vendor";
          }
        },
        // Otimizar nomes de arquivos para cache
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  esbuild: {
    // Remove apenas debugger em produção
    // console.log/info/debug já são condicionais (só rodam em dev)
    // console.error e console.warn são mantidos para debugging em produção
    drop: mode === "production" ? ["debugger"] : [],
  },
  // Otimizar dependências pré-empacotadas
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "@tanstack/react-query",
    ],
  },
}));
