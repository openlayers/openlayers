/**
 * @module ol/tileurlfunction
 */
import {modulo} from './math.js';
import {renderXYZTemplate} from './uri.js';
import {hash as tileCoordHash} from './tilecoord.js';

/**
 * @param {string} template Template.
 * @param {import("./tilegrid/TileGrid.js").default|null} tileGrid Tile grid.
 * @return {import("./Tile.js").UrlFunction} Tile URL function.
 */
export function createFromTemplate(template, tileGrid) {
  return (
    /**
     * @param {import("./tilecoord.js").TileCoord} tileCoord Tile Coordinate.
     * @param {number} pixelRatio Pixel ratio.
     * @param {import("./proj/Projection.js").default} projection Projection.
     * @return {string|undefined} Tile URL.
     */
    function (tileCoord, pixelRatio, projection) {
      if (!tileCoord) {
        return undefined;
      }
      let maxY;
      const z = tileCoord[0];
      if (tileGrid) {
        // The `{-y}` placeholder only works for sources that have a tile grid at construction
        const range = tileGrid.getFullTileRange(z);
        if (range) {
          maxY = range.getHeight() - 1;
        }
      }
      return renderXYZTemplate(template, z, tileCoord[1], tileCoord[2], maxY);
    }
  );
}

/**
 * @param {Array<string>} templates Templates.
 * @param {import("./tilegrid/TileGrid.js").default} tileGrid Tile grid.
 * @return {import("./Tile.js").UrlFunction} Tile URL function.
 */
export function createFromTemplates(templates, tileGrid) {
  const len = templates.length;
  const tileUrlFunctions = new Array(len);
  for (let i = 0; i < len; ++i) {
    tileUrlFunctions[i] = createFromTemplate(templates[i], tileGrid);
  }
  return createFromTileUrlFunctions(tileUrlFunctions);
}

/**
 * @param {Array<import("./Tile.js").UrlFunction>} tileUrlFunctions Tile URL Functions.
 * @return {import("./Tile.js").UrlFunction} Tile URL function.
 */
export function createFromTileUrlFunctions(tileUrlFunctions) {
  if (tileUrlFunctions.length === 1) {
    return tileUrlFunctions[0];
  }
  return (
    /**
     * @param {import("./tilecoord.js").TileCoord} tileCoord Tile Coordinate.
     * @param {number} pixelRatio Pixel ratio.
     * @param {import("./proj/Projection.js").default} projection Projection.
     * @return {string|undefined} Tile URL.
     */
    function (tileCoord, pixelRatio, projection) {
      if (!tileCoord) {
        return undefined;
      }
      const h = tileCoordHash(tileCoord);
      const index = modulo(h, tileUrlFunctions.length);
      return tileUrlFunctions[index](tileCoord, pixelRatio, projection);
    }
  );
}

/**
 * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
 * @param {number} pixelRatio Pixel ratio.
 * @param {import("./proj/Projection.js").default} projection Projection.
 * @return {string|undefined} Tile URL.
 */
export function nullTileUrlFunction(tileCoord, pixelRatio, projection) {
  return undefined;
}

/**
 * @param {string} url URL.
 * @return {Array<string>} Array of urls.
 */
export function expandUrl(url) {
  const urls = [];
  let match = /\{([a-z])-([a-z])\}/.exec(url);
  if (match) {
    // char range
    const startCharCode = match[1].charCodeAt(0);
    const stopCharCode = match[2].charCodeAt(0);
    let charCode;
    for (charCode = startCharCode; charCode <= stopCharCode; ++charCode) {
      urls.push(url.replace(match[0], String.fromCharCode(charCode)));
    }
    return urls;
  }
  match = /\{(\d+)-(\d+)\}/.exec(url);
  if (match) {
    // number range
    const stop = parseInt(match[2], 10);
    for (let i = parseInt(match[1], 10); i <= stop; i++) {
      urls.push(url.replace(match[0], i.toString()));
    }
    return urls;
  }
  urls.push(url);
  return urls;
}
