import FullScreen from '../../src/ol/control/FullScreen.js';
import Map from '../../src/ol/Map.js';
import View from '../../src/ol/View.js';
import {apply} from 'ol-mapbox-style';

const locations = [
  {
    center: [0, 4050000],
    zoom: 2,
  },
  {
    center: [-10026264.955714773, 3498225.377934253],
    zoom: 12.3,
  },
  {
    center: [-8120333.846364162, -5972314.327727663],
    zoom: 10.15,
  },
  {
    center: [12700564.586161729, 2575397.3413926377],
    zoom: 13.8,
  },
  {
    center: [8976666.32253083, 814262.3154676007],
    zoom: 15.7,
  },
  {
    center: [1284003.7367688504, 5950927.737276901],
    zoom: 11.19,
  },
  {
    center: [-8468554.506387988, 5696886.564463913],
    zoom: 10.11,
  },
  {
    center: [707717.3609533564, 6361291.958635207],
    zoom: 10.02,
  },
  {
    center: [3345381.3050933336, -216864.19183635892],
    zoom: 13.9,
  },
  {
    center: [3318257.9642649507, -1786301.1175574847],
    zoom: 6.1,
  },
  {
    center: [19365301.097574536, -5033096.120372388],
    zoom: 10.77,
  },
  {
    center: [-13542913.807564376, 5913315.884147839],
    zoom: 11.59,
  },
  {
    center: [9680854.2477813, 3231923.470902604],
    zoom: 8.06,
  },
  {
    center: [-10341383.185823392, 1826844.1155603195],
    zoom: 9.27,
  },
  {
    center: [3232422.751942559, 5017252.706810253],
    zoom: 12.25,
  },
  {
    center: [-16373943.169136822, 8651360.275919426],
    zoom: 8.49,
  },
  {
    center: [12475943.19806142, 4172022.2635435928],
    zoom: 9.91,
  },
];

const container = document.getElementById('map');

const map = new Map({
  target: container,
  view: new View(locations[(Math.random() * locations.length) | 0]),
});

map.addControl(new FullScreen());

apply(
  map,
  'https://api.maptiler.com/maps/topo/style.json?key=get_your_own_D6rA4zTHduk6KOKTXzGB'
);

container.onmouseover = function () {
  container.className = 'over';
};
container.onmouseout = function () {
  container.className = '';
};
