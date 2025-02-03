import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import CircleStyle from '../src/ol/style/Circle.js';
import Fill from '../src/ol/style/Fill.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';
import Text from '../src/ol/style/Text.js';

let openSansAdded = false;

const myDom = {
  points: {
    text: document.getElementById('points-text'),
    align: document.getElementById('points-align'),
    baseline: document.getElementById('points-baseline'),
    rotation: document.getElementById('points-rotation'),
    font: document.getElementById('points-font'),
    weight: document.getElementById('points-weight'),
    size: document.getElementById('points-size'),
    height: document.getElementById('points-height'),
    offsetX: document.getElementById('points-offset-x'),
    offsetY: document.getElementById('points-offset-y'),
    color: document.getElementById('points-color'),
    outline: document.getElementById('points-outline'),
    outlineWidth: document.getElementById('points-outline-width'),
    maxreso: document.getElementById('points-maxreso'),
  },
  lines: {
    text: document.getElementById('lines-text'),
    align: document.getElementById('lines-align'),
    baseline: document.getElementById('lines-baseline'),
    rotation: document.getElementById('lines-rotation'),
    font: document.getElementById('lines-font'),
    weight: document.getElementById('lines-weight'),
    placement: document.getElementById('lines-placement'),
    maxangle: document.getElementById('lines-maxangle'),
    overflow: document.getElementById('lines-overflow'),
    size: document.getElementById('lines-size'),
    height: document.getElementById('lines-height'),
    offsetX: document.getElementById('lines-offset-x'),
    offsetY: document.getElementById('lines-offset-y'),
    color: document.getElementById('lines-color'),
    outline: document.getElementById('lines-outline'),
    outlineWidth: document.getElementById('lines-outline-width'),
    maxreso: document.getElementById('lines-maxreso'),
  },
  polygons: {
    text: document.getElementById('polygons-text'),
    align: document.getElementById('polygons-align'),
    baseline: document.getElementById('polygons-baseline'),
    rotation: document.getElementById('polygons-rotation'),
    font: document.getElementById('polygons-font'),
    weight: document.getElementById('polygons-weight'),
    placement: document.getElementById('polygons-placement'),
    maxangle: document.getElementById('polygons-maxangle'),
    overflow: document.getElementById('polygons-overflow'),
    size: document.getElementById('polygons-size'),
    height: document.getElementById('polygons-height'),
    offsetX: document.getElementById('polygons-offset-x'),
    offsetY: document.getElementById('polygons-offset-y'),
    color: document.getElementById('polygons-color'),
    outline: document.getElementById('polygons-outline'),
    outlineWidth: document.getElementById('polygons-outline-width'),
    maxreso: document.getElementById('polygons-maxreso'),
  },
};

const getText = function (feature, resolution, dom) {
  const type = dom.text.value;
  const maxResolution = dom.maxreso.value;
  let text = feature.get('name');

  if (resolution > maxResolution) {
    text = '';
  } else if (type == 'hide') {
    text = '';
  } else if (type == 'shorten') {
    text = truncate(text, 12);
  } else if (
    type == 'wrap' &&
    (!dom.placement || dom.placement.value != 'line')
  ) {
    text = stringDivider(text, 16, '\n');
  }

  return text;
};

const createTextStyle = function (feature, resolution, dom) {
  const align = dom.align.value;
  const baseline = dom.baseline.value;
  const size = dom.size.value;
  const height = dom.height.value;
  const offsetX = parseInt(dom.offsetX.value, 10);
  const offsetY = parseInt(dom.offsetY.value, 10);
  const weight = dom.weight.value;
  const placement = dom.placement ? dom.placement.value : undefined;
  const maxAngle = dom.maxangle ? parseFloat(dom.maxangle.value) : undefined;
  const overflow = dom.overflow ? dom.overflow.value == 'true' : undefined;
  const rotation = parseFloat(dom.rotation.value);
  if (dom.font.value == "'Open Sans'" && !openSansAdded) {
    const openSans = document.createElement('link');
    openSans.href = 'https://fonts.googleapis.com/css?family=Open+Sans';
    openSans.rel = 'stylesheet';
    document.head.appendChild(openSans);
    openSansAdded = true;
  }
  const font = weight + ' ' + size + '/' + height + ' ' + dom.font.value;
  const fillColor = dom.color.value;
  const outlineColor = dom.outline.value;
  const outlineWidth = parseInt(dom.outlineWidth.value, 10);

  return new Text({
    textAlign: align == '' ? undefined : align,
    textBaseline: baseline,
    font: font,
    text: getText(feature, resolution, dom),
    fill: new Fill({color: fillColor}),
    stroke: new Stroke({color: outlineColor, width: outlineWidth}),
    offsetX: offsetX,
    offsetY: offsetY,
    placement: placement,
    maxAngle: maxAngle,
    overflow: overflow,
    rotation: rotation,
  });
};

// Polygons
function polygonStyleFunction(feature, resolution) {
  return new Style({
    stroke: new Stroke({
      color: 'blue',
      width: 1,
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.1)',
    }),
    text: createTextStyle(feature, resolution, myDom.polygons),
  });
}

const vectorPolygons = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/polygon-samples.geojson',
    format: new GeoJSON(),
  }),
  style: polygonStyleFunction,
});

// Lines
function lineStyleFunction(feature, resolution) {
  return new Style({
    stroke: new Stroke({
      color: 'green',
      width: 2,
    }),
    text: createTextStyle(feature, resolution, myDom.lines),
  });
}

const vectorLines = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/line-samples.geojson',
    format: new GeoJSON(),
  }),
  style: lineStyleFunction,
});

// Points
function pointStyleFunction(feature, resolution) {
  return new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({color: 'rgba(255, 0, 0, 0.1)'}),
      stroke: new Stroke({color: 'red', width: 1}),
    }),
    text: createTextStyle(feature, resolution, myDom.points),
  });
}

const vectorPoints = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/point-samples.geojson',
    format: new GeoJSON(),
  }),
  style: pointStyleFunction,
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    vectorPolygons,
    vectorLines,
    vectorPoints,
  ],
  target: 'map',
  view: new View({
    center: [-8161939, 6095025],
    zoom: 8,
  }),
});

document
  .getElementById('refresh-points')
  .addEventListener('click', function () {
    vectorPoints.setStyle(pointStyleFunction);
  });

document.getElementById('refresh-lines').addEventListener('click', function () {
  vectorLines.setStyle(lineStyleFunction);
});

document
  .getElementById('refresh-polygons')
  .addEventListener('click', function () {
    vectorPolygons.setStyle(polygonStyleFunction);
  });

/**
 * @param {string} string String
 * @param {number} n The max number of characters to keep.
 * @return {string} Truncated string.
 */
function truncate(string, n) {
  return string.length > n ? string.slice(0, n - 1) + '…' : string.slice();
}

// https://stackoverflow.com/questions/14484787/wrap-text-in-javascript
function stringDivider(str, width, spaceReplacer) {
  if (str.length > width) {
    let p = width;
    while (p > 0 && str[p] != ' ' && str[p] != '-') {
      p--;
    }
    if (p > 0) {
      let left;
      if (str.substring(p, p + 1) == '-') {
        left = str.substring(0, p + 1);
      } else {
        left = str.substring(0, p);
      }
      const right = str.substring(p + 1);
      return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
    }
  }
  return str;
}
