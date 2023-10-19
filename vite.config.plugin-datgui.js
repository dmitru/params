import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import pkg from "./package.json" assert { type: "json" };

export default defineConfig({
  build: {
    outDir: "dist/plugins/datgui",
    lib: {
      entry: ["./src/plugins/datgui/index.ts"],
      formats: ["es"],
      fileName: (format) => `index.js`,
    },
    rollupOptions: {
      output: {
        preserveModules: true,
      },
      external: [
        ...Object.keys(pkg.dependencies || {}), // don't bundle dependencies
        /^node:.*/, // don't bundle built-in Node.js modules (use protocol imports!)
        "../../core",
      ],
    },
    target: "esnext", // transpile as little as possible
  },
  plugins: [
    dts({
      include: ["./src/plugins/datgui"],
      outDir: "dist",
    }),
  ], // emit TS declaration files
});
