// FIXME feature weight property
goog.provide('ol.layer.Heatmap');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('ol.Object');
goog.require('ol.layer.Vector');
goog.require('ol.render.EventType');
goog.require('ol.style.Icon');
goog.require('ol.style.Style');


/**
 * @enum {string}
 */
ol.layer.HeatmapLayerProperty = {
  GRADIENT: 'gradient'
};



/**
 * @constructor
 * @extends {ol.layer.Vector}
 * @param {olx.layer.HeatmapOptions=} opt_options Options.
 * @todo stability experimental
 */
ol.layer.Heatmap = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, /** @type {olx.layer.VectorOptions} */ (options));

  /**
   * @private
   * @type {Uint32Array}
   */
  this.gradient_ = null;

  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.layer.HeatmapLayerProperty.GRADIENT),
      this.handleGradientChanged_, false, this);

  this.setGradient(goog.isDef(options.gradient) ?
      options.gradient : ol.layer.Heatmap.DEFAULT_GRADIENT);

  var radius = goog.isDef(options.radius) ? options.radius : 8;
  var blur = goog.isDef(options.blur) ? options.blur : 15;
  var shadow = goog.isDef(options.shadow) ? options.shadow : 250;

  var style = new ol.style.Style({
    image: ol.layer.Heatmap.createIcon_(radius, blur, shadow)
  });

  // FIXME: styles are immutable
  // /**
  //  * @param {ol.Feature} feature
  //  * @param {number} resolution
  //  * @return {number} weight
  //  */
  // var weightFunction = function(feature, resolution) {
  //   var weight = /** @type {number} */ (feature.get('weight'));
  //   return goog.isDef(weight) ? weight : 1;
  // };
  //
  // var styleArray = [style];
  // this.setStyle(function(feature, resolution) {
  //   var image = style.getImage();
  //   image.setOpacity(weightFunction(feature, resolution));
  //   return styleArray;
  // });

  this.setStyle(style);

  goog.events.listen(this, ol.render.EventType.RENDER,
      this.handleRender_, false, this);

};
goog.inherits(ol.layer.Heatmap, ol.layer.Vector);


/**
 * @const
 * @type {Array.<string>}
 */
ol.layer.Heatmap.DEFAULT_GRADIENT = ['#00f', '#0ff', '#0f0', '#ff0', '#f00'];


/**
 * @param {Array.<string>} colors
 * @return {Uint32Array}
 * @private
 */
ol.layer.Heatmap.createGradient_ = function(colors) {
  var canvas = goog.dom.createElement(goog.dom.TagName.CANVAS);
  var context = canvas.getContext('2d');
  var width = 1;
  var height = 256;
  canvas.width = width;
  canvas.height = height;

  var gradient = context.createLinearGradient(0, 0, width, height);
  var step = 1 / colors.length;
  for (var i = 0, ii = colors.length; i < ii; ++i) {
    gradient.addColorStop(i * step, colors[i]);
  }

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  var imageData = context.getImageData(0, 0, width, height).data;
  for (var i = 0, ii = imageData.length; i < ii; i += 4) {
    imageData[i + 3] = i / 4;
  }
  return new Uint32Array(imageData.buffer);
};


/**
 * @param {number} radius Radius size in pixel.
 * @param {number} blur Blur size in pixel.
 * @param {number} shadow Shadow offset size in pixel.
 * @return {ol.style.Icon} icon
 * @private
 */
ol.layer.Heatmap.createIcon_ = function(radius, blur, shadow) {
  var canvas =  /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));
  var context = canvas.getContext('2d');
  var halfSize = radius + blur + 1;
  canvas.width = canvas.height = halfSize * 2;
  context.shadowOffsetX = context.shadowOffsetY = shadow;
  context.shadowBlur = blur;
  context.shadowColor = '#000';
  context.beginPath();
  var center = halfSize - shadow;
  context.arc(center, center, radius, 0, Math.PI * 2, true);
  context.fill();
  return new ol.style.Icon({
    src: canvas.toDataURL()
  });
};


/**
 * @return {Array.<string>} Colors.
 */
ol.layer.Heatmap.prototype.getGradient = function() {
  return /** @type {Array.<string>} */ (
      this.get(ol.layer.HeatmapLayerProperty.GRADIENT));
};
goog.exportProperty(
    ol.layer.Heatmap.prototype,
    'getGradient',
    ol.layer.Heatmap.prototype.getGradient);


/**
 * @private
 */
ol.layer.Heatmap.prototype.handleGradientChanged_ = function() {
  this.gradient_ = ol.layer.Heatmap.createGradient_(this.getGradient());
};


/**
 * @param {ol.render.Event} event Post compose event
 * @private
 */
ol.layer.Heatmap.prototype.handleRender_ = function(event) {
  goog.asserts.assert(event.type == ol.render.EventType.RENDER);
  var context = event.context;
  var canvas = context.canvas;
  var image = context.getImageData(0, 0, canvas.width, canvas.height);
  var view32 = new Uint32Array(image.data.buffer);
  var view8 = image.data;
  var i, ii, alpha;
  for (i = 0, ii = view32.length; i < ii; ++i) {
    alpha = view8[4 * i + 3];
    if (alpha) {
      view32[i] = this.gradient_[alpha];
    }
  }
  context.putImageData(image, 0, 0);
};


/**
 * @param {Array.<string>} colors Gradient.
 */
ol.layer.Heatmap.prototype.setGradient = function(colors) {
  this.set(ol.layer.HeatmapLayerProperty.GRADIENT, colors);
};
goog.exportProperty(
    ol.layer.Heatmap.prototype,
    'setGradient',
    ol.layer.Heatmap.prototype.setGradient);
