/**
 * @module ol/layer/WebGLTile
 */
import BaseTileLayer from './BaseTile.js';
import LayerProperty from '../layer/Property.js';
import WebGLTileLayerRenderer, {
  Attributes,
  Uniforms,
} from '../renderer/webgl/TileLayer.js';
import {
  PALETTE_TEXTURE_ARRAY,
  ValueTypes,
  expressionToGlsl,
  getStringNumberEquivalent,
  uniformNameForVariable,
} from '../style/expressions.js';

/**
 * @typedef {import("../source/DataTile.js").default|import("../source/TileImage.js").default} SourceType
 */

/**
 * @typedef {Object} Style
 * Translates tile data to rendered pixels.
 *
 * @property {Object<string, (string|number)>} [variables] Style variables.  Each variable must hold a number or string.  These
 * variables can be used in the `color`, `brightness`, `contrast`, `exposure`, `saturation` and `gamma`
 * {@link import("../style/expressions.js").ExpressionValue expressions}, using the `['var', 'varName']` operator.
 * To update style variables, use the {@link import("./WebGLTile.js").default#updateStyleVariables} method.
 * @property {import("../style/expressions.js").ExpressionValue} [color] An expression applied to color values.
 * @property {import("../style/expressions.js").ExpressionValue} [brightness=0] Value used to decrease or increase
 * the layer brightness.  Values range from -1 to 1.
 * @property {import("../style/expressions.js").ExpressionValue} [contrast=0] Value used to decrease or increase
 * the layer contrast.  Values range from -1 to 1.
 * @property {import("../style/expressions.js").ExpressionValue} [exposure=0] Value used to decrease or increase
 * the layer exposure.  Values range from -1 to 1.
 * @property {import("../style/expressions.js").ExpressionValue} [saturation=0] Value used to decrease or increase
 * the layer saturation.  Values range from -1 to 1.
 * @property {import("../style/expressions.js").ExpressionValue} [gamma=1] Apply a gamma correction to the layer.
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
 * @property {SourceType} [source] Source for this layer.
 * @property {Array<SourceType>|function(import("../extent.js").Extent, number):Array<SourceType>} [sources] Array
 * of sources for this layer. Takes precedence over `source`. Can either be an array of sources, or a function that
 * expects an extent and a resolution (in view projection units per pixel) and returns an array of sources. See
 * {@link module:ol/source.sourcesFromTileGrid} for a helper function to generate sources that are organized in a
 * pyramid following the same pattern as a tile grid. **Note:** All sources must have the same band count and content.
 * @property {import("../Map.js").default} [map] Sets the layer as overlay on a map. The map will not manage
 * this layer in its layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
 * use {@link module:ol/Map~Map#addLayer}.
 * @property {boolean} [useInterimTilesOnError=true] Use interim tiles on error.
 * @property {number} [cacheSize=512] The internal texture cache size.  This needs to be large enough to render
 * two zoom levels worth of tiles.
 */

/**
 * @typedef {Object} ParsedStyle
 * @property {string} vertexShader The vertex shader.
 * @property {string} fragmentShader The fragment shader.
 * @property {Object<string,import("../webgl/Helper.js").UniformValue>} uniforms Uniform definitions.
 * @property {Array<import("../webgl/PaletteTexture.js").default>} paletteTextures Palette textures.
 */

/**
 * @param {Style} style The layer style.
 * @param {number} [bandCount] The number of bands.
 * @return {ParsedStyle} Shaders and uniforms generated from the style.
 */
