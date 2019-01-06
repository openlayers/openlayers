import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import XYZ from '../src/ol/source/XYZ.js';

const appId = 'kDm0Jq1K4Ak7Bwtn8uvk';
const appCode = 'xnmvc4dKZrDfGlvQHXSvwQ';
const hereLayers = [
  {
    base: 'base',
    type: 'maptile',
    scheme: 'normal.day',
    app_id: appId,
    app_code: appCode
  },
  {
    base: 'base',
    type: 'maptile',
    scheme: 'normal.day.transit',
    app_id: appId,
    app_code: appCode
  },
  {
    base: 'base',
    type: 'maptile',
    scheme: 'pedestrian.day',
    app_id: appId,
    app_code: appCode
  },
  {
    base: 'aerial',
    type: 'maptile',
    scheme: 'terrain.day',
    app_id: appId,
    app_code: appCode
  },
  {
    base: 'aerial',
    type: 'maptile',
    scheme: 'satellite.day',
    app_id: appId,
    app_code: appCode
  },
  {
    base: 'aerial',
    type: 'maptile',
    scheme: 'hybrid.day',
    app_id: appId,
    app_code: appCode
  }
];
const urlTpl = 'https://{1-4}.{base}.maps.cit.api.here.com' +
  '/{type}/2.1/maptile/newest/{scheme}/{z}/{x}/{y}/256/png' +
  '?app_id={app_id}&app_code={app_code}';
const layers = [];
let i, ii;
for (i = 0, ii = hereLayers.length; i < ii; ++i) {
  const layerDesc = hereLayers[i];
  layers.push(new TileLayer({
    visible: false,
    preload: Infinity,
    source: new XYZ({
      url: createUrl(urlTpl, layerDesc),
      attributions: 'Map Tiles &copy; ' + new Date().getFullYear() + ' ' +
        '<a href="http://developer.here.com">HERE</a>'
    })
  }));
}

const map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [921371.9389, 6358337.7609],
    zoom: 10
  })
});

function createUrl(tpl, layerDesc) {
  return tpl
    .replace('{base}', layerDesc.base)
    .replace('{type}', layerDesc.type)
    .replace('{scheme}', layerDesc.scheme)
    .replace('{app_id}', layerDesc.app_id)
    .replace('{app_code}', layerDesc.app_code);
}

const select = document.getElementById('layer-select');
function onChange() {
  const scheme = select.value;
  for (let i = 0, ii = layers.length; i < ii; ++i) {
    layers[i].setVisible(hereLayers[i].scheme === scheme);
  }
}
select.addEventListener('change', onChange);
onChange();
