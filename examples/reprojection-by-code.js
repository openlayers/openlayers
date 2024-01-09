import Graticule from '../src/ol/layer/Graticule.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import Stroke from '../src/ol/style/Stroke.js';
import TileDebug from '../src/ol/source/TileDebug.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import proj4 from 'proj4';
import {applyTransform} from '../src/ol/extent.js';
import {fromEPSGCode, register} from '../src/ol/proj/proj4.js';
import {getTransform} from '../src/ol/proj.js';

register(proj4);

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

function setProjection(projection, name, bbox) {
  if (projection === null || name === null || bbox === null) {
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

  resultSpan.innerHTML = '(' + projection.getCode() + ') ' + name;

  const fromLonLat = getTransform('EPSG:4326', projection);

  projection.setWorldExtent(bbox);

  // approximate calculation of projection extent,
  // checking if the world extent crosses the dateline
  if (bbox[0] > bbox[2]) {
    bbox = [bbox[0], bbox[1], bbox[2] + 360, bbox[3]];
  }
  const extent = applyTransform(bbox, fromLonLat, undefined, 8);
  projection.setExtent(extent);
  const newView = new View({
    projection: projection,
  });
  map.setView(newView);
  newView.fit(extent);
}

function loadProjection(epsgCode) {
  resultSpan.innerHTML = 'Loading ...';
  fromEPSGCode(epsgCode)
    .then((projection) => {
      const code = projection.getCode().substring(5);
      fetch(`https://spatialreference.org/ref/epsg/${code}/projjson.json`)
        .then((response) => response.json())
        .then((json) =>
          setProjection(projection, json.name, [
            json.bbox.west_longitude,
            json.bbox.south_latitude,
            json.bbox.east_longitude,
            json.bbox.north_latitude,
          ]),
        );
    })
    .catch(() => setProjection(null, null, null));
}

/**
 * Handle click event.
 * @param {Event} event The event.
 */
searchButton.onclick = function (event) {
  loadProjection(queryInput.value);
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
