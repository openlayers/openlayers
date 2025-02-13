import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GPX from '../src/ol/format/GPX.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import IGC from '../src/ol/format/IGC.js';
import KML from '../src/ol/format/KML.js';
import TopoJSON from '../src/ol/format/TopoJSON.js';
import DragAndDrop from '../src/ol/interaction/DragAndDrop.js';
import {defaults as defaultInteractions} from '../src/ol/interaction/defaults.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorImageLayer from '../src/ol/layer/VectorImage.js';
import ImageTile from '../src/ol/source/ImageTile.js';
import VectorSource from '../src/ol/source/Vector.js';

const dragAndDropInteraction = new DragAndDrop({
  formatConstructors: [GPX, GeoJSON, IGC, KML, TopoJSON],
});

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const map = new Map({
  interactions: defaultInteractions().extend([dragAndDropInteraction]),
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

dragAndDropInteraction.on('addfeatures', function (event) {
  const vectorSource = new VectorSource({
    features: event.features,
  });
  map.addLayer(
    new VectorImageLayer({
      source: vectorSource,
    }),
  );
  map.getView().fit(vectorSource.getExtent());
});

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
