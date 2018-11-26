import Map from 'ol/Map';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';

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
