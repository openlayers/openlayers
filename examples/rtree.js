// NOCOMPILE
// FIXME this example dives into private members and will never compile :)
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var i, ii, j, jj;

var count = 2000;
var features = new Array(count);
var e = 18000000;
for (i = 0; i < count; ++i) {
  features[i] = new ol.Feature({
    'geometry': new ol.geom.Point(
        [2 * e * Math.random() - e, 2 * e * Math.random() - e])
  });
}
var vectorSource = new ol.source.Vector({
  features: features
});

var styleArray = [new ol.style.Style({
  image: new ol.style.Circle({
    radius: 3,
    fill: null,
    stroke: new ol.style.Stroke({color: 'red', width: 1})
  })
})];

var colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
var depthStyle = [];
for (i = 0, ii = colors.length; i < ii; ++i) {
  depthStyle[i] = new ol.style.Style({
    fill: null,
    image: null,
    stroke: new ol.style.Stroke({
      color: colors[i],
      width: (7 - i) / 2
    }),
    zIndex: i
  });
}
var extentsByDepth = [];
vectorSource.rBush_.forEachNode(function(node) {
  if (node.height > 0) {
    if (goog.isDef(extentsByDepth[node.height])) {
      extentsByDepth[node.height].push(node.extent);
    } else {
      extentsByDepth[node.height] = [node.extent];
    }
  }
});
var rtreeExtentFeatures = [];
for (i = 0, ii = extentsByDepth.length; i < ii; ++i) {
  var extents = extentsByDepth[i];
  if (!goog.isDef(extents)) {
    continue;
  }
  for (j = 0, jj = extents.length; j < jj; ++j) {
    var extent = extents[j];
    var geometry = new ol.geom.Polygon([[
      ol.extent.getBottomLeft(extent),
      ol.extent.getTopLeft(extent),
      ol.extent.getTopRight(extent),
      ol.extent.getBottomRight(extent)
    ]]);
    var feature = new ol.Feature({
      'geometry': geometry,
      'styleArray': [depthStyle[i]]
    });
    rtreeExtentFeatures.push(feature);
  }
}

var vector = new ol.layer.Vector({
  source: vectorSource,
  style: styleArray
});

var rtree = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: rtreeExtentFeatures
  }),
  style: function(feature, resolution) {
    return feature.get('styleArray');
  }
});

var map = new ol.Map({
  layers: [vector, rtree],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});
