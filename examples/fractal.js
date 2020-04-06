import Feature from '../src/ol/Feature.js';
import LineString from '../src/ol/geom/LineString.js';
import Map from '../src/ol/Map.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';

const radius = 10e6;
const cos30 = Math.cos(Math.PI / 6);
const sin30 = Math.sin(Math.PI / 6);
const rise = radius * sin30;
const run = radius * cos30;

const triangle = new LineString([
  [0, radius],
  [run, -rise],
  [-run, -rise],
  [0, radius],
]);

const feature = new Feature(triangle);

const layer = new VectorLayer({
  source: new VectorSource({
    features: [feature],
  }),
});

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

function makeFractal(depth) {
  const geometry = triangle.clone();
  const graph = coordsToGraph(geometry.getCoordinates());
  for (let i = 0; i < depth; ++i) {
    let node = graph;
    while (node.next) {
      const next = node.next;
      injectNodes(node);
      node = next;
    }
  }
  const coordinates = graphToCoords(graph);
  document.getElementById('count').innerHTML = coordinates.length;
  geometry.setCoordinates(coordinates);
  feature.setGeometry(geometry);
}

function injectNodes(startNode) {
  const endNode = startNode.next;

  const start = startNode.point;
  const end = startNode.next.point;
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];

  // first point at 1/3 along the segment
  const firstNode = {
    point: [start[0] + dx / 3, start[1] + dy / 3],
  };

  // second point at peak of _/\_
  const r = Math.sqrt(dx * dx + dy * dy) / (2 * cos30);
  const a = Math.atan2(dy, dx) + Math.PI / 6;
  const secondNode = {
    point: [start[0] + r * Math.cos(a), start[1] + r * Math.sin(a)],
  };

  // third point at 2/3 along the segment
  const thirdNode = {
    point: [end[0] - dx / 3, end[1] - dy / 3],
  };

  startNode.next = firstNode;
  firstNode.next = secondNode;
  secondNode.next = thirdNode;
  thirdNode.next = endNode;
}

function coordsToGraph(coordinates) {
  const graph = {
    point: coordinates[0],
  };
  const length = coordinates.length;
  for (let level = 0, node = graph; level < length - 1; ++level) {
    node.next = {
      point: coordinates[level + 1],
    };
    node = node.next;
  }
  return graph;
}

function graphToCoords(graph) {
  const coordinates = [graph.point];
  for (let node = graph, i = 1; node.next; node = node.next, ++i) {
    coordinates[i] = node.next.point;
  }
  return coordinates;
}

const depthInput = document.getElementById('depth');

function update() {
  makeFractal(Number(depthInput.value));
}

let updateTimer;

/**
 * Regenerate fractal on depth change.  Change events are debounced so updates
 * only occur every 200ms.
 */
depthInput.onchange = function () {
  window.clearTimeout(updateTimer);
  updateTimer = window.setTimeout(update, 200);
};

update();
