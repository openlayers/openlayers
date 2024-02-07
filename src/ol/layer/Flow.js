/**
 * @module ol/layer/Flow
 */
import BaseTileLayer from './BaseTile.js';
import FlowLayerRenderer, {A, U, V} from '../renderer/webgl/FlowLayer.js';
import LayerProperty from './Property.js';
import {
  ValueTypes,
  expressionToGlsl,
  getStringNumberEquivalent,
  uniformNameForVariable,
} from '../style/expressions.js';

/**
 * TODO:
 *  - deal with blending
 *  - options (max speed etc.)
 */

/**
 * @typedef {import("../source/DataTile.js").default} SourceType
 */

/**
 * @typedef {Object} Style
 * Translates tile data to rendered pixels.
 *
 * @property {Object<string, (string|number)>} [variables] Style variables.  Each variable must hold a number or string.  These
 * variables can be used in the `color` {@link import("../style/expressions.js").ExpressionValue expression} using
 * the `['var', 'varName']` operator.  To update style variables, use the {@link import("./WebGLTile.js").default#updateStyleVariables} method.
 * @property {import("../style/expressions.js").ExpressionValue} [color] An expression applied to color values.
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
 * @property {import("../Map.js").default} [map] Sets the layer as overlay on a map. The map will not manage
 * this layer in its layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
 * use {@link module:ol/Map~Map#addLayer}.
 * @property {boolean} [useInterimTilesOnError=true] Use interim tiles on error.
 * @property {number} [cacheSize=512] The internal texture cache size.  This needs to be large enough to render
 * two zoom levels worth of tiles.
 */

const tileVertexShader = `
  attribute vec2 a_textureCoord;
  uniform mat4 u_tileTransform;
  uniform float u_texturePixelWidth;
  uniform float u_texturePixelHeight;
  uniform float u_textureResolution;
  uniform float u_textureOriginX;
  uniform float u_textureOriginY;
  uniform float u_depth;

  varying vec2 v_textureCoord;
  varying vec2 v_mapCoord;

  void main() {
    v_textureCoord = a_textureCoord;
    v_mapCoord = vec2(
      u_textureOriginX + u_textureResolution * u_texturePixelWidth * v_textureCoord[0],
      u_textureOriginY - u_textureResolution * u_texturePixelHeight * v_textureCoord[1]
    );
    gl_Position = u_tileTransform * vec4(a_textureCoord, u_depth, 1.0);
  }
`;

const tileFragmentShader = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  varying vec2 v_textureCoord;
  varying vec2 v_mapCoord;
  uniform vec4 u_renderExtent;
  uniform float u_transitionAlpha;
  uniform float u_texturePixelWidth;
  uniform float u_texturePixelHeight;
  uniform float u_resolution;
  uniform float u_zoom;
  uniform bool ${U.IS_FLOAT};
  uniform float ${U.GAIN};
  uniform float ${U.OFFSET};

  uniform sampler2D u_tileTextures[1];

  void main() {
    if (
      v_mapCoord[0] < u_renderExtent[0] ||
      v_mapCoord[1] < u_renderExtent[1] ||
      v_mapCoord[0] > u_renderExtent[2] ||
      v_mapCoord[1] > u_renderExtent[3]
    ) {
      discard;
    }

    vec4 color = texture2D(u_tileTextures[0],  v_textureCoord);
    if (!${U.IS_FLOAT}) {
      color.rg = color.rg *= 255.0;
    }

    color.rg = color.rg * ${U.GAIN} + ${U.OFFSET};

    gl_FragColor = color;
  }
`;

/**
 * Sets up a varying position for rendering textures.
 */
const quadVertexShader = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  attribute vec2 ${A.POSITION};

  varying vec2 ${V.POSITION};

  void main() {
    ${V.POSITION} = ${A.POSITION};
    gl_Position = vec4(1.0 - 2.0 * ${A.POSITION}, 0, 1);
  }
`;

/**
 * Sampes a texture and renders it with a new opacity.
 */
const textureFragmentShader = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  uniform sampler2D ${U.TEXTURE};
  uniform float ${U.OPACITY};

  varying vec2 ${V.POSITION};

  void main() {
    vec4 color = texture2D(${U.TEXTURE}, 1.0 - ${V.POSITION});
    gl_FragColor = vec4(floor(255.0 * color * ${U.OPACITY}) / 255.0);
  }
