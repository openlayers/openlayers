import proj4 from 'proj4';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {getCenter} from '../src/ol/extent.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Link from '../src/ol/interaction/Link.js';
import WebGPUTileLayer from '../src/ol/layer/WebGPUTile.js';
import WebGPUVectorLayer from '../src/ol/layer/WebGPUVector.js';
import {get as getProjection} from '../src/ol/proj.js';
import {register} from '../src/ol/proj/proj4.js';
import DataTile from '../src/ol/source/DataTile.js';
import ImageTile from '../src/ol/source/ImageTile.js';
import VectorSource from '../src/ol/source/Vector.js';
import {createXYZ} from '../src/ol/tilegrid.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const projections = [
  {
    code: 'EPSG:27700',
    def:
      '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 ' +
      '+x_0=400000 +y_0=-100000 +ellps=airy ' +
      '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
      '+units=m +no_defs',
    extent: [-650000, -150000, 1350000, 1450000],
  },
  {
    code: 'EPSG:23032',
    def:
      '+proj=utm +zone=32 +ellps=intl ' +
      '+towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs',
    extent: [-1206118.71, 4021309.92, 1295389.0, 8051813.28],
  },
  {
    code: 'EPSG:5479',
    def:
      '+proj=lcc +lat_1=-76.66666666666667 +lat_2=' +
      '-79.33333333333333 +lat_0=-78 +lon_0=163 +x_0=7000000 +y_0=5000000 ' +
      '+ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    extent: [6825737.53, 4189159.8, 9633741.96, 5782472.71],
  },
  {
    code: 'EPSG:3413',
    def:
      '+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 ' +
      '+x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    extent: [-4194304, -4194304, 4194304, 4194304],
  },
  {
    code: 'EPSG:2163',
    def:
      '+proj=laea +lat_0=45 +lon_0=-100 +x_0=0 +y_0=0 ' +
      '+a=6370997 +b=6370997 +units=m +no_defs',
    extent: [-8040784.5135, -2577524.921, 3668901.4484, 4785105.1096],
  },
  {
    code: 'ESRI:54009',
    def: '+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    extent: [-18e6, -9e6, 18e6, 9e6],
  },
];

for (const {code, def} of projections) {
  proj4.defs(code, def);
}
register(proj4);
for (const {code, extent} of projections) {
  getProjection(code).setExtent(extent);
}

const base = new WebGPUTileLayer({
  source: new ImageTile({
    attributions: attributions,
    url:
      'https://api.maptiler.com/maps/aquarelle-v4/{z}/{x}/{y}.png?key=' + key,
    tileSize: 512,
    maxZoom: 20,
  }),
});

const size = 256;

const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const context = canvas.getContext('2d', {willReadFrequently: true});

const raster = new WebGPUTileLayer({
  source: new DataTile({
    projection: 'EPSG:4326',
    wrapX: true,
    interpolate: true,
    transition: 0,
    tileGrid: createXYZ({
      extent: [-180, -90, 180, 90],
      maxResolution: 180 / size,
      maxZoom: 7,
      tileSize: size,
    }),
    loader: function (z, x, y) {
      const half = size / 2;
      context.clearRect(0, 0, size, size);

      context.strokeStyle = 'rgba(0,0,0,0.35)';
      context.lineWidth = 0.5;
      const step = size / 4;
      for (let i = 0; i <= size; i += step) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, size);
        context.moveTo(0, i);
        context.lineTo(size, i);
        context.stroke();
      }

      context.strokeStyle = 'rgba(0,0,0,0.85)';
      context.lineWidth = 0.5;
      context.strokeRect(1, 1, size - 1, size - 1);

      context.font = 'bold 16px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.lineWidth = 3;
      context.strokeStyle = 'rgba(255,255,255,0.9)';
      context.strokeText('EPSG:4326', half, half - 18);
      context.font = '14px sans-serif';
      context.strokeText(`z:${z}  x:${x}  y:${y}`, half, half + 10);
      context.fillStyle = 'rgba(0,0,0,0.85)';
      context.font = 'bold 16px sans-serif';
      context.fillText('EPSG:4326', half, half - 18);
      context.font = '14px sans-serif';
      context.fillText(`z:${z}  x:${x}  y:${y}`, half, half + 10);

      return context.getImageData(0, 0, size, size).data;
    },
  }),
});

