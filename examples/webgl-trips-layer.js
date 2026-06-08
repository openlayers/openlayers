import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import {fromLonLat} from '../src/ol/proj.js';
import ImageTile from '../src/ol/source/ImageTile.js';
import VectorSource from '../src/ol/source/Vector.js';

const lineColor = 'rgba(0,17,64, 0.8)';
const lineColorTrail = 'rgba(0,17,64, 0.01)';
const lineColorTrailEnd = 'rgba(0,17,64, 0)';
const lineColorActive = 'rgb(0,195,26)';
const lineMetricThreshold = ['*', ['time'], 10];

/** @type {import('../src/ol/style/flat.js').FlatStyleLike} */
const style = [
  {
    filter: ['<=', ['line-metric'], lineMetricThreshold],
    style: {
      'stroke-color': [
        'interpolate',
        ['linear'],
        ['line-metric'],
        ['-', lineMetricThreshold, 1000],
        lineColorTrailEnd,
        ['-', lineMetricThreshold, 999],
        lineColorTrail,
        ['-', lineMetricThreshold, 10],
        lineColorTrail,
        ['-', lineMetricThreshold, 5],
        lineColor,
        ['-', lineMetricThreshold, 1],
        lineColorActive,
        lineMetricThreshold,
        lineColorActive,
      ],
      'stroke-width': 4,
      'stroke-line-cap': 'round',
      'stroke-line-join': 'round',
    },
  },
];

fetch('./data/taxi_trips.json')
  .then((resp) => resp.json())
  .then((json) => {
    // console.log(json);
    let minT = Infinity;
    let maxT = -Infinity;
    const features = json.map((trip) => {
      const timestamp = trip['TIMESTAMP'];
      if (timestamp < minT) {
        minT = timestamp;
      }
      if (timestamp > maxT) {
        maxT = timestamp;
      }
      let startTime = -Math.floor(Math.random() * 1000);
      startTime += Math.floor(startTime / 2);
      const coords = JSON.parse(trip['POLYLINE']).map((point, i) => [
        point[0],
        point[1],
        0,
        startTime + i * 15,
      ]);
      // split coordinates into different lines if
      const coordsArray = coords.reduce(
        (prev, currPoint, i) => {
          if (i === 0) {
            return [[currPoint]];
          }
          const prevPoint = coords[i - 1];
          // distance is computed in degrees, which is reasonably acceptable in that part of the world
          const distSq =
            (currPoint[0] - prevPoint[0]) * (currPoint[0] - prevPoint[0]) +
            (currPoint[1] - prevPoint[1]) * (currPoint[1] - prevPoint[1]);
          // start a new segment if the points are too far apart
          if (distSq > 0.001) {
            prev.push([currPoint]);
            return prev;
          }
          prev[prev.length - 1].push(currPoint);
          return prev;
        },
        [[]],
      );
      return {
        type: 'Feature',
        geometry: {
          type: 'MultiLineString',
          coordinates: coordsArray,
        },
      };
    });
    console.log('minT', minT, 'maxT', maxT);
    return {
      type: 'FeatureCollection',
      features: features,
    };
  })
  .then((g) => console.log(JSON.stringify(g)));

const vectorLayer = new WebGLVectorLayer({
  source: new VectorSource({
    url: './data/geojson/taxi_trips.geojson',
    format: new GeoJSON(),
  }),
  style,
});

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const map = new Map({
  layers: [
    new TileLayer({
      source: new ImageTile({
        attributions,
        url:
          'https://api.maptiler.com/maps/dataviz-light/{z}/{x}/{y}.jpg?key=' +
          key,
      }),
    }),
    vectorLayer,
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([-8.6, 41.15]),
    zoom: 13,
  }),
});

// animate the map
function animate() {
  map.render();
  window.requestAnimationFrame(animate);
}
animate();
