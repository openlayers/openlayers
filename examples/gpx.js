import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GPX from '../src/ol/format/GPX.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import BingMaps from '../src/ol/source/BingMaps.js';
import VectorSource from '../src/ol/source/Vector.js';
import _ol_style_Circle_ from '../src/ol/style/Circle.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';

var raster = new TileLayer({
  source: new BingMaps({
    imagerySet: 'Aerial',
    key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5'
  })
});

var style = {
  'Point': new _ol_style_Style_({
    image: new _ol_style_Circle_({
      fill: new _ol_style_Fill_({
        color: 'rgba(255,255,0,0.4)'
      }),
      radius: 5,
      stroke: new _ol_style_Stroke_({
        color: '#ff0',
        width: 1
      })
    })
  }),
  'LineString': new _ol_style_Style_({
    stroke: new _ol_style_Stroke_({
      color: '#f00',
      width: 3
    })
  }),
  'MultiLineString': new _ol_style_Style_({
    stroke: new _ol_style_Stroke_({
      color: '#0f0',
      width: 3
    })
  })
};

var vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/gpx/fells_loop.gpx',
    format: new GPX()
  }),
  style: function(feature) {
    return style[feature.getGeometry().getType()];
  }
});

var map = new Map({
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new View({
    center: [-7916041.528716288, 5228379.045749711],
    zoom: 12
  })
});

var displayFeatureInfo = function(pixel) {
  var features = [];
  map.forEachFeatureAtPixel(pixel, function(feature) {
    features.push(feature);
  });
  if (features.length > 0) {
    var info = [];
    var i, ii;
    for (i = 0, ii = features.length; i < ii; ++i) {
      info.push(features[i].get('desc'));
    }
    document.getElementById('info').innerHTML = info.join(', ') || '(unknown)';
    map.getTarget().style.cursor = 'pointer';
  } else {
    document.getElementById('info').innerHTML = '&nbsp;';
    map.getTarget().style.cursor = '';
  }
};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('click', function(evt) {
  displayFeatureInfo(evt.pixel);
});
