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
    zoom: 2,
    multiWorld: true
  })
});

const selected = [];

const status = document.getElementById('status');

map.on('singleclick', function(e) {
  map.forEachFeatureAtPixel(e.pixel, function(f) {
    const selIndex = selected.indexOf(f);
    if (selIndex < 0) {
      selected.push(f);
      f.setStyle(highlightStyle);
    } else {
      selected.splice(selIndex, 1);
      f.setStyle(undefined);
    }
  });

  status.innerHTML = '&nbsp;' + selected.length + ' selected features';
});
