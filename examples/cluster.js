goog.require('ol.ClusterFeature');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.Cluster');
goog.require('ol.source.MapQuest');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var raster = new ol.layer.Tile({
  source: new ol.source.MapQuest({layer: 'sat'})
});

var source = new ol.source.Vector();

var clusterOptions = {
  source: source
};

var clusterSource = new ol.source.Cluster(clusterOptions);

var clusterStyles = {
  point: new ol.style.Style({
    image: new ol.style.Circle({
      radius: 3,
      stroke: new ol.style.Stroke({
        color: 'white',
        width: 1
      }),
      fill: new ol.style.Fill({
        color: 'blue'
      })
    })
  }),
  small: new ol.style.Style({
    image: new ol.style.Circle({
      radius: 5,
      stroke: new ol.style.Stroke({
        color: 'white',
        width: 2
      }),
      fill: new ol.style.Fill({
        color: 'green'
      })
    })
  }),
  medium: new ol.style.Style({
    image: new ol.style.Circle({
      radius: 10,
      stroke: new ol.style.Stroke({
        color: 'rgba(255,255,255,1)',
        width: 4
      }),
      fill: new ol.style.Fill({
        color: 'green'
      })
    })
  }),
  large: new ol.style.Style({
    image: new ol.style.Circle({
      radius: 15,
      stroke: new ol.style.Stroke({
        color: 'rgba(255,255,255,1)',
        width: 6
      }),
      fill: new ol.style.Fill({
        color: 'green'
      })
    })
  })
};


/**
 * @param {ol.Feature} feature the feature being styled
 * @param {number} resolution the resolution of the view
 * @return {Array.<ol.style.Style>}
 */
function styleFunction(feature, resolution) {
  var style;
  if (feature instanceof ol.ClusterFeature) {
    var n = feature.getFeatures().length;
    if (n < 10) {
      style = clusterStyles.small;
    } else if (n < 100) {
      style = clusterStyles.medium;
    } else {
      style = clusterStyles.large;
    }
  } else {
    style = clusterStyles.point;
  }
  return [style];
}

var clusters = new ol.layer.Vector({
  source: clusterSource,
  style: styleFunction
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

var resolution = map.getView().getResolution();
var size = map.getSize();
var extent = map.getView().calculateExtent(/** @type {Array.<number>} */(size));
var features = [];
for (var i = 0; i < 300; i++) {
  var x = Math.round(Math.random() * 180) - 90;
  var y = Math.round(Math.random() * 85) - 42.5;
  var coords = ol.proj.transform([x, y], 'EPSG:4326', 'EPSG:3857');
  var geom = new ol.geom.Point(coords);
  features.push(new ol.Feature(geom));
}

source.addFeatures(features);
