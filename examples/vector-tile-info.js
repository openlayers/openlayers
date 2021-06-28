import MVT from '../src/ol/format/MVT.js';
import Map from '../src/ol/Map.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import View from '../src/ol/View.js';

const map = new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
  layers: [
    new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        url: 'https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer/tile/{z}/{y}/{x}.pbf',
      }),
    }),
  ],
});

map.on('pointermove', showInfo);

const info = document.getElementById('info');
function showInfo(event) {
  const features = map.getFeaturesAtPixel(event.pixel);
  if (features.length == 0) {
    info.innerText = '';
    info.style.opacity = 0;
    return;
  }
  const properties = features[0].getProperties();
  info.innerText = JSON.stringify(properties, null, 2);
  info.style.opacity = 1;
}
