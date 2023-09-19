import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/main.ts",
  plugins: [typescript(), resolve()],
  output: {
    file: "SwiftFormat.novaextension/Scripts/main.js",
    sourcemap: false,
    format: "cjs",
  },
};
