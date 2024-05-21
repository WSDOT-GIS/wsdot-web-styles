# WSDOT Style Definitions

- CSS variables based on the [WSDOT Web Style Guide] and the tools used to generate them.
- [WSDOT Custom Icons]

## Use

### Install

```shell
npm install github:WSDOT-GIS/wsdot-web-styles
```

Has not been tested with npm alternatives such as bun, but I don't anticipate any problems. If you encounter any problems, please create an issue in this GitHub project.

### Reference in your project

This is an example of how to reference these style definitions in a [Vite] project.

```typescript
// Import WSDOT standard fonts, optional dependencies
// of wsdot-web-styles / @wsdot/web-styles
import "@fontsource/inconsolata";
import "@fontsource/lato";

// You can also use a dynamic import.
// In this case, importing the CSS file that
// defines WSDOT standard colors.
import("@wsdot/web-styles/css/wsdot-colors.css");

/**
 * Asynchronously adds the WSDOT logo SVG to the HTML document.
 * @returns A Promise that resolves with the WSDOT logo element.
 * @throws {Error} If the heading element is not found.
 */
async function addWsdotLogo() {
  // Import raw SVG markup from SVG file.
  const { default: svg } = await import(
    "@wsdot/web-styles/images/wsdot-logo/wsdot-logo-black.svg?raw"
  );
  // Parse the markup into a DOM element.
  const dp = new DOMParser();
  const wsdotLogo = dp.parseFromString(svg, "image/svg+xml").documentElement;

  // Add an id attribute.
  wsdotLogo.id = "wsdot-logo";

  // Add the logo to the heading element.
  // Throw an error if the heading element cannot found.
  const headingSelector = "h2";
  const headingElement = document.body.querySelector(headingSelector);
  if (!headingElement) {
    throw new Error("Heading element not found");
  }
  // Prepend the logo to the heading element.
  headingElement.prepend(wsdotLogo);
  // Return the logo element.
  return wsdotLogo;
}

addWsdotLogo().catch((reason: unknown) => {
  if (import.meta.env.DEV) {
    emitErrorEvent(reason);
  }
  console.error("Failed to add WSDOT logo.", reason);
});
```

## Other Resources

- [Font Awesome Transportation icons (filtered to free / open source only)](https://fontawesome.com/search?o=r&m=free&c=transportation)
- [Material Icon transportation symbols via Google Fonts](https://fonts.google.com/icons?selected=Material+Icons&icon.category=Transportation&icon.set=Material+Symbols)
- [_Wikimedia Commons_, "Category:Diagrams of route signs of the United States"](https://commons.wikimedia.org/wiki/Category:Diagrams_of_route_signs_of_the_United_States)

[WSDOT Web Style Guide]: https://wsdotwebhelp.gitbook.io/web-style-guide/
[WSDOT Custom Icons]: https://wsdotwebhelp.gitbook.io/web-style-guide/design-foundations/iconography#custom-icons
[vite]: https://vitejs.dev
