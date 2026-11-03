import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MVT from '../src/ol/format/MVT.js';
import WebGLVectorTileLayer from '../src/ol/layer/WebGLVectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';

const style = [
  {
    filter: ['==', ['geometry-type'], 'Polygon'],
    style: {
      'fill-color': [
        'match',
        ['get', 'layer'],
        'Water area',
        '#a0c8f0',
        '#eee',
      ],
      'stroke-color': '#c8c8c8',
      'stroke-width': 1,
    },
  },
  {
    filter: ['==', ['geometry-type'], 'LineString'],
    style: {
      'stroke-color': '#a06060',
      'stroke-width': 2,
    },
  },
  {
    filter: ['==', ['geometry-type'], 'Point'],
    style: {
      'circle-radius': 4,
      'circle-fill-color': '#336699',
    },
  },
];

const map = new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
  layers: [
    new WebGLVectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        url: 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/tile/{z}/{y}/{x}.pbf',
      }),
      style,
    }),
  ],
});

const mapTarget = map.getTargetElement();
mapTarget.addEventListener('pointerleave', showInfo);
map.on('pointermove', (evt) => {
  if (evt.dragging) {
    return;
  }
  showInfo(evt);
});

const info = document.getElementById('info');
function showInfo(event) {
  const features =
    event.type === 'pointerleave' ? [] : map.getFeaturesAtPixel(event.pixel);
  if (features.length == 0) {
    info.innerText = '';
    info.style.opacity = '0';
    return;
  }
  const properties = features[0].getProperties();
  info.innerText = JSON.stringify(properties, null, 2);
  info.style.opacity = '1';
}
