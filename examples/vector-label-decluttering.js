import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import * as _ol_extent_ from '../src/ol/extent.js';
import _ol_format_GeoJSON_ from '../src/ol/format/GeoJSON.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';
import _ol_style_Text_ from '../src/ol/style/Text.js';

var map = new _ol_Map_({
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 1
  })
});

var labelStyle = new _ol_style_Style_({
  geometry: function(feature) {
    var geometry = feature.getGeometry();
    if (geometry.getType() == 'MultiPolygon') {
      // Only render label for the widest polygon of a multipolygon
      var polygons = geometry.getPolygons();
      var widest = 0;
      for (var i = 0, ii = polygons.length; i < ii; ++i) {
        var polygon = polygons[i];
        var width = _ol_extent_.getWidth(polygon.getExtent());
        if (width > widest) {
          widest = width;
          geometry = polygon;
        }
      }
    }
    return geometry;
  },
  text: new _ol_style_Text_({
    font: '12px Calibri,sans-serif',
    overflow: true,
    fill: new _ol_style_Fill_({
      color: '#000'
    }),
    stroke: new _ol_style_Stroke_({
      color: '#fff',
      width: 3
    })
  })
});
var countryStyle = new _ol_style_Style_({
  fill: new _ol_style_Fill_({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new _ol_style_Stroke_({
    color: '#319FD3',
    width: 1
  })
});
var style = [countryStyle, labelStyle];

var vectorLayer = new _ol_layer_Vector_({
  source: new _ol_source_Vector_({
    url: 'data/geojson/countries.geojson',
    format: new _ol_format_GeoJSON_()
  }),
  style: function(feature) {
    labelStyle.getText().setText(feature.get('name'));
    return style;
  },
  declutter: true
});

map.addLayer(vectorLayer);
