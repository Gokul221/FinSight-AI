import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      JWT_SECRET: "test-secret-do-not-use-in-prod",
      JWT_EXPIRES_IN: "1h",
      DATABASE_URL: "mongodb://127.0.0.1:27017/finsight-test",
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
