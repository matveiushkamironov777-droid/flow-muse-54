import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const url = loadEnv(mode, process.cwd(), "VITE_SUPABASE_").VITE_SUPABASE_URL?.trim();
    if (url !== undefined && (!/^https?:\/\//i.test(url) || !URL.canParse(url))) {
      throw new Error("VITE_SUPABASE_URL must be a valid HTTP or HTTPS project URL.");
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
