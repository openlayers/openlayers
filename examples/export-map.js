import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    new VectorLayer({
      source: new VectorSource({
        url: 'data/geojson/countries.geojson',
        format: new GeoJSON()
      })
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

document.getElementById('export-png').addEventListener('click', function() {
  map.once('rendercomplete', function() {
    domtoimage.toPng(map.getViewport().querySelector('.ol-layers'))
      .then(function(dataURL) {
        const link = document.getElementById('image-download');
        link.href = dataURL;
        link.click();
      });
  });
  map.renderSync();
});
