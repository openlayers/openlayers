import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import {
  getPointResolution,
  get as getProjection,
  transform,
} from '../src/ol/proj.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const disabledLayer = new TileLayer({
  // specify className so forEachLayerAtPixel can distinguish layers
  className: 'ol-layer-dem',
  source: new XYZ({
    attributions: attributions,
    url:
      'https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=' + key,
    maxZoom: 10,
    crossOrigin: '',
    imageSmoothing: false,
  }),
});

const imagery = new TileLayer({
  className: 'ol-layer-imagery',
  source: new XYZ({
    attributions: attributions,
    url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=' + key,
    maxZoom: 20,
    crossOrigin: '',
  }),
});

const enabledLayer = new TileLayer({
  source: new XYZ({
    attributions: attributions,
    url:
      'https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=' + key,
    maxZoom: 10,
    crossOrigin: '',
  }),
});

imagery.on('prerender', function (evt) {
  // use opaque background to conceal DEM while fully opaque imagery renders
  if (imagery.getOpacity() === 1) {
    evt.context.fillStyle = 'white';
    evt.context.fillRect(
      0,
      0,
      evt.context.canvas.width,
      evt.context.canvas.height
    );
  }
});

const control = document.getElementById('opacity');
const output = document.getElementById('output');
const listener = function () {
  output.innerText = control.value;
  imagery.setOpacity(control.value / 100);
};
control.addEventListener('input', listener);
control.addEventListener('change', listener);
output.innerText = control.value;
imagery.setOpacity(control.value / 100);

const viewProjSelect = document.getElementById('view-projection');
const projection = getProjection(viewProjSelect.value);

const view = new View({
  center: transform([6.893, 45.8295], 'EPSG:4326', projection),
  zoom: 16,
  projection: projection,
});

const map1 = new Map({
  target: 'map1',
  layers: [disabledLayer, imagery],
  view: view,
});

const map2 = new Map({
  target: 'map2',
  layers: [enabledLayer],
  view: view,
});

const info1 = document.getElementById('info1');
const info2 = document.getElementById('info2');

const showElevations = function (evt) {
  if (evt.dragging) {
    return;
  }
  map1.forEachLayerAtPixel(
    evt.pixel,
    function (layer, pixel) {
      const height =
        -10000 + (pixel[0] * 256 * 256 + pixel[1] * 256 + pixel[2]) * 0.1;
      info1.innerText = height.toFixed(1);
    },
    {
      layerFilter: function (layer) {
        return layer === disabledLayer;
      },
    }
  );
  map2.forEachLayerAtPixel(
    evt.pixel,
    function (layer, pixel) {
      const height =
        -10000 + (pixel[0] * 256 * 256 + pixel[1] * 256 + pixel[2]) * 0.1;
      info2.innerText = height.toFixed(1);
    },
    {
      layerFilter: function (layer) {
        return layer === enabledLayer;
      },
    }
  );
};

map1.on('pointermove', showElevations);
map2.on('pointermove', showElevations);

viewProjSelect.addEventListener('change', function () {
  const currentView = map1.getView();
  const currentProjection = currentView.getProjection();
  const newProjection = getProjection(viewProjSelect.value);
  const currentResolution = currentView.getResolution();
  const currentCenter = currentView.getCenter();
  const currentRotation = currentView.getRotation();
  const newCenter = transform(currentCenter, currentProjection, newProjection);
  const currentPointResolution = getPointResolution(
    currentProjection,
    1,
    currentCenter,
    'm'
  );
  const newPointResolution = getPointResolution(
    newProjection,
    1,
    newCenter,
    'm'
  );
  const newResolution =
    (currentResolution * currentPointResolution) / newPointResolution;
  const newView = new View({
    center: newCenter,
    resolution: newResolution,
    rotation: currentRotation,
    projection: newProjection,
  });
  map1.setView(newView);
  map2.setView(newView);
});