`;

/**
 * Samples current particle positions, determines new positions based on velocity, and
 * encodes the new position as a color.
 */
const particlePositionFragmentShader = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  uniform sampler2D ${U.POSITION_TEXTURE};
  uniform sampler2D ${U.VELOCITY_TEXTURE};
  uniform float ${U.MAX_SPEED};
  uniform float ${U.RANDOM_SEED};
  uniform float ${U.SPEED_FACTOR};
  uniform float ${U.DROP_RATE};
  uniform float ${U.DROP_RATE_BUMP};
  uniform vec2 ${U.ROTATION};
  uniform vec2 ${U.VIEWPORT_SIZE_PX};

  varying vec2 ${V.POSITION};

  // pseudo-random generator
  const vec3 randConstants = vec3(12.9898, 78.233, 4375.85453);

  float rand(const vec2 co) {
    float t = dot(randConstants.xy, co);
    return fract(sin(t) * (randConstants.z + t));
  }

  void main() {
    vec4 positionColor = texture2D(${U.POSITION_TEXTURE}, ${V.POSITION});

    // decode particle position from pixel RGBA
    vec2 particlePosition = vec2(
      positionColor.r / 255.0 + positionColor.b,
      positionColor.g / 255.0 + positionColor.a
    );

    vec4 velocityColor = texture2D(${U.VELOCITY_TEXTURE}, particlePosition);
    if (velocityColor.a == 0.0) {
      discard;
    }

    float vx = mix(-${U.MAX_SPEED}, ${U.MAX_SPEED}, velocityColor.r);
    float vy = mix(-${U.MAX_SPEED}, ${U.MAX_SPEED}, velocityColor.g);

    vec2 velocity = vec2(
      vx * ${U.ROTATION}.x - vy * ${U.ROTATION}.y,
      vx * ${U.ROTATION}.y + vy * ${U.ROTATION}.x
    );

    float speed = length(velocity) / ${U.MAX_SPEED};

    // account for aspect ratio (square particle position texture, non-square map)
    float aspectRatio = ${U.VIEWPORT_SIZE_PX}.x / ${U.VIEWPORT_SIZE_PX}.y;
    vec2 offset = vec2(velocity.x / aspectRatio, velocity.y) * 0.0001 * ${U.SPEED_FACTOR};

    // update particle position, wrapping around the edge
    particlePosition = fract(1.0 + particlePosition + offset);

    // a random seed to use for the particle drop
    vec2 seed = (particlePosition + ${V.POSITION}) * ${U.RANDOM_SEED};

    // drop rate is a chance a particle will restart at random position, to avoid degeneration
    float dropRate = ${U.DROP_RATE} + speed * ${U.DROP_RATE_BUMP};
    float drop = step(1.0 - dropRate, rand(seed));

    vec2 randomPosition = vec2(rand(seed + 1.3), rand(seed + 2.1));
    particlePosition = mix(particlePosition, randomPosition, drop);

    // encode the new particle position back into RGBA
    gl_FragColor = vec4(
      fract(particlePosition * 255.0),
      floor(particlePosition * 255.0) / 255.0
    );
  }
`;

/**
 * Samples the particle position texture to decode the particle position
 * based on pixel color.
 */
const particleColorVertexShader = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  attribute float ${A.INDEX};

  uniform sampler2D ${U.POSITION_TEXTURE};
  uniform float ${U.PARTICLE_COUNT_SQRT};

  varying vec2 ${V.POSITION};

  void main() {
    vec4 color = texture2D(
      ${U.POSITION_TEXTURE},
      vec2(
        fract(${A.INDEX} / ${U.PARTICLE_COUNT_SQRT}),
        floor(${A.INDEX} / ${U.PARTICLE_COUNT_SQRT}) / ${U.PARTICLE_COUNT_SQRT}
      )
    );

    ${V.POSITION} = vec2(
      color.r / 255.0 + color.b,
      color.g / 255.0 + color.a
    );

    gl_PointSize = 1.0;
    gl_Position = vec4(
      2.0 * ${V.POSITION}.x - 1.0,
      2.0 * ${V.POSITION}.y - 1.0,
      0,
      1
    );
  }
