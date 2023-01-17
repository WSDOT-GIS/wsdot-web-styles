let jsdom: typeof import("jsdom") | undefined = undefined;

if (typeof window === "undefined") {
  jsdom = await import("jsdom");
}

const urlRoot = new URL("https://wsdotwebhelp.gitbook.io");
const colorPageUrl = new URL("web-style-guide/design-foundations/color", urlRoot); // "https://wsdotwebhelp.gitbook.io/web-style-guide/design-foundations/color";
const scaleIncrementsUrl = new URL("web-style-guide/design-foundations/typography/typographic-scale/scale-increments", urlRoot); //"https://wsdotwebhelp.gitbook.io/web-style-guide/design-foundations/typography/typographic-scale/scale-increments";

// const tables = document.body.querySelectorAll("table");

const pmsRe = /(\d+)\s+(\d+)%/ig;
const rgbRe = /(\d+),\s(\d+),\s(\d+)/g;
const hexRe = /[0-9a-f]{6}/ig;
const sameAsRe = /Same as.+/ig;

export type ColorInfoToStringFormat = "rgb" | "hex";

/**
 * Represents a color definition.
 */
export class ColorInfo {
  name: string;
  pms?: string;
  rgb!: [number, number, number];
  hex!: number;
  sameAs?: string;


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
        this.rgb = match[0].split(/,\s/g).map(v => parseInt(v)) as [number, number, number];
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

  get cssName() {
    return `--${this.name.replace(/\s/g, "-").replace(/%/g, "-percent")}`.toLowerCase();
  }


  /**
   * Converts the object into a CSS variable definition.
   */
  public toString(format: ColorInfoToStringFormat = "hex") {
    if (format === "hex") {
      return `${this.cssName}: #${this.hex.toString(16)};`;
    } else if (format === "rgb") {
      return `${this.cssName}: rgb(${this.rgb.join(",")});`;
    }
    throw new TypeError(`format must be either "hex" or "rgb". Instead got ${format}`);
  }

}

/**
 * Gets color info from the table of table definitions.
 * Data is stored in columns rather than rows.
 * @param table 
 * @param i - Column index. Valid values are 0-2.
 * @returns 
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
 */
function* getColorInfo(table: HTMLTableElement): Generator<ColorInfo, void, unknown> {
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
export function getColorInfosFromTable(tables: Iterable<HTMLTableElement>): ColorInfo[] {
  return [...tables].map(t => [...getColorInfo(t)]).flat();
}

/**
 * Determines if code is running in browser or node context and
 * retrieves the document at the URL using the method corresponding
 * to that environment.
 * @param url - An HTML document URL.
 * @returns 
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

export async function scrapeColors(url: URL = colorPageUrl): Promise<ColorInfo[]> {
  const document = await getDocument(url)
  let tables: NodeListOf<HTMLTableElement> | null = null;
  tables = document.querySelectorAll("table");


  if (!tables) {
    throw new TypeError("Could not find tables.")
  }

  return getColorInfosFromTable(tables);
}

export interface Scale {
  base: string;
  incrementName: string;
  pixelSize: string;
  remSize: string;
}

export async function* getScales(url = scaleIncrementsUrl) {

  let document = (await jsdom?.JSDOM.fromURL(url.toString()))?.window.document;
  if (!document) {
    const response = await fetch(url);
    const markup = await response.text();
    const domParser = new DOMParser();
    document = domParser.parseFromString(markup, "text/html");
  }

  const table = document.querySelector("table");

  if (!table) {
    throw new TypeError("Could not find table");
  }

  function* enumerateScaleIncrements(table: HTMLTableElement) {
    const rows = table?.querySelectorAll("tr");

    for (const [i, row] of rows.entries()) {
      const cells = [...row.querySelectorAll("td")].map(cell => cell.textContent as string);
      // The first row contains table headings
      if (i === 0) {
        continue;
      }

      const [base, incrementName, pixelSize, remSize] = cells;
      if (!/Base-?\d+/g.test(incrementName)) {
        continue;
      }
      yield {
        base,
        incrementName,
        pixelSize,
        remSize
      } as Scale;
    }
  }

  yield* enumerateScaleIncrements(table);
}