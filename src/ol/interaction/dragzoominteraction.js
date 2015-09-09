goog.provide('ol.interaction.DragZoom');

goog.require('goog.asserts');
goog.require('goog.math');
goog.require('ol.events.condition');
goog.require('ol.interaction.DragBox');
goog.require('ol.interaction.Interaction');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');



/**
 * @classdesc
 * Allows the user to zoom the map by clicking and dragging on the map,
 * normally combined with an {@link ol.events.condition} that limits
 * it to when a key, shift by default, is held down.
 *
 * @constructor
 * @extends {ol.interaction.DragBox}
 * @param {olx.interaction.DragZoomOptions=} opt_options Options.
 * @api stable
 */
ol.interaction.DragZoom = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  var condition = goog.isDef(options.condition) ?
      options.condition : ol.events.condition.shiftKeyOnly;

  /**
   * @private
   * @type {number}
   */
  this.duration_ = goog.isDef(options.duration) ? options.duration : 200;

  /**
   * @private
   * @type {ol.style.Style}
   */
  var style = goog.isDef(options.style) ?
      options.style : new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: [0, 0, 255, 1]
        })
      });

  goog.base(this, {
    condition: condition,
    style: style
  });

};
goog.inherits(ol.interaction.DragZoom, ol.interaction.DragBox);


/**
 * @inheritDoc
 */
ol.interaction.DragZoom.prototype.onBoxEnd = function() {
  var map = this.getMap();
  var view = map.getView();
  goog.asserts.assert(!goog.isNull(view), 'view should not be null');
  var size = map.getSize();
  goog.asserts.assert(goog.isDef(size), 'size should be defined');
  var extent = this.getGeometry().getExtent();
  var viewExtent = view.calculateExtent(size);
  var x = ol.interaction.DragZoom.calculateAnchor(viewExtent, extent, 0);
  var y = ol.interaction.DragZoom.calculateAnchor(viewExtent, extent, 1);
  ol.interaction.Interaction.zoom(map, view,
      view.getResolutionForExtent(extent, size),
      [x, y], this.duration_);
};


/**
 * Calculate the point which would be stationary (anchorpoint) when
 * zooming from one extent to the other.
 * @param {ol.Extent} outerExtent
 * @param {ol.Extent} innerExtent
 * @param {number} index 0 for X coordinates, 1 for Y coordinates
 * @return {number}
 */
ol.interaction.DragZoom.calculateAnchor = function(outerExtent, innerExtent,
    index) {
  var innerMin = innerExtent[0 + index];
  var innerMax = innerExtent[2 + index];
  var ratio = (outerExtent[0 + index] - innerMin) /
              (innerMax - outerExtent[2 + index]);
  if (!goog.math.isFiniteNumber(ratio)) {
    return innerMax;
  }
  var percent = ratio / (1 + ratio);
  return innerMin + (innerMax - innerMin) * percent;
};
