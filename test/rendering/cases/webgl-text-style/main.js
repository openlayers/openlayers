import WebGLVectorLayer from 'ol/layer/WebGLVector.js';
import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

const vectorSource = new VectorSource();

// scale
vectorSource.addFeature(
  new Feature({
    geometry: new Point([-50, 50]),
    name: 'scale',
  }),
);

// rotate
vectorSource.addFeature(
  new Feature({
    geometry: new Point([50, -50]),
    name: 'rotate',
  }),
);

// rotate with view
vectorSource.addFeature(
  new Feature({
    geometry: new Point([50, 50]),
    name: 'rotateWithView',
  }),
);

// align left
vectorSource.addFeature(
  new Feature({
    geometry: new Point([50, 50]),
    name: 'alignLeft',
  }),
);

// background and padding
vectorSource.addFeature(
  new Feature({
    geometry: new Point([-10, 0]),
    name: 'backgroundPadding',
  }),
);

// two dimensional scale
vectorSource.addFeature(
  new Feature({
    geometry: new Point([100, 20]),
    name: 'mirror',
  }),
);

new Map({
  pixelRatio: 1,
  layers: [
    new WebGLVectorLayer({
      source: vectorSource,
      style: [
        // scale
        {
          filter: ['==', ['get', 'name'], 'scale'],
          style: {
            'text-value': 'hello',
            //'text-font': '12px Ubuntu',
            'text-scale': 2,
            'text-fill-color': 'red',
            'text-stroke-color': '#000',
          },
        },
        // rotate
        {
          filter: ['==', ['get', 'name'], 'rotate'],
          style: {
            'text-value': 'upside down',
            //'text-font': '12px Ubuntu',
            'text-rotation': Math.PI,
            'text-stroke-color': 'red',
            'text-stroke-width': 2,
          },
        },
        // rotate with view
        {
          filter: ['==', ['get', 'name'], 'rotateWithView'],
          style: {
            'text-value': 'rotateWithView',
            //'text-font': 'Ubuntu',
            'text-rotate-with-view': true,
            'text-stroke-color': [10, 10, 10, 0.5],
          },
        },
        // align left
        {
          filter: ['==', ['get', 'name'], 'alignLeft'],
          style: {
            'text-value': 'align left',
            //'text-font': 'Ubuntu',
            'text-align': 'left',
            'text-stroke-color': [10, 10, 10, 0.5],
          },
        },
        // background and padding
        {
          filter: ['==', ['get', 'name'], 'backgroundPadding'],
          style: {
            'text-value': 'hello',
            //'text-font': '12px Ubuntu',
            'text-padding': [1, 2, 3, 5],
            'text-background-fill-color': 'rgba(55, 55, 55, 0.25)',
            'text-background-stroke-color': '#000',
            'text-background-stroke-width': 1,
          },
        },
        // two dimensional scale (mirror)
        {
          filter: ['==', ['get', 'name'], 'mirror'],
          style: {
            'text-value': 'mirror',
            //'text-font': '12px Ubuntu',
            'text-scale': [-1, 2],
            'text-rotate-with-view': true,
            'text-fill-color': 'red',
            'text-stroke-color': '#000',
            'text-padding': [1, 2, 3, 5],
            'text-background-fill-color': 'rgba(55, 55, 55, 0.25)',
            'text-background-stroke-color': '#000',
            'text-background-stroke-width': 1,
          },
        },
      ],
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
    rotation: Math.PI / 4,
  }),
});

render({tolerance: 0.02});
