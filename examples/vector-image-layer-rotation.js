import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Point from '../src/ol/geom/Point.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorImageLayer from '../src/ol/layer/VectorImage.js';
import {fromLonLat} from '../src/ol/proj.js';
import VectorSource from '../src/ol/source/Vector.js';
import Fill from '../src/ol/style/Fill.js';
import Icon from '../src/ol/style/Icon.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';
import Text from '../src/ol/style/Text.js';

const DEGREES_PER_METER = 1 / 111319.49079327358;

function lonLat(xMeters, yMeters) {
  return [xMeters * DEGREES_PER_METER, yMeters * DEGREES_PER_METER];
}

function rectRing(left, bottom, right, top) {
  return [
    [left, bottom],
    [right, bottom],
    [right, top],
    [left, top],
    [left, bottom],
  ];
}

function polygonFeature(properties, ringMeters) {
  return {
    type: 'Feature',
    properties: properties,
    geometry: {
      type: 'Polygon',
      coordinates: [ringMeters.map((point) => lonLat(point[0], point[1]))],
    },
  };
}

function lineFeature(properties, pathMeters) {
  return {
    type: 'Feature',
    properties: properties,
    geometry: {
      type: 'LineString',
      coordinates: pathMeters.map((point) => lonLat(point[0], point[1])),
    },
  };
}

function featureCollection(features) {
  return {type: 'FeatureCollection', features: features};
}

const APRON = {left: -344, bottom: -75, right: 344, top: 85};
const TAXIWAY = {left: -400, bottom: -120, right: 400, top: -75};
const TAXILANE_Y = (TAXIWAY.bottom + TAXIWAY.top) / 2;
const STAND_WIDTH = 100;
const STAND_GAP = 12;
const STAND_ROW_LEFT = -330;
const PARKING_Y = 35;
const TURN_RADIUS = 60;

const stands = ['11', '12', '13', '14', '15'].map((designator, index) => {
  const left = STAND_ROW_LEFT + index * (STAND_WIDTH + STAND_GAP);
  return {
    designator: designator,
    left: left,
    right: left + STAND_WIDTH,
    centerX: left + STAND_WIDTH / 2,
  };
});

function leadInPath(standCenterX) {
  const turnCenterX = standCenterX - TURN_RADIUS;
  const turnCenterY = TAXILANE_Y + TURN_RADIUS;
  const path = [];
  for (let step = 0; step <= 6; ++step) {
    const angle = ((step / 6 - 1) * Math.PI) / 2;
    path.push([
      turnCenterX + TURN_RADIUS * Math.cos(angle),
      turnCenterY + TURN_RADIUS * Math.sin(angle),
    ]);
  }
  path.push([standCenterX, PARKING_Y]);
  return path;
}

const aprons = featureCollection([
  polygonFeature(
    {designator: 'Apron 1'},
    rectRing(APRON.left, APRON.bottom, APRON.right, APRON.top),
  ),
]);

const taxiways = featureCollection([
  polygonFeature(
    {},
    rectRing(TAXIWAY.left, TAXIWAY.bottom, TAXIWAY.right, TAXIWAY.top),
  ),
]);

const routeNetwork = featureCollection([
  lineFeature({designator: 'A'}, [
    [TAXIWAY.left, TAXILANE_Y],
    [TAXIWAY.right, TAXILANE_Y],
  ]),
  ...stands.map((stand) => lineFeature({}, leadInPath(stand.centerX))),
]);

const standPositions = featureCollection(
  stands.map((stand) =>
    polygonFeature(
      {designator: stand.designator},
      rectRing(stand.left, APRON.bottom, stand.right, APRON.top),
    ),
  ),
);

const AIRCRAFT_SVG =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" ' +
      'viewBox="0 0 32 32">' +
      '<path d="M16 2 C16.8 2 17.6 3.2 17.6 5 L17.6 11 L30 19.5 L30 22 ' +
      'L17.6 18.5 L17.6 25 L21 28 L21 29.5 L16 28.2 L11 29.5 L11 28 ' +
      'L14.4 25 L14.4 18.5 L2 22 L2 19.5 L14.4 11 L14.4 5 ' +
      'C14.4 3.2 15.2 2 16 2 Z" fill="#fff" stroke="#000" ' +
      'stroke-width="1" stroke-linejoin="round"/>' +
      '</svg>',
  );

const LABEL_FONT = '12px Roboto, "Helvetica Neue", sans-serif';

function standFont(resolution) {
  let addition;
  if (resolution < 1) {
    addition = 1;
  } else if (resolution > 2) {
    addition = 6;
  } else {
    addition = 4;
  }
  const size = Math.max((12 + addition) / resolution, 6);
  return `${size}px Roboto, "Helvetica Neue", sans-serif`;
}

function apronStyle(feature, resolution) {
  return new Style({
    fill: new Fill({color: '#323d45'}),
    text:
      resolution > 5
        ? undefined
        : new Text({
            font: LABEL_FONT,
            text: feature.get('designator'),
            textAlign: 'center',
            textBaseline: 'middle',
            overflow: true,
            rotateWithView: true,
            fill: new Fill({color: 'white'}),
          }),
  });
}

const taxiwayStyle = new Style({fill: new Fill({color: '#4a555c'})});