`;

/**
 * @typedef {Object} ParsedStyle
 * @property {string} tileVertexShader The flow tile vertex shader.
 * @property {string} tileFragmentShader The flow tile fragment shader.
 * @property {string} textureVertexShader Generic texture fragment shader.
 * @property {string} textureFragmentShader Generic texture fragment shader.
 * @property {string} particlePositionVertexShader The particle position vertex shader.
 * @property {string} particlePositionFragmentShader The particle position fragment shader.
 * @property {string} particleColorVertexShader The particle color vertex shader.
 * @property {string} particleColorFragmentShader The particle color fragment shader.
 */

/**
 * @param {Style} style The layer style.
 * @return {ParsedStyle} Shaders and uniforms generated from the style.
 */
function parseStyle(style) {
  /**
   * @type {import("../style/expressions.js").ParsingContext}
   */
  const context = {
    inFragmentShader: true,
    variables: [],
    attributes: [],
    functions: {},
    style,
  };

  const pipeline = [];

  if (style.color !== undefined) {
    const color = expressionToGlsl(context, style.color, ValueTypes.COLOR);
    pipeline.push(`color = ${color};`);
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
    const variableName = context.variables[i].name;
    if (!(variableName in style.variables)) {
      throw new Error(`Missing '${variableName}' in style variables`);
    }

    const uniformName = uniformNameForVariable(variableName);
    uniforms[uniformName] = function () {
      let value = style.variables[variableName];
      if (typeof value === 'string') {
        value = getStringNumberEquivalent(value);
      }
      return value !== undefined ? value : -9999999; // to avoid matching with the first string literal
    };
  }

  const uniformDeclarations = Object.keys(uniforms).map(function (name) {
    return `uniform float ${name};`;
  });

  const functionDefintions = Object.keys(context.functions).map(function (
    name
  ) {
    return context.functions[name];
  });

  const particleColorFragmentShader = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    uniform sampler2D ${U.VELOCITY_TEXTURE};
    uniform float ${U.MAX_SPEED};
    uniform vec2 ${U.ROTATION};

    ${uniformDeclarations.join('\n')}

    varying vec2 ${V.POSITION};
    
    ${functionDefintions.join('\n')}

    void main() {
      vec4 velocityColor = texture2D(${U.VELOCITY_TEXTURE}, ${V.POSITION});

      float vx = mix(-${U.MAX_SPEED}, ${U.MAX_SPEED}, velocityColor.r);
      float vy = mix(-${U.MAX_SPEED}, ${U.MAX_SPEED}, velocityColor.g);

      vec2 velocity = vec2(
        vx * ${U.ROTATION}.x - vy * ${U.ROTATION}.y,
        vx * ${U.ROTATION}.y + vy * ${U.ROTATION}.x
      );

      // prefix must match expectations for 'get' variables in ol/style/expressions.js
      float v_speed = length(velocity) / ${U.MAX_SPEED};

      vec4 color;

      ${pipeline.join('\n')}

      if (color.a == 0.0) {
        discard;
      }

      gl_FragColor = color;
    }
  `;

  return {
    tileVertexShader,
    tileFragmentShader,
    particleColorVertexShader,
    particleColorFragmentShader,
    particlePositionVertexShader: quadVertexShader,
    particlePositionFragmentShader,
    textureVertexShader: quadVertexShader,
    textureFragmentShader,
  };
}

/**
 * @type {Array<SourceType>}
 */
const sources = [];

/**
 * @classdesc
 * Renders vector fields.
 *
 * @extends BaseTileLayer<SourceType, FlowLayerRenderer>
 * @fires import("../render/Event.js").RenderEvent
 * @api
 */
class FlowLayer extends BaseTileLayer {
  /**
   * @param {Options} options Tile layer options.
   */
  constructor(options) {
    options = options ? Object.assign({}, options) : {};

    const cacheSize = options.cacheSize;
    delete options.cacheSize;

    super(options);

    /**
     * @type {Style}
     * @private
     */
    this.style_ = options.style || {};

    /**
     * @type {Object<string, (string|number)>}
     * @private
     */
    this.styleVariables_ = this.style_.variables || {};

    /**
     * @type {number}
     * @private
     */
    this.cacheSize_ = cacheSize;

    this.addChangeListener(LayerProperty.SOURCE, this.handleSourceUpdate_);
  }

  /**
   * @private
   */
  handleSourceUpdate_() {
    if (this.hasRenderer()) {
      this.getRenderer().clearCache();
    }
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

  /**
   * Gets the sources for this layer, for a given extent and resolution.
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @return {Array<SourceType>} Sources.
   */
  getSources(extent, resolution) {
    const source = this.getSource();
    sources[0] = source;
    return sources;
  }

  createRenderer() {
    const parsedStyle = parseStyle(this.style_);

    return new FlowLayerRenderer(this, {
      ...parsedStyle,
      cacheSize: this.cacheSize_,
      // TODO: options for this
      gain: 1 / 255,
      offset: 0,
    });
  }
}

/**
 * Clean up underlying WebGL resources.
 * @function
 * @api
 */
FlowLayer.prototype.dispose;

export default FlowLayer;
