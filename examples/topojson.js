goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.parser.TopoJSON');
goog.require('ol.source.TileJSON');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var raster = new ol.layer.Tile({
  source: new ol.source.TileJSON({
    url: 'http://api.tiles.mapbox.com/v3/mapbox.world-dark.jsonp'
  })
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/topojson/world-110m.json',
    parser: new ol.parser.TopoJSON()
  }),
  style: new ol.style.Style({
    symbolizers: [
      new ol.style.Fill({
        color: '#BADA55',
        opacity: 0.5
      }),
      new ol.style.Stroke({
        color: '#FFF',
        opacity: 1,
        width: 1.5
      })
    ]
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 1
  })
});
