import { InvalidColorParametersError } from "./InvalidColorParametersError.js";

const pmsRe = /(\d+)\s+(\d+)%/gi;
const rgbRe = /(\d+),\s(\d+),\s(\d+)/g;
const hexRe = /[0-9a-f]{6}/gi;
const sameAsRe = /Same as.+/gi;

export type ColorInfoToStringFormat = "rgb" | "hex";

export type Rgb = [red: number, green: number, blue: number];
export type Rgba = [red: number, green: number, blue: number, alpha: number];
/**
 * Represents a color definition.
 */

export class ColorInfo {
	name: string;
	pms?: string;
	rgb?: Rgb;
	hex?: number;
	sameAs?: string;

	public get isValid(): boolean {
		return this.rgb != null || this.hex != null;
	}

	/**
	 * Constructs a new ColorInfo object with the given name and values.
	 * @param name - The name of the color.
	 * @param values - The values to initialize the color with.
	 *   These can be in the form of PMS (e.g. "100% 100%"), RGB (e.g. "255, 255, 255"),
	 *   hex (e.g. "FFFFFF"), or "Same as ...".
	 */
	constructor(name: string, ...values: string[]) {
		if (!name) {
			throw new InvalidColorParametersError(
				undefined,
				undefined,
				name,
				...values,
			);
		}
		this.name = name;

		for (const v of values) {
			if (v === undefined) {
				continue;
			}
			let match = v.match(pmsRe);
			if (match) {
				this.pms = match[0];
				continue;
			}

			match = v.match(rgbRe);
			if (match) {
				this.rgb = match[0]
					.split(/,\s/g)
					.map((v) => Number.parseInt(v)) as (typeof this)["rgb"];
				continue;
			}

			match = v.match(hexRe);
			if (match) {
				this.hex = Number.parseInt(match[0], 16);
				continue;
			}

			match = v.match(sameAsRe);
			if (match) {
				this.sameAs = match[0];
			}
		}

		if (!this.isValid) {
			throw new InvalidColorParametersError(
				`Either an RGB or HEX color value must be provided. ${JSON.stringify(
					{ name, values },
					undefined,
					"\t",
				)}`,
				undefined,
				name,
				...values,
			);
		}
	}

	/**
	 * Gets the CSS variable name for the color.
	 * @returns - The CSS variable name.
	 */
	get cssName() {
		return `--${this.name
			.replace(/\s/g, "-")
			.replace(/%/g, "-percent")}`.toLowerCase();
	}

	/**
	 * Converts the object into a CSS variable definition.
	 * @param format - The color format to use.
	 *   Either "rgb" or "hex".
	 * @returns - The CSS variable definition.
	 */
	public toString(format: ColorInfoToStringFormat = "hex") {
		if (
			this.hex != null &&
			(format === "hex" || (format === "rgb" && this.rgb == null))
		) {
			return `${this.cssName}: #${this.hex.toString(16)};`;
		}
		if (
			this.rgb != null &&
			(format === "rgb" || (format === "hex" && this.hex == null))
		) {
			return `${this.cssName}: rgb(${this.rgb.join(",")});`;
		}
		console.error("Error converting color to string", { ...this });
		throw new TypeError(
			`format must be either "hex" or "rgb". Instead got ${format as string}`,
			{
				cause: this,
			},
		);
	}
}

export default ColorInfo;
