/**
 * Gets style info from WSDOT style guide website.
 */
import { stderr } from "node:process";

let jsdom: typeof import("jsdom") | undefined = undefined;

if (typeof window === "undefined") {
  jsdom = await import("jsdom");
}

const urlRoot = new URL("https://wsdotwebhelp.gitbook.io");

/**
 * https://wsdotwebhelp.gitbook.io/web-style-guide/design-foundations/color
 */
const colorPageUrl = new URL(
  "web-style-guide/design-foundations/color",
  urlRoot,
);

/**
 * https://wsdotwebhelp.gitbook.io/web-style-guide/design-foundations/typography/typographic-scale/scale-increments
 */
const scaleIncrementsUrl = new URL(
  "web-style-guide/design-foundations/typography/typographic-scale/scale-increments",
  urlRoot,
);

const pmsRe = /(\d+)\s+(\d+)%/gi;
const rgbRe = /(\d+),\s(\d+),\s(\d+)/g;
const hexRe = /[0-9a-f]{6}/gi;
const sameAsRe = /Same as.+/gi;

export type ColorInfoToStringFormat = "rgb" | "hex";

/**
 * Represents a color definition.
 */
export class ColorInfo {
  name: string;
  pms?: string;
  rgb!: [red: number, green: number, blue: number];
  hex!: number;
  sameAs?: string;

  /**
   * Constructs a new ColorInfo object with the given name and values.
   * @param name - The name of the color.
   * @param values - The values to initialize the color with.
   *   These can be in the form of PMS (e.g. "100% 100%"), RGB (e.g. "255, 255, 255"),
   *   hex (e.g. "FFFFFF"), or "Same as ...".
   */
  constructor(name: string, ...values: string[]) {
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
          .map((v) => parseInt(v)) as (typeof this)["rgb"];
        continue;
      }

      match = v.match(hexRe);
      if (match) {
        this.hex = parseInt(match[0], 16);
        continue;
      }

      match = v.match(sameAsRe);
      if (match) {
        this.sameAs = match[0];
        continue;
      }
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
    if (format === "hex") {
      return `${this.cssName}: #${this.hex.toString(16)};`;
    } else if (format === "rgb") {
      return `${this.cssName}: rgb(${this.rgb.join(",")});`;
    }
    throw new TypeError(
      `format must be either "hex" or "rgb". Instead got ${format as string}`,
    );
  }
}

/**
 * Gets color info from the table of table definitions.
 * Data is stored in columns rather than rows.
 * @param table - An HTML color definition table.
 * @param i - Column index. Valid values are 0-2.
 * @returns - {@link ColorInfo} object.
 */
function getColorInfoColumn(table: HTMLTableElement, i: number) {
  const selector = `td:nth-child(${i})`;
  const cells = [...table.querySelectorAll(selector)];
  if (!cells.length) {
    return null;
  }
  const textContents = [...cells.entries()]
    .filter(([i, cell]) => i !== 1 && cell.textContent != null)
    .map(([, cell]) => cell.textContent?.trimEnd()) as string[];
  return new ColorInfo(textContents[0], ...textContents.slice(1));
}

/**
 * Enumerates of the color infos in an HTML table.
 * Each table contains three color definitions, and
 * the page has multiple tables of color definitions.
 * @param table - An HTML color definition table.
 * @yields - {@link ColorInfo}
 */
function* getColorInfo(
  table: HTMLTableElement,
): Generator<ColorInfo, void, unknown> {
  for (let i = 1; i <= 3; i++) {
    const colorInfo = getColorInfoColumn(table, i);
    if (colorInfo) {
      yield colorInfo;
    }
  }
}

/**
 * Gets color info from table.
 * @param tables - An iterable list of tables.
 * @returns An array of {@link ColorInfo} objects.
 */
export function getColorInfosFromTable(
  tables: Iterable<HTMLTableElement>,
): ColorInfo[] {
  return [...tables].map((t) => [...getColorInfo(t)]).flat();
}

