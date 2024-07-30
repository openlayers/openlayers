import Layer from '../src/ol/layer/WebGLTile.js';
import Map from '../src/ol/Map.js';
import NightLayer from '../src/ol/layer/NightTile.js';
import OSM from '../src/ol/source/OSM.js';
import StadiaMaps from '../src/ol/source/StadiaMaps.js';
import View from '../src/ol/View.js';

const baseLayer = new Layer({
  source: new StadiaMaps({
    layer: 'alidade_smooth',
  }),
});

const nightLayer = new NightLayer({
  source: new StadiaMaps({
    layer: 'alidade_smooth_dark',
  }),
});

const twilight = document.getElementById('twilight');
twilight.addEventListener('change', () => {
  nightLayer.setTwilightSteps(Math.floor(twilight.value));
});

const datetime = document.getElementById('datetime');
datetime.addEventListener('change', () => {
  nightLayer.setDate(datetime.value);
});

const nightSource = document.getElementById('nightSource');
nightSource.addEventListener('change', () => {
  const layers = {
    StadiaMaps: new StadiaMaps({
      layer: 'alidade_smooth_dark',
    }),
    ColorTileSimple: 'rgba(0, 0, 0, 0.5)',
    ColorTileBlack: '#000000',
  };
  nightLayer.setSource(layers[nightSource.value]);
});

const baseSource = document.getElementById('baseSource');
baseSource.addEventListener('change', () => {
  const layers = {
    StadiaMaps: new StadiaMaps({
      layer: 'alidade_smooth',
    }),
    OSM: new OSM(),
  };
  baseLayer.setSource(layers[baseSource.value]);
});

const map = new Map({
  target: 'map',
  layers: [baseLayer, nightLayer],
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});
