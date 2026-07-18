import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@trend-iq/data": resolve(root, "packages/data/src/index.ts"),
      "@trend-iq/analysis": resolve(root, "packages/analysis/src/index.ts"),
      "@trend-iq/indicators": resolve(root, "packages/indicators/src/index.ts"),
      "@trend-iq/chart": resolve(root, "packages/chart/src/index.ts"),
      "@trend-iq/store": resolve(root, "packages/store/src/index.ts"),
      "@trend-iq/shared": resolve(root, "packages/shared/src/index.ts"),
      "@trend-iq/ui": resolve(root, "packages/ui/src/index.ts"),
      "@": resolve(root, "apps/desktop/src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["packages/**/src/**/*.test.ts", "apps/desktop/src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.workbuddy/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["packages/analysis/src/**", "apps/desktop/src/store/**"],
    },
  },
});
