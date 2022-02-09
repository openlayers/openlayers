/**
 * @module ol/layer/MapboxVector
 */
import BaseEvent from '../events/Event.js';
import EventType from '../events/EventType.js';
import MVT from '../format/MVT.js';
import SourceState from '../source/State.js';
import VectorTileLayer from '../layer/VectorTile.js';
import VectorTileSource from '../source/VectorTile.js';
import {applyBackground, applyStyle, setupVectorSource} from 'ol-mapbox-style';

const mapboxBaseUrl = 'https://api.mapbox.com';

/**
 * Gets the path from a mapbox:// URL.
 * @param {string} url The Mapbox URL.
 * @return {string} The path.
 * @private
 */
export function getMapboxPath(url) {
  const startsWith = 'mapbox://';
  if (url.indexOf(startsWith) !== 0) {
    return '';
  }
  return url.slice(startsWith.length);
}

/**
 * Turns mapbox:// sprite URLs into resolvable URLs.
 * @param {string} url The sprite URL.
 * @param {string} token The access token.
 * @param {string} styleUrl The style URL.
 * @return {string} A resolvable URL.
 * @private
 */
export function normalizeSpriteUrl(url, token, styleUrl) {
  const mapboxPath = getMapboxPath(url);
  if (!mapboxPath) {
    return decodeURI(new URL(url, styleUrl).href);
  }
  const startsWith = 'sprites/';
  if (mapboxPath.indexOf(startsWith) !== 0) {
    throw new Error(`unexpected sprites url: ${url}`);
  }
  const sprite = mapboxPath.slice(startsWith.length);

  return `${mapboxBaseUrl}/styles/v1/${sprite}/sprite?access_token=${token}`;
}

/**
 * Turns mapbox:// glyphs URLs into resolvable URLs.
 * @param {string} url The glyphs URL.
 * @param {string} token The access token.
 * @param {string} styleUrl The style URL.
 * @return {string} A resolvable URL.
 * @private
 */
export function normalizeGlyphsUrl(url, token, styleUrl) {
  const mapboxPath = getMapboxPath(url);
  if (!mapboxPath) {
    return decodeURI(new URL(url, styleUrl).href);
  }
  const startsWith = 'fonts/';
  if (mapboxPath.indexOf(startsWith) !== 0) {
    throw new Error(`unexpected fonts url: ${url}`);
  }
  const font = mapboxPath.slice(startsWith.length);

  return `${mapboxBaseUrl}/fonts/v1/${font}/0-255.pbf?access_token=${token}`;
}

/**
 * Turns mapbox:// style URLs into resolvable URLs.
 * @param {string} url The style URL.
 * @param {string} token The access token.
 * @return {string} A resolvable URL.
 * @private
 */
export function normalizeStyleUrl(url, token) {
  const mapboxPath = getMapboxPath(url);
  if (!mapboxPath) {
    return decodeURI(new URL(url, location.href).href);
  }
  const startsWith = 'styles/';
  if (mapboxPath.indexOf(startsWith) !== 0) {
    throw new Error(`unexpected style url: ${url}`);
  }
  const style = mapboxPath.slice(startsWith.length);

  return `${mapboxBaseUrl}/styles/v1/${style}?&access_token=${token}`;
}

/**
 * Turns mapbox:// source URLs into vector tile URL templates.
 * @param {string} url The source URL.
 * @param {string} token The access token.
 * @param {string} tokenParam The access token key.
 * @param {string} styleUrl The style URL.
 * @return {string} A vector tile template.
 * @private
 */
export function normalizeSourceUrl(url, token, tokenParam, styleUrl) {
  const urlObject = new URL(url, styleUrl);
  const mapboxPath = getMapboxPath(url);
  if (!mapboxPath) {
    if (!token) {
      return decodeURI(urlObject.href);
    }
    urlObject.searchParams.set(tokenParam, token);
    return decodeURI(urlObject.href);
  }
  return `https://{a-d}.tiles.mapbox.com/v4/${mapboxPath}/{z}/{x}/{y}.vector.pbf?access_token=${token}`;
}

/**
 * @classdesc
 * Event emitted on configuration or loading error.
 */