function guidanceStyle(feature, resolution) {
  return new Style({
    stroke: new Stroke({
      color: 'rgba(154, 130, 68, 0.55)',
      width: 1.3,
      lineDash: [0.5, 4],
    }),
    text:
      resolution > 5
        ? undefined
        : new Text({
            font: LABEL_FONT,
            text: feature.get('designator'),
            textAlign: 'center',
            textBaseline: 'middle',
            placement: 'line',
            overflow: true,
            keepUpright: false,
            fill: new Fill({color: 'white'}),
          }),
  });
}

function standStyle(feature, resolution) {
  return new Style({
    stroke: new Stroke({color: '#575757', width: 2}),
    text:
      resolution > 4
        ? undefined
        : new Text({
            font: standFont(resolution),
            text: feature.get('designator'),
            textAlign: 'center',
            textBaseline: 'middle',
            placement: 'point',
            rotateWithView: true,
            fill: new Fill({color: '#fff'}),
            stroke: new Stroke({color: '#000', width: 2}),
          }),
  });
}

function aircraftStyle(headingDegrees) {
  return new Style({
    image: new Icon({
      src: AIRCRAFT_SVG,
      rotation: (headingDegrees * Math.PI) / 180,
      rotateWithView: true,
    }),
  });
}

const geoJson = new GeoJSON({featureProjection: 'EPSG:3857'});

function readFeatures(collection, style) {
  const features = geoJson.readFeatures(collection);
  features.forEach((feature) => feature.setStyle(style));
  return features;
}

const parkingStands = new Set(['11', '13', '15']);
const aircraftFeatures = stands
  .filter((stand) => parkingStands.has(stand.designator))
  .map((stand) => {
    const feature = new Feature({
      geometry: new Point(fromLonLat(lonLat(stand.centerX, PARKING_Y))),
    });
    feature.setStyle(aircraftStyle(0));
    return feature;
  });

const source = new VectorSource();
source.addFeatures(readFeatures(aprons, apronStyle));
source.addFeatures(readFeatures(taxiways, taxiwayStyle));
source.addFeatures(readFeatures(routeNetwork, guidanceStyle));
source.addFeatures(readFeatures(standPositions, standStyle));
source.addFeatures(aircraftFeatures);

// One view shared by both maps; pan/zoom/rotate either map and both stay in sync.
const view = new View({
  center: fromLonLat(lonLat(0, (APRON.bottom + APRON.top) / 2)),
  zoom: 17,
});

// The reference: a plain VectorLayer re-renders every frame, so it is the
// accuracy benchmark the image layer is compared against.
new Map({
  target: 'map-old',
  layers: [new VectorLayer({source: source})],
  view: view,
});

// The VectorImageLayer under test. With rotateContent the image is rendered
// screen-aligned: the settled copy to the canvas is lossless, and symbols and
// labels honor rotateWithView.
const imageMap = new Map({
  target: 'map-new',
  layers: [],
  view: view,
});

const rotateContentInput = document.getElementById('rotate-content');

function applyImageLayer() {
  imageMap.setLayers([
    new VectorImageLayer({
      source: source,
      rotateContent: rotateContentInput.checked,
    }),
  ]);
  updateCopyInfo();
}

rotateContentInput.addEventListener('change', applyImageLayer);

const rotationInput = document.getElementById('rotation');
const rotationNumber = document.getElementById('rotation-number');

function setRotationDegrees(degrees) {
  view.setRotation((degrees * Math.PI) / 180);
}

rotationInput.addEventListener('input', () => {
  setRotationDegrees(Number(rotationInput.value));
});

rotationNumber.addEventListener('input', () => {
  const degrees = Number(rotationNumber.value);
  if (!Number.isNaN(degrees)) {
    setRotationDegrees(degrees);
  }
});

view.on('change:rotation', () => {
  let degrees = (view.getRotation() * 180) / Math.PI;
  degrees = ((((degrees + 180) % 360) + 360) % 360) - 180;
  const fixed = degrees.toFixed(2);
  rotationInput.value = fixed;
  if (document.activeElement !== rotationNumber) {
    rotationNumber.value = fixed;
  }
});

const copyInfo = document.getElementById('copy-info');

function blitPrediction(map) {
  const size = map.getSize();
  if (!size) {
    return null;
  }
  const ratio = map.getPixelRatio();
  const cos = Math.abs(Math.cos(view.getRotation()));
  const sin = Math.abs(Math.sin(view.getRotation()));
  const wex = (size[0] * cos + size[1] * sin) * ratio;
  const hex = (size[0] * sin + size[1] * cos) * ratio;
  return {
    wex: wex,
    hex: hex,
    dx: (Math.round(wex) - wex) / 2,
    dy: (Math.round(hex) - hex) / 2,
  };
}

function updateCopyInfo() {
  const prediction = blitPrediction(imageMap);
  if (!prediction) {
    return;
  }
  if (rotateContentInput.checked) {
    copyInfo.textContent =
      'rotateContent: the settled copy lands on whole pixels (lossless)';
    return;
  }
  copyInfo.textContent =
    `image ${prediction.wex.toFixed(2)} x ${prediction.hex.toFixed(2)} device px, ` +
    `copy lands ${prediction.dx.toFixed(3)}, ${prediction.dy.toFixed(3)} px off`;
}

view.on('change:rotation', updateCopyInfo);
imageMap.on('change:size', updateCopyInfo);
imageMap.once('postrender', updateCopyInfo);

applyImageLayer();
