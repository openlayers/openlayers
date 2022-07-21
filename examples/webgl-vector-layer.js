import GeoJSON from '../src/ol/format/GeoJSON.js';
import Layer from '../src/ol/layer/Layer.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import WebGLVectorLayerRenderer from '../src/ol/renderer/webgl/VectorLayer.js';
import {asArray} from '../src/ol/color.js';
import {packColor} from '../src/ol/renderer/webgl/shaders.js';

class WebGLLayer extends Layer {
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      fill: {
        attributes: {
          color: function (feature) {
            const color = asArray(feature.get('COLOR') || '#eee');
            color[3] = 0.85;
            return packColor(color);
          },
          opacity: function () {
            return 0.6;
          },
        },
      },
      stroke: {
        attributes: {
          color: function (feature) {
            const color = [...asArray(feature.get('COLOR') || '#eee')];
            color.forEach((_, i) => (color[i] = Math.round(color[i] * 0.75))); // darken slightly
            return packColor(color);
          },
          width: function () {
            return 1.5;
          },
          opacity: function () {
            return 1;
          },
        },
      },
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
