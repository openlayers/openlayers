import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import * as _ol_extent_ from '../src/ol/extent.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';
import _ol_style_Text_ from '../src/ol/style/Text.js';

var map = new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1
  })
});

var labelStyle = new Style({
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
var countryStyle = new Style({
  fill: new _ol_style_Fill_({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new _ol_style_Stroke_({
    color: '#319FD3',
    width: 1
  })
});
var style = [countryStyle, labelStyle];

var vectorLayer = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/countries.geojson',
    format: new GeoJSON()
  }),
  style: function(feature) {
    labelStyle.getText().setText(feature.get('name'));
    return style;
  },
  declutter: true
});

map.addLayer(vectorLayer);
