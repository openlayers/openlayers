/**
 * @module ol/source/OGCMapTile
 */
import SourceState from './State.js';
import TileGrid from '../tilegrid/TileGrid.js';
import TileImage from './TileImage.js';
import {assign} from '../obj.js';
import {get as getProjection} from '../proj.js';

/**
 * See https://ogcapi.ogc.org/tiles/.
 */

/**
 * @typedef {Object} TileSet
 * @property {string} dataType Type of data represented in the tileset (must be "map").
 * @property {string} [tileMatrixSetDefinition] Reference to a tile matrix set definition.
 * @property {TileMatrixSet} [tileMatrixSet] Tile matrix set definition.
 * @property {Array<TileMatrixSetLimits>} [tileMatrixSetLimits] Tile matrix set limits.
 * @property {Array<Link>} links Tileset links.
 */

/**
 * @typedef {Object} Link
 * @property {string} rel The link rel attribute.
 * @property {string} href The link URL.
 * @property {string} type The link type.
 */

/**
 * @typedef {Object} TileMatrixSetLimits
 * @property {string} tileMatrix The tile matrix id.
 * @property {number} minTileRow The minimum tile row.
 * @property {number} maxTileRow The maximum tile row.
 * @property {number} minTileCol The minimum tile column.
 * @property {number} maxTileCol The maximum tile column.
 */

/**
 * @typedef {Object} TileMatrixSet
 * @property {string} id The tile matrix set identifier.
 * @property {string} crs The coordinate reference system.
 * @property {Array<TileMatrix>} tileMatrices Array of tile matrices.
 */

/**
 * @typedef {Object} TileMatrix
 * @property {string} id The tile matrix identifier.
 * @property {number} cellSize The pixel resolution (map units per pixel).
 * @property {Array<number>} pointOfOrigin The map location of the matrix origin.
 * @property {string} [cornerOfOrigin='topLeft'] The corner of the matrix that represents the origin ('topLeft' or 'bottomLeft').
 * @property {number} matrixWidth The number of columns.
 * @property {number} matrixHeight The number of rows.
 * @property {number} tileWidth The pixel width of a tile.
 * @property {number} tileHeight The pixel height of a tile.
 */

const BOTTOM_LEFT_ORIGIN = 'bottomLeft';

/**
 * @type {Object<string, boolean>}
 */
const knownImageTypes = {
  'image/png': true,
  'image/jpeg': true,
  'image/gif': true,
  'image/webp': true,
};

/**
 * @param {string} base The base URL.
 * @param {string} url The potentially relative URL.
 * @return {string} The full URL.
 */
function resolveUrl(base, url) {
  if (url.indexOf('://') >= 0) {
    return url;
  }
  return new URL(url, base).href;
}

/**
 * @param {string} url The URL.
 * @param {function(ProgressEvent<XMLHttpRequest>): void} onLoad The load callback.
 * @param {function(ProgressEvent<XMLHttpRequest>): void} onError The error callback.
 */
function getJSON(url, onLoad, onError) {
  const client = new XMLHttpRequest();
  client.addEventListener('load', onLoad);
  client.addEventListener('error', onError);
  client.open('GET', url);
  client.setRequestHeader('Accept', 'application/json');
  client.send();
}

/**
 * @typedef {Object} Options
 * @property {string} url URL to the OGC Map Tileset endpoint.
 * @property {Object} [context] A lookup of values to use in the tile URL template.  The `{tileMatrix}`
 * (zoom level), `{tileRow}`, and `{tileCol}` variables in the URL will always be provided by the source.
 * @property {string} [mediaType] The content type for the tiles (e.g. "image/png").  If not provided,
 * the source will try to find a link with rel="item" that uses a supported image type.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. By default, the projection
 * will be derived from the `supportedCRS` of the `tileMatrixSet`.  You can override this by supplying
 * a projection to the constructor.
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {number} [cacheSize] Tile cache size. The default depends on the screen size. Will be ignored if too small.
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {boolean} [imageSmoothing=true] Enable image smoothing.
 * @property {number} [reprojectionErrorThreshold=0.5] Maximum allowed reprojection error (in pixels).
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {import("../Tile.js").LoadFunction} [tileLoadFunction] Optional function to load a tile given a URL. The default is
 * ```js
 * function(tile, src) {
 *   tile.getImage().src = src;
 * };
 * ```
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 * @property {number} [transition] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 */

