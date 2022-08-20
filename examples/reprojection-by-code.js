import Graticule from '../src/ol/layer/Graticule.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import Stroke from '../src/ol/style/Stroke.js';
import TileDebug from '../src/ol/source/TileDebug.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import proj4 from 'proj4';
import {applyTransform} from '../src/ol/extent.js';
import {get as getProjection, getTransform} from '../src/ol/proj.js';
import {register} from '../src/ol/proj/proj4.js';

const osmSource = new OSM();

const debugLayer = new TileLayer({
  source: new TileDebug({
    tileGrid: osmSource.getTileGrid(),
    projection: osmSource.getProjection(),
  }),
  visible: false,
});

const graticule = new Graticule({
  // the style to use for the lines, optional.
  strokeStyle: new Stroke({
    color: 'rgba(255,120,0,0.9)',
    width: 2,
    lineDash: [0.5, 4],
  }),
  showLabels: true,
  visible: false,
  wrapX: false,
});

const map = new Map({
  layers: [
    new TileLayer({
      source: osmSource,
    }),
    debugLayer,
    graticule,
  ],
  target: 'map',
  view: new View({
    projection: 'EPSG:3857',
    center: [0, 0],
    zoom: 1,
  }),
});

const queryInput = document.getElementById('epsg-query');
const searchButton = document.getElementById('epsg-search');
const resultSpan = document.getElementById('epsg-result');
const renderEdgesCheckbox = document.getElementById('render-edges');
const showTilesCheckbox = document.getElementById('show-tiles');
const showGraticuleCheckbox = document.getElementById('show-graticule');

function setProjection(code, name, proj4def, bbox) {
  if (code === null || name === null || proj4def === null || bbox === null) {
    resultSpan.innerHTML = 'Nothing usable found, using EPSG:3857...';
    map.setView(
      new View({
        projection: 'EPSG:3857',
        center: [0, 0],
        zoom: 1,
      })
    );
    return;
  }

  resultSpan.innerHTML = '(' + code + ') ' + name;

  const newProjCode = 'EPSG:' + code;
  proj4.defs(newProjCode, proj4def);
  register(proj4);
  const newProj = getProjection(newProjCode);
  const fromLonLat = getTransform('EPSG:4326', newProj);

  let worldExtent = [bbox[1], bbox[2], bbox[3], bbox[0]];
  newProj.setWorldExtent(worldExtent);

  // approximate calculation of projection extent,
  // checking if the world extent crosses the dateline
  if (bbox[1] > bbox[3]) {
    worldExtent = [bbox[1], bbox[2], bbox[3] + 360, bbox[0]];
  }
  const extent = applyTransform(worldExtent, fromLonLat, undefined, 8);
  newProj.setExtent(extent);
  const newView = new View({
    projection: newProj,
  });
  map.setView(newView);
  newView.fit(extent);
}

function search(query) {
  resultSpan.innerHTML = 'Searching ...';
  fetch('https://epsg.io/?format=json&q=' + query)
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {
      const results = json['results'];
      if (results && results.length > 0) {
        for (let i = 0, ii = results.length; i < ii; i++) {
          const result = results[i];
          if (result) {
            const code = result['code'];
            const name = result['name'];
            const proj4def = result['proj4'];
            const bbox = result['bbox'];
            if (
              code &&
              code.length > 0 &&
              proj4def &&
              proj4def.length > 0 &&
              bbox &&
              bbox.length == 4
            ) {
              setProjection(code, name, proj4def, bbox);
              return;
            }
          }
        }
      }
      setProjection(null, null, null, null);
    });
}

/**
 * Handle click event.
 * @param {Event} event The event.
 */
searchButton.onclick = function (event) {
  search(queryInput.value);
  event.preventDefault();
};

/**
 * Handle checkbox change events.
 */
function onReprojectionChange() {
  osmSource.setRenderReprojectionEdges(renderEdgesCheckbox.checked);
}
function onGraticuleChange() {
  graticule.setVisible(showGraticuleCheckbox.checked);
}
function onTilesChange() {
  debugLayer.setVisible(showTilesCheckbox.checked);
}
showGraticuleCheckbox.addEventListener('change', onGraticuleChange);
renderEdgesCheckbox.addEventListener('change', onReprojectionChange);
showTilesCheckbox.addEventListener('change', onTilesChange);

onReprojectionChange();
onGraticuleChange();
onTilesChange();