class ErrorEvent extends BaseEvent {
  /**
   * @param {Error} error error object.
   */
  constructor(error) {
    super(EventType.ERROR);

    /**
     * @type {Error}
     */
    this.error = error;
  }
}

/**
 * @typedef {Object} StyleObject
 * @property {Object<string, SourceObject>} sources The style sources.
 * @property {string} sprite The sprite URL.
 * @property {string} glyphs The glyphs URL.
 * @property {Array<LayerObject>} layers The style layers.
 */

/**
 * @typedef {Object} SourceObject
 * @property {string} url The source URL.
 * @property {SourceType} type The source type.
 * @property {Array<string>} [tiles] TileJSON tiles.
 */

/**
 * The Mapbox source type.
 * @enum {string}
 */
const SourceType = {
  VECTOR: 'vector',
};

/**
 * @typedef {Object} LayerObject
 * @property {string} id The layer id.
 * @property {string} type The layer type.
 * @property {string} source The source id.
 * @property {Object} layout The layout.
 * @property {Object} paint The paint.
 */

/**
 * @typedef {Object} Options
 * @property {string} styleUrl The URL of the Mapbox style object to use for this layer.  For a
 * style created with Mapbox Studio and hosted on Mapbox, this will look like
 * 'mapbox://styles/you/your-style'.
 * @property {string} [accessToken] The access token for your Mapbox style. This has to be provided
 * for `mapbox://` style urls. For `https://` and other urls, any access key must be the last query
 * parameter of the style url.
 * @property {string} [source] If your style uses more than one source, you need to use either the
 * `source` property or the `layers` property to limit rendering to a single vector source.  The
 * `source` property corresponds to the id of a vector source in your Mapbox style.
 * @property {Array<string>} [layers] Limit rendering to the list of included layers.  All layers
 * must share the same vector source.  If your style uses more than one source, you need to use
 * either the `source` property or the `layers` property to limit rendering to a single vector
 * source.
 * @property {boolean} [declutter=true] Declutter images and text. Decluttering is applied to all
 * image and text styles of all Vector and VectorTile layers that have set this to `true`. The priority
 * is defined by the z-index of the layer, the `zIndex` of the style and the render order of features.
 * Higher z-index means higher priority. Within the same z-index, a feature rendered before another has
 * higher priority.
 *
 * As an optimization decluttered features from layers with the same `className` are rendered above
 * the fill and stroke styles of all of those layers regardless of z-index.  To opt out of this
 * behavior and place declutterd features with their own layer configure the layer with a `className`
 * other than `ol-layer`.
 * @property {import("./Base.js").BackgroundColor|false} [background] Background color for the layer.
 * If not specified, the background from the Mapbox style object will be used. Set to `false` to prevent
 * the Mapbox style's background from being used.
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible. If neither `maxResolution` nor `minZoom` are defined, the layer's `maxResolution` will
 * match the style source's `minzoom`.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will
 * be visible. If neither `maxResolution` nor `minZoom` are defined, the layer's `minZoom` will match
 * the style source's `minzoom`.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {import("../render.js").OrderFunction} [renderOrder] Render order. Function to be used when sorting
 * features before rendering. By default features are drawn in the order that they are created. Use
 * `null` to avoid the sort, but get an undefined draw order.
 * @property {number} [renderBuffer=100] The buffer in pixels around the tile extent used by the
 * renderer when getting features from the vector tile for the rendering or hit-detection.
 * Recommended value: Vector tiles are usually generated with a buffer, so this value should match
 * the largest possible buffer of the used tiles. It should be at least the size of the largest
 * point symbol or line width.
 * @property {import("./VectorTileRenderType.js").default|string} [renderMode='hybrid'] Render mode for vector tiles:
 *  * `'hybrid'`: Polygon and line elements are rendered as images, so pixels are scaled during zoom
 *    animations. Point symbols and texts are accurately rendered as vectors and can stay upright on
 *    rotated views.
 *  * `'vector'`: Everything is rendered as vectors. Use this mode for improved performance on vector
 *    tile layers with only a few rendered features (e.g. for highlighting a subset of features of
 *    another layer with the same source).
 * @property {import("../PluggableMap.js").default} [map] Sets the layer as overlay on a map. The map will not manage
 * this layer in its layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
 * use {@link import("../PluggableMap.js").default#addLayer map.addLayer()}.
 * @property {boolean} [updateWhileAnimating=false] When set to `true`, feature batches will be
 * recreated during animations. This means that no vectors will be shown clipped, but the setting
 * will have a performance impact for large amounts of vector data. When set to `false`, batches
 * will be recreated when no animation is active.
 * @property {boolean} [updateWhileInteracting=false] When set to `true`, feature batches will be
 * recreated during interactions. See also `updateWhileAnimating`.
 * @property {number} [preload=0] Preload. Load low-resolution tiles up to `preload` levels. `0`
 * means no preloading.
 * @property {boolean} [useInterimTilesOnError=true] Use interim tiles on error.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */

