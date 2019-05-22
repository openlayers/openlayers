/**
 * @module ol/layer/Heatmap
 */
import {listen} from '../events.js';
import {getChangeEventType} from '../Object.js';
import {createCanvasContext2D} from '../dom.js';
import VectorLayer from './Vector.js';
import {assign} from '../obj.js';
import WebGLPointsLayerRenderer from '../renderer/webgl/PointsLayer';


/**
 * @typedef {Object} Options
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
 * @property {Array<string>} [gradient=['#00f', '#0ff', '#0f0', '#ff0', '#f00']] The color gradient
 * of the heatmap, specified as an array of CSS color strings.
 * @property {number} [radius=8] Radius size in pixels.
 * @property {number} [blur=15] Blur size in pixels.
 * @property {string|function(import("../Feature.js").default):number} [weight='weight'] The feature
 * attribute to use for the weight or a function that returns a weight from a feature. Weight values
 * should range from 0 to 1 (and values outside will be clamped to that range).
 * @property {import("../source/Vector.js").default} [source] Source.
 */


/**
 * @enum {string}
 * @private
 */
const Property = {
  BLUR: 'blur',
  GRADIENT: 'gradient',
  RADIUS: 'radius'
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
 * @fires import("../render/Event.js").RenderEvent
 * @api
 */
class Heatmap extends VectorLayer {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {
    const options = opt_options ? opt_options : {};

    const baseOptions = assign({}, options);

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

    listen(this,
      getChangeEventType(Property.GRADIENT),
      this.handleGradientChanged_, this);

    this.setGradient(options.gradient ? options.gradient : DEFAULT_GRADIENT);

    this.setBlur(options.blur !== undefined ? options.blur : 15);

    this.setRadius(options.radius !== undefined ? options.radius : 8);

    const weight = options.weight ? options.weight : 'weight';
    if (typeof weight === 'string') {
      this.weightFunction_ = function(feature) {
        return feature.get(weight);
      };
    } else {
      this.weightFunction_ = weight;
    }

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
   * @inheritDoc
   */
  createRenderer() {
    return new WebGLPointsLayerRenderer(this, {
      vertexShader: `
        precision mediump float;
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        attribute float a_rotateWithView;
        attribute vec2 a_offsets;
        attribute float a_opacity;

        uniform mat4 u_projectionMatrix;
        uniform mat4 u_offsetScaleMatrix;
        uniform mat4 u_offsetRotateMatrix;
        uniform float u_size;

        varying vec2 v_texCoord;
        varying float v_opacity;

        void main(void) {
          mat4 offsetMatrix = u_offsetScaleMatrix;
          if (a_rotateWithView == 1.0) {
            offsetMatrix = u_offsetScaleMatrix * u_offsetRotateMatrix;
          }
          vec4 offsets = offsetMatrix * vec4(a_offsets, 0.0, 0.0);
          gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets * u_size;
          v_texCoord = a_texCoord;
          v_opacity = a_opacity;
        }`,
      fragmentShader: `
        precision mediump float;
        uniform float u_resolution;
        uniform float u_blurSlope;

        varying vec2 v_texCoord;
        varying float v_opacity;

        void main(void) {
          vec2 texCoord = v_texCoord * 2.0 - vec2(1.0, 1.0);
          float sqRadius = texCoord.x * texCoord.x + texCoord.y * texCoord.y;
          float value = (1.0 - sqrt(sqRadius)) * u_blurSlope;
          float alpha = smoothstep(0.0, 1.0, value) * v_opacity;
          gl_FragColor = vec4(alpha, alpha, alpha, alpha);
        }`,
      uniforms: {
        u_size: function() {
          return (this.get(Property.RADIUS) + this.get(Property.BLUR)) * 2;
        }.bind(this),
        u_blurSlope: function() {
          return this.get(Property.RADIUS) / Math.max(1, this.get(Property.BLUR));
        }.bind(this),
        u_resolution: function(frameState) {
          return frameState.viewState.resolution;
        }
      },
      postProcesses: [
        {
          fragmentShader: `
            precision mediump float;

            uniform sampler2D u_image;
            uniform sampler2D u_gradientTexture;

            varying vec2 v_texCoord;
            varying vec2 v_screenCoord;

            void main() {
              vec4 color = texture2D(u_image, v_texCoord);
              gl_FragColor.a = color.a;
              gl_FragColor.rgb = texture2D(u_gradientTexture, vec2(0.5, color.a)).rgb;
              gl_FragColor.rgb *= gl_FragColor.a;
            }`,
          uniforms: {
            u_gradientTexture: this.gradient_
          }
        }
      ],
      opacityCallback: this.weightFunction_
    });
  }
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
