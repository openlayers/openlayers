goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.MapQuest');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.Cluster')

var raster = new ol.layer.Tile({
  source: new ol.source.MapQuest({layer: 'sat'})
});

var source = new ol.source.Vector();

var clusterSource = new ol.source.Vector();

var vector = new ol.layer.Vector({
  source: source,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new ol.style.Stroke({
      color: '#ffcc33',
      width: 2
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: '#ffcc33'
      })
    })
  })
});


var clusters = new ol.layer.Vector({
  source: clusterSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new ol.style.Stroke({
      color: 'green',
      width: 2
    }),
    image: new ol.style.Circle({
      radius: 12,
      fill: new ol.style.Fill({
        color: 'green'
      })
    })
  })
});

var map = new ol.Map({
  layers: [raster, clusters, vector],
  renderer: 'canvas',
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 4
  })
});

var resolution = map.getView().getView2D().getResolution();
var size = map.getSize();
var extent = map.getView().getView2D().calculateExtent(size);

var data = [];
for(var i = 0; i < 30; i++) {
  var x = Math.round(Math.random() * (90 - 0) + 0);
  var y = Math.round(Math.random() * (180 - 0) + 0);
  var coords = /** @type {ol.geom.RawPoint} */ ([x * resolution, y * resolution]);
  var geom = new ol.geom.Point(coords);
  var feature = new ol.Feature(geom);
  data.push(feature);
}
var clusterOptions = {
  'data': data
};

goog.events.listen(map, ol.MapEventType.MOVEEND, function(e) {
  window.console.log(e);
});

source.addFeatures(data);
var cluster = new ol.Cluster(clusterOptions);
cluster.cluster(extent, resolution);
window.console.log(cluster.clusters);
window.console.log(cluster.features);
clusterSource.addFeatures(cluster.features);
