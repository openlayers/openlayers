import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_RegularShape_ from '../src/ol/style/RegularShape.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';


var stroke = new _ol_style_Stroke_({color: 'black', width: 2});
var fill = new _ol_style_Fill_({color: 'red'});

var styles = {
  'square': new Style({
    image: new _ol_style_RegularShape_({
      fill: fill,
      stroke: stroke,
      points: 4,
      radius: 10,
      angle: Math.PI / 4
    })
  }),
  'triangle': new Style({
    image: new _ol_style_RegularShape_({
      fill: fill,
      stroke: stroke,
      points: 3,
      radius: 10,
      rotation: Math.PI / 4,
      angle: 0
    })
  }),
  'star': new Style({
    image: new _ol_style_RegularShape_({
      fill: fill,
      stroke: stroke,
      points: 5,
      radius: 10,
      radius2: 4,
      angle: 0
    })
  }),
  'cross': new Style({
    image: new _ol_style_RegularShape_({
      fill: fill,
      stroke: stroke,
      points: 4,
      radius: 10,
      radius2: 0,
      angle: 0
    })
  }),
  'x': new Style({
    image: new _ol_style_RegularShape_({
      fill: fill,
      stroke: stroke,
      points: 4,
      radius: 10,
      radius2: 0,
      angle: Math.PI / 4
    })
  })
};


var styleKeys = ['x', 'cross', 'star', 'triangle', 'square'];
var count = 250;
var features = new Array(count);
var e = 4500000;
for (var i = 0; i < count; ++i) {
  var coordinates = [2 * e * Math.random() - e, 2 * e * Math.random() - e];
  features[i] = new Feature(new Point(coordinates));
  features[i].setStyle(styles[styleKeys[Math.floor(Math.random() * 5)]]);
}

var source = new VectorSource({
  features: features
});

var vectorLayer = new VectorLayer({
  source: source
});

var map = new Map({
  layers: [
    vectorLayer
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
