import { scrapeScales } from "./index.js";

console.log(":root {");
for await (const {
  base,
  incrementName,
  remSize,
  pixelSize,
} of scrapeScales()) {
  console.log(`\t--${incrementName}: ${remSize}; /* ${pixelSize} ${base} */`);
}
console.log("}");
