goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.Cluster');
goog.require('ol.source.MapQuest');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');


var count = 20000;
var features = new Array(count);
var e = 4500000;
for (var i = 0; i < count; ++i) {
  var coordinates = [2 * e * Math.random() - e, 2 * e * Math.random() - e];
  
  var feat = new ol.Feature(new ol.geom.Point(coordinates));
  // set a propertie with value between 1 and 4
  feat.set("clusterprop",Math.floor(Math.random() * 4) + 1  );
  features[i] = feat;
}

var shouldCluster = function (feature,neighbor) {
    return (feature.get("clusterprop") == neighbor.get("clusterprop"));
};

var source = new ol.source.Vector({
  features: features
});

var clusterSource = new ol.source.Cluster({
  distance: 40,
  source: source,
  shouldCluster:shouldCluster
});

var stylecolors = {
    1:'red',
    2:'blue',
    3:'purple',
    4:'green'
};

var styleCache = {};
var clusters = new ol.layer.Vector({
  source: clusterSource,
  style: function(feature, resolution) {

    var size = feature.get('features').length;
      style = [new ol.style.Style({
        image: new ol.style.Circle({
          radius: 10,
          stroke: new ol.style.Stroke({
            color: '#fff'
          }),
          fill: new ol.style.Fill({
            color: stylecolors[feature.get("features")[0].get("clusterprop")]
          })
        }),
        text: new ol.style.Text({
          text: size.toString(),
          fill: new ol.style.Fill({
            color: '#fff'
          })
        })
      })];
    return style;
  }
});

var raster = new ol.layer.Tile({
  source: new ol.source.MapQuest({layer: 'sat'})
});

var raw = new ol.layer.Vector({
  source: source
});

var map = new ol.Map({
  layers: [raster, clusters],
  renderer: 'canvas',
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});
