import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const view = new View();

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: view,
});

const fitmessage = document.getElementById('fitmessage');
const setmaptarget = document.getElementById('setmaptarget');

view.fit([2766140, 8427067, 2803328, 8462993]).then(() => {
  const message = `Deferred View.fit() done, resolution = ${view.getResolution()}, center = ${view.getCenter()}`;
  fitmessage.innerHTML = message;
});

setmaptarget.addEventListener(
  'click',
  function () {
    map.setTarget('map');
  },
  false,
);