/**
 * @classdesc
 * Layer source for map tiles from an OGC API - Tiles service that provides "map" type tiles.
 * The service must conform to at least the core (http://www.opengis.net/spec/ogcapi-tiles-1/1.0/conf/core)
 * and tileset (http://www.opengis.net/spec/ogcapi-tiles-1/1.0/conf/tileset) conformance classes.
 * @api
 */
class OGCMapTile extends TileImage {
  /**
   * @param {Options} options OGC map tile options.
   */
  constructor(options) {
    super({
      attributions: options.attributions,
      cacheSize: options.cacheSize,
      crossOrigin: options.crossOrigin,
      imageSmoothing: options.imageSmoothing,
      projection: options.projection,
      reprojectionErrorThreshold: options.reprojectionErrorThreshold,
      state: SourceState.LOADING,
      tileLoadFunction: options.tileLoadFunction,
      wrapX: options.wrapX !== undefined ? options.wrapX : true,
      transition: options.transition,
    });

    /**
     * @type {string}
     * @private
     */
    this.baseUrl_ = options.url;

    /**
     * @private
     * @type {string}
     */
    this.mediaType_ = options.mediaType;

    /**
     * @private
     * @type {Object}
     */
    this.context_ = options.context || null;

    /**
     * @private
     * @type {string}
     */
    this.tileUrlTemplate_;

    /**
     * @private
     * @type {Array<TileMatrixSetLimits>}
     */
    this.tileMatrixSetLimits_ = null;

    getJSON(
      this.baseUrl_,
      this.onTileSetMetadataLoad_.bind(this),
      this.onTileSetMetadataError_.bind(this)
    );
  }

  /**
   * @private
   * @param {ProgressEvent<XMLHttpRequest>} event The load event.
   */
  onTileSetMetadataLoad_(event) {
    const client = event.target;
    // status will be 0 for file:// urls
    if (!client.status || (client.status >= 200 && client.status < 300)) {
      let response;
      try {
        response = /** @type {TileSet} */ (JSON.parse(client.responseText));
      } catch (err) {
        this.handleError_(err);
        return;
      }
      this.parseTileSetMetadata_(response);
    } else {
      this.handleError_(
        new Error(`Unexpected status for tiles info: ${client.status}`)
      );
    }
  }

  /**
   * @private
   * @param {ProgressEvent<XMLHttpRequest>} event The error event.
   */
  onTileSetMetadataError_(event) {
    this.handleError_(new Error('Client error loading tiles info'));
  }

  /**
   * @private
   * @param {TileSet} info Tile set metadata.
   */
  parseTileSetMetadata_(info) {
    let tileUrlTemplate;
    let fallbackUrlTemplate;
    for (let i = 0; i < info.links.length; ++i) {
      const link = info.links[i];
      if (link.rel === 'item') {
        if (link.type === this.mediaType_) {
          tileUrlTemplate = link.href;
          break;
        }
        if (knownImageTypes[link.type]) {
          fallbackUrlTemplate = link.href;
        } else if (!fallbackUrlTemplate && link.type.indexOf('image/') === 0) {
          fallbackUrlTemplate = link.href;
        }
      }
    }

    if (!tileUrlTemplate) {
      if (fallbackUrlTemplate) {
        tileUrlTemplate = fallbackUrlTemplate;
      } else {
        this.handleError_(new Error('Could not find "item" link'));
        return;
      }
    }
    this.tileUrlTemplate_ = tileUrlTemplate;

    if (info.tileMatrixSet) {
      this.parseTileMatrixSet_(info.tileMatrixSet);
      return;
    }

    if (!info.tileMatrixSetDefinition) {
      this.handleError_(
        new Error('Expected tileMatrixSetDefinition or tileMatrixSet')
      );
      return;
    }

    getJSON(
      resolveUrl(this.baseUrl_, info.tileMatrixSetDefinition),
      this.onTilesTileMatrixSetLoad_.bind(this),
      this.onTilesTileMatrixSetError_.bind(this)
    );
  }

