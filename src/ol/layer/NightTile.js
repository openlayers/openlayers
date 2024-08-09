/**
 * @module ol/layer/NightTile
 */
import WebGLNightTileLayerRenderer, {
  Uniforms,
} from '../renderer/webgl/NightTileLayer.js';
import WebGLTileLayer from '../layer/WebGLTile.js';

import ColorTile from '../source/ColorTile.js';

/**
 * @typedef {import("../source/DataTile.js").default} SourceType
 */

/**
 * @typedef {Object} Style
 * Translates tile data to rendered pixels.
 *
 * @property {Object<string, (string|number)>} [variables] Style variables.  Each variable must hold a number or string.  These
 * variables can be used in the `color`, `brightness`, `contrast`, `exposure`, `saturation` and `gamma`
 * {@link import("../expr/expression.js").ExpressionValue expressions}, using the `['var', 'varName']` operator.
 * To update style variables, use the {@link import("./WebGLTile.js").default#updateStyleVariables} method.
 * @property {import("../expr/expression.js").ExpressionValue} [color] An expression applied to color values.
 * @property {import("../expr/expression.js").ExpressionValue} [brightness=0] Value used to decrease or increase
 * the layer brightness.  Values range from -1 to 1.
 * @property {import("../expr/expression.js").ExpressionValue} [contrast=0] Value used to decrease or increase
 * the layer contrast.  Values range from -1 to 1.
 * @property {import("../expr/expression.js").ExpressionValue} [exposure=0] Value used to decrease or increase
 * the layer exposure.  Values range from -1 to 1.
 * @property {import("../expr/expression.js").ExpressionValue} [saturation=0] Value used to decrease or increase
 * the layer saturation.  Values range from -1 to 1.
 * @property {import("../expr/expression.js").ExpressionValue} [gamma=1] Apply a gamma correction to the layer.
 * Values range from 0 to infinity.
 */

/**
 * @typedef {Object} Options
 * @property {Style} [style] Style to apply to the layer.
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
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {number} [preload=0] Preload. Load low-resolution tiles up to `preload` levels. `0`
 * means no preloading.
 * @property {SourceType|string|null} [source] Tile source or color for a night shadow.
 * @property {Array<SourceType>|function(import("../extent.js").Extent, number):Array<SourceType>} [sources] Array
 * of sources for this layer. Takes precedence over `source`. Can either be an array of sources, or a function that
 * expects an extent and a resolution (in view projection units per pixel) and returns an array of sources. See
 * {@link module:ol/source.sourcesFromTileGrid} for a helper function to generate sources that are organized in a
 * pyramid following the same pattern as a tile grid. **Note:** All sources must have the same band count and content.
 * @property {import("../Map.js").default} [map] Sets the layer as overlay on a map. The map will not manage
 * this layer in its layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
 * use {@link module:ol/Map~Map#addLayer}.
 * @property {boolean} [useInterimTilesOnError=true] Deprecated.  Use interim tiles on error.
 * @property {number} [cacheSize=512] The internal texture cache size.  This needs to be large enough to render
 * two zoom levels worth of tiles.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 * @property {number} [twilightSteps=0] Number of Twilight steps. 0 means gradation.
 * @property {number} [updateInterval=5] Automatic layer update interval in seconds.
 * @property {Date|number} [date] Date.
 * @property {import("../size.js").Size} [coordinateTileSize=[256,256]] Tile size for underlying CoordinateTileSource.
 */

/**
 * @typedef {Object} ParsedStyle
 * @property {Array<string>} uniformDeclarations Uniform declarations
 * @property {Array<string>} functionDefintions Function definitions
 * @property {Array<string>} pipeline pipelines
 * @property {Object<string,import("../webgl/Helper.js").UniformValue>} uniforms Uniform definitions.
 * @property {Array<import("../webgl/PaletteTexture.js").default>} paletteTextures Palette textures.
 */
/**
 * @typedef {Object} Shader
 * @property {string} vertexShader The vertex shader.
 * @property {string} fragmentShader The fragment shader.
 */
/**
 * @classdesc
 * For layer sources that provide pre-rendered, tiled images in grids that are
 * organized by zoom levels for specific resolutions, as usual. but it only renders
 * night shadow area on the Earth.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @extends {WebGLTileLayer}
 * @fires import("../render/Event.js").RenderEvent
 * @api
 */
