/**
 * @module ol/layer/Flow
 */
import BaseTileLayer from './BaseTile.js';
import FlowLayerRenderer, {A, U, V} from '../renderer/webgl/FlowLayer.js';
import LayerProperty from './Property.js';
import {Attributes as BA, Uniforms as BU} from '../renderer/webgl/TileLayer.js';
import {ColorType} from '../expr/expression.js';
import {expressionToGlsl} from '../webgl/styleparser.js';
import {
  getStringNumberEquivalent,
  newCompilationContext,
  uniformNameForVariable,
} from '../expr/gpu.js';

/**
 * @typedef {import("../source/DataTile.js").default} SourceType
 */

/**
 * @typedef {Object} Style
 * Translates tile data to rendered pixels.
 *
 * @property {Object<string, (string|number)>} [variables] Style variables.  Each variable must hold a number or string.  These
 * variables can be used in the `color` {@link import("../expr/expression.js").ExpressionValue expression} using
 * the `['var', 'varName']` operator.  To update style variables, use the {@link import("./WebGLTile.js").default#updateStyleVariables} method.
 * @property {import("../expr/expression.js").ExpressionValue} [color] An expression applied to color values.
 */

/**
 * @typedef {Object} Options
 * @property {number} maxSpeed The maximum particle speed.
 * @property {number} [speedFactor=0.001] A larger factor increases the rate at which particles cross the screen.
 * @property {number} [particles=65536] The number of particles to render.
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
  attribute vec2 ${BA.TEXTURE_COORD};
  uniform mat4 ${BU.TILE_TRANSFORM};
  uniform float ${BU.TEXTURE_PIXEL_WIDTH};
  uniform float ${BU.TEXTURE_PIXEL_HEIGHT};
  uniform float ${BU.TEXTURE_RESOLUTION};
  uniform float ${BU.TEXTURE_ORIGIN_X};
  uniform float ${BU.TEXTURE_ORIGIN_Y};
  uniform float ${BU.DEPTH};

  varying vec2 v_textureCoord;
  varying vec2 v_mapCoord;

  void main() {
    v_textureCoord = ${BA.TEXTURE_COORD};
    v_mapCoord = vec2(
      ${BU.TEXTURE_ORIGIN_X} + ${BU.TEXTURE_RESOLUTION} * ${BU.TEXTURE_PIXEL_WIDTH} * v_textureCoord[0],
      ${BU.TEXTURE_ORIGIN_Y} - ${BU.TEXTURE_RESOLUTION} * ${BU.TEXTURE_PIXEL_HEIGHT} * v_textureCoord[1]
    );
    gl_Position = ${BU.TILE_TRANSFORM} * vec4(${BA.TEXTURE_COORD}, ${BU.DEPTH}, 1.0);
  }
`;

const tileFragmentShader = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  uniform vec4 ${BU.RENDER_EXTENT};
  uniform float ${U.MAX_SPEED};
  uniform sampler2D ${BU.TILE_TEXTURE_ARRAY}[1];

  varying vec2 v_textureCoord;
  varying vec2 v_mapCoord;

  void main() {
    if (
      v_mapCoord[0] < ${BU.RENDER_EXTENT}[0] ||
      v_mapCoord[1] < ${BU.RENDER_EXTENT}[1] ||
      v_mapCoord[0] > ${BU.RENDER_EXTENT}[2] ||
      v_mapCoord[1] > ${BU.RENDER_EXTENT}[3]
    ) {
      discard;
    }

    vec4 velocity = texture2D(${BU.TILE_TEXTURE_ARRAY}[0],  v_textureCoord);
    gl_FragColor = vec4((velocity.xy + ${U.MAX_SPEED}) / (2.0 * ${U.MAX_SPEED}), 0, 1);
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

    float vx = 2.0 * velocityColor.r - 1.0;
    float vy = 2.0 * velocityColor.g - 1.0;

    // normalized veloicty (magnitude 0 - 1)
    vec2 velocity = vec2(
      vx * ${U.ROTATION}.x - vy * ${U.ROTATION}.y,
      vx * ${U.ROTATION}.y + vy * ${U.ROTATION}.x
    );

    // account for aspect ratio (square particle position texture, non-square map)
    float aspectRatio = ${U.VIEWPORT_SIZE_PX}.x / ${U.VIEWPORT_SIZE_PX}.y;
    vec2 offset = vec2(velocity.x / aspectRatio, velocity.y) * ${U.SPEED_FACTOR};

    // update particle position, wrapping around the edge
    particlePosition = fract(1.0 + particlePosition + offset);

    // a random seed to use for the particle drop
    vec2 seed = (particlePosition + ${V.POSITION}) * ${U.RANDOM_SEED};

    // drop rate is a chance a particle will restart at random position, to avoid degeneration
    float dropRate = ${U.DROP_RATE} + length(velocity) * ${U.DROP_RATE_BUMP};
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
  const context = newCompilationContext();
  context.inFragmentShader = true;
  const pipeline = [];

  if (style.color !== undefined) {
    const color = expressionToGlsl(context, style.color, ColorType);
    pipeline.push(`color = ${color};`);
  }

  const variableNames = Object.keys(context.variables);
  if (variableNames.length > 1 && !style.variables) {
    throw new Error(
      `Missing variables in style (expected ${context.variables})`,
    );
  }

  /** @type {Object<string,import("../webgl/Helper").UniformValue>} */
  const uniforms = {};

  for (const variableName of variableNames) {
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

  const functionDefintions = Object.keys(context.functions).map(
    function (name) {
      return context.functions[name];
    },
  );

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

      float v_prop_speed = length(velocity);

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
 * Experimental layer that renders particles moving through a vector field.
 *
 * @extends BaseTileLayer<SourceType, FlowLayerRenderer>
 * @fires import("../render/Event.js").RenderEvent
 */
class FlowLayer extends BaseTileLayer {
  /**
   * @param {Options} options Flow layer options.
   */
  constructor(options) {
    const baseOptions = Object.assign({}, options);
    delete baseOptions.maxSpeed;
    delete baseOptions.speedFactor;
    delete baseOptions.particles;
    super(baseOptions);

    /**
     * @type {Style}
     * @private
     */
    this.style_ = options.style || {};

    if (!(options.maxSpeed > 0)) {
      throw new Error('maxSpeed is required');
    }
    /**
     * @type {number}
     * @private
     */
    this.maxSpeed_ = options.maxSpeed;

    /**
     * @type {number}
     * @private
     */
    this.speedFactor_ = options.speedFactor;

    /**
     * @type {number}
     * @private
     */
    this.particles_ = options.particles;

    /**
     * @type {Object<string, (string|number)>}
     * @private
     */
    this.styleVariables_ = this.style_.variables || {};

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

  /**
   * @override
   */
  createRenderer() {
    const parsedStyle = parseStyle(this.style_);

    return new FlowLayerRenderer(this, {
      ...parsedStyle,
      cacheSize: this.getCacheSize(),
      maxSpeed: this.maxSpeed_,
      speedFactor: this.speedFactor_,
      particles: this.particles_,
    });
  }
}

/**
 * Clean up underlying WebGL resources.
 * @function
 */
FlowLayer.prototype.dispose;

export default FlowLayer;
