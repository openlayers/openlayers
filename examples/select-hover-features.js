import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import Style from '../src/ol/style/Style.js';
import Fill from '../src/ol/style/Fill.js';
import Stroke from '../src/ol/style/Stroke.js';

const raster = new TileLayer({
  source: new OSM()
});

const highlightStyle = new Style({
  fill: new Fill({
    color: 'rgba(255,255,255,0.7)'
  }),
  stroke: new Stroke({
    color: '#3399CC',
    width: 3
  })
});

const vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/countries.geojson',
    format: new GeoJSON()
  })
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

let selected = null;
const status = document.getElementById('status');

map.on('pointermove', function(e) {
  if (selected !== null) {
    selected.setStyle(undefined);
    selected = null;
  }

  map.forEachFeatureAtPixel(e.pixel, function(f) {
    selected = f;
    f.setStyle(highlightStyle);
    return true;
  });

  if (selected) {
    status.innerHTML = '&nbsp;Hovering: ' + selected.get('name');
  } else {
    status.innerHTML = '&nbsp;';
  }
});
