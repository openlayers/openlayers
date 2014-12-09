goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.TileJSON');
goog.require('ol.source.TopoJSON');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var raster = new ol.layer.Tile({
  source: new ol.source.TileJSON({
    url: 'http://api.tiles.mapbox.com/v3/mapbox.world-dark.jsonp'
  })
});

var styleArray = [new ol.style.Style({
  fill: new ol.style.Fill({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new ol.style.Stroke({
    color: '#319FD3',
    width: 1
  })
})];

var vector = new ol.layer.Vector({
  source: new ol.source.TopoJSON({
    projection: 'EPSG:3857',
    url: 'data/topojson/world-110m.json'
  }),
  style: function(feature, resolution) {
    // don't want to render the full world polygon, which repeats all countries
    return feature.getId() !== undefined ? styleArray : null;
  }
});

var map = new ol.Map({
  layers: [raster, vector],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 1
  })
});
