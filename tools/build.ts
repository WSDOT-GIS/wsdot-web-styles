import { dirname, resolve } from "path";

const root = dirname(import.meta.dir);

const entryPoints = ["./tools/get-scales.ts", "./tools/get-colors.ts"].map(
  (p) => resolve(root, p),
);
const outDir = resolve(root, "bin");

console.debug({ entryPoints, outDir });

await Bun.build({
  entrypoints: entryPoints,
  outdir: outDir,
  target: "node",
  external: ["jsdom"],
});
