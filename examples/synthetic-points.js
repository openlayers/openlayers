import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import LineString from '../src/ol/geom/LineString.js';
import Point from '../src/ol/geom/Point.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import _ol_style_Circle_ from '../src/ol/style/Circle.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';


var count = 20000;
var features = new Array(count);
var e = 18000000;
for (var i = 0; i < count; ++i) {
  features[i] = new Feature({
    'geometry': new Point(
        [2 * e * Math.random() - e, 2 * e * Math.random() - e]),
    'i': i,
    'size': i % 2 ? 10 : 20
  });
}

var styles = {
  '10': new _ol_style_Style_({
    image: new _ol_style_Circle_({
      radius: 5,
      fill: new _ol_style_Fill_({color: '#666666'}),
      stroke: new _ol_style_Stroke_({color: '#bada55', width: 1})
    })
  }),
  '20': new _ol_style_Style_({
    image: new _ol_style_Circle_({
      radius: 10,
      fill: new _ol_style_Fill_({color: '#666666'}),
      stroke: new _ol_style_Stroke_({color: '#bada55', width: 1})
    })
  })
};

var vectorSource = new _ol_source_Vector_({
  features: features,
  wrapX: false
});
var vector = new VectorLayer({
  source: vectorSource,
  style: function(feature) {
    return styles[feature.get('size')];
  }
});

var map = new Map({
  layers: [vector],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

var point = null;
var line = null;
var displaySnap = function(coordinate) {
  var closestFeature = vectorSource.getClosestFeatureToCoordinate(coordinate);
  if (closestFeature === null) {
    point = null;
    line = null;
  } else {
    var geometry = closestFeature.getGeometry();
    var closestPoint = geometry.getClosestPoint(coordinate);
    if (point === null) {
      point = new Point(closestPoint);
    } else {
      point.setCoordinates(closestPoint);
    }
    if (line === null) {
      line = new LineString([coordinate, closestPoint]);
    } else {
      line.setCoordinates([coordinate, closestPoint]);
    }
  }
  map.render();
};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  var coordinate = map.getEventCoordinate(evt.originalEvent);
  displaySnap(coordinate);
});

map.on('click', function(evt) {
  displaySnap(evt.coordinate);
});

var stroke = new _ol_style_Stroke_({
  color: 'rgba(255,255,0,0.9)',
  width: 3
});
var style = new _ol_style_Style_({
  stroke: stroke,
  image: new _ol_style_Circle_({
    radius: 10,
    stroke: stroke
  })
});

map.on('postcompose', function(evt) {
  var vectorContext = evt.vectorContext;
  vectorContext.setStyle(style);
  if (point !== null) {
    vectorContext.drawGeometry(point);
  }
  if (line !== null) {
    vectorContext.drawGeometry(line);
  }
});

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  var pixel = map.getEventPixel(evt.originalEvent);
  var hit = map.hasFeatureAtPixel(pixel);
  if (hit) {
    map.getTarget().style.cursor = 'pointer';
  } else {
    map.getTarget().style.cursor = '';
  }
});
