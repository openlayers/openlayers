/**
 * @module ol/source/ImageTile
 */
import DataTileSource from './DataTile.js';
import {expandUrl, pickUrl, renderXYZTemplate} from '../uri.js';

/**
 * Image tile loading function.  The function is called with z, x, and y tile coordinates and
 * returns an {@link import("../DataTile.js").ImageLike image} or a promise for the same.
 *
 * @typedef {function(number, number, number, import("./DataTile.js").LoaderOptions):(import("../DataTile.js").ImageLike|Promise<import("../DataTile.js").ImageLike>)} Loader
 */

/**
 * @typedef {function(number, number, number, import("./DataTile.js").LoaderOptions):string} UrlGetter
 */

/**
 * @typedef {string | Array<string> | UrlGetter} UrlLike
 */

/**
 * @typedef {Object} Options
 * @property {UrlLike} [url] The image URL template.  In addition to a single URL template, an array of URL templates or a function
 * can be provided.  If a function is provided, it will be called with z, x, y tile coordinates and loader options and should
 * return a URL.
 * @property {Loader} [loader] Data loader.  Called with z, x, and y tile coordinates.
 * Returns an {@link import("../DataTile.js").ImageLike image} for a tile or a promise for the same.
 * The promise should not resolve until the image is loaded.  If the `url` option is provided, a loader will be created.
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [maxZoom=42] Optional max zoom level. Not used if `tileGrid` is provided.
 * @property {number} [minZoom=0] Optional min zoom level. Not used if `tileGrid` is provided.
 * @property {number|import("../size.js").Size} [tileSize=[256, 256]] The pixel width and height of the source tiles.
 * This may be different than the rendered pixel size if a `tileGrid` is provided.
 * @property {number} [gutter=0] The size in pixels of the gutter around data tiles to ignore.
 * This allows artifacts of rendering at tile edges to be ignored.
 * Supported data should be wider and taller than the tile size by a value of `2 x gutter`.
 * @property {number} [maxResolution] Optional tile grid resolution at level zero. Not used if `tileGrid` is provided.
 * @property {import("../proj.js").ProjectionLike} [projection='EPSG:3857'] Tile projection.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 * @property {boolean} [opaque=false] Whether the layer is opaque.
 * @property {import("./Source.js").State} [state] The source state.
 * @property {boolean} [wrapX=true] Render tiles beyond the antimeridian.
 * @property {number} [transition] Transition time when fading in new tiles (in miliseconds).
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.
 * @property {import('./DataTile.js').CrossOriginAttribute} [crossOrigin='anonymous'] The crossOrigin property to pass to loaders for image data.
 */

const loadError = new Error('Image failed to load');

/**
 * @param {string} template The image url template.
 * @param {number} z The tile z coordinate.
 * @param {number} x The tile x coordinate.
 * @param {number} y The tile y coordinate.
 * @param {import('./DataTile.js').LoaderOptions} options The loader options.
 * @return {Promise<HTMLImageElement>} Resolves with a loaded image.
 */
function loadImage(template, z, x, y, options) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (options.crossOrigin !== undefined) {
      image.crossOrigin = options.crossOrigin;
    }
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(loadError));
    image.src = renderXYZTemplate(template, z, x, y, options.maxY);
  });
}

/**
 * @param {Array<string>} templates The url templates.
 * @return {Loader} The image loader.
 */
function makeLoaderFromTemplates(templates) {
  return function (z, x, y, options) {
    const template = pickUrl(templates, z, x, y);
    return loadImage(template, z, x, y, options);
  };
}

/**
 * @param {UrlGetter} getter The url getter.
 * @return {Loader} The image loader.
 */
function makeLoaderFromGetter(getter) {
  return function (z, x, y, options) {
    const url = getter(z, x, y, options);
    return loadImage(url, z, x, y, options);
  };
}

/**
 * @classdesc
 * A source for typed array data tiles.
 *
 * @fires import("./Tile.js").TileSourceEvent
 * @api
 */
class ImageTileSource extends DataTileSource {
  /**
   * @param {Options} options DataTile source options.
   */
  constructor(options) {
    /**
     * @type {Loader}
     */
    let loader = options.loader;

    if (options.url) {
      if (Array.isArray(options.url)) {
        loader = makeLoaderFromTemplates(options.url);
      } else if (typeof options.url === 'string') {
        const urls = expandUrl(options.url);
        loader = makeLoaderFromTemplates(urls);
      } else if (typeof options.url === 'function') {
        loader = makeLoaderFromGetter(options.url);
      } else {
        throw new Error(
          'The url option must be a single template, an array of templates, or a function for getting a URL'
        );
      }
    }

    super({
      loader: loader,
      attributions: options.attributions,
      attributionsCollapsible: options.attributionsCollapsible,
      maxZoom: options.maxZoom,
      minZoom: options.minZoom,
      tileSize: options.tileSize,
      gutter: options.gutter,
      maxResolution: options.maxResolution,
      projection: options.projection,
      tileGrid: options.tileGrid,
      opaque: options.opaque,
      state: options.state,
      wrapX: options.wrapX,
      transition: options.transition,
      interpolate: options.interpolate !== false,
      crossOrigin: options.crossOrigin,
    });
  }
}

export default ImageTileSource;
