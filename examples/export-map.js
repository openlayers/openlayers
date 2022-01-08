import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, Style} from '../src/ol/style.js';
import {
  Heatmap as HeatmapLayer,
  Vector as VectorLayer,
} from '../src/ol/layer.js';
import {asArray} from '../src/ol/color.js';

const style = new Style({
  fill: new Fill({
    color: '#eeeeee',
  }),
});

const map = new Map({
  layers: [
    new VectorLayer({
      source: new VectorSource({
        url: 'https://openlayers.org/data/vector/ecoregions.json',
        format: new GeoJSON(),
      }),
      background: 'white',
      style: function (feature) {
        const color = asArray(feature.get('COLOR_NNH') || '#eeeeee');
        color[3] = 0.75;
        style.getFill().setColor(color);
        return style;
      },
    }),
    new HeatmapLayer({
      source: new VectorSource({
        url: 'data/geojson/world-cities.geojson',
        format: new GeoJSON(),
      }),
      weight: function (feature) {
        return feature.get('population') / 1e7;
      },
      radius: 15,
      blur: 15,
      opacity: 0.75,
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

document.getElementById('export-png').addEventListener('click', function () {
  map.once('rendercomplete', function () {
    const mapCanvas = map.getCompositeCanvas();
    if (navigator.msSaveBlob) {
      // link download attribute does not work on MS browsers
      navigator.msSaveBlob(mapCanvas.msToBlob(), 'map.png');
    } else {
      const link = document.getElementById('image-download');
      link.href = mapCanvas.toDataURL();
      link.click();
    }
  });
  map.renderSync();
});
