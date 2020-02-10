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
  const ringCoords = feature.getGeometry().getLinearRing().getCoordinates();

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

  return ccwLength < cwLength ? ccwCoordinates : cwCoordinates;
}


// layers definition

const raster = new TileLayer({
  source: new OSM()
});

// Idaho state GeoJSON
const baseFeature = new GeoJSON().readFeature({
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-111.08518023825431, 44.506142112334651],
      [-111.049728402187043, 44.48816653348365],
      [-111.050246928500059, 42.001596004902879],
      [-114.034225025564496, 41.993120340230973],
      [-117.028253570918153, 42.000021221285593],
      [-117.013965290292987, 43.79706698163281],
      [-116.926654421365328, 44.081212999602798],
      [-117.00760854178904, 44.211414316643626],
      [-117.194393242542148, 44.279130012187053],
      [-117.192299932611846, 44.438938541544815],
      [-117.051529640968823, 44.665957043251822],
      [-116.836142772727712, 44.863848449598407],
      [-116.693285572713776, 45.186647083345598],
      [-116.558872029574673, 45.444357861691202],
      [-116.457797807894295, 45.574530371714637],
      [-116.511257230609658, 45.726407368951158],
      [-116.678997292088653, 45.807361489374898],
      [-116.91500358322115, 45.999984412318923],
      [-116.906527918549244, 46.17777492208711],
      [-116.998070218253446, 46.330170445636647],
      [-117.026646779503764, 47.722925720821678],
      [-117.031428744390425, 48.999307047312811],
      [-116.04823243777011, 49.000369706176514],
      [-115.967796843659372, 47.950481953519962],
      [-115.704276650140244, 47.684842843832847],
      [-115.70479517645326, 47.504930217116986],
      [-115.519066733004436, 47.345118486979523],
      [-115.288328925274485, 47.250397813023341],
      [-115.121651522659207, 47.095368047772524],
      [-114.843318120642479, 46.786319963659238],
      [-114.585610543076569, 46.641337445917912],
      [-114.284519597322202, 46.631805523941722],
      [-114.394043877436815, 46.41008751343437],
      [-114.491430800891379, 46.147079444668812],
      [-114.407275900757696, 45.889912798873901],
      [-114.523701061926985, 45.825369076023016],
      [-114.513650613637765, 45.569236282074407],
      [-114.335315971318892, 45.470274575002556],
      [-114.137936689725905, 45.589337178652805],
      [-114.035799809181796, 45.730101068736438],
      [-113.914099763050558, 45.702587166349815],
      [-113.794493026849608, 45.564998449738447],
      [-113.680212388086019, 45.249075090808205],
      [-113.502934003071431, 45.124225477442394],
      [-113.439424132066847, 44.862792192294137],
      [-113.378577309780937, 44.789769603991623],
      [-113.174841279684017, 44.765430875077264],
      [-113.052084976248494, 44.619910626344669],
      [-112.874812992793338, 44.360084132610794],
      [-112.690147208208202, 44.498729106526447],
      [-112.362592215812043, 44.462221013154888],
      [-112.336134570729712, 44.560638587676046],
      [-111.771491423659086, 44.498216981772842],
      [-111.542386013581194, 44.530487242808441],
      [-111.400015332083171, 44.728922781705712],
      [-111.291547309272815, 44.701402477759679],
      [-111.194192393615367, 44.561157113989054],
      [-111.08518023825431, 44.506142112334651]
    ]]
  }
}, {
  featureProjection: 'EPSG:3857'
});

// this is were the drawn features go
const baseVector = new VectorLayer({
  source: new VectorSource({
    features: [baseFeature]
  })
});
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

const getFeatureOptions = {
  hitTolerance: 10,
  layerFilter: (layer) => {
    return layer === baseVector;
  }
};

// the click event is used to start/end tracing around a feature
map.on('click', (event) => {
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
  if (tracingFeature) {
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
    drawInteraction.on('drawend', () => {
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
