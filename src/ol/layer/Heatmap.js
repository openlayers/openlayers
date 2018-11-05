/**
 * @module ol/layer/Heatmap
 */
import {listen} from '../events.js';
import {getChangeEventType} from '../Object.js';
import {createCanvasContext2D} from '../dom.js';
import VectorLayer from './Vector.js';
import {clamp} from '../math.js';
import {assign} from '../obj.js';
import RenderEventType from '../render/EventType.js';
import Icon from '../style/Icon.js';
import Style from '../style/Style.js';


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
 * @property {number} [shadow=250] Shadow size in pixels.
 * @property {string|function(import("../Feature.js").default):number} [weight='weight'] The feature
 * attribute to use for the weight or a function that returns a weight from a feature. Weight values
 * should range from 0 to 1 (and values outside will be clamped to that range).
 * @property {import("./VectorRenderType.js").default|string} [renderMode='vector'] Render mode for vector layers:
 *  * `'image'`: Vector layers are rendered as images. Great performance, but point symbols and
 *    texts are always rotated with the view and pixels are scaled during zoom animations.
 *  * `'vector'`: Vector layers are rendered as vectors. Most accurate rendering even during
 *    animations, but slower performance.
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
    delete baseOptions.shadow;
    delete baseOptions.weight;
    super(baseOptions);

    /**
     * @private
     * @type {Uint8ClampedArray}
     */
    this.gradient_ = null;

    /**
     * @private
     * @type {number}
     */
    this.shadow_ = options.shadow !== undefined ? options.shadow : 250;

    /**
     * @private
     * @type {string|undefined}
     */
    this.circleImage_ = undefined;

    /**
     * @private
     * @type {Array<Array<import("../style/Style.js").default>>}
     */
    this.styleCache_ = null;

    listen(this,
      getChangeEventType(Property.GRADIENT),
      this.handleGradientChanged_, this);

    this.setGradient(options.gradient ? options.gradient : DEFAULT_GRADIENT);

    this.setBlur(options.blur !== undefined ? options.blur : 15);

    this.setRadius(options.radius !== undefined ? options.radius : 8);

    listen(this,
      getChangeEventType(Property.BLUR),
      this.handleStyleChanged_, this);
    listen(this,
      getChangeEventType(Property.RADIUS),
      this.handleStyleChanged_, this);

    this.handleStyleChanged_();

    const weight = options.weight ? options.weight : 'weight';
    let weightFunction;
    if (typeof weight === 'string') {
      weightFunction = function(feature) {
        return feature.get(weight);
      };
    } else {
      weightFunction = weight;
    }

    this.setStyle(function(feature, resolution) {
      const weight = weightFunction(feature);
      const opacity = weight !== undefined ? clamp(weight, 0, 1) : 1;
      // cast to 8 bits
      const index = (255 * opacity) | 0;
      let style = this.styleCache_[index];
      if (!style) {
        style = [
          new Style({
            image: new Icon({
              opacity: opacity,
              src: this.circleImage_
            })
          })
        ];
        this.styleCache_[index] = style;
      }
      return style;
    }.bind(this));

    // For performance reasons, don't sort the features before rendering.
    // The render order is not relevant for a heatmap representation.
    this.setRenderOrder(null);

    listen(this, RenderEventType.RENDER, this.handleRender_, this);
  }

  /**
   * @return {string} Data URL for a circle.
   * @private
   */
  createCircle_() {
    const radius = this.getRadius();
    const blur = this.getBlur();
    const halfSize = radius + blur + 1;
    const size = 2 * halfSize;
    const context = createCanvasContext2D(size, size);
    context.shadowOffsetX = context.shadowOffsetY = this.shadow_;
    context.shadowBlur = blur;
    context.shadowColor = '#000';
    context.beginPath();
    const center = halfSize - this.shadow_;
    context.arc(center, center, radius, 0, Math.PI * 2, true);
    context.fill();
    return context.canvas.toDataURL();
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
   * @private
   */
  handleStyleChanged_() {
    this.circleImage_ = this.createCircle_();
    this.styleCache_ = new Array(256);
    this.changed();
  }

  /**
   * @param {import("../render/Event.js").default} event Post compose event
   * @private
   */
  handleRender_(event) {
    const context = event.context;
    const canvas = context.canvas;
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const view8 = image.data;
    for (let i = 0, ii = view8.length; i < ii; i += 4) {
      const alpha = view8[i + 3] * 4;
      if (alpha) {
        view8[i] = this.gradient_[alpha];
        view8[i + 1] = this.gradient_[alpha + 1];
        view8[i + 2] = this.gradient_[alpha + 2];
      }
    }
    context.putImageData(image, 0, 0);
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
}


/**
 * @param {Array<string>} colors A list of colored.
 * @return {Uint8ClampedArray} An array.
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

  return context.getImageData(0, 0, width, height).data;
}


export default Heatmap;
