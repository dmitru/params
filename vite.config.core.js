import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import pkg from "./package.json" assert { type: "json" };

export default defineConfig({
  build: {
    outDir: "dist/core",
    lib: {
      entry: ["./src/index.ts"],
      formats: ["es"], // pure ESM package
      fileName: (format) => `index.js`,
    },
    rollupOptions: {
      output: {
        preserveModules: true,
      },
      external: [
        ...Object.keys(pkg.dependencies || {}), // don't bundle dependencies
        /^node:.*/, // don't bundle built-in Node.js modules (use protocol imports!)
      ],
    },
    target: "esnext", // transpile as little as possible
  },
  plugins: [
    dts({
      include: ["./src/core"],
      outDir: "dist",
    }),
  ], // emit TS declaration files
});
