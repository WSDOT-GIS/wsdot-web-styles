import { scrapeColors } from "./index.js";

const colors = await scrapeColors();

console.log(
	`:root {\n${colors.map((c) => `\t${c.toString()} /* ${c.rgb.join(",")} */`).join("\n")}\n}`,
);
