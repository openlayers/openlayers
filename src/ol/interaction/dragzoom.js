goog.provide('ol.interaction.DragZoom');

goog.require('ol');
goog.require('ol.easing');
goog.require('ol.events.condition');
goog.require('ol.extent');
goog.require('ol.interaction.DragBox');


/**
 * @classdesc
 * Allows the user to zoom the map by clicking and dragging on the map,
 * normally combined with an {@link ol.events.condition} that limits
 * it to when a key, shift by default, is held down.
 *
 * To change the style of the box, use CSS and the `.ol-dragzoom` selector, or
 * your custom one configured with `className`.
 *
 * @constructor
 * @extends {ol.interaction.DragBox}
 * @param {olx.interaction.DragZoomOptions=} opt_options Options.
 * @api
 */
ol.interaction.DragZoom = function(opt_options) {
  var options = opt_options ? opt_options : {};

  var condition = options.condition ?
    options.condition : ol.events.condition.shiftKeyOnly;

  /**
   * @private
   * @type {number}
   */
  this.duration_ = options.duration !== undefined ? options.duration : 200;

  /**
   * @private
   * @type {boolean}
   */
  this.out_ = options.out !== undefined ? options.out : false;

  ol.interaction.DragBox.call(this, {
    condition: condition,
    className: options.className || 'ol-dragzoom'
  });

};
ol.inherits(ol.interaction.DragZoom, ol.interaction.DragBox);


/**
 * @inheritDoc
 */
ol.interaction.DragZoom.prototype.onBoxEnd = function() {
  var map = this.getMap();

  var view = /** @type {!ol.View} */ (map.getView());

  var size = /** @type {!ol.Size} */ (map.getSize());

  var extent = this.getGeometry().getExtent();

  if (this.out_) {
    var mapExtent = view.calculateExtent(size);
    var boxPixelExtent = ol.extent.createOrUpdateFromCoordinates([
      map.getPixelFromCoordinate(ol.extent.getBottomLeft(extent)),
      map.getPixelFromCoordinate(ol.extent.getTopRight(extent))]);
    var factor = view.getResolutionForExtent(boxPixelExtent, size);

    ol.extent.scaleFromCenter(mapExtent, 1 / factor);
    extent = mapExtent;
  }

  var resolution = view.constrainResolution(
      view.getResolutionForExtent(extent, size));

  var center = ol.extent.getCenter(extent);
  center = view.constrainCenter(center);

  view.animate({
    resolution: resolution,
    center: center,
    duration: this.duration_,
    easing: ol.easing.easeOut
  });

};
