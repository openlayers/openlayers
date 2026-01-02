/**
 * @module ol/layer/WebGLText
 */
import WebGLTextLayerRenderer from '../renderer/webgl/TextLayer.js';
import Layer from './Layer.js';

/**
 * @typedef {Object} Options
 * @property {import("../source/Vector.js").default} source Source.
 * @property {import("../style/flat.js").FlatStyleLike} [style] Style.
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.
 * @property {number} [zIndex] The z-index for layer rendering.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will be visible.
 */

/**
 * @classdesc
 * Layer for rendering text using WebGL and Signed Distance Fields (SDF).
 * @extends {Layer<import("../source/Vector.js").default, WebGLTextLayerRenderer>}
 */
class WebGLTextLayer extends Layer {
    /**
     * @param {Options} options Options.
     */
    constructor(options) {
        const baseOptions = Object.assign({}, options);
        super(baseOptions);
        this.style_ = options.style;
    }

    /**
     * @override
     */
    createRenderer() {
        const style = /** @type {any} */ (this.style_);
        const fontFamily = (style && style.fontFamily) ? style.fontFamily : 'sans-serif';
        const fontWeight = (style && style.fontWeight) ? style.fontWeight : 'normal';
        return new WebGLTextLayerRenderer(this, {
            fontFamily: fontFamily,
            fontWeight: fontWeight,
            style: this.style_
        });
    }
}

export default WebGLTextLayer;
