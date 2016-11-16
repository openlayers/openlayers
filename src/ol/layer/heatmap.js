goog.provide('ol.layer.Heatmap');

goog.require('ol.events');
goog.require('ol');
goog.require('ol.Object');
goog.require('ol.dom');
goog.require('ol.layer.Vector');
goog.require('ol.math');
goog.require('ol.obj');
goog.require('ol.render.EventType');
goog.require('ol.style.Icon');
goog.require('ol.style.Style');


/**
 * @enum {string}
 */
ol.layer.HeatmapLayerProperty = {
  BLUR: 'blur',
  GRADIENT: 'gradient',
  RADIUS: 'radius'
};


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
ol.layer.Heatmap = function(opt_options) {
  var options = opt_options ? opt_options : {};

  var baseOptions = ol.obj.assign({}, options);

  delete baseOptions.gradient;
  delete baseOptions.radius;
  delete baseOptions.blur;
  delete baseOptions.shadow;
  delete baseOptions.weight;
  ol.layer.Vector.call(this, /** @type {olx.layer.VectorOptions} */ (baseOptions));

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

  ol.events.listen(this,
      ol.Object.getChangeEventType(ol.layer.HeatmapLayerProperty.GRADIENT),
      this.handleGradientChanged_, this);

  this.setGradient(options.gradient ?
      options.gradient : ol.layer.Heatmap.DEFAULT_GRADIENT);

  this.setBlur(options.blur !== undefined ? options.blur : 15);

  this.setRadius(options.radius !== undefined ? options.radius : 8);

  ol.events.listen(this,
      ol.Object.getChangeEventType(ol.layer.HeatmapLayerProperty.BLUR),
      this.handleStyleChanged_, this);
  ol.events.listen(this,
      ol.Object.getChangeEventType(ol.layer.HeatmapLayerProperty.RADIUS),
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
  goog.DEBUG && console.assert(typeof weightFunction === 'function',
      'weightFunction should be a function');

  this.setStyle(function(feature, resolution) {
    goog.DEBUG && console.assert(this.styleCache_, 'this.styleCache_ expected');
    goog.DEBUG && console.assert(this.circleImage_ !== undefined,
        'this.circleImage_ should be defined');
    var weight = weightFunction(feature);
    var opacity = weight !== undefined ? ol.math.clamp(weight, 0, 1) : 1;
    // cast to 8 bits
    var index = (255 * opacity) | 0;
    var style = this.styleCache_[index];
    if (!style) {
      style = [
        new ol.style.Style({
          image: new ol.style.Icon({
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

  ol.events.listen(this, ol.render.EventType.RENDER, this.handleRender_, this);

};
ol.inherits(ol.layer.Heatmap, ol.layer.Vector);


/**
 * @const
 * @type {Array.<string>}
 */
ol.layer.Heatmap.DEFAULT_GRADIENT = ['#00f', '#0ff', '#0f0', '#ff0', '#f00'];


/**
 * @param {Array.<string>} colors A list of colored.
 * @return {Uint8ClampedArray} An array.
 * @private
 */
ol.layer.Heatmap.createGradient_ = function(colors) {
  var width = 1;
  var height = 256;
  var context = ol.dom.createCanvasContext2D(width, height);

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
ol.layer.Heatmap.prototype.createCircle_ = function() {
  var radius = this.getRadius();
  var blur = this.getBlur();
  goog.DEBUG && console.assert(radius !== undefined && blur !== undefined,
      'radius and blur should be defined');
  var halfSize = radius + blur + 1;
  var size = 2 * halfSize;
  var context = ol.dom.createCanvasContext2D(size, size);
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
ol.layer.Heatmap.prototype.getBlur = function() {
  return /** @type {number} */ (this.get(ol.layer.HeatmapLayerProperty.BLUR));
};


/**
 * Return the gradient colors as array of strings.
 * @return {Array.<string>} Colors.
 * @api
 * @observable
 */
ol.layer.Heatmap.prototype.getGradient = function() {
  return /** @type {Array.<string>} */ (
      this.get(ol.layer.HeatmapLayerProperty.GRADIENT));
};


/**
 * Return the size of the radius in pixels.
 * @return {number} Radius size in pixel.
 * @api
 * @observable
 */
ol.layer.Heatmap.prototype.getRadius = function() {
  return /** @type {number} */ (this.get(ol.layer.HeatmapLayerProperty.RADIUS));
};


/**
 * @private
 */
ol.layer.Heatmap.prototype.handleGradientChanged_ = function() {
  this.gradient_ = ol.layer.Heatmap.createGradient_(this.getGradient());
};


/**
 * @private
 */
ol.layer.Heatmap.prototype.handleStyleChanged_ = function() {
  this.circleImage_ = this.createCircle_();
  this.styleCache_ = new Array(256);
  this.changed();
};


/**
 * @param {ol.render.Event} event Post compose event
 * @private
 */
ol.layer.Heatmap.prototype.handleRender_ = function(event) {
  goog.DEBUG && console.assert(event.type == ol.render.EventType.RENDER,
      'event.type should be RENDER');
  goog.DEBUG && console.assert(this.gradient_, 'this.gradient_ expected');
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
ol.layer.Heatmap.prototype.setBlur = function(blur) {
  this.set(ol.layer.HeatmapLayerProperty.BLUR, blur);
};


/**
 * Set the gradient colors as array of strings.
 * @param {Array.<string>} colors Gradient.
 * @api
 * @observable
 */
ol.layer.Heatmap.prototype.setGradient = function(colors) {
  this.set(ol.layer.HeatmapLayerProperty.GRADIENT, colors);
};


/**
 * Set the size of the radius in pixels.
 * @param {number} radius Radius size in pixel.
 * @api
 * @observable
 */
ol.layer.Heatmap.prototype.setRadius = function(radius) {
  this.set(ol.layer.HeatmapLayerProperty.RADIUS, radius);
};
