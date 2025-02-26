/**
 * @module ol/layer/Heatmap
 */
import {createCanvasContext2D} from '../dom.js';
import {BooleanType, NumberType} from '../expr/expression.js';
import {newCompilationContext} from '../expr/gpu.js';
import {clamp} from '../math.js';
import {ShaderBuilder} from '../render/webgl/ShaderBuilder.js';
import {
  applyContextToBuilder,
  expressionToGlsl,
  generateAttributesFromContext,
  generateUniformsFromContext,
} from '../render/webgl/compileUtil.js';
import WebGLVectorLayerRenderer from '../renderer/webgl/VectorLayer.js';
import BaseVector from './BaseVector.js';

/**
 * @typedef {import("../style/flat.js").NumberExpression|string|function(import("../Feature.js").default):number} WeightExpression
 */

/**
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../Feature.js").default]
 * @template {import("../source/Vector.js").default<FeatureType>} [VectorSourceType=import("../source/Vector.js").default<FeatureType>]
 * @typedef {Object} Options
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
 * @property {Array<string>} [gradient=['#00f', '#0ff', '#0f0', '#ff0', '#f00']] The color gradient
 * of the heatmap, specified as an array of CSS color strings.
 * @property {import("../style/flat.js").NumberExpression} [radius=8] Radius size in pixels. Note that for LineStrings,
 * the width of the line will be double the radius.
 * @property {import("../style/flat.js").NumberExpression} [blur=15] Blur size in pixels. This is added to the `radius`
 * parameter above to create the final size of the blur effect.
 * @property {WeightExpression} [weight='weight'] The feature
 * attribute to use for the weight. This also supports expressions returning a number or a function that returns a weight from a feature. Weight values
 * should range from 0 to 1 (and values outside will be clamped to that range).
 * @property {import("../style/flat.js").BooleanExpression} [filter] Optional filter expression.
 * @property {Object<string, number|Array<number>|string|boolean>} [variables] Variables used in expressions (optional)
 * @property {VectorSourceType} [source] Point source.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */

/**
 * @enum {string}
 * @private
 */
const Property = {
  BLUR: 'blur',
  GRADIENT: 'gradient',
  RADIUS: 'radius',
};

/**
 * @const
 * @type {Array<string>}
 */
const DEFAULT_GRADIENT = ['#00f', '#0ff', '#0f0', '#ff0', '#f00'];

/**
 * @classdesc
 * Layer for rendering vector data as a heatmap.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @fires import("../render/Event.js").RenderEvent#prerender
 * @fires import("../render/Event.js").RenderEvent#postrender
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../Feature.js").default]
 * @template {import("../source/Vector.js").default<FeatureType>} [VectorSourceType=import("../source/Vector.js").default<FeatureType>]
 * @extends {BaseVector<FeatureType, VectorSourceType, WebGLVectorLayerRenderer>}
 * @api
 */
class Heatmap extends BaseVector {
  /**
   * @param {Options<FeatureType, VectorSourceType>} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    const baseOptions = Object.assign({}, options);

    delete baseOptions.gradient;
    delete baseOptions.radius;
    delete baseOptions.blur;
    delete baseOptions.weight;
    super(baseOptions);

    this.filter_ = options.filter ?? true;

    /**
     * @type {import('../style/flat.js').StyleVariables}
     * @private
     */
    this.styleVariables_ = options.variables || {};

    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.gradient_ = null;

    this.addChangeListener(Property.GRADIENT, this.handleGradientChanged_);

    this.setGradient(options.gradient ? options.gradient : DEFAULT_GRADIENT);

    this.setBlur(options.blur !== undefined ? options.blur : 15);

    this.setRadius(options.radius !== undefined ? options.radius : 8);

    const weight = options.weight ? options.weight : 'weight';

    /**
     * @private
     */
    this.weight_ = weight;

