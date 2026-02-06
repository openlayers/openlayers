import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Link from '../src/ol/interaction/Link.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import XYZ from '../src/ol/source/XYZ.js';

const populatedPlaces = new VectorLayer({
  source: new VectorSource({
    url: 'https://openlayers.org/data/vector/populated-places.json',
    format: new GeoJSON(),
  }),
  style: {
    'circle-stroke-color': 'hsl(0 100% 100% / 0.9)',
    'circle-stroke-width': 0.75,
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['get', 'pop_max'],
      500_000,
      3,
      10_000_000,
      10,
    ],
    'circle-fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'pop_max'],
      1_000_000,
      'hsl(210 100% 40% / 0.9)',
      10_000_000,
      'hsl(0 80% 60% / 0.9)',
    ],
  },
});

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';

const map = new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        attributions:
          '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
          '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
        url:
          'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=' + key,
        tileSize: 512,
        maxZoom: 20,
      }),
    }),
    populatedPlaces,
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

map.addInteraction(new Link());

const info = document.getElementById('info');

let currentFeature = null;
function displayFeatureInfo(pixel, width) {
  const feature = map.getFeaturesAtPixel(pixel)[0];
  if (feature) {
    const featurePixel = map.getPixelFromCoordinate(
      feature.getGeometry().getCoordinates(),
    );
    if (featurePixel[0] > width) {
      featurePixel[0] = featurePixel[0] % width;
    } else if (featurePixel[1] < width) {
      featurePixel[0] = width + (featurePixel[0] % width);
    }
    info.style.top = featurePixel[1] + 'px';
    if (featurePixel[0] < width / 2) {
      info.style.left = featurePixel[0] + 'px';
      info.style.right = 'auto';
    } else {
      info.style.right = width - featurePixel[0] + 'px';
      info.style.left = 'auto';
    }
    if (feature !== currentFeature) {
      info.style.visibility = 'visible';
      info.innerHTML =
        feature.get('name') + '<br>' + feature.get('pop_max').toLocaleString();
    }
  } else if (currentFeature) {
    info.style.visibility = 'hidden';
  }
  currentFeature = feature;
}

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    info.style.visibility = 'hidden';
    currentFeature = undefined;
    return;
  }
  displayFeatureInfo(evt.pixel, evt.frameState.size[0]);
});

map.on('click', function (evt) {
  displayFeatureInfo(evt.pixel, evt.frameState.size[0]);
});

map.getTargetElement().addEventListener('pointerleave', function () {
  currentFeature = undefined;
  info.style.visibility = 'hidden';
});
