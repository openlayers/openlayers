import _ol_ from '../index';
import _ol_LayerType_ from '../layertype';
import _ol_layer_Layer_ from '../layer/layer';

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
var _ol_layer_Image_ = function(opt_options) {
  var options = opt_options ? opt_options : {};
  _ol_layer_Layer_.call(this,  /** @type {olx.layer.LayerOptions} */ (options));

  /**
   * The layer type.
   * @protected
   * @type {ol.LayerType}
   */
  this.type = _ol_LayerType_.IMAGE;

};

_ol_.inherits(_ol_layer_Image_, _ol_layer_Layer_);


/**
 * Return the associated {@link ol.source.Image source} of the image layer.
 * @function
 * @return {ol.source.Image} Source.
 * @api
 */
_ol_layer_Image_.prototype.getSource;
export default _ol_layer_Image_;
