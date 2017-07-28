goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


/**
 * @type {ol.Map}
 */
var map;

// The extent we want to restrict the map to.
var maxExtent = [-546677.6272683458, 5244890.488572459,
  920913.3158070382, 6516802.639237792];


/**
 * @type {ol.View}
 */
var view = new ol.View({
  center: ol.extent.getCenter(maxExtent),
  minZoom: 6,
  zoom: 6,
  restrictExtent: true,
});

map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    }),
  }),
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: view
});