/**
 * Determines if code is running in browser or node context and
 * retrieves the document at the URL using the method corresponding
 * to that environment.
 * @param url - An HTML document URL.
 * @returns - A promise that resolves to the document.
 */
async function getDocument(url: URL) {
  let document = (await jsdom?.JSDOM.fromURL(url.toString()))?.window.document;
  if (!document) {
    const response = await fetch(url);
    const markup = await response.text();
    const domParser = new DOMParser();
    document = domParser.parseFromString(markup, "text/html");
  }
  return document;
}

/**
 * Scrapes colors from a given URL and returns an array of ColorInfo objects.
 * @param {URL} [url] - The URL to scrape colors from. Defaults to the colorPageUrl.
 * @returns {Promise<ColorInfo[]>} - A promise that resolves to an array of ColorInfo objects representing the scraped colors.
 * @throws {TypeError} - If no tables are found on the page.
 */
export async function scrapeColors(
  url: URL = colorPageUrl,
): Promise<ColorInfo[]> {
  const document = await getDocument(url);
  let tables: NodeListOf<HTMLTableElement> | null = null;
  tables = document.querySelectorAll("table");

  if (!tables) {
    throw new TypeError("Could not find tables.");
  }

  return getColorInfosFromTable(tables);
}

export interface Scale {
  base: string;
  incrementName: string;
  pixelSize: string;
  remSize: string;
}

/**
 * Generates a generator that yields scale information for each row in the given HTML table.
 * @param table - The HTML table to extract scale information from.
 * @yields - {@link Scale} information for each row in the table.
 */
function* enumerateScaleIncrements(
  table: HTMLTableElement,
): Generator<Scale, void, unknown> {
  const rows = table?.querySelectorAll("tr");

  /**
   * A tuple of the base, increment name, pixel size, and rem size.
   */
  type ScaleInfoTuple = [
    base: string,
    incrementName: string,
    pixelSize: string,
    remSize: string,
  ];

  const incrementNameRe = /Base-?\d+/g;

  // Loop through each row in the table and yield the scale information within.
  for (const [i, row] of rows.entries()) {
    // If this is the first row (table headings), skip to next one.
    if (i === 0) {
      continue;
    }

    // Create an array of text content from each cell in the current row,
    // filtering out any empty cells.
    const cells = [...row.querySelectorAll("td")]
      .map((cell) => cell.textContent!)
      .filter((text) => !!text) as ScaleInfoTuple;

    // If there are not enough cells, skip to next row and write an error message.
    if (cells.length < 4) {
      stderr.write(
        `\nRow ${i} should have 4 elements but only has ${
          cells.length
        }.\n${JSON.stringify(cells)}\n`,
      );
      continue;
    }

    // If any of the cells are empty, skip to next row and write an error message.
    if (cells.some((text) => !text)) {
      stderr.write(
        `\nRow ${i} contains an empty element.\n${JSON.stringify(cells)}\n`,
      );
      continue;
    }

    // If the increment name does not match the expected format, skip to next row and write an error message.
    const [base, incrementName, pixelSize, remSize] = cells;
    if (!incrementNameRe.test(incrementName)) {
      stderr.write(
        `Row ${i} has an invalid increment name: ${incrementName}. Expected to match ${incrementNameRe.source}\n`,
      );
      continue;
    }
    yield {
      base,
      incrementName,
      pixelSize,
      remSize,
    };
  }
}

/**
 * Gets scale increments from style guide.
 * @param url - The URL to of the style guide page. Defaults to {@link scaleIncrementsUrl}.
 * @yields - {@link Scale} information for each row in the table.
 */
export async function* scrapeScales(url = scaleIncrementsUrl) {
  const document = await getDocument(url);

  const table = document.querySelector("table");

  if (!table) {
    throw new TypeError("Could not find table");
  }

  yield* enumerateScaleIncrements(table);
}