function parseStyle(style, bandCount) {
  const vertexShader = `
    attribute vec2 ${Attributes.TEXTURE_COORD};
    uniform mat4 ${Uniforms.TILE_TRANSFORM};
    uniform float ${Uniforms.TEXTURE_PIXEL_WIDTH};
    uniform float ${Uniforms.TEXTURE_PIXEL_HEIGHT};
    uniform float ${Uniforms.TEXTURE_RESOLUTION};
    uniform float ${Uniforms.TEXTURE_ORIGIN_X};
    uniform float ${Uniforms.TEXTURE_ORIGIN_Y};
    uniform float ${Uniforms.DEPTH};

    varying vec2 v_textureCoord;
    varying vec2 v_mapCoord;

    void main() {
      v_textureCoord = ${Attributes.TEXTURE_COORD};
      v_mapCoord = vec2(
        ${Uniforms.TEXTURE_ORIGIN_X} + ${Uniforms.TEXTURE_RESOLUTION} * ${Uniforms.TEXTURE_PIXEL_WIDTH} * v_textureCoord[0],
        ${Uniforms.TEXTURE_ORIGIN_Y} - ${Uniforms.TEXTURE_RESOLUTION} * ${Uniforms.TEXTURE_PIXEL_HEIGHT} * v_textureCoord[1]
      );
      gl_Position = ${Uniforms.TILE_TRANSFORM} * vec4(${Attributes.TEXTURE_COORD}, ${Uniforms.DEPTH}, 1.0);
    }
  `;

  /**
   * @type {import("../style/expressions.js").ParsingContext}
   */
  const context = {
    inFragmentShader: true,
    variables: [],
    attributes: [],
    stringLiteralsMap: {},
    functions: {},
    bandCount: bandCount,
  };

  const pipeline = [];

  if (style.color !== undefined) {
    const color = expressionToGlsl(context, style.color, ValueTypes.COLOR);
    pipeline.push(`color = ${color};`);
  }

  if (style.contrast !== undefined) {
    const contrast = expressionToGlsl(
      context,
      style.contrast,
      ValueTypes.NUMBER
    );
    pipeline.push(
      `color.rgb = clamp((${contrast} + 1.0) * color.rgb - (${contrast} / 2.0), vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));`
    );
  }

  if (style.exposure !== undefined) {
    const exposure = expressionToGlsl(
      context,
      style.exposure,
      ValueTypes.NUMBER
    );
    pipeline.push(
      `color.rgb = clamp((${exposure} + 1.0) * color.rgb, vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));`
    );
  }

  if (style.saturation !== undefined) {
    const saturation = expressionToGlsl(
      context,
      style.saturation,
      ValueTypes.NUMBER
    );
    pipeline.push(`
      float saturation = ${saturation} + 1.0;
      float sr = (1.0 - saturation) * 0.2126;
      float sg = (1.0 - saturation) * 0.7152;
      float sb = (1.0 - saturation) * 0.0722;
      mat3 saturationMatrix = mat3(
        sr + saturation, sr, sr,
        sg, sg + saturation, sg,
        sb, sb, sb + saturation
      );
      color.rgb = clamp(saturationMatrix * color.rgb, vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));
    `);
  }

  if (style.gamma !== undefined) {
    const gamma = expressionToGlsl(context, style.gamma, ValueTypes.NUMBER);
    pipeline.push(`color.rgb = pow(color.rgb, vec3(1.0 / ${gamma}));`);
  }

  if (style.brightness !== undefined) {
    const brightness = expressionToGlsl(
      context,
      style.brightness,
      ValueTypes.NUMBER
    );
    pipeline.push(
      `color.rgb = clamp(color.rgb + ${brightness}, vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));`
    );
  }

  /** @type {Object<string,import("../webgl/Helper").UniformValue>} */
  const uniforms = {};

  const numVariables = context.variables.length;
  if (numVariables > 1 && !style.variables) {
    throw new Error(
      `Missing variables in style (expected ${context.variables})`
    );
  }

  for (let i = 0; i < numVariables; ++i) {
    const variableName = context.variables[i];
    if (!(variableName in style.variables)) {
      throw new Error(`Missing '${variableName}' in style variables`);
    }
    const uniformName = uniformNameForVariable(variableName);
    uniforms[uniformName] = function () {
      let value = style.variables[variableName];
      if (typeof value === 'string') {
        value = getStringNumberEquivalent(context, value);
      }
      return value !== undefined ? value : -9999999; // to avoid matching with the first string literal
    };
  }

  const uniformDeclarations = Object.keys(uniforms).map(function (name) {
    return `uniform float ${name};`;
  });

  const textureCount = Math.ceil(bandCount / 4);
  uniformDeclarations.push(
    `uniform sampler2D ${Uniforms.TILE_TEXTURE_ARRAY}[${textureCount}];`
  );

  if (context.paletteTextures) {
    uniformDeclarations.push(
      `uniform sampler2D ${PALETTE_TEXTURE_ARRAY}[${context.paletteTextures.length}];`
    );
  }

  const functionDefintions = Object.keys(context.functions).map(function (
    name
  ) {
    return context.functions[name];
  });

  const fragmentShader = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    varying vec2 v_textureCoord;
    varying vec2 v_mapCoord;
    uniform vec4 ${Uniforms.RENDER_EXTENT};
    uniform float ${Uniforms.TRANSITION_ALPHA};
    uniform float ${Uniforms.TEXTURE_PIXEL_WIDTH};
    uniform float ${Uniforms.TEXTURE_PIXEL_HEIGHT};
    uniform float ${Uniforms.RESOLUTION};
    uniform float ${Uniforms.ZOOM};

    ${uniformDeclarations.join('\n')}

    ${functionDefintions.join('\n')}

    void main() {
      if (
        v_mapCoord[0] < ${Uniforms.RENDER_EXTENT}[0] ||
        v_mapCoord[1] < ${Uniforms.RENDER_EXTENT}[1] ||
        v_mapCoord[0] > ${Uniforms.RENDER_EXTENT}[2] ||
        v_mapCoord[1] > ${Uniforms.RENDER_EXTENT}[3]
      ) {
        discard;
      }

      vec4 color = texture2D(${
        Uniforms.TILE_TEXTURE_ARRAY
      }[0],  v_textureCoord);

      ${pipeline.join('\n')}

      if (color.a == 0.0) {
        discard;
      }

      gl_FragColor = color;
      gl_FragColor.rgb *= gl_FragColor.a;
      gl_FragColor *= ${Uniforms.TRANSITION_ALPHA};
    }`;

  return {
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
    paletteTextures: context.paletteTextures,
  };
}

/**
 * @classdesc
 * For layer sources that provide pre-rendered, tiled images in grids that are
 * organized by zoom levels for specific resolutions.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @extends BaseTileLayer<SourceType, WebGLTileLayerRenderer>
 * @fires import("../render/Event.js").RenderEvent
 * @api
 */
class WebGLTileLayer extends BaseTileLayer {
  /**
   * @param {Options} options Tile layer options.
   */
  constructor(options) {
    options = options ? Object.assign({}, options) : {};

    const style = options.style || {};
    delete options.style;

    const cacheSize = options.cacheSize;
    delete options.cacheSize;

    super(options);

    /**
     * @type {Array<SourceType>|function(import("../extent.js").Extent, number):Array<SourceType>}
     * @private
     */
    this.sources_ = options.sources;

    /**
     * @type {SourceType|null}
     * @private
     */
    this.renderedSource_ = null;

    /**
     * @type {number}
     * @private
     */
    this.renderedResolution_ = NaN;

    /**
     * @type {Style}
     * @private
     */
    this.style_ = style;

    /**
     * @type {number}
     * @private
     */
    this.cacheSize_ = cacheSize;

    /**
     * @type {Object<string, (string|number)>}
     * @private
     */
    this.styleVariables_ = this.style_.variables || {};

    this.addChangeListener(LayerProperty.SOURCE, this.handleSourceUpdate_);
  }

  /**
   * Gets the sources for this layer, for a given extent and resolution.
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @return {Array<SourceType>} Sources.
   */
  getSources(extent, resolution) {
    const source = this.getSource();
    return this.sources_
      ? typeof this.sources_ === 'function'
        ? this.sources_(extent, resolution)
        : this.sources_
      : source
      ? [source]
      : [];
  }

  /**
   * @return {SourceType} The source being rendered.
   */
  getRenderSource() {
    return this.renderedSource_ || this.getSource();
  }

  /**
   * @return {import("../source/Source.js").State} Source state.
   */
  getSourceState() {
    const source = this.getRenderSource();
    return source ? source.getState() : 'undefined';
  }

  /**
   * @private
   */
  handleSourceUpdate_() {
    if (this.getSource()) {
      this.setStyle(this.style_);
    }
  }

  /**
   * @private
   * @return {number} The number of source bands.
   */
  getSourceBandCount_() {
    const max = Number.MAX_SAFE_INTEGER;
    const sources = this.getSources([-max, -max, max, max], max);
    return sources && sources.length && 'bandCount' in sources[0]
      ? sources[0].bandCount
      : 4;
  }

  createRenderer() {
    const parsedStyle = parseStyle(this.style_, this.getSourceBandCount_());

    return new WebGLTileLayerRenderer(this, {
      vertexShader: parsedStyle.vertexShader,
      fragmentShader: parsedStyle.fragmentShader,
      uniforms: parsedStyle.uniforms,
      cacheSize: this.cacheSize_,
      paletteTextures: parsedStyle.paletteTextures,
    });
  }

  /**
   * @param {import("../Map").FrameState} frameState Frame state.
   * @param {Array<SourceType>} sources Sources.
   * @return {HTMLElement} Canvas.
   */
  renderSources(frameState, sources) {
    const layerRenderer = this.getRenderer();
    let canvas;
    for (let i = 0, ii = sources.length; i < ii; ++i) {
      this.renderedSource_ = sources[i];
      if (layerRenderer.prepareFrame(frameState)) {
        canvas = layerRenderer.renderFrame(frameState);
      }
    }
    return canvas;
  }

  /**
   * @param {?import("../Map.js").FrameState} frameState Frame state.
   * @param {HTMLElement} target Target which the renderer may (but need not) use
   * for rendering its content.
   * @return {HTMLElement} The rendered element.
   */
  render(frameState, target) {
    this.rendered = true;
    const viewState = frameState.viewState;
    const sources = this.getSources(frameState.extent, viewState.resolution);
    let ready = true;
    for (let i = 0, ii = sources.length; i < ii; ++i) {
      const source = sources[i];
      const sourceState = source.getState();
      if (sourceState == 'loading') {
        const onChange = () => {
          if (source.getState() == 'ready') {
            source.removeEventListener('change', onChange);
            this.changed();
          }
        };
        source.addEventListener('change', onChange);
      }
      ready = ready && sourceState == 'ready';
    }
    const canvas = this.renderSources(frameState, sources);
    if (this.getRenderer().renderComplete && ready) {
      // Fully rendered, done.
      this.renderedResolution_ = viewState.resolution;
      return canvas;
    }
    // Render sources from previously fully rendered frames
    if (this.renderedResolution_ > 0.5 * viewState.resolution) {
      const altSources = this.getSources(
        frameState.extent,
        this.renderedResolution_
      ).filter((source) => !sources.includes(source));
      if (altSources.length > 0) {
        return this.renderSources(frameState, altSources);
      }
    }
    return canvas;
  }

  /**
   * Update the layer style.  The `updateStyleVariables` function is a more efficient
   * way to update layer rendering.  In cases where the whole style needs to be updated,
   * this method may be called instead.  Note that calling this method will also replace
   * any previously set variables, so the new style also needs to include new variables,
   * if needed.
   * @param {Style} style The new style.
   */
  setStyle(style) {
    this.styleVariables_ = style.variables || {};
    this.style_ = style;
    const parsedStyle = parseStyle(this.style_, this.getSourceBandCount_());
    const renderer = this.getRenderer();
    renderer.reset({
      vertexShader: parsedStyle.vertexShader,
      fragmentShader: parsedStyle.fragmentShader,
      uniforms: parsedStyle.uniforms,
      paletteTextures: parsedStyle.paletteTextures,
    });
    this.changed();
  }

  /**
   * Update any variables used by the layer style and trigger a re-render.
   * @param {Object<string, number>} variables Variables to update.
   * @api
   */
  updateStyleVariables(variables) {
    Object.assign(this.styleVariables_, variables);
    this.changed();
  }
}

/**
 * Clean up underlying WebGL resources.
 * @function
 * @api
 */
WebGLTileLayer.prototype.dispose;

export default WebGLTileLayer;
