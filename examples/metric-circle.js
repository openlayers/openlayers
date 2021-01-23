import '../src/ol/ol.css';
import {circular} from '../src/ol/geom/Polygon.js';
import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {Circle} from '../src/ol/geom.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';

const circleFeature = new Feature({
  geometry: new Circle(
    [945751.8, 7154116.68], // coordinates in EPSG:3857
    1500 // units of the layer, in this case "fake" Pseudo Mercator meters
  ),
});

// the metric circle is created in EPSG:4326
const metricCircleFeature = new Feature({
  geometry: new circular(
    [8.495833, 53.915222], // same location as lon lat
    1500, // meters
    128 // vertices of the resulting circle
  ).transform('EPSG:4326', 'EPSG:3857'),
});

circleFeature.setStyle(
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

metricCircleFeature.setStyle(
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
        features: [circleFeature, metricCircleFeature],
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [945753, 7154121],
    zoom: 13,
  }),
});
