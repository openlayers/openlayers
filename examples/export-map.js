import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';
import {
  Heatmap as HeatmapLayer,
  Vector as VectorLayer,
} from '../src/ol/layer.js';

const map = new Map({
  layers: [
    new VectorLayer({
      background: '#a9d3df',
      source: new VectorSource({
        url: 'data/geojson/countries.geojson',
        format: new GeoJSON(),
      }),
      style: new Style({
        stroke: new Stroke({
          color: '#ccc',
        }),
        fill: new Fill({
          color: 'white',
        }),
      }),
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
      opacity: 0.5,
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
    const mapCanvas = document.createElement('canvas');
    const size = map.getSize();
    mapCanvas.width = size[0];
    mapCanvas.height = size[1];
    const mapContext = mapCanvas.getContext('2d');
    Array.prototype.forEach.call(
      map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
      function (canvas) {
        if (canvas.width > 0) {
          const backgroundColor = canvas.parentNode.style.backgroundColor;
          if (backgroundColor) {
            mapContext.fillStyle = backgroundColor;
            mapContext.fillRect(0, 0, canvas.width, canvas.height);
          }

          const opacity =
            canvas.parentNode.style.opacity || canvas.style.opacity;
          mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
          let matrix;
          const transform = canvas.style.transform;
          if (transform) {
            // Get the transform parameters from the style's transform matrix
            matrix = transform
              .match(/^matrix\(([^\(]*)\)$/)[1]
              .split(',')
              .map(Number);
          } else {
            matrix = [
              parseFloat(canvas.style.width) / canvas.width,
              0,
              0,
              parseFloat(canvas.style.height) / canvas.height,
              0,
              0,
            ];
          }
          // Apply the transform to the export map context
          CanvasRenderingContext2D.prototype.setTransform.apply(
            mapContext,
            matrix
          );
          mapContext.drawImage(canvas, 0, 0);
        }
      }
    );
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
