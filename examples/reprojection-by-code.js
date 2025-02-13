import proj4 from 'proj4';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {applyTransform} from '../src/ol/extent.js';
import Graticule from '../src/ol/layer/Graticule.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {register} from '../src/ol/proj/proj4.js';
import {get as getProjection, getTransform} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import TileDebug from '../src/ol/source/TileDebug.js';
import Stroke from '../src/ol/style/Stroke.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';

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
      }),
    );
    return;
  }

  resultSpan.innerHTML = '(' + code + ') ' + name;

  proj4.defs(code, proj4def);
  register(proj4);
  const newProj = getProjection(code);
  const fromLonLat = getTransform('EPSG:4326', newProj);

  newProj.setWorldExtent(bbox);

  // approximate calculation of projection extent,
  // checking if the world extent crosses the dateline
  if (bbox[0] > bbox[2]) {
    bbox[2] += 360;
  }
  const extent = applyTransform(bbox, fromLonLat, undefined, 8);
  newProj.setExtent(extent);
  const newView = new View({
    projection: newProj,
  });
  map.setView(newView);
  newView.fit(extent);
}

function search(query) {
  resultSpan.innerHTML = 'Searching ...';
  fetch(
    `https://api.maptiler.com/coordinates/search/${query}.json?exports=true&key=${key}`,
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {
      const results = json['results'];
      if (results && results.length > 0) {
        for (let i = 0, ii = results.length; i < ii; i++) {
          const result = results[i];
          if (result) {
            const id = result['id'];
            const code = id['authority'] + ':' + id['code'];
            const name = result['name'];
            const proj4def = result['exports']['wkt'];
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