/**
 * @classdesc
 * A vector tile layer based on a Mapbox style that uses a single vector source.  Configure
 * the layer with the `styleUrl` and `accessToken` shown in Mapbox Studio's share panel.
 * If the style uses more than one source, use the `source` property to choose a single
 * vector source.  If you want to render a subset of the layers in the style, use the `layers`
 * property (all layers must share the same vector source).  See the constructor options for
 * more detail.
 *
 *     var map = new Map({
 *       view: new View({
 *         center: [0, 0],
 *         zoom: 1
 *       }),
 *       layers: [
 *         new MapboxVectorLayer({
 *           styleUrl: 'mapbox://styles/mapbox/bright-v9',
 *           accessToken: 'your-mapbox-access-token-here'
 *         })
 *       ],
 *       target: 'map'
 *     });
 *
 * On configuration or loading error, the layer will trigger an `'error'` event.  Listeners
 * will receive an object with an `error` property that can be used to diagnose the problem.
 *
 * @param {Options} options Options.
 * @extends {VectorTileLayer}
 * @fires module:ol/events/Event~BaseEvent#event:error
 * @api
 */
class MapboxVectorLayer extends VectorTileLayer {
  /**
   * @param {Options} options Layer options.  At a minimum, `styleUrl` and `accessToken`
   * must be provided.
   */
  constructor(options) {
    const declutter = 'declutter' in options ? options.declutter : true;
    const source = new VectorTileSource({
      state: SourceState.LOADING,
      format: new MVT(),
    });

    super({
      source: source,
      background: options.background,
      declutter: declutter,
      className: options.className,
      opacity: options.opacity,
      visible: options.visible,
      zIndex: options.zIndex,
      minResolution: options.minResolution,
      maxResolution: options.maxResolution,
      minZoom: options.minZoom,
      maxZoom: options.maxZoom,
      renderOrder: options.renderOrder,
      renderBuffer: options.renderBuffer,
      renderMode: options.renderMode,
      map: options.map,
      updateWhileAnimating: options.updateWhileAnimating,
      updateWhileInteracting: options.updateWhileInteracting,
      preload: options.preload,
      useInterimTilesOnError: options.useInterimTilesOnError,
      properties: options.properties,
    });

    this.setMaxResolutionFromTileGrid_ =
      options.maxResolution === undefined && options.minZoom === undefined;

    this.sourceId = options.source;
    this.layers = options.layers;

    if (options.accessToken) {
      this.accessToken = options.accessToken;
    } else {
      const url = new URL(options.styleUrl, location.href);
      // The last search parameter is the access token
      url.searchParams.forEach((value, key) => {
        this.accessToken = value;
        this.accessTokenParam_ = key;
      });
    }
    this.fetchStyle(options.styleUrl);
  }

