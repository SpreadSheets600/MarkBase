import { build } from "esbuild";

await build({
  entryPoints: ["src/capture.js"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "chrome110",
  outfile: "../extension/capture.js",
  legalComments: "none",
});
console.log("built extension/capture.js");
