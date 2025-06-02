import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GPX from '../src/ol/format/GPX.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import IGC from '../src/ol/format/IGC.js';
import KML from '../src/ol/format/KML.js';
import TopoJSON from '../src/ol/format/TopoJSON.js';
import DragAndDrop from '../src/ol/interaction/DragAndDrop.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import ImageTile from '../src/ol/source/ImageTile.js';
import VectorSource from '../src/ol/source/Vector.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const map = new Map({
  layers: [
    new TileLayer({
      source: new ImageTile({
        attributions: attributions,
        url:
          'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=' + key,
        tileSize: 512,
        maxZoom: 20,
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const extractStyles = /** @type {HTMLInputElement} */ (
  document.getElementById('extractstyles')
);
let dragAndDropInteraction;

function setInteraction() {
  if (dragAndDropInteraction) {
    map.removeInteraction(dragAndDropInteraction);
  }
  dragAndDropInteraction = new DragAndDrop({
    formatConstructors: [
      GPX,
      GeoJSON,
      IGC,
      // use constructed format to set options
      new KML({extractStyles: extractStyles.checked}),
      TopoJSON,
    ],
  });
  dragAndDropInteraction.on('addfeatures', function (event) {
    const vectorSource = new VectorSource({
      features: event.features,
    });
    map.addLayer(
      new VectorLayer({
        source: vectorSource,
      }),
    );
    map.getView().fit(vectorSource.getExtent());
  });
  map.addInteraction(dragAndDropInteraction);
}
setInteraction();

extractStyles.addEventListener('change', setInteraction);

const displayFeatureInfo = function (pixel) {
  const features = [];
  map.forEachFeatureAtPixel(pixel, function (feature) {
    features.push(feature);
  });
  if (features.length > 0) {
    const info = [];
    let i, ii;
    for (i = 0, ii = features.length; i < ii; ++i) {
      info.push(features[i].get('name'));
    }
    document.getElementById('info').innerHTML = info.join(', ') || '&nbsp';
  } else {
    document.getElementById('info').innerHTML = '&nbsp;';
  }
};

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return;
  }
  displayFeatureInfo(evt.pixel);
});

map.on('click', function (evt) {
  displayFeatureInfo(evt.pixel);
});

// Sample data downloads

const link = /** @type {HTMLAnchorElement} */ (
  document.getElementById('download')
);

function download(fullpath, filename) {
  fetch(fullpath)
    .then(function (response) {
      return response.blob();
    })
    .then(function (blob) {
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    });
}

document.getElementById('download-gpx').addEventListener('click', function () {
  download('data/gpx/fells_loop.gpx', 'fells_loop.gpx');
});

document
  .getElementById('download-geojson')
  .addEventListener('click', function () {
    download('data/geojson/roads-seoul.geojson', 'roads-seoul.geojson');
  });

document.getElementById('download-igc').addEventListener('click', function () {
  download('data/igc/Ulrich-Prinz.igc', 'Ulrich-Prinz.igc');
});

document.getElementById('download-kml').addEventListener('click', function () {
  download('data/kml/states.kml', 'states.kml');
});

document
  .getElementById('download-topojson')
  .addEventListener('click', function () {
    download('data/topojson/fr-departments.json', 'fr-departments.json');
  });