    // For performance reasons, don't sort the features before rendering.
    // The render order is not relevant for a heatmap representation.
    this.setRenderOrder(null);
  }

  /**
   * Return the blur size in pixels.
   * @return {import("../style/flat.js").NumberExpression} Blur size in pixels.
   * @api
   * @observable
   */
  getBlur() {
    return /** @type {import("../style/flat.js").NumberExpression} */ (
      this.get(Property.BLUR)
    );
  }

  /**
   * Return the gradient colors as array of strings.
   * @return {Array<string>} Colors.
   * @api
   * @observable
   */
  getGradient() {
    return /** @type {Array<string>} */ (this.get(Property.GRADIENT));
  }

  /**
   * Return the size of the radius in pixels.
   * @return {import("../style/flat.js").NumberExpression} Radius size in pixel.
   * @api
   * @observable
   */
  getRadius() {
    return /** @type {import("../style/flat.js").NumberExpression} */ (
      this.get(Property.RADIUS)
    );
  }

  /**
   * @private
   */
  handleGradientChanged_() {
    this.gradient_ = createGradient(this.getGradient());
  }

  /**
   * Set the blur size in pixels.
   * @param {import("../style/flat.js").NumberExpression} blur Blur size in pixels (supports expressions).
   * @api
   * @observable
   */
  setBlur(blur) {
    const previousValue = this.get(Property.BLUR);
    this.set(Property.BLUR, blur);
    // if the value stays numerical, simply refresh the layer
    if (typeof blur === 'number' && typeof previousValue === 'number') {
      this.changed();
      return;
    }
    this.clearRenderer();
  }

  /**
   * Set the gradient colors as array of strings.
   * @param {Array<string>} colors Gradient.
   * @api
   * @observable
   */
  setGradient(colors) {
    this.set(Property.GRADIENT, colors);
  }

  /**
   * Set the size of the radius in pixels.
   * @param {import("../style/flat.js").NumberExpression} radius Radius size in pixel (supports expressions).
   * @api
   * @observable
   */
  setRadius(radius) {
    const previousValue = this.get(Property.RADIUS);
    this.set(Property.RADIUS, radius);
    // if the value stays numerical, simply refresh the layer
    if (typeof radius === 'number' && typeof previousValue === 'number') {
      this.changed();
      return;
    }
    this.clearRenderer();
  }

  /**
   * Set the filter expression
   * @param {import("../style/flat.js").BooleanExpression} filter Filter expression
   * @api
   */
  setFilter(filter) {
    this.filter_ = filter;
    this.changed();
    this.clearRenderer();
  }

  /**
   * Set the weight expression
   * @param {WeightExpression} weight Weight expression
   * @api
   */
  setWeight(weight) {
    this.weight_ = weight;
    this.changed();
    this.clearRenderer();
  }

  /**
   * @override
   */
  createRenderer() {
    const builder = new ShaderBuilder();

    const context = newCompilationContext();
    const filterCompiled = expressionToGlsl(context, this.filter_, BooleanType);
    let radiusCompiled = expressionToGlsl(
      context,
      this.getRadius(),
      NumberType,
    );
    let blurCompiled = expressionToGlsl(context, this.getBlur(), NumberType);

    /** @type {import('../render/webgl/VectorStyleRenderer.js').UniformDefinitions} */
    const blurRadiusUniforms = {};
    if (typeof this.getBlur() === 'number') {
      blurCompiled = 'a_blur';
      blurRadiusUniforms['a_blur'] = () => this.getBlur();
      builder.addUniform('float a_blur');
    }
    if (typeof this.getRadius() === 'number') {
      radiusCompiled = 'a_radius';
      blurRadiusUniforms['a_radius'] = () => this.getRadius();
      builder.addUniform('float a_radius');
    }

    /** @type {import('../render/webgl/VectorStyleRenderer.js').AttributeDefinitions} */
    const weightAttribute = {};
    let weightExpression = null;
    if (
      typeof this.weight_ === 'string' ||
      typeof this.weight_ === 'function'
    ) {
      const weightFunction =
        typeof this.weight_ === 'string'
          ? (feature) => feature.get(this.weight_)
          : this.weight_;
      weightAttribute['prop_weight'] = {
        size: 1,
        callback: (feature) => {
          const weightValue = weightFunction(feature);
          return weightValue !== undefined ? clamp(weightValue, 0, 1) : 1;
        },
      };
      weightExpression = 'a_prop_weight';
      builder.addAttribute('a_prop_weight', 'float');
    } else {
      const clampedWeight = ['clamp', this.weight_, 0, 1];
      weightExpression = expressionToGlsl(context, clampedWeight, NumberType);
    }

    builder
      .addFragmentShaderFunction(
        `float getBlurSlope() {
  float blur = max(1., ${blurCompiled});
  float radius = ${radiusCompiled};
  return radius / blur;
}`,
      )
      .setSymbolSizeExpression(`vec2(${radiusCompiled} + ${blurCompiled}) * 2.`)
      .setSymbolColorExpression(
        `vec4(smoothstep(0., 1., (1. - length(coordsPx * 2. / v_quadSizePx)) * getBlurSlope()) * ${weightExpression})`,
      )
      .setStrokeColorExpression(
        `vec4(smoothstep(0., 1., (1. - length(currentRadiusPx * 2. / v_width)) * getBlurSlope()) * ${weightExpression})`,
      )
      .setStrokeWidthExpression(`(${radiusCompiled} + ${blurCompiled}) * 2.`)
      .setFillColorExpression(`vec4(${weightExpression})`)
      .setFragmentDiscardExpression(`!${filterCompiled}`);

    applyContextToBuilder(builder, context);
    const attributes = generateAttributesFromContext(context);
    const uniforms = generateUniformsFromContext(context, this.styleVariables_);

    return new WebGLVectorLayerRenderer(this, {
      className: this.getClassName(),
      variables: this.styleVariables_,
      style: {
        builder,
        attributes: {
          ...attributes,
          ...weightAttribute,
        },
        uniforms: {
          ...uniforms,
          ...blurRadiusUniforms,
        },
      },
      disableHitDetection: false,
      postProcesses: [
        {
          fragmentShader: `
            precision mediump float;

            uniform sampler2D u_image;
            uniform sampler2D u_gradientTexture;
            uniform float u_opacity;

            varying vec2 v_texCoord;

            void main() {
              vec4 color = texture2D(u_image, v_texCoord);
              gl_FragColor.a = color.a * u_opacity;
              gl_FragColor.rgb = texture2D(u_gradientTexture, vec2(0.5, color.a)).rgb;
              gl_FragColor.rgb *= gl_FragColor.a;
            }`,
          uniforms: {
            u_gradientTexture: () => this.gradient_,
            u_opacity: () => this.getOpacity(),
          },
        },
      ],
    });
  }

  /**
   * Update any variables used by the layer style and trigger a re-render.
   * @param {import('../style/flat.js').StyleVariables} variables Variables to update.
   */
  updateStyleVariables(variables) {
    Object.assign(this.styleVariables_, variables);
    this.changed();
  }

  /**
   * @override
   */
  renderDeclutter() {}
}

/**
 * @param {Array<string>} colors A list of colored.
 * @return {HTMLCanvasElement} canvas with gradient texture.
 */
function createGradient(colors) {
  const width = 1;
  const height = 256;
  const context = createCanvasContext2D(width, height);

  const gradient = context.createLinearGradient(0, 0, width, height);
  const step = 1 / (colors.length - 1);
  for (let i = 0, ii = colors.length; i < ii; ++i) {
    gradient.addColorStop(i * step, colors[i]);
  }

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  return context.canvas;
}

export default Heatmap;
