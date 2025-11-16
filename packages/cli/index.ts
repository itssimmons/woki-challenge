const log = console.log.bind(console);

type SpecialChars = "." | "*" | "_" | "-" | " ";

type Important<T> = {
	[K in keyof T]-?: T[K] extends object ? Important<T[K]> : NonNullable<T[K]>;
};

interface IndexPrintPadding {
	outside: number;
	inner: number;
}

interface IndexPrintOptions {
	character: SpecialChars;
	padding: Partial<IndexPrintPadding>;
}

const defaultValue: IndexPrintOptions = {
	character: ".",
	padding: {
		outside: 2,
		inner: 1,
	},
};

function withDefaults<T>(defaults: T, provided: Partial<T>): Important<T> {
	return {
		...defaults,
		...provided,
	} as Important<T>;
}

/**
 * Prints a formatted line to the console with a label, a value, and a customizable separator (default: dots).
 * The separator fills the space between the label and value, aligning the output to the terminal width.
 *
 * @param label - The label text to display on the left.
 * @param value - The value text to display on the right.
 * @param opts - Optional configuration.
 *   - character: The character to use as the separator (default: ".").
 *   - padding: Padding settings for outside and inner spaces.
 *
 * @example
 * // Basic usage with default options
 * indexPrint("Username", "alice");
 *
 * @example
 * // Custom separator and padding
 * indexPrint("Score", "42", {
 *   character: "*",
 *   padding: { outside: 4, inner: 1 }
 * });
 *
 * @example
 * // Using with chalk
 * indexPrint("Done in", "0.32ms", {
 *   character: chalk.green(".") as "."
 * });
 *
 */
export const indexPrint = (
	label: string,
	value: string,
	opts: Partial<IndexPrintOptions> = defaultValue,
) => {
	const options = withDefaults(defaultValue, opts);
	const terminalWidth = process.stdout.columns || 160;

	const dots = options.character.repeat(
		Math.max(
			2,
			terminalWidth -
				label.length -
				value.length -
				options.padding.outside * 2 -
				options.padding.inner * 2,
		),
	);
	log(
		" ".repeat(options.padding.outside) +
			label +
			" ".repeat(options.padding.inner) +
			dots +
			" ".repeat(options.padding.inner) +
			value +
			" ".repeat(options.padding.inner),
	);
};
