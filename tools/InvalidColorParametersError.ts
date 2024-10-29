import type { ColorInfo } from "./ColorInfo.js";

export class InvalidColorParametersError extends Error {
	constructor(
		message?: string,
		options?: ErrorOptions,
		...colorInfoParameters: ConstructorParameters<typeof ColorInfo>
	) {
		const [name, ...values] = colorInfoParameters;
		super(
			message ??
				`Invalid color parameters were provided: ${JSON.stringify({ name, values }, undefined, "\t")}`,
			options,
		);
		this.name = "InvalidColorParametersError";
	}
}
