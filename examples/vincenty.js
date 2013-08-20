goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.control.defaults');
goog.require('ol.ellipsoid.WGS84');
goog.require('ol.expr');
goog.require('ol.layer.TileLayer');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GeoJSON');
goog.require('ol.proj');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.Rule');
goog.require('ol.style.Shape');
goog.require('ol.style.Style');
goog.require('ol.style.Text');



var style = new ol.style.Style({
  rules: [new ol.style.Rule({
    filter: 'geometryType("point")',
    symbolizers: [
      new ol.style.Shape({
        size: 40,
        fillColor: '#ffffff'
      }),
      new ol.style.Text({
        color: '#333333',
        text: ol.expr.parse('name'),
        fontFamily: 'Calibri,sans-serif',
        fontSize: 10
      })
    ]
  })]
});
var cityFeatures = [{
  'type': 'Feature',
  'properties': {'name': 'London'},
  'geometry': {
    'type': 'Point',
    'coordinates': [-0.1275, 51.507222]
  }
},{
  'type': 'Feature',
  'properties': {'name': 'Beijing'},
  'geometry': {
    'type': 'Point',
    'coordinates': [116.391667, 39.913889]
  }
}];
var v = ol.ellipsoid.WGS84.vincenty(cityFeatures[0].
    geometry.coordinates, cityFeatures[1].geometry.coordinates);
var distance = v.distance;
var initialBearing = v.initialBearing;
var divisionCount = 20;
for (var i = 1; i < divisionCount; i++) {
  var pd = ol.ellipsoid.WGS84.vincentyPoint(cityFeatures[0].
      geometry.coordinates, distance / divisionCount * i, initialBearing);
  cityFeatures.push({
    'type': 'Feature',
    'properties': {'name': i + ''},
    'geometry': {
      'type': 'Point',
      'coordinates': pd
    }
  });
}

var citySource = new ol.source.Vector({
  parser: new ol.parser.GeoJSON(),
  projection: ol.proj.get('EPSG:4326'),
  data: {'type': 'FeatureCollection',
    'features': cityFeatures
  }
});
var cityLayer = new ol.layer.Vector({
  style: style,
  source: citySource
});



var map = new ol.Map({
  controls: ol.control.defaults({}, []),
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OSM()
    }),
    cityLayer
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [6000000, 6000000],
    zoom: 2
  })
});
