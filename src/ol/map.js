goog.provide('ol.Map');

goog.require('ol');
goog.require('ol.PluggableMap');
goog.require('ol.PluginType');
goog.require('ol.control');
goog.require('ol.interaction');
goog.require('ol.obj');
goog.require('ol.plugins');
goog.require('ol.renderer.canvas.ImageLayer');
goog.require('ol.renderer.canvas.Map');
goog.require('ol.renderer.canvas.TileLayer');
goog.require('ol.renderer.canvas.VectorLayer');
goog.require('ol.renderer.canvas.VectorTileLayer');
goog.require('ol.renderer.webgl.ImageLayer');
goog.require('ol.renderer.webgl.Map');
goog.require('ol.renderer.webgl.TileLayer');
goog.require('ol.renderer.webgl.VectorLayer');


if (ol.ENABLE_CANVAS) {
  ol.plugins.register(ol.PluginType.MAP_RENDERER, ol.renderer.canvas.Map);
  ol.plugins.registerMultiple(ol.PluginType.LAYER_RENDERER, [
    ol.renderer.canvas.ImageLayer,
    ol.renderer.canvas.TileLayer,
    ol.renderer.canvas.VectorLayer,
    ol.renderer.canvas.VectorTileLayer
  ]);
}

if (ol.ENABLE_WEBGL) {
  ol.plugins.register(ol.PluginType.MAP_RENDERER, ol.renderer.webgl.Map);
  ol.plugins.registerMultiple(ol.PluginType.LAYER_RENDERER, [
    ol.renderer.webgl.ImageLayer,
    ol.renderer.webgl.TileLayer,
    ol.renderer.webgl.VectorLayer
  ]);
}


/**
 * @classdesc
 * The map is the core component of OpenLayers. For a map to render, a view,
 * one or more layers, and a target container are needed:
 *
 *     var map = new ol.Map({
 *       view: new ol.View({
 *         center: [0, 0],
 *         zoom: 1
 *       }),
 *       layers: [
 *         new ol.layer.Tile({
 *           source: new ol.source.OSM()
 *         })
 *       ],
 *       target: 'map'
 *     });
 *
 * The above snippet creates a map using a {@link ol.layer.Tile} to display
 * {@link ol.source.OSM} OSM data and render it to a DOM element with the
 * id `map`.
 *
 * The constructor places a viewport container (with CSS class name
 * `ol-viewport`) in the target element (see `getViewport()`), and then two
 * further elements within the viewport: one with CSS class name
 * `ol-overlaycontainer-stopevent` for controls and some overlays, and one with
 * CSS class name `ol-overlaycontainer` for other overlays (see the `stopEvent`
 * option of {@link ol.Overlay} for the difference). The map itself is placed in
 * a further element within the viewport.
 *
 * Layers are stored as a `ol.Collection` in layerGroups. A top-level group is
 * provided by the library. This is what is accessed by `getLayerGroup` and
 * `setLayerGroup`. Layers entered in the options are added to this group, and
 * `addLayer` and `removeLayer` change the layer collection in the group.
 * `getLayers` is a convenience function for `getLayerGroup().getLayers()`.
 * Note that `ol.layer.Group` is a subclass of `ol.layer.Base`, so layers
 * entered in the options or added with `addLayer` can be groups, which can
 * contain further groups, and so on.
 *
 * @constructor
 * @extends {ol.PluggableMap}
 * @param {olx.MapOptions} options Map options.
 * @fires ol.MapBrowserEvent
 * @fires ol.MapEvent
 * @fires ol.render.Event#postcompose
 * @fires ol.render.Event#precompose
 * @api
 */
ol.Map = function(options) {
  options = ol.obj.assign({}, options);
  if (!options.controls) {
    options.controls = ol.control.defaults();
  }
  if (!options.interactions) {
    options.interactions = ol.interaction.defaults();
  }

  ol.PluggableMap.call(this, options);
};
ol.inherits(ol.Map, ol.PluggableMap);