const vectorSource = new VectorSource({
  url: 'https://openlayers.org/data/vector/ecoregions.json',
  format: new GeoJSON(),
});
vectorSource.setProjection('EPSG:4326');

const vector = new WebGPUVectorLayer({
  source: vectorSource,
  style: [
    {
      filter: ['==', ['var', 'highlightedId'], ['id']],
      style: {
        'stroke-color': 'white',
        'stroke-width': 2.5,
        'fill-color': '#00AAFF99',
      },
    },
    {
      else: true,
      style: {
        'stroke-color': '#777777aa',
        'stroke-width': 0.5,
        'fill-color': [255, 255, 255, 0.1],
      },
    },
  ],
  variables: {
    highlightedId: -1,
  },
});

const map = new Map({
  layers: [base, vector, raster],
  target: 'map',
  view: new View({
    projection: 'EPSG:3857',
    center: [0, 0],
    zoom: 1,
  }),
});

const viewProjSelect = /** @type {HTMLSelectElement} */ (
  document.getElementById('view-projection')
);
const visibleRaster = /** @type {HTMLInputElement} */ (
  document.getElementById('visible-raster')
);
const visibleVector = /** @type {HTMLInputElement} */ (
  document.getElementById('visible-vector')
);

function updateViewProjection() {
  const newProj = getProjection(viewProjSelect.value);
  if (!newProj) {
    return;
  }
  const newProjExtent = newProj.getExtent();
  map.setView(
    new View({
      projection: newProj,
      center: getCenter(newProjExtent || [0, 0, 0, 0]),
      zoom: 0,
      extent: newProjExtent || undefined,
    }),
  );
}

function isKnownProjection(code) {
  return [...viewProjSelect.options].some((option) => option.value === code);
}

function setViewProjection(code) {
  const next = code && isKnownProjection(code) ? code : 'EPSG:3857';
  if (viewProjSelect.value === next) {
    return;
  }
  viewProjSelect.value = next;
  updateViewProjection();
}

const link = new Link();

const initialProjection = link.track('viewProj', (newValue) => {
  setViewProjection(newValue);
});
if (initialProjection && isKnownProjection(initialProjection)) {
  viewProjSelect.value = initialProjection;
}
updateViewProjection();

viewProjSelect.onchange = () => {
  updateViewProjection();
  link.update('viewProj', viewProjSelect.value);
};

visibleRaster.addEventListener('change', () => {
  raster.setVisible(visibleRaster.checked);
});
visibleVector.addEventListener('change', () => {
  vector.setVisible(visibleVector.checked);
});
raster.on('change:visible', () => {
  visibleRaster.checked = raster.getVisible();
});
vector.on('change:visible', () => {
  visibleVector.checked = vector.getVisible();
});

map.addInteraction(link);

let highlightedId = -1;
function displayFeatureInfo(pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, (f) => f);
  const info = document.getElementById('info');
  if (info) {
    info.innerHTML = feature ? feature.get('ECO_NAME') || '&nbsp;' : '&nbsp;';
  }
  map.getTargetElement().style.cursor = feature ? 'pointer' : '';

  const id = feature ? feature.getId() : -1;
  if (id !== highlightedId) {
    highlightedId = id;
    vector.updateStyleVariables({highlightedId});
  }
}

map.on('pointermove', (evt) => {
  if (!evt.dragging) {
    displayFeatureInfo(evt.pixel);
  }
});

map.on('click', (evt) => {
  displayFeatureInfo(evt.pixel);
});
