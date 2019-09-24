/**
 * @module ol/layer/WebGLPoints
 */
import VectorLayer from './Vector.js';
import {assign} from '../obj.js';
import WebGLPointsLayerRenderer from '../renderer/webgl/PointsLayer.js';
import {getSymbolFragmentShader, getSymbolVertexShader} from '../webgl/ShaderBuilder.js';
import {assert} from '../asserts.js';


/**
 * @typedef {Object} Options
 * @property {import('../style/LiteralStyle.js').LiteralStyle} literalStyle Literal style to apply to the layer features.
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
 * @property {import("../source/Vector.js").default} [source] Source.
 */


/**
 * @classdesc
 * Layer optimized for rendering large point datasets.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @fires import("../render/Event.js").RenderEvent
 * @api
 */
class WebGLPointsLayer extends VectorLayer {
  /**
   * @param {Options} options Options.
   */
  constructor(options) {
    const baseOptions = assign({}, options);

    super(baseOptions);

    /**
     * @type {import('../style/LiteralStyle.js').LiteralStyle}
     */
    this.literalStyle = options.literalStyle;

    assert(this.literalStyle.symbol !== undefined, 65);
  }

  /**
   * @inheritDoc
   */
  createRenderer() {
    return new WebGLPointsLayerRenderer(this, {
      vertexShader: getSymbolVertexShader(this.literalStyle.symbol),
      fragmentShader: getSymbolFragmentShader()
    });
  }
}

export default WebGLPointsLayer;
