/**
 * @module ol/layer/Image
 */
import {inherits} from '../index.js';
import LayerType from '../LayerType.js';
import Layer from '../layer/Layer.js';

/**
 * @classdesc
 * Server-rendered images that are available for arbitrary extents and
 * resolutions.
 * Note that any property set in the options is set as a {@link ol.Object}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @constructor
 * @extends {ol.layer.Layer}
 * @fires ol.render.Event
 * @param {olx.layer.ImageOptions=} opt_options Layer options.
 * @api
 */
const ImageLayer = function(opt_options) {
  const options = opt_options ? opt_options : {};
  Layer.call(this,  /** @type {olx.layer.LayerOptions} */ (options));

  /**
   * The layer type.
   * @protected
   * @type {ol.LayerType}
   */
  this.type = LayerType.IMAGE;

};

inherits(ImageLayer, Layer);


/**
 * Return the associated {@link ol.source.Image source} of the image layer.
 * @function
 * @return {ol.source.Image} Source.
 * @api
 */
ImageLayer.prototype.getSource;
export default ImageLayer;
