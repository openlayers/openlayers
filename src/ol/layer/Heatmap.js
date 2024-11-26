/**
 * @module ol/layer/Heatmap
 */
import BaseVector from './BaseVector.js';
import WebGLPointsLayerRenderer from '../renderer/webgl/PointsLayer.js';
import {ShaderBuilder} from '../webgl/ShaderBuilder.js';
import {clamp} from '../math.js';
import {createCanvasContext2D} from '../dom.js';

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
 * @property {number} [radius=8] Radius size in pixels.
 * @property {number} [blur=15] Blur size in pixels.
 * @property {string|function(import("../Feature.js").default):number} [weight='weight'] The feature
 * attribute to use for the weight or a function that returns a weight from a feature. Weight values
 * should range from 0 to 1 (and values outside will be clamped to that range).
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
 * @extends {BaseVector<FeatureType, VectorSourceType, WebGLPointsLayerRenderer>}
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
    this.weightFunction_ =
      typeof weight === 'string'
        ? /**
           * @param {import('../Feature.js').default} feature Feature
           * @return {any} weight
           */
          (feature) => feature.get(weight)
        : weight;

    // For performance reasons, don't sort the features before rendering.
    // The render order is not relevant for a heatmap representation.
    this.setRenderOrder(null);
  }

  /**
   * Return the blur size in pixels.
   * @return {number} Blur size in pixels.
   * @api
   * @observable
   */
  getBlur() {
    return /** @type {number} */ (this.get(Property.BLUR));
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
   * @return {number} Radius size in pixel.
   * @api
   * @observable
   */
  getRadius() {
    return /** @type {number} */ (this.get(Property.RADIUS));
  }

  /**
   * @private
   */
  handleGradientChanged_() {
    this.gradient_ = createGradient(this.getGradient());
  }

  /**
   * Set the blur size in pixels.
   * @param {number} blur Blur size in pixels.
   * @api
   * @observable
   */
  setBlur(blur) {
    this.set(Property.BLUR, blur);
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
   * @param {number} radius Radius size in pixel.
   * @api
   * @observable
   */
  setRadius(radius) {
    this.set(Property.RADIUS, radius);
  }

  /**
   * @override
   */
  createRenderer() {
    const builder = new ShaderBuilder()
      .addAttribute('float a_weight')
      .addVarying('v_weight', 'float', 'a_weight')
      .addUniform('float u_size')
      .addUniform('float u_blurSlope')
      .setSymbolSizeExpression('vec2(u_size)')
      .setSymbolColorExpression(
        'vec4(smoothstep(0., 1., (1. - length(coordsPx * 2. / v_quadSizePx)) * u_blurSlope) * v_weight)',
      );

    return new WebGLPointsLayerRenderer(this, {
      className: this.getClassName(),
      attributes: [
        {
          name: 'weight',
          callback: (feature) => {
            const weight = this.weightFunction_(feature);
            return weight !== undefined ? clamp(weight, 0, 1) : 1;
          },
        },
      ],
      uniforms: {
        u_size: () => {
          return (this.get(Property.RADIUS) + this.get(Property.BLUR)) * 2;
        },
        u_blurSlope: () => {
          return (
            this.get(Property.RADIUS) / Math.max(1, this.get(Property.BLUR))
          );
        },
      },
      hitDetectionEnabled: true,
      vertexShader: builder.getSymbolVertexShader(),
      fragmentShader: builder.getSymbolFragmentShader(),
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
