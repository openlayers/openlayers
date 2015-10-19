goog.provide('ol.interaction.DragZoom');

goog.require('goog.asserts');
goog.require('ol.animation');
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
 * @api stable
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

  goog.base(this, {
    condition: condition,
    className: options.className || 'ol-dragzoom'
  });

};
goog.inherits(ol.interaction.DragZoom, ol.interaction.DragBox);


/**
 * @inheritDoc
 */
ol.interaction.DragZoom.prototype.onBoxEnd = function() {
  var map = this.getMap();

  var view = map.getView();
  goog.asserts.assert(view, 'map must have view');

  var size = map.getSize();
  goog.asserts.assert(size !== undefined, 'size should be defined');

  var extent = this.getGeometry().getExtent();

  var resolution = view.constrainResolution(
      view.getResolutionForExtent(extent, size));

  var currentResolution = view.getResolution();
  goog.asserts.assert(currentResolution !== undefined, 'res should be defined');

  var currentCenter = view.getCenter();
  goog.asserts.assert(currentCenter !== undefined, 'center should be defined');

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
