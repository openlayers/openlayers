goog.provide('ol.interaction.DragZoom');

goog.require('goog.asserts');
goog.require('ol.animation');
goog.require('ol.easing');
goog.require('ol.events.condition');
goog.require('ol.extent');
goog.require('ol.interaction.DragBox');
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

  var resolution = view.constrainResolution(
      view.getResolutionForExtent(extent, size));

  var currentResolution = view.getResolution();
  goog.asserts.assert(goog.isDef(currentResolution), 'res should be defined');

  var currentCenter = view.getCenter();
  goog.asserts.assert(goog.isDef(currentCenter), 'center should be defined');

  map.beforeRender(ol.animation.zoom({
    resolution: currentResolution,
    duration: this.duration_,
    easing: ol.easing.easeOut
  }));
  map.beforeRender(ol.animation.pan({
    source: currentCenter,
    duration: this.duration_,
    easing: ol.easing.easeOut
  }));

  view.setCenter(ol.extent.getCenter(extent));
  view.setResolution(resolution);
};
