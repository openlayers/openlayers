import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_format_GeoJSON_ from '../src/ol/format/geojson';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';
import _ol_style_Text_ from '../src/ol/style/text';


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
    format: new _ol_format_GeoJSON_()
  }),
  style: function(feature, resolution) {
    style.getText().setText(resolution < 5000 ? feature.get('name') : '');
    return style;
  }
});

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    }),
    vectorLayer
  ],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 1
  })
});

var highlightStyleCache = {};

var featureOverlay = new _ol_layer_Vector_({
  source: new _ol_source_Vector_(),
  map: map,
  style: function(feature, resolution) {
    var text = resolution < 5000 ? feature.get('name') : '';
    if (!highlightStyleCache[text]) {
      highlightStyleCache[text] = new _ol_style_Style_({
        stroke: new _ol_style_Stroke_({
          color: '#f00',
          width: 1
        }),
        fill: new _ol_style_Fill_({
          color: 'rgba(255,0,0,0.1)'
        }),
        text: new _ol_style_Text_({
          font: '12px Calibri,sans-serif',
          text: text,
          fill: new _ol_style_Fill_({
            color: '#000'
          }),
          stroke: new _ol_style_Stroke_({
            color: '#f00',
            width: 3
          })
        })
      });
    }
    return highlightStyleCache[text];
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
