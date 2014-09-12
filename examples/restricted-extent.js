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
  center: [187117.84426934615, 5880846.5639051255],
  minZoom: 6,
  zoom: 6,
  // This is the "constrain center" function. It constrains the center
  // to ensure that the map extent is within maxExtent (defined above).
  // FIXME: the function does not correctly handle the case where the
  // map is rotated.
  constrainCenter: function(center, resolution) {
    if (center !== undefined && resolution !== undefined) {
      var mapSize = /** @type {ol.Size} */ (map.getSize());
      var viewResolution = resolution;
      var mapHalfWidth = (mapSize[0] * viewResolution) / 2.0;
      var mapHalfHeight = (mapSize[1] * viewResolution) / 2.0;
      if (center[0] - mapHalfWidth < maxExtent[0]) {
        center[0] = maxExtent[0] + mapHalfWidth;
      } else if (center[0] + mapHalfWidth > maxExtent[2]) {
        center[0] = maxExtent[2] - mapHalfWidth;
      }
      if (center[1] - mapHalfHeight < maxExtent[1]) {
        center[1] = maxExtent[1] + mapHalfHeight;
      } else if (center[1] + mapHalfHeight > maxExtent[3]) {
        center[1] = maxExtent[3] - mapHalfHeight;
      }
    }
    return center;
  }
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
    })
  }),
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: view
});
