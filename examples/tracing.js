import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Draw from '../src/ol/interaction/Draw.js';
import Snap from '../src/ol/interaction/Snap.js';
import Style from '../src/ol/style/Style.js';
import Stroke from '../src/ol/style/Stroke.js';
import Fill from '../src/ol/style/Fill.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import LineString from '../src/ol/geom/LineString.js';
import Feature from '../src/ol/Feature.js';

// math utilities

// coordinates; will return the length of the [a, b] segment
function length(a, b) {
  return Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]));
}

// coordinates; will return true if c is on the [a, b] segment
function isOnSegment(c, a, b) {
  const lengthAc = length(a, c);
  const lengthAb = length(a, b);
  const dot = ((c[0] - a[0]) * (b[0] - a[0]) + (c[1] - a[1]) * (b[1] - a[1])) / lengthAb;
  return Math.abs(lengthAc - dot) < 1e-6 && lengthAc < lengthAb;
}

// modulo for negative values, eg: mod(-1, 4) returns 3
function mod(a, b) {
  return ((a % b) + b) % b;
}

// returns a coordinates array which contains the segments of the feature's
// outer ring between the start and end points
// Note: this assumes the base feature is a single polygon
function getPartialRingCoords(feature, startPoint, endPoint) {
  let polygon = feature.getGeometry();
  if (polygon.getType() === 'MultiPolygon') {
    polygon = polygon.getPolygon(0);
  }
  const ringCoords = polygon.getLinearRing().getCoordinates();

  let i, pointA, pointB, startSegmentIndex = -1;
  for (i = 0; i < ringCoords.length; i++) {
    pointA = ringCoords[i];
    pointB = ringCoords[mod(i + 1, ringCoords.length)];

    // check if this is the start segment dot product
    if (isOnSegment(startPoint, pointA, pointB)) {
      startSegmentIndex = i;
      break;
    }
  }

  const cwCoordinates = [];
  let cwLength = 0;
  const ccwCoordinates = [];
  let ccwLength = 0;

  // build clockwise coordinates
  for (i = 0; i < ringCoords.length; i++) {
    pointA = i === 0 ? startPoint : ringCoords[mod(i + startSegmentIndex, ringCoords.length)];
    pointB = ringCoords[mod(i + startSegmentIndex + 1, ringCoords.length)];
    cwCoordinates.push(pointA);

    if (isOnSegment(endPoint, pointA, pointB)) {
      cwCoordinates.push(endPoint);
      cwLength += length(pointA, endPoint);
      break;
    } else {
      cwLength += length(pointA, pointB);
    }
  }

  // build counter-clockwise coordinates
  for (i = 0; i < ringCoords.length; i++) {
    pointA = ringCoords[mod(startSegmentIndex - i, ringCoords.length)];
    pointB = i === 0 ? startPoint : ringCoords[mod(startSegmentIndex - i + 1, ringCoords.length)];
    ccwCoordinates.push(pointB);

    if (isOnSegment(endPoint, pointA, pointB)) {
      ccwCoordinates.push(endPoint);
      ccwLength += length(endPoint, pointB);
      break;
    } else {
      ccwLength += length(pointA, pointB);
    }
  }

  // keep the shortest path
  return ccwLength < cwLength ? ccwCoordinates : cwCoordinates;
}


// layers definition

const raster = new TileLayer({
  source: new OSM()
});

// features in this layer will be snapped to
const baseVector = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'https://ahocevar.com/geoserver/wfs?service=wfs&request=getfeature&typename=topp:states&cql_filter=STATE_NAME=\'Idaho\'&outputformat=application/json'
  })
});

// this is were the drawn features go
const drawVector = new VectorLayer({
  source: new VectorSource(),
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(100, 255, 0, 1)',
      width: 2
    }),
    fill: new Fill({
      color: 'rgba(100, 255, 0, 0.3)'
    })
  })
});

// this line only appears when we're tracing a feature outer ring
const previewLine = new Feature({
  geometry: new LineString([])
});
const previewVector = new VectorLayer({
  source: new VectorSource({
    features: [previewLine]
  }),
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(255, 0, 0, 1)',
      width: 2
    })
  })
});

const map = new Map({
  layers: [raster, baseVector, drawVector, previewVector],
  target: 'map',
  view: new View({
    center: [-12986427, 5678422],
    zoom: 5
  })
});

let drawInteraction, tracingFeature, startPoint, endPoint;
let drawing = false;

const getFeatureOptions = {
  hitTolerance: 10,
  layerFilter: (layer) => {
    return layer === baseVector;
  }
};

// the click event is used to start/end tracing around a feature
map.on('click', (event) => {
  if (!drawing) {
    return;
  }

  let hit = false;
  map.forEachFeatureAtPixel(
    event.pixel,
    (feature) => {
      if (tracingFeature && feature !== tracingFeature) {
        return;
      }

      hit = true;
      const coord = map.getCoordinateFromPixel(event.pixel);

      // second click on the tracing feature: append the ring coordinates
      if (feature === tracingFeature) {
        endPoint = tracingFeature.getGeometry().getClosestPoint(coord);
        const appendCoords = getPartialRingCoords(tracingFeature, startPoint, endPoint);
        drawInteraction.removeLastPoint();
        drawInteraction.appendCoordinates(appendCoords);
        tracingFeature = null;
      }

      // start tracing on the feature ring
      tracingFeature = feature;
      startPoint = tracingFeature.getGeometry().getClosestPoint(coord);
    },
    getFeatureOptions
  );

  if (!hit) {
    // clear current tracing feature & preview
    previewLine.getGeometry().setCoordinates([]);
    tracingFeature = null;
  }
});

// the pointermove event is used to show a preview of the result of the tracing
map.on('pointermove', (event) => {
  if (tracingFeature && drawing) {
    let coord = null;
    map.forEachFeatureAtPixel(
      event.pixel,
      (feature) => {
        if (tracingFeature === feature) {
          coord = map.getCoordinateFromPixel(event.pixel);
        }
      },
      getFeatureOptions
    );

    let previewCoords = [];
    if (coord) {
      endPoint = tracingFeature.getGeometry().getClosestPoint(coord);
      previewCoords = getPartialRingCoords(tracingFeature, startPoint, endPoint);
    }
    previewLine.getGeometry().setCoordinates(previewCoords);
  }
});

const snapInteraction = new Snap({
  source: baseVector.getSource()
});

const typeSelect = document.getElementById('type');

function addInteraction() {
  const value = typeSelect.value;
  if (value !== 'None') {
    drawInteraction = new Draw({
      source: drawVector.getSource(),
      type: typeSelect.value
    });
    drawInteraction.on('drawstart', () => {
      drawing = true;
    });
    drawInteraction.on('drawend', () => {
      drawing = false;
      previewLine.getGeometry().setCoordinates([]);
      tracingFeature = null;
    });
    map.addInteraction(drawInteraction);
    map.addInteraction(snapInteraction);
  }
}

typeSelect.onchange = function() {
  map.removeInteraction(drawInteraction);
  map.removeInteraction(snapInteraction);
  addInteraction();
};
addInteraction();