  /**
   * Fetch the style object.
   * @param {string} styleUrl The URL of the style to load.
   * @protected
   */
  fetchStyle(styleUrl) {
    const url = normalizeStyleUrl(styleUrl, this.accessToken);
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `unexpected response when fetching style: ${response.status}`
          );
        }
        return response.json();
      })
      .then((style) => {
        this.onStyleLoad(style, url.startsWith('data:') ? location.href : url);
      })
      .catch((error) => {
        this.handleError(error);
      });
  }

  /**
   * Handle the loaded style object.
   * @param {StyleObject} style The loaded style.
   * @param {string} styleUrl The URL of the style.
   * @protected
   */
  onStyleLoad(style, styleUrl) {
    let sourceId;
    let sourceIdOrLayersList;
    if (this.layers) {
      // confirm all layers share the same source
      const lookup = {};
      for (let i = 0; i < style.layers.length; ++i) {
        const layer = style.layers[i];
        if (layer.source) {
          lookup[layer.id] = layer.source;
        }
      }
      let firstSource;
      for (let i = 0; i < this.layers.length; ++i) {
        const candidate = lookup[this.layers[i]];
        if (!candidate) {
          this.handleError(
            new Error(`could not find source for ${this.layers[i]}`)
          );
          return;
        }
        if (!firstSource) {
          firstSource = candidate;
        } else if (firstSource !== candidate) {
          this.handleError(
            new Error(
              `layers can only use a single source, found ${firstSource} and ${candidate}`
            )
          );
          return;
        }
      }
      sourceId = firstSource;
      sourceIdOrLayersList = this.layers;
    } else {
      sourceId = this.sourceId;
      sourceIdOrLayersList = sourceId;
    }

    if (!sourceIdOrLayersList) {
      // default to the first source in the style
      sourceId = Object.keys(style.sources)[0];
      sourceIdOrLayersList = sourceId;
    }

    if (style.sprite) {
      style.sprite = normalizeSpriteUrl(
        style.sprite,
        this.accessToken,
        styleUrl
      );
    }

    if (style.glyphs) {
      style.glyphs = normalizeGlyphsUrl(
        style.glyphs,
        this.accessToken,
        styleUrl
      );
    }

    const styleSource = style.sources[sourceId];
    if (styleSource.type !== SourceType.VECTOR) {
      this.handleError(
        new Error(`only works for vector sources, found ${styleSource.type}`)
      );
      return;
    }

    const source = this.getSource();
    if (styleSource.url && styleSource.url.indexOf('mapbox://') === 0) {
      // Tile source url, handle it directly
      source.setUrl(
        normalizeSourceUrl(
          styleSource.url,
          this.accessToken,
          this.accessTokenParam_,
          styleUrl
        )
      );
      applyStyle(this, style, sourceIdOrLayersList)
        .then(() => {
          this.configureSource(source, style);
        })
        .catch((error) => {
          this.handleError(error);
        });
    } else {
      // TileJSON url, let ol-mapbox-style handle it
      if (styleSource.tiles) {
        styleSource.tiles = styleSource.tiles.map((url) =>
          normalizeSourceUrl(
            url,
            this.accessToken,
            this.accessTokenParam_,
            styleUrl
          )
        );
      }
      setupVectorSource(
        styleSource,
        styleSource.url
          ? normalizeSourceUrl(
              styleSource.url,
              this.accessToken,
              this.accessTokenParam_,
              styleUrl
            )
          : undefined
      ).then((source) => {
        applyStyle(this, style, sourceIdOrLayersList)
          .then(() => {
            this.configureSource(source, style);
          })
          .catch((error) => {
            this.configureSource(source, style);
            this.handleError(error);
          });
      });
    }
  }

  /**
   * Applies configuration from the provided source to this layer's source,
   * and reconfigures the loader to add a feature that renders the background,
   * if the style is configured with a background.
   * @param {import("../source/VectorTile.js").default} source The source to configure from.
   * @param {StyleObject} style The style to configure the background from.
   */
  configureSource(source, style) {
    const targetSource = this.getSource();
    if (source !== targetSource) {
      targetSource.setAttributions(source.getAttributions());
      targetSource.setTileUrlFunction(source.getTileUrlFunction());
      targetSource.setTileLoadFunction(source.getTileLoadFunction());
      targetSource.tileGrid = source.tileGrid;
    }
    if (this.getBackground() === undefined) {
      applyBackground(this, style);
    }
    if (this.setMaxResolutionFromTileGrid_) {
      const tileGrid = targetSource.getTileGrid();
      this.setMaxResolution(tileGrid.getResolution(tileGrid.getMinZoom()));
    }
    targetSource.setState(SourceState.READY);
  }

  /**
   * Handle configuration or loading error.
   * @param {Error} error The error.
   * @protected
   */
  handleError(error) {
    this.dispatchEvent(new ErrorEvent(error));
    const source = this.getSource();
    source.setState(SourceState.ERROR);
  }
}

export default MapboxVectorLayer;
