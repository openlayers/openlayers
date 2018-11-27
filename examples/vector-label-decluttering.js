import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {getWidth} from '../src/ol/extent.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import {Fill, Stroke, Style, Text} from '../src/ol/style.js';

const map = new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1
  })
});

const labelStyle = new Style({
  geometry: function(feature) {
    let geometry = feature.getGeometry();
    if (geometry.getType() == 'MultiPolygon') {
      // Only render label for the widest polygon of a multipolygon
      const polygons = geometry.getPolygons();
      let widest = 0;
      for (let i = 0, ii = polygons.length; i < ii; ++i) {
        const polygon = polygons[i];
        const width = getWidth(polygon.getExtent());
        if (width > widest) {
          widest = width;
          geometry = polygon;
        }
      }
    }
    return geometry;
  },
  text: new Text({
    font: '12px Calibri,sans-serif',
    overflow: true,
    fill: new Fill({
      color: '#000'
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 3
    })
  })
});
const countryStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new Stroke({
    color: '#319FD3',
    width: 1
  })
});
const style = [countryStyle, labelStyle];

const vectorLayer = new VectorLayer({
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
