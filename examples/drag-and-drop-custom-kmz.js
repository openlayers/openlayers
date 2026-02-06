import {unzipSync} from 'fflate';
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
import VectorLayer from '../src/ol/layer/Vector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

// Create functions to extract KML and icons from KMZ array buffer,
// which must be done synchronously.

let zip;

function getKMLData(buffer) {
  zip = unzipSync(new Uint8Array(buffer));
  const kml = Object.keys(zip).find((key) => /\.kml$/i.test(key));
  if (!(kml in zip)) {
    return null;
  }
  return new TextDecoder().decode(zip[kml]);
}

function getKMLImage(href) {
  const index = window.location.href.lastIndexOf('/');
  if (index === -1) {
    return href;
  }
  const image = href.slice(index + 1);
  if (!(image in zip)) {
    return href;
  }
  return URL.createObjectURL(new Blob([zip[image]]));
}

// Define a KMZ format class by subclassing ol/format/KML

class KMZ extends KML {
  constructor(opt_options) {
    const options = opt_options || {};
    options.iconUrlFunction = getKMLImage;
    super(options);
  }

  getType() {
    return 'arraybuffer';
  }

  readFeature(source, options) {
    const kmlData = getKMLData(source);
    return super.readFeature(kmlData, options);
  }

  readFeatures(source, options) {
    const kmlData = getKMLData(source);
    return super.readFeatures(kmlData, options);
  }
}

// Set up map with Drag and Drop interaction

const dragAndDropInteraction = new DragAndDrop({
  formatConstructors: [KMZ, GPX, GeoJSON, IGC, KML, TopoJSON],
});

const map = new Map({
  interactions: defaultInteractions().extend([dragAndDropInteraction]),
  layers: [
    new TileLayer({
      source: new OSM(),
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
    new VectorLayer({
      source: vectorSource,
    }),
  );
  map.getView().fit(vectorSource.getExtent());
});

const displayFeatureInfo = function (pixel) {
  const features = map.getFeaturesAtPixel(pixel);
  let html;
  if (features.length > 0) {
    const info = [];
    for (let i = 0, ii = features.length; i < ii; ++i) {
      const description =
        features[i].get('description') ||
        features[i].get('name') ||
        features[i].get('_name') ||
        features[i].get('layer');
      if (description) {
        info.push(description);
      }
    }
    html = info.join('<br/>');
  }
  document.getElementById('info').innerHTML = html ?? '';
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

// Sample data download

const link = document.getElementById('download');

function download(fullpath, filename) {
  fetch(fullpath)
    .then((response) => response.blob())
    .then(function (blob) {
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    });
}

document.getElementById('download-kmz').addEventListener('click', function () {
  download('data/kmz/iceland.kmz', 'iceland.kmz');
});
