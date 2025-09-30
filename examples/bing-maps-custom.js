import BingMaps from '../src/ol/source/BingMaps.js';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';

const styles = [
  {
    name: 'Custom',
    imagery: 'RoadOnDemand',
    params: {
      style:
        'tollRoad|fc:06b1ca;sc:ff889d;lbc:000000;loc:ffffff_' +
        'controlledAccessHighway|fc:06b1ca;sc:8f8f8f;lbc:000000;loc:ffffff_' +
        'highway|fc:37c256;sc:8f8f8f;lbc:000000;loc:ffffff_' +
        'majorRoad|fc:ff889d;sc:8f8f8f;lbc:000000;loc:ffffff_' +
        'arterialRoad|fc:fef2b4;sc:8f8f8f;lbc:000000;loc:ffffff_' +
        'street|fc:ffffff;sc:8f8f8f;lbc:000000;loc:ffffff_' +
        'road|fc:8f8f8f;sc:8f8f8f;lbc:000000;loc:ffffff',
    },
  },
  {
    name: 'Traffic',
    imagery: 'AerialWithLabelsOnDemand',
    params: {
      mapLayer: 'trafficFlow',
    },
  },
];
const layers = [];
let i, ii;
for (i = 0, ii = styles.length; i < ii; ++i) {
  const style = styles[i];
  layers.push(
    new TileLayer({
      visible: false,
      preload: Infinity,
      source: new BingMaps({
        key: 'AlEoTLTlzFB6Uf4Sy-ugXcRO21skQO7K8eObA5_L-8d20rjqZJLs2nkO1RMjGSPN',
        imagerySet: style.imagery || style.name,
        params: style.params,
      }),
    })
  );
}
const map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [-6655.5402445057125, 6709968.258934638],
    zoom: 13,
  }),
});

const select = document.getElementById('layer-select');
function onChange() {
  const style = select.value;
  for (let i = 0, ii = layers.length; i < ii; ++i) {
    layers[i].setVisible(styles[i].name === style);
  }
}
select.addEventListener('change', onChange);
onChange();
