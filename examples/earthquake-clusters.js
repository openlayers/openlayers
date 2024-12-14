import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {createEmpty, extend, getHeight, getWidth} from '../src/ol/extent.js';
import KML from '../src/ol/format/KML.js';
import Select from '../src/ol/interaction/Select.js';
import {defaults as defaultInteractions} from '../src/ol/interaction/defaults.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import Cluster from '../src/ol/source/Cluster.js';
import StadiaMaps from '../src/ol/source/StadiaMaps.js';
import VectorSource from '../src/ol/source/Vector.js';
import CircleStyle from '../src/ol/style/Circle.js';
import Fill from '../src/ol/style/Fill.js';
import RegularShape from '../src/ol/style/RegularShape.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';
import Text from '../src/ol/style/Text.js';

const earthquakeFill = new Fill({
  color: 'rgba(255, 153, 0, 0.8)',
});
const earthquakeStroke = new Stroke({
  color: 'rgba(255, 204, 0, 0.2)',
  width: 1,
});
const textFill = new Fill({
  color: '#fff',
});
const textStroke = new Stroke({
  color: 'rgba(0, 0, 0, 0.6)',
  width: 3,
});
const invisibleFill = new Fill({
  color: 'rgba(255, 255, 255, 0.01)',
});

function createEarthquakeStyle(feature) {
  // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
  // standards-violating <magnitude> tag in each Placemark.  We extract it
  // from the Placemark's name instead.
  const name = feature.get('name');
  const magnitude = parseFloat(name.substr(2));
  const radius = 5 + 20 * (magnitude - 5);

  return new Style({
    geometry: feature.getGeometry(),
    image: new RegularShape({
      radius: radius,
      radius2: 3,
      points: 5,
      angle: Math.PI,
      fill: earthquakeFill,
      stroke: earthquakeStroke,
    }),
  });
}

let maxFeatureCount;
let vector = null;
const calculateClusterInfo = function (resolution) {
  maxFeatureCount = 0;
  const features = vector.getSource().getFeatures();
  let feature, radius;
  for (let i = features.length - 1; i >= 0; --i) {
    feature = features[i];
    const originalFeatures = feature.get('features');
    const extent = createEmpty();
    let j, jj;
    for (j = 0, jj = originalFeatures.length; j < jj; ++j) {
      extend(extent, originalFeatures[j].getGeometry().getExtent());
    }
    maxFeatureCount = Math.max(maxFeatureCount, jj);
    radius = (0.25 * (getWidth(extent) + getHeight(extent))) / resolution;
    feature.set('radius', radius);
  }
};

let currentResolution;
function styleFunction(feature, resolution) {
  if (resolution != currentResolution) {
    calculateClusterInfo(resolution);
    currentResolution = resolution;
  }
  let style;
  const size = feature.get('features').length;
  if (size > 1) {
    style = new Style({
      image: new CircleStyle({
        radius: feature.get('radius'),
        fill: new Fill({
          color: [255, 153, 0, Math.min(0.8, 0.4 + size / maxFeatureCount)],
        }),
      }),
      text: new Text({
        text: size.toString(),
        fill: textFill,
        stroke: textStroke,
      }),
    });
  } else {
    const originalFeature = feature.get('features')[0];
    style = createEarthquakeStyle(originalFeature);
  }
  return style;
}

function selectStyleFunction(feature) {
  const styles = [
    new Style({
      image: new CircleStyle({
        radius: feature.get('radius'),
        fill: invisibleFill,
      }),
    }),
  ];
  const originalFeatures = feature.get('features');
  let originalFeature;
  for (let i = originalFeatures.length - 1; i >= 0; --i) {
    originalFeature = originalFeatures[i];
    styles.push(createEarthquakeStyle(originalFeature));
  }
  return styles;
}

vector = new VectorLayer({
  source: new Cluster({
    distance: 40,
    source: new VectorSource({
      url: 'data/kml/2012_Earthquakes_Mag5.kml',
      format: new KML({
        extractStyles: false,
      }),
    }),
  }),
  style: styleFunction,
});

const raster = new TileLayer({
  source: new StadiaMaps({
    layer: 'stamen_toner',
  }),
});

const map = new Map({
  layers: [raster, vector],
  interactions: defaultInteractions().extend([
    new Select({
      condition: function (evt) {
        return evt.type == 'pointermove' || evt.type == 'singleclick';
      },
      style: selectStyleFunction,
    }),
  ]),
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
