import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {
  DragAndDrop,
  defaults as defaultInteractions,
} from '../src/ol/interaction.js';
import {GPX, GeoJSON, IGC, KML, MVT, TopoJSON} from '../src/ol/format.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {createXYZ} from '../src/ol/tilegrid.js';

// Define a custom MVT format as ol/format/MVT requires an extent

const tileCoordZ = document.getElementById('tileCoordZ');
const tileCoordX = document.getElementById('tileCoordX');
const tileCoordY = document.getElementById('tileCoordY');

class customMVT extends MVT {
  constructor() {
    super({featureClass: Feature});
  }
  readFeatures(source, options) {
    options.extent = createXYZ().getTileCoordExtent([
      parseInt(tileCoordZ.value),
      parseInt(tileCoordX.value),
      parseInt(tileCoordY.value),
    ]);
    return super.readFeatures(source, options);
  }
}

// Set up map with Drag and Drop interaction

const dragAndDropInteraction = new DragAndDrop({
  formatConstructors: [customMVT, GPX, GeoJSON, IGC, KML, TopoJSON],
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
    })
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
      const description =
        features[i].get('name') ||
        features[i].get('_name') ||
        features[i].get('layer');
      if (description) {
        info.push(description);
      }
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
  const pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('click', function (evt) {
  displayFeatureInfo(evt.pixel);
});

// Sample data download

const link = document.getElementById('download');

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

document.getElementById('download-mvt').addEventListener('click', function () {
  const fullpath =
    'https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer/tile/' +
    tileCoordZ.value +
    '/' +
    tileCoordY.value +
    '/' +
    tileCoordX.value +
    '.pbf';
  const filename =
    tileCoordZ.value + '-' + tileCoordX.value + '-' + tileCoordY.value + '.mvt';
  download(fullpath, filename);
});
