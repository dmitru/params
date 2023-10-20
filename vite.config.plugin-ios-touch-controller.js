import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import pkg from "./package.json" assert { type: "json" };

export default defineConfig({
  build: {
    outDir: "dist/plugins/ios-touch-controller",
    lib: {
      entry: ["./src/plugins/ios-touch-controller/index.ts"],
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
        "../../core",
      ],
    },
    target: "esnext", // transpile as little as possible
  },
  plugins: [
    dts({
      include: ["./src/plugins/ios-touch-controller"],
      outDir: "dist",
    }),
  ], // emit TS declaration files
});