  /**
   * @private
   * @param {ProgressEvent<XMLHttpRequest>} event The load event.
   */
  onTilesTileMatrixSetLoad_(event) {
    const client = event.target;
    // status will be 0 for file:// urls
    if (!client.status || (client.status >= 200 && client.status < 300)) {
      let response;
      try {
        response = /** @type {TileMatrixSet} */ (
          JSON.parse(client.responseText)
        );
      } catch (err) {
        this.handleError_(err);
        return;
      }
      this.parseTileMatrixSet_(response);
    } else {
      this.handleError_(
        new Error(`Unexpected status for tile matrix set: ${client.status}`)
      );
    }
  }

  /**
   * @private
   * @param {ProgressEvent<XMLHttpRequest>} event The error event.
   */
  onTilesTileMatrixSetError_(event) {
    this.handleError_(new Error('Client error loading tile matrix set'));
  }

  /**
   * @private
   * @param {TileMatrixSet} tileMatrixSet Tile matrix set.
   */
  parseTileMatrixSet_(tileMatrixSet) {
    let projection = this.getProjection();
    if (!projection) {
      projection = getProjection(tileMatrixSet.crs);
      if (!projection) {
        this.handleError_(new Error(`Unsupported CRS: ${tileMatrixSet.crs}`));
        return;
      }
    }
    const backwards = projection.getAxisOrientation().substr(0, 2) !== 'en';

    // TODO: deal with limits
    const matrices = tileMatrixSet.tileMatrices;
    const length = matrices.length;
    const origins = new Array(length);
    const resolutions = new Array(length);
    const sizes = new Array(length);
    const tileSizes = new Array(length);
    for (let i = 0; i < matrices.length; ++i) {
      const matrix = matrices[i];
      const origin = matrix.pointOfOrigin;
      if (backwards) {
        origins[i] = [origin[1], origin[0]];
      } else {
        origins[i] = origin;
      }
      resolutions[i] = matrix.cellSize;
      sizes[i] = [matrix.matrixWidth, matrix.matrixHeight];
      tileSizes[i] = [matrix.tileWidth, matrix.tileHeight];
    }

    const tileGrid = new TileGrid({
      origins: origins,
      resolutions: resolutions,
      sizes: sizes,
      tileSizes: tileSizes,
    });

    this.tileGrid = tileGrid;

    const tileUrlTemplate = this.tileUrlTemplate_;
    const context = this.context_;
    const base = this.baseUrl_;

    this.setTileUrlFunction(function (tileCoord, pixelRatio, projection) {
      if (!tileCoord) {
        return undefined;
      }

      const matrix = matrices[tileCoord[0]];
      const upsideDown = matrix.cornerOfOrigin === BOTTOM_LEFT_ORIGIN;

      const localContext = {
        tileMatrix: matrix.id,
        tileCol: tileCoord[1],
        tileRow: upsideDown ? -tileCoord[2] - 1 : tileCoord[2],
      };
      assign(localContext, context);

      const url = tileUrlTemplate.replace(/\{(\w+?)\}/g, function (m, p) {
        return localContext[p];
      });

      return resolveUrl(base, url);
    }, tileUrlTemplate);

    this.setState(SourceState.READY);
  }

  /**
   * @private
   * @param {Error} error The error.
   */
  handleError_(error) {
    console.error(error); // eslint-disable-line
    this.setState(SourceState.ERROR);
  }
}

export default OGCMapTile;
