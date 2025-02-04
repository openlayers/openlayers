import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {
  never,
  platformModifierKeyOnly,
  primaryAction,
} from '../src/ol/events/condition.js';
import {getCenter, getHeight, getWidth} from '../src/ol/extent.js';
import MultiPoint from '../src/ol/geom/MultiPoint.js';
import Point from '../src/ol/geom/Point.js';
import Draw from '../src/ol/interaction/Draw.js';
import Modify from '../src/ol/interaction/Modify.js';
import Translate from '../src/ol/interaction/Translate.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import CircleStyle from '../src/ol/style/Circle.js';
import Fill from '../src/ol/style/Fill.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';

const raster = new TileLayer({
  source: new OSM(),
});

const source = new VectorSource();

const style = new Style({
  geometry: function (feature) {
    const modifyGeometry = feature.get('modifyGeometry');
    return modifyGeometry ? modifyGeometry.geometry : feature.getGeometry();
  },
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)',
  }),
  stroke: new Stroke({
    color: '#ffcc33',
    width: 2,
  }),
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({
      color: '#ffcc33',
    }),
  }),
});

function calculateCenter(geometry) {
  let center, coordinates, minRadius;
  const type = geometry.getType();
  if (type === 'Polygon') {
    let x = 0;
    let y = 0;
    let i = 0;
    coordinates = geometry.getCoordinates()[0].slice(1);
    coordinates.forEach(function (coordinate) {
      x += coordinate[0];
      y += coordinate[1];
      i++;
    });
    center = [x / i, y / i];
  } else if (type === 'LineString') {
    center = geometry.getCoordinateAt(0.5);
    coordinates = geometry.getCoordinates();
  } else {
    center = getCenter(geometry.getExtent());
  }
  let sqDistances;
  if (coordinates) {
    sqDistances = coordinates.map(function (coordinate) {
      const dx = coordinate[0] - center[0];
      const dy = coordinate[1] - center[1];
      return dx * dx + dy * dy;
    });
    minRadius = Math.sqrt(Math.max.apply(Math, sqDistances)) / 3;
  } else {
    minRadius =
      Math.max(
        getWidth(geometry.getExtent()),
        getHeight(geometry.getExtent()),
      ) / 3;
  }
  return {
    center: center,
    coordinates: coordinates,
    minRadius: minRadius,
    sqDistances: sqDistances,
  };
}

const vector = new VectorLayer({
  source: source,
  style: function (feature) {
    const styles = [style];
    const modifyGeometry = feature.get('modifyGeometry');
    const geometry = modifyGeometry
      ? modifyGeometry.geometry
      : feature.getGeometry();
    const result = calculateCenter(geometry);
    const center = result.center;
    if (center) {
      styles.push(
        new Style({
          geometry: new Point(center),
          image: new CircleStyle({
            radius: 4,
            fill: new Fill({
              color: '#ff3333',
            }),
          }),
        }),
      );
      const coordinates = result.coordinates;
      if (coordinates) {
        const minRadius = result.minRadius;
        const sqDistances = result.sqDistances;
        const rsq = minRadius * minRadius;
        const points = coordinates.filter(function (coordinate, index) {
          return sqDistances[index] > rsq;
        });
        styles.push(
          new Style({
            geometry: new MultiPoint(points),
            image: new CircleStyle({
              radius: 4,
              fill: new Fill({
                color: '#33cc33',
              }),
            }),
          }),
        );
      }
    }
    return styles;
  },
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4,
  }),
});

const defaultStyle = new Modify({source: source})
  .getOverlay()
  .getStyleFunction();

const modify = new Modify({
  source: source,
  condition: function (event) {
    return primaryAction(event) && !platformModifierKeyOnly(event);
  },
  deleteCondition: never,
  insertVertexCondition: never,
  style: function (feature, resolution) {
    feature.get('features').forEach(function (modifyFeature) {
      const modifyGeometry = modifyFeature.get('modifyGeometry');
      if (modifyGeometry) {
        const point = feature.getGeometry().getCoordinates();
        let modifyPoint = modifyGeometry.point;
        if (!modifyPoint) {
          // save the initial geometry and vertex position
          modifyPoint = point;
          modifyGeometry.point = modifyPoint;
          modifyGeometry.geometry0 = modifyGeometry.geometry;
          // get anchor and minimum radius of vertices to be used
          const result = calculateCenter(modifyGeometry.geometry0);
          modifyGeometry.center = result.center;
          modifyGeometry.minRadius = result.minRadius;
        }

        const center = modifyGeometry.center;
        const minRadius = modifyGeometry.minRadius;
        let dx, dy;
        dx = modifyPoint[0] - center[0];
        dy = modifyPoint[1] - center[1];
        const initialRadius = Math.sqrt(dx * dx + dy * dy);
        if (initialRadius > minRadius) {
          const initialAngle = Math.atan2(dy, dx);
          dx = point[0] - center[0];
          dy = point[1] - center[1];
          const currentRadius = Math.sqrt(dx * dx + dy * dy);
          if (currentRadius > 0) {
            const currentAngle = Math.atan2(dy, dx);
            const geometry = modifyGeometry.geometry0.clone();
            geometry.scale(currentRadius / initialRadius, undefined, center);
            geometry.rotate(currentAngle - initialAngle, center);
            modifyGeometry.geometry = geometry;
          }
        }
      }
    });
    return defaultStyle(feature, resolution);
  },
});

modify.on('modifystart', function (event) {
  event.features.forEach(function (feature) {
    feature.set(
      'modifyGeometry',
      {geometry: feature.getGeometry().clone()},
      true,
    );
  });
});

modify.on('modifyend', function (event) {
  event.features.forEach(function (feature) {
    const modifyGeometry = feature.get('modifyGeometry');
    if (modifyGeometry) {
      feature.setGeometry(modifyGeometry.geometry);
      feature.unset('modifyGeometry', true);
    }
  });
});

map.addInteraction(modify);
map.addInteraction(
  new Translate({
    condition: function (event) {
      return primaryAction(event) && platformModifierKeyOnly(event);
    },
    layers: [vector],
  }),
);

let draw; // global so we can remove it later
const typeSelect = document.getElementById('type');

function addInteractions() {
  draw = new Draw({
    source: source,
    type: typeSelect.value,
  });
  map.addInteraction(draw);
}

/**
 * Handle change event.
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw);
  addInteractions();
};

addInteractions();
