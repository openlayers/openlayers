import _ol_Feature_ from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import _ol_source_Cluster_ from '../src/ol/source/Cluster.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import _ol_style_Circle_ from '../src/ol/style/Circle.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';
import _ol_style_Text_ from '../src/ol/style/Text.js';


var distance = document.getElementById('distance');

var count = 20000;
var features = new Array(count);
var e = 4500000;
for (var i = 0; i < count; ++i) {
  var coordinates = [2 * e * Math.random() - e, 2 * e * Math.random() - e];
  features[i] = new _ol_Feature_(new Point(coordinates));
}

var source = new _ol_source_Vector_({
  features: features
});

var clusterSource = new _ol_source_Cluster_({
  distance: parseInt(distance.value, 10),
  source: source
});

var styleCache = {};
var clusters = new _ol_layer_Vector_({
  source: clusterSource,
  style: function(feature) {
    var size = feature.get('features').length;
    var style = styleCache[size];
    if (!style) {
      style = new _ol_style_Style_({
        image: new _ol_style_Circle_({
          radius: 10,
          stroke: new _ol_style_Stroke_({
            color: '#fff'
          }),
          fill: new _ol_style_Fill_({
            color: '#3399CC'
          })
        }),
        text: new _ol_style_Text_({
          text: size.toString(),
          fill: new _ol_style_Fill_({
            color: '#fff'
          })
        })
      });
      styleCache[size] = style;
    }
    return style;
  }
});

var raster = new TileLayer({
  source: new _ol_source_OSM_()
});

var map = new Map({
  layers: [raster, clusters],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});

distance.addEventListener('input', function() {
  clusterSource.setDistance(parseInt(distance.value, 10));
});
