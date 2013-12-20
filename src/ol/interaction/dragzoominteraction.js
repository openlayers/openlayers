goog.provide('ol.interaction.DragZoom');

goog.require('goog.asserts');
goog.require('ol.events.condition');
goog.require('ol.interaction.DragBox');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');



/**
 * Allows the user to zoom the map by clicking and dragging on the map,
 * normally combined with an {@link ol.events.condition} that limits
 * it to when the shift key is held down.
 * @constructor
 * @extends {ol.interaction.DragBox}
 * @param {olx.interaction.DragZoomOptions=} opt_options Options.
 * @todo stability experimental
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
          color: 'blue'
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
  this.getMap().withFrozenRendering(goog.bind(function() {
    // FIXME works for View2D only
    var view = this.getMap().getView().getView2D();

    view.fitExtent(this.getGeometry().getExtent(), this.getMap().getSize());
    // FIXME we should preserve rotation
    view.setRotation(0);
  }, this));
};
