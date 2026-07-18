import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    exclude: [
      "src/modules/platform/backup/**/*.spec.ts",
      "src/modules/platform/scheduler/**/*.spec.ts",
      "src/modules/platform/search/**/*.spec.ts",
      "node_modules/**",
    ],
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-jwt-secret-for-testing-purposes-only",
      AUTH_RATE_LIMIT_MAX: "1000",
      AUTH_RATE_LIMIT_WINDOW_MS: "60000",
      SMTP_HOST: "localhost",
      SMTP_PORT: "587",
      SMTP_USER: "",
      SMTP_PASSWORD: "",
      SMTP_FROM: "test@tableflow.io",
      FRONTEND_URL: "http://localhost:3000",
      VERIFICATION_REQUIRED: "false",
    },
  },
});
