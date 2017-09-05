import _ol_Feature_ from '../src/ol/feature';
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_geom_LineString_ from '../src/ol/geom/linestring';
import _ol_geom_Point_ from '../src/ol/geom/point';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Circle_ from '../src/ol/style/circle';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';


var count = 20000;
var features = new Array(count);
var e = 18000000;
for (var i = 0; i < count; ++i) {
  features[i] = new _ol_Feature_({
    'geometry': new _ol_geom_Point_(
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
var vector = new _ol_layer_Vector_({
  source: vectorSource,
  style: function(feature) {
    return styles[feature.get('size')];
  }
});

var map = new _ol_Map_({
  layers: [vector],
  target: document.getElementById('map'),
  view: new _ol_View_({
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
      point = new _ol_geom_Point_(closestPoint);
    } else {
      point.setCoordinates(closestPoint);
    }
    if (line === null) {
      line = new _ol_geom_LineString_([coordinate, closestPoint]);
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
