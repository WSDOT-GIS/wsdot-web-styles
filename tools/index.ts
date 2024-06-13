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

type RgbTuple = [red: number, green: number, blue: number];

/**
 * Represents a color definition.
 */
export class ColorInfo {
  name: string;
  pms?: string;
  rgb!: RgbTuple;
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

    let rgb: typeof this.rgb | undefined = undefined;
    let hex: typeof this.hex | undefined = undefined;

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
        rgb = match[0]
          .split(/,\s/g)
          .map((v) => parseInt(v)) as (typeof this)["rgb"];
        this.rgb = rgb;
        continue;
      }

      match = v.match(hexRe);
      if (match) {
        hex = parseInt(match[0], 16);
        this.hex = hex;
        continue;
      }

      match = v.match(sameAsRe);
      if (match) {
        this.sameAs = match[0];
        continue;
      }
    }

    if (rgb == null && hex == null) {
      throw new TypeError(`Color ${name} has no hex or RGB values.`, {
        cause: values,
      });
    } else if (rgb == null) {
      throw new TypeError(`Color ${name} has no rgb value`, {
        cause: values,
      });
    } else if (hex == null) {
      throw new TypeError(`Color ${name} has no hex value`, {
        cause: values,
      });
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
    if (format !== "hex" && format !== "rgb") {
      throw new TypeError(
        `format must be either "hex" or "rgb". Instead got ${format as string}`,
      );
    }
    if (format === "hex" && this.hex != null) {
      return `${this.cssName}: #${this.hex.toString(16)};`;
    } else if (format === "rgb" && this.rgb != null && this.rgb.length > 0) {
      return `${this.cssName}: rgb(${this.rgb.join(",")});`;
    }

    throw new TypeError(`Unexpected color info`, {
      cause: this,
    });
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
  const cells = table.querySelectorAll<HTMLTableCellElement>(selector);
  let output: ColorInfo | null;
  if (!cells.length) {
    output = null;
  } else {
    type IndexCellTuple = [index: number, cell: HTMLTableCellElement];

    /**
     * Filters out cells that are not in the second column and have non-null text content.
     * @param value - The index and cell to filter.
     * @returns True if the index is not 1 and the cell is not null.
     */
    function filterFunction(value: IndexCellTuple): boolean {
      const [i, cell] = value;
      return i !== 1 && cell != null;
    }
    function mapFunction([, cell]: IndexCellTuple): string | undefined {
      return cell.textContent?.trimEnd();
    }
    const textContents = [...cells.entries()]
      .filter(filterFunction)
      .map(mapFunction) as string[];
    output = new ColorInfo(textContents[0], ...textContents.slice(1));
  }
  return output;
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
  function getColorInfosFromHtmlTable(t: HTMLTableElement): ColorInfo[] {
    return [...getColorInfo(t)];
  }
  return [...tables].map(getColorInfosFromHtmlTable).flat();
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
