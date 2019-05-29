import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import {Group as LayerGroup, Tile as TileLayer} from '../../../src/ol/layer.js';
import XYZ from '../../../src/ol/source/XYZ.js';

new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 3
  }),
  layers: new LayerGroup({
    opacity: 0.75,
    layers: [
      new TileLayer({
        opacity: 0.25,
        source: new XYZ({
          url: '/data/tiles/satellite/{z}/{x}/{y}.jpg'
        })
      }),
      new TileLayer({
        source: new XYZ({
          url: '/data/tiles/stamen-labels/{z}/{x}/{y}.png'
        })
      })
    ]
  })
});

render();
