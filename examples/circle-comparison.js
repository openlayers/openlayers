import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {Circle} from '../src/ol/geom.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {circular} from '../src/ol/geom/Polygon.js';
import {fromLonLat, getPointResolution} from '../src/ol/proj.js';

const centerLonLat = [8.495833, 53.915222];
const center3857 = fromLonLat(centerLonLat, 'EPSG:3857');
const radius = 1000000; // 1000 km

// circle feature using projection unit meters
const circleFeature1 = new Feature({
  geometry: new Circle(
    center3857, // coordinates in EPSG:3857
    radius // radius in projection units
  ),
});

// circle feature with radius adjusted for point resolution
const circleFeature2 = new Feature({
  geometry: new Circle(
    center3857, // coordinates in EPSG:3857
    radius / getPointResolution('EPSG:3857', 1, center3857)
  ),
});

// the circle calculated with spherical geometry
const circleFeatureSpherical = new Feature({
  geometry: new circular(
    centerLonLat, // same location as lon lat
    radius, // great-circle radius in meters
    128 // vertices of the resulting polygon
  ).transform('EPSG:4326', 'EPSG:3857'),
});

circleFeature1.setStyle(
  new Style({
    stroke: new Stroke({
      color: 'red',
      width: 3,
    }),
    fill: new Fill({
      color: 'rgba(255, 0, 0, 0.2)',
    }),
  })
);

circleFeature2.setStyle(
  new Style({
    stroke: new Stroke({
      color: 'green',
      width: 3,
    }),
    fill: new Fill({
      color: 'rgba(0, 255, 0, 0.2)',
    }),
  })
);

circleFeatureSpherical.setStyle(
  new Style({
    stroke: new Stroke({
      color: 'blue',
      width: 3,
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.2)',
    }),
  })
);

new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
      visible: true,
    }),
    new VectorLayer({
      source: new VectorSource({
        features: [circleFeature1, circleFeature2, circleFeatureSpherical],
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: center3857,
    zoom: 4,
  }),
});
