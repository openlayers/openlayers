goog.provide('ol.interaction.DragZoom');

goog.require('goog.asserts');
goog.require('ol.Size');
goog.require('ol.View2D');
goog.require('ol.events.condition');
goog.require('ol.interaction.DragBox');



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
   * @type {function(ol.Map, ol.geom.Polygon)}
   */
  var behavior = (
      /**
       * @param {ol.Map} map Map.
       * @param {ol.geom.Polygon} polygon Polugon.
       */
      function(map, polygon) {
        map.withFrozenRendering(function() {
          // FIXME works for View2D only
          var view = map.getView();
          goog.asserts.assertInstanceof(view, ol.View2D);

          var linearRings = polygon.getLinearRings();
          goog.asserts.assert(linearRings.length == 2);

          var innerLinearRing = linearRings[1];
          var innerLinearRingExtent = innerLinearRing.getExtent();

          var mapSize = /** @type {ol.Size} */ (map.getSize());

          map.withFrozenRendering(function() {
            view.fitExtent(innerLinearRingExtent, mapSize);
            // FIXME we should preserve rotation
            view.setRotation(0);
          });
        });
      });

  goog.base(this, {
    behavior: behavior,
    condition: condition
  });
};
goog.inherits(ol.interaction.DragZoom, ol.interaction.DragBox);
