import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import GeoJSON from '../../../src/ol/format/GeoJSON.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import {Fill, Stroke, Style, Text} from '../../../src/ol/style.js';

const map = new Map({
  target: 'map',
  view: new View({
    center: [-17465028, 2331736],
    zoom: 5
  })
});

const labelStyle = new Style({
  text: new Text({
    font: '16px Ubuntu',
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
    url: '/data/countries.json',
    format: new GeoJSON()
  }),
  style: function(feature) {
    labelStyle.getText().setText(feature.get('name'));
    return style;
  },
  declutter: true
});

map.addLayer(vectorLayer);


render({tolerance: 0.007});
