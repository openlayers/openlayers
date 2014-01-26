goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.ellipsoid.WGS84');
goog.require('ol.geom.Point');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var cityFeatures = [{
  'name': 'London',
  'coordinates': [-0.1275, 51.507222]
},{
  'name': 'Beijing',
  'coordinates': [116.391667, 39.913889]
}];

var styles = [new ol.style.Style({
  image: new ol.style.Circle({
    fill: new ol.style.Fill({
      color: '#ffffff'
    }),
    stroke: new ol.style.Stroke({
      color: '#000',
      width: 1
    }),
    radius: 10
  })
})];

var tr4326to3857 = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');

var i;
var features = [];
var feature;
for (i in cityFeatures) {
  var cityFeature = cityFeatures[i];
  feature = new ol.Feature({
    geometry: new ol.geom.Point(tr4326to3857(cityFeature.coordinates)),
    name: cityFeature.name
  });
  features.push(feature);
}

var v = ol.ellipsoid.WGS84.vincenty(
    cityFeatures[0].coordinates,
    cityFeatures[1].coordinates);
var distance = v.distance;
var initialBearing = v.initialBearing;
var divisionCount = 20;
for (i = 1; i < divisionCount; i++) {
  var pd = ol.ellipsoid.WGS84.vincentyDirect(
      cityFeatures[0].coordinates,
      distance / divisionCount * i,
      initialBearing);
  feature = new ol.Feature({
    geometry: new ol.geom.Point(tr4326to3857(pd)),
    name: i + ''
  });
  features.push(feature);
}

var vectorSource = new ol.source.Vector({
  features: features
});

var cityLayer = new ol.layer.Vector({
  source: vectorSource,
  styleFunction: function(feature, resolution) {
    return styles;
  }
});


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    cityLayer
  ],
  renderer: ol.RendererHint.CANVAS,
  target: document.getElementById('map'),
  view: new ol.View2D({
    center: [6000000, 6000000],
    zoom: 2
  })
});
