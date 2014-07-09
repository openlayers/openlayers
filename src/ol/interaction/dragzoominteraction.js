goog.provide('ol.interaction.DragZoom');

goog.require('goog.asserts');
goog.require('ol');
goog.require('ol.events.condition');
goog.require('ol.extent');
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
  goog.asserts.assert(goog.isDef(view));
  var extent = this.getGeometry().getExtent();
  var center = ol.extent.getCenter(extent);
  var size = map.getSize();
  goog.asserts.assert(goog.isDef(size));
  ol.interaction.Interaction.zoom(map, view,
      view.getResolutionForExtent(extent, size),
      center, ol.DRAGZOOM_ANIMATION_DURATION);
};