class WebGLNightTileLayer extends WebGLTileLayer {
  /**
   * @param {Options} [options] Tile layer options.
   */
  constructor(options) {
    options = options ? Object.assign({}, options) : {};

    options.updateInterval = options.updateInterval ?? 5;

    super({
      ...options,
      source: null,
    });

    this.twilightSteps_ = options.twilightSteps ?? 0;
    this.coordinateTileSize_ = options.coordinateTileSize;

    this.date_ = options.date;

    this.setSource(options.source);

    if (options.updateInterval) {
      this.timer_ = setInterval(
        () => !this.date_ && this.changed(),
        options.updateInterval * 1000,
      );
    }
  }

  /**
   * @override
   * @param {string|SourceType|null|undefined} source Tile source or color for a night shadow.
   */
  setSource(source) {
    if (typeof source === 'string' || source === undefined) {
      source = new ColorTile({
        color: /** @type {string|undefined} */ (source) || 'black',
      });
    }
    super.setSource(source);
  }

  /**
   * @override
   * @return {number} The number of source bands.
   */
  getSourceBandCount() {
    const bandCount = super.getSourceBandCount();
    return bandCount + 2; // XXX:
  }

  /**
   * @override
   * @return {ParsedStyle} Shaders and uniforms generated from the style.
   */
  parseStyle() {
    const parsed = super.parseStyle();

    parsed.pipeline.push(`
      vec4 observer = radians(texture2D(${Uniforms.TILE_TEXTURE_ARRAY}[1], v_textureCoord));
      vec2 subsolar = radians(${Uniforms.SUBSOLAR_POSITION});

      float A = sin(observer.w) * sin(subsolar.y);
      float B = cos(observer.w) * cos(subsolar.y) * cos(subsolar.x - observer.z);
      float altitude = degrees(asin(A + B));

      const float twilightStep = 6.;
      float twilightSteps = ${Uniforms.TWILIGHT_STEPS};

      // Attenuation for each twilightStep
      const float att = 0.5;

      float twilightLevel = -altitude / twilightStep;

      if (twilightSteps > 0.) {
        twilightLevel = ceil(clamp(twilightLevel, 0., twilightSteps));
      }

      float brightness = clamp(pow(att, twilightLevel), 0., 1.);
      color.a *= (1. - brightness);
    `);

    parsed.uniformDeclarations.push(`
      uniform vec2 ${Uniforms.SUBSOLAR_POSITION};
      uniform float ${Uniforms.TWILIGHT_STEPS};
    `);

    return parsed;
  }

  /**
   * @override
   */
  createRenderer() {
    const parsedStyle = this.parseStyle();
    const shader = this.buildShaders(parsedStyle);

    return new WebGLNightTileLayerRenderer(this, {
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,

      cacheSize: this.getCacheSize(),
      uniforms: parsedStyle.uniforms,
      paletteTextures: parsedStyle.paletteTextures,

      date: this.date_,
      twilightSteps: this.twilightSteps_,
      coordinateTileSize: this.coordinateTileSize_,
    });
  }

  /**
   * Set Date
   * @param {Date|number|undefined} date Date. `undefined` sets realtime.
   * @api
   */
  setDate(date) {
    this.date_ = date ? new Date(date).getTime() : undefined;
    const renderer = this.getRenderer();
    if (renderer) {
      renderer.setDate(this.date_);
      this.changed();
    }
  }

  /**
   * Get Date
   * @return {Date|undefined} Date. `undefined` means realtime.
   * @api
   */
  getDate() {
    return this.date_ ? new Date(this.date_) : undefined;
  }

  /**
   * Set Twilight steps
   * @param {number} steps Twilight steps
   * @api
   */
  setTwilightSteps(steps) {
    this.twilightSteps_ = steps;
    const renderer = this.getRenderer();
    if (renderer) {
      renderer.setTwilightSteps(this.twilightSteps_);
      this.changed();
    }
  }

  /**
   * Get Twilight steps
   * @return {number} Twilight steps
   * @api
   */
  getTwilightSteps() {
    return this.twilightSteps_;
  }

  /**
   * @override
   */
  disposeInternal() {
    super.disposeInternal();
    if (this.timer_) {
      clearInterval(this.timer_);
    }
  }
}

/**
 * Clean up underlying WebGL resources.
 * @function
 * @api
 */
WebGLNightTileLayer.prototype.dispose;

export default WebGLNightTileLayer;
