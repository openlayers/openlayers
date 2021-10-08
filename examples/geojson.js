import Circle from '../src/ol/geom/Circle.js';
import Feature from '../src/ol/Feature.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {style} from '../src/ol/style.js';

const styles = {
  Point: style({
    circle: {radius: 10, stroke: {color: 'red', width: 1}},
  }),
  LineString: style({
    stroke: {
      color: 'green',
    },
  }),
  MultiLineString: style({
    stroke: {
      color: 'green',
    },
  }),
  MultiPolygon: style({
    stroke: {
      color: 'yellow',
    },
    fill: {
      color: 'rgba(255, 255, 0, 0.1)',
    },
  }),
  Polygon: style({
    stroke: {
      color: 'blue',
      lineDash: [4],
      width: 3,
    },
    fill: {
      color: 'rgba(0, 0, 255, 0.1)',
    },
  }),
  GeometryCollection: style({
    stroke: {
      color: 'magenta',
      width: 2,
    },
    fill: {
      color: 'magenta',
    },
    circle: {
      radius: 15,
      stroke: {
        color: 'magenta',
      },
    },
  }),
  Circle: style({
    stroke: {
      color: 'red',
      width: 2,
    },
    fill: {
      color: 'rgba(255,0,0,0.2)',
    },
  }),
};

const styleFunction = function (feature) {
  return styles[feature.getGeometry().getType()];
};

const geojsonObject = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 0],
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4e6, -2e6],
          [8e6, 2e6],
        ],
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4e6, 2e6],
          [8e6, -2e6],
        ],
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-5e6, -1e6],
            [-3e6, -1e6],
            [-4e6, 1e6],
            [-5e6, -1e6],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [
            [-1e6, -7.5e5],
            [-1e6, 7.5e5],
          ],
          [
            [1e6, -7.5e5],
            [1e6, 7.5e5],
          ],
          [
            [-7.5e5, -1e6],
            [7.5e5, -1e6],
          ],
          [
            [-7.5e5, 1e6],
            [7.5e5, 1e6],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-5e6, 6e6],
              [-3e6, 6e6],
              [-3e6, 8e6],
              [-5e6, 8e6],
              [-5e6, 6e6],
            ],
          ],
          [
            [
              [-2e6, 6e6],
              [0, 6e6],
              [0, 8e6],
              [-2e6, 8e6],
              [-2e6, 6e6],
            ],
          ],
          [
            [
              [1e6, 6e6],
              [3e6, 6e6],
              [3e6, 8e6],
              [1e6, 8e6],
              [1e6, 6e6],
            ],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'LineString',
            coordinates: [
              [-5e6, -5e6],
              [0, -5e6],
            ],
          },
          {
            type: 'Point',
            coordinates: [4e6, -5e6],
          },
          {
            type: 'Polygon',
            coordinates: [
              [
                [1e6, -6e6],
                [3e6, -6e6],
                [2e6, -4e6],
                [1e6, -6e6],
              ],
            ],
          },
        ],
      },
    },
  ],
};

const vectorSource = new VectorSource({
  features: new GeoJSON().readFeatures(geojsonObject),
});

vectorSource.addFeature(new Feature(new Circle([5e6, 7e6], 1e6)));

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: styleFunction,
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    vectorLayer,
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
