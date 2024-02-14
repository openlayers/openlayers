import GeoJSON from '../src/ol/format/GeoJSON.js';
import Layer from '../src/ol/layer/Layer.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import WebGLVectorLayerRenderer from '../src/ol/renderer/webgl/VectorLayer.js';

/** @type {import('../src/ol/style/webgl.js').WebGLStyle} */
const style = {
  'stroke-color': ['*', ['get', 'COLOR'], [220, 220, 220]],
  'stroke-width': 2,
  'stroke-offset': -1,
  'fill-color': ['*', ['get', 'COLOR'], [255, 255, 255, 0.6]],
};

class WebGLLayer extends Layer {
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      style,
    });
  }
}

const osm = new TileLayer({
  source: new OSM(),
});

const vectorLayer = new WebGLLayer({
  source: new VectorSource({
    url: 'https://openlayers.org/data/vector/ecoregions.json',
    format: new GeoJSON(),
  }),
});

const map = new Map({
  layers: [osm, vectorLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

const featureOverlay = new WebGLLayer({
  source: new VectorSource(),
  map: map,
  style: {
    'stroke-color': 'rgba(255, 255, 255, 0.7)',
    'stroke-width': 1,
  },
});

let highlight;
const displayFeatureInfo = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });

  const info = document.getElementById('info');
  if (feature) {
    info.innerHTML = feature.get('ECO_NAME') || '&nbsp;';
  } else {
    info.innerHTML = '&nbsp;';
  }

  if (feature !== highlight) {
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight);
    }
    if (feature) {
      featureOverlay.getSource().addFeature(feature);
    }
    highlight = feature;
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
