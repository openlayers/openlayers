goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.extent');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.source.MapGuide');
goog.require('ol.source.TileWMS');

var mdf = 'Library://Samples/Sheboygan/Maps/Sheboygan.MapDefinition';

//This must point to the mapagent URL of your MapGuide installation
var agentUrl =
    'http://localhost:8018/mapguide/mapagent/mapagent.fcgi';

//Various features you can include in the CREATERUNTIMEMAP response.

//Nothing. This the default.
var REQ_NONE = 0;
//Information about layers and groups (required for the mask values below to have any effect)
var REQ_LAYER_STRUCTURE = 1;
//Icons for each layer (has no effect if REQ_LAYER_STRUCTURE is not in the bitmask)
var REQ_LAYER_ICONS = 2;
//Feature Source information for each layer (has no effect if REQ_LAYER_STRUCTURE is not in the bitmask)
var REQ_LAYER_FEATURE_SOURCE = 4;

function initMap(json) {
  var projCode = "EPSG:" + json.RuntimeMap.CoordinateSystem[0].EpsgCode[0];
  var bounds = [
    parseFloat(json.RuntimeMap.Extents[0].LowerLeftCoordinate[0].X[0]),
    parseFloat(json.RuntimeMap.Extents[0].LowerLeftCoordinate[0].Y[0]),
    parseFloat(json.RuntimeMap.Extents[0].UpperRightCoordinate[0].X[0]),
    parseFloat(json.RuntimeMap.Extents[0].UpperRightCoordinate[0].Y[0])
  ];
  var map = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.TileWMS({
          url: 'http://vmap0.tiles.osgeo.org/wms/vmap0',
          params: {
            'VERSION': '1.1.1',
            'LAYERS': 'basic',
            'FORMAT': 'image/jpeg'
          }
        })
      }),
      new ol.layer.Image({
        source: new ol.source.MapGuide({
          projection: projCode,
          url: agentUrl,
          useOverlay: true,
          metersPerUnit: json.RuntimeMap.CoordinateSystem[0].MetersPerUnit[0],
          params: {
            BEHAVIOR: 2,
            MAPNAME: json.RuntimeMap.Name[0],
            FORMAT: 'PNG',
            SESSION: json.RuntimeMap.SessionId[0]
          },
          extent: bounds
        })
      })
    ],
    // The OSgeo server does not set cross origin headers, so we cannot use WebGL
    renderers: [ol.RendererHint.CANVAS, ol.RendererHint.DOM],
    target: 'map',
    view: new ol.View2D({
      center: [-87.7302542509315, 43.744459064634],
      projection: projCode,
      zoom: 12
    })
  });
}

//Initiate the CREATERUNTIMEMAP request
$.getJSON(agentUrl, {
  "OPERATION": "CREATERUNTIMEMAP",
  "VERSION": "2.6.0",
  "MAPDEFINITION": mdf,
  "USERNAME": "Anonymous",
  "REQUESTEDFEATURES": REQ_NONE,
  "FORMAT": "application/json"
}, function(data, textStatus, jqXHR) {
  initMap(data);
}).error(function(jqXHR, textStatus, errorThrown) {
  alert("Error: " + jqXHR.responseText);
});
