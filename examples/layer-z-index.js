import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_RegularShape_ from '../src/ol/style/RegularShape.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';


var stroke = new _ol_style_Stroke_({color: 'black', width: 1});

var styles = {
  'square': new _ol_style_Style_({
    image: new _ol_style_RegularShape_({
      fill: new _ol_style_Fill_({color: 'blue'}),
      stroke: stroke,
      points: 4,
      radius: 80,
      angle: Math.PI / 4
    })
  }),
  'triangle': new _ol_style_Style_({
    image: new _ol_style_RegularShape_({
      fill: new _ol_style_Fill_({color: 'red'}),
      stroke: stroke,
      points: 3,
      radius: 80,
      rotation: Math.PI / 4,
      angle: 0
    })
  }),
  'star': new _ol_style_Style_({
    image: new _ol_style_RegularShape_({
      fill: new _ol_style_Fill_({color: 'green'}),
      stroke: stroke,
      points: 5,
      radius: 80,
      radius2: 4,
      angle: 0
    })
  })
};


function createLayer(coordinates, style, zIndex) {
  var feature = new Feature(new Point(coordinates));
  feature.setStyle(style);

  var source = new _ol_source_Vector_({
    features: [feature]
  });

  var vectorLayer = new _ol_layer_Vector_({
    source: source
  });
  vectorLayer.setZIndex(zIndex);

  return vectorLayer;
}

var layer0 = createLayer([40, 40], styles['star'], 0);
var layer1 = createLayer([0, 0], styles['square'], 1);
var layer2 = createLayer([0, 40], styles['triangle'], 0);

var layers = [];
layers.push(layer1);
layers.push(layer2);

var map = new Map({
  layers: layers,
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 18
  })
});

layer0.setMap(map);


function bindInputs(id, layer) {
  var idxInput = document.getElementById('idx' + id);
  idxInput.onchange = function() {
    layer.setZIndex(parseInt(this.value, 10) || 0);
  };
  idxInput.value = String(layer.getZIndex());
}
bindInputs(1, layer1);
bindInputs(2, layer2);
