// NOCOMPILE
// FIXME this example dives into private members and will never compile :)
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.extent');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.structs.RTree');
goog.require('ol.symbol');


/**
 * @return {Array.<Array.<ol.Extent>>} Extents at depths.
 */
ol.structs.RTree.prototype.getExtentsByDepth = function() {
  var depthFirstSearch =
      /**
       * @param {ol.structs.RTreeNode} node Node.
       * @param {number} depth Depth.
       * @param {Array.<Array.<ol.Extent>>} result Result.
       * @return {Array.<Array.<ol.Extent>>} Result.
       */
      function(node, depth, result) {
    if (goog.isDef(result[depth])) {
      result[depth].push(node.extent);
    } else {
      result[depth] = [node.extent];
    }
    var nodes = node.nodes;
    if (goog.isDef(nodes)) {
      var i, ii;
      for (i = 0, ii = nodes.length; i < ii; ++i) {
        depthFirstSearch(nodes[i], depth + 1, result);
      }
    }
    return result;
  };
  return depthFirstSearch(this.rootTree_, 0, []);
};

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

var style = {
  image: ol.symbol.renderCircle(3, null, {color: 'red', width: 1})
};

var colors = ['red', 'orange', 'yellow', 'blue', 'green', 'indigo', 'violet'];
var depthStyle = [];
for (i = 0, ii = colors.length; i < ii; ++i) {
  depthStyle[i] = {
    fill: null,
    image: null,
    stroke: {
      color: colors[i],
      width: (7 - i) / 2
    },
    zIndex: i
  };
}
var extentsByDepth = vectorSource.rTree_.getExtentsByDepth();
var rtreeExtentFeatures = [];
for (i = 0, ii = extentsByDepth.length; i < ii; ++i) {
  var extents = extentsByDepth[i];
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
      'style': depthStyle[i]
    });
    rtreeExtentFeatures.push(feature);
  }
}

var vector = new ol.layer.Vector({
  source: vectorSource,
  styleFunction: function(feature) {
    return style;
  }
});

var rtree = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: rtreeExtentFeatures
  }),
  styleFunction: function(feature) {
    return feature.get('style');
  }
});

var map = new ol.Map({
  layers: [vector, rtree],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
