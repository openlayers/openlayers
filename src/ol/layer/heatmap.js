import _ol_events_ from '../events';
import _ol_ from '../index';
import _ol_Object_ from '../object';
import _ol_dom_ from '../dom';
import _ol_layer_Vector_ from '../layer/vector';
import _ol_math_ from '../math';
import _ol_obj_ from '../obj';
import _ol_render_EventType_ from '../render/eventtype';
import _ol_style_Icon_ from '../style/icon';
import _ol_style_Style_ from '../style/style';

/**
 * @classdesc
 * Layer for rendering vector data as a heatmap.
 * Note that any property set in the options is set as a {@link ol.Object}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @constructor
 * @extends {ol.layer.Vector}
 * @fires ol.render.Event
 * @param {olx.layer.HeatmapOptions=} opt_options Options.
 * @api
 */
var _ol_layer_Heatmap_ = function(opt_options) {
  var options = opt_options ? opt_options : {};

  var baseOptions = _ol_obj_.assign({}, options);

  delete baseOptions.gradient;
  delete baseOptions.radius;
  delete baseOptions.blur;
  delete baseOptions.shadow;
  delete baseOptions.weight;
  _ol_layer_Vector_.call(this, /** @type {olx.layer.VectorOptions} */ (baseOptions));

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
   * @type {Array.<Array.<ol.style.Style>>}
   */
  this.styleCache_ = null;

  _ol_events_.listen(this,
      _ol_Object_.getChangeEventType(_ol_layer_Heatmap_.Property_.GRADIENT),
      this.handleGradientChanged_, this);

  this.setGradient(options.gradient ?
    options.gradient : _ol_layer_Heatmap_.DEFAULT_GRADIENT);

  this.setBlur(options.blur !== undefined ? options.blur : 15);

  this.setRadius(options.radius !== undefined ? options.radius : 8);

  _ol_events_.listen(this,
      _ol_Object_.getChangeEventType(_ol_layer_Heatmap_.Property_.BLUR),
      this.handleStyleChanged_, this);
  _ol_events_.listen(this,
      _ol_Object_.getChangeEventType(_ol_layer_Heatmap_.Property_.RADIUS),
      this.handleStyleChanged_, this);

  this.handleStyleChanged_();

  var weight = options.weight ? options.weight : 'weight';
  var weightFunction;
  if (typeof weight === 'string') {
    weightFunction = function(feature) {
      return feature.get(weight);
    };
  } else {
    weightFunction = weight;
  }

  this.setStyle(function(feature, resolution) {
    var weight = weightFunction(feature);
    var opacity = weight !== undefined ? _ol_math_.clamp(weight, 0, 1) : 1;
    // cast to 8 bits
    var index = (255 * opacity) | 0;
    var style = this.styleCache_[index];
    if (!style) {
      style = [
        new _ol_style_Style_({
          image: new _ol_style_Icon_({
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

  _ol_events_.listen(this, _ol_render_EventType_.RENDER, this.handleRender_, this);
};

_ol_.inherits(_ol_layer_Heatmap_, _ol_layer_Vector_);


/**
 * @const
 * @type {Array.<string>}
 */
_ol_layer_Heatmap_.DEFAULT_GRADIENT = ['#00f', '#0ff', '#0f0', '#ff0', '#f00'];


/**
 * @param {Array.<string>} colors A list of colored.
 * @return {Uint8ClampedArray} An array.
 * @private
 */
_ol_layer_Heatmap_.createGradient_ = function(colors) {
  var width = 1;
  var height = 256;
  var context = _ol_dom_.createCanvasContext2D(width, height);

  var gradient = context.createLinearGradient(0, 0, width, height);
  var step = 1 / (colors.length - 1);
  for (var i = 0, ii = colors.length; i < ii; ++i) {
    gradient.addColorStop(i * step, colors[i]);
  }

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  return context.getImageData(0, 0, width, height).data;
};


/**
 * @return {string} Data URL for a circle.
 * @private
 */
_ol_layer_Heatmap_.prototype.createCircle_ = function() {
  var radius = this.getRadius();
  var blur = this.getBlur();
  var halfSize = radius + blur + 1;
  var size = 2 * halfSize;
  var context = _ol_dom_.createCanvasContext2D(size, size);
  context.shadowOffsetX = context.shadowOffsetY = this.shadow_;
  context.shadowBlur = blur;
  context.shadowColor = '#000';
  context.beginPath();
  var center = halfSize - this.shadow_;
  context.arc(center, center, radius, 0, Math.PI * 2, true);
  context.fill();
  return context.canvas.toDataURL();
};


/**
 * Return the blur size in pixels.
 * @return {number} Blur size in pixels.
 * @api
 * @observable
 */
_ol_layer_Heatmap_.prototype.getBlur = function() {
  return (
    /** @type {number} */ this.get(_ol_layer_Heatmap_.Property_.BLUR)
  );
};


/**
 * Return the gradient colors as array of strings.
 * @return {Array.<string>} Colors.
 * @api
 * @observable
 */
_ol_layer_Heatmap_.prototype.getGradient = function() {
  return (
    /** @type {Array.<string>} */ this.get(_ol_layer_Heatmap_.Property_.GRADIENT)
  );
};


/**
 * Return the size of the radius in pixels.
 * @return {number} Radius size in pixel.
 * @api
 * @observable
 */
_ol_layer_Heatmap_.prototype.getRadius = function() {
  return (
    /** @type {number} */ this.get(_ol_layer_Heatmap_.Property_.RADIUS)
  );
};


/**
 * @private
 */
_ol_layer_Heatmap_.prototype.handleGradientChanged_ = function() {
  this.gradient_ = _ol_layer_Heatmap_.createGradient_(this.getGradient());
};


/**
 * @private
 */
_ol_layer_Heatmap_.prototype.handleStyleChanged_ = function() {
  this.circleImage_ = this.createCircle_();
  this.styleCache_ = new Array(256);
  this.changed();
};


/**
 * @param {ol.render.Event} event Post compose event
 * @private
 */
_ol_layer_Heatmap_.prototype.handleRender_ = function(event) {
  var context = event.context;
  var canvas = context.canvas;
  var image = context.getImageData(0, 0, canvas.width, canvas.height);
  var view8 = image.data;
  var i, ii, alpha;
  for (i = 0, ii = view8.length; i < ii; i += 4) {
    alpha = view8[i + 3] * 4;
    if (alpha) {
      view8[i] = this.gradient_[alpha];
      view8[i + 1] = this.gradient_[alpha + 1];
      view8[i + 2] = this.gradient_[alpha + 2];
    }
  }
  context.putImageData(image, 0, 0);
};


/**
 * Set the blur size in pixels.
 * @param {number} blur Blur size in pixels.
 * @api
 * @observable
 */
_ol_layer_Heatmap_.prototype.setBlur = function(blur) {
  this.set(_ol_layer_Heatmap_.Property_.BLUR, blur);
};


/**
 * Set the gradient colors as array of strings.
 * @param {Array.<string>} colors Gradient.
 * @api
 * @observable
 */
_ol_layer_Heatmap_.prototype.setGradient = function(colors) {
  this.set(_ol_layer_Heatmap_.Property_.GRADIENT, colors);
};


/**
 * Set the size of the radius in pixels.
 * @param {number} radius Radius size in pixel.
 * @api
 * @observable
 */
_ol_layer_Heatmap_.prototype.setRadius = function(radius) {
  this.set(_ol_layer_Heatmap_.Property_.RADIUS, radius);
};


/**
 * @enum {string}
 * @private
 */
_ol_layer_Heatmap_.Property_ = {
  BLUR: 'blur',
  GRADIENT: 'gradient',
  RADIUS: 'radius'
};
export default _ol_layer_Heatmap_;
