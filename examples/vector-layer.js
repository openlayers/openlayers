import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';
import _ol_style_Text_ from '../src/ol/style/Text.js';


var style = new _ol_style_Style_({
  fill: new _ol_style_Fill_({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new _ol_style_Stroke_({
    color: '#319FD3',
    width: 1
  }),
  text: new _ol_style_Text_({
    font: '12px Calibri,sans-serif',
    fill: new _ol_style_Fill_({
      color: '#000'
    }),
    stroke: new _ol_style_Stroke_({
      color: '#fff',
      width: 3
    })
  })
});

var vectorLayer = new _ol_layer_Vector_({
  source: new _ol_source_Vector_({
    url: 'data/geojson/countries.geojson',
    format: new GeoJSON()
  }),
  style: function(feature) {
    style.getText().setText(feature.get('name'));
    return style;
  }
});

var map = new Map({
  layers: [vectorLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1
  })
});

var highlightStyle = new _ol_style_Style_({
  stroke: new _ol_style_Stroke_({
    color: '#f00',
    width: 1
  }),
  fill: new _ol_style_Fill_({
    color: 'rgba(255,0,0,0.1)'
  }),
  text: new _ol_style_Text_({
    font: '12px Calibri,sans-serif',
    fill: new _ol_style_Fill_({
      color: '#000'
    }),
    stroke: new _ol_style_Stroke_({
      color: '#f00',
      width: 3
    })
  })
});

var featureOverlay = new _ol_layer_Vector_({
  source: new _ol_source_Vector_(),
  map: map,
  style: function(feature) {
    highlightStyle.getText().setText(feature.get('name'));
    return highlightStyle;
  }
});

var highlight;
var displayFeatureInfo = function(pixel) {

  var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
    return feature;
  });

  var info = document.getElementById('info');
  if (feature) {
    info.innerHTML = feature.getId() + ': ' + feature.get('name');
  } else {
    info.innerHTML = '&nbsp;';
  }

  if (feature !== highlight) {
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight);
    }
    if (feature) {
      featureOverlay.getSource().addFeature(feature);
    }
    highlight = feature;
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
