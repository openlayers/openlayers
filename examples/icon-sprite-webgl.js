import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import TileJSON from '../src/ol/source/TileJSON';
import Feature from '../src/ol/Feature';
import Point from '../src/ol/geom/Point';
import VectorLayer from '../src/ol/layer/Vector';
import {Vector} from '../src/ol/source';
import {fromLonLat} from '../src/ol/proj';
import WebGLPointsLayerRenderer from '../src/ol/renderer/webgl/PointsLayer';
import {lerp} from '../src/ol/math';

const vectorSource = new Vector({
  features: [],
  attributions: 'National UFO Reporting Center'
});

const texture = document.createElement('img');
texture.src = 'data/ufo_shapes.png';

// This describes the content of the associated sprite sheet
// coords are u0, v0, u1, v1 for a given shape
const shapeTextureCoords = {
  'light': [0, 0.5, 0.25, 0],
  'sphere': [0.25, 0.5, 0.5, 0],
  'circle': [0.25, 0.5, 0.5, 0],
  'disc': [0.5, 0.5, 0.75, 0],
  'oval': [0.5, 0.5, 0.75, 0],
  'triangle': [0.75, 0.5, 1, 0],
  'fireball': [0, 1, 0.25, 0.5],
  'default': [0.75, 1, 1, 0.5]
};

const oldColor = [255, 160, 110];
const newColor = [180, 255, 200];

class WebglPointsLayer extends VectorLayer {
  createRenderer() {
    return new WebGLPointsLayerRenderer(this, {
      texture: texture,
      colorCallback: function(feature, vertex, component) {
        // component at index 3 is alpha
        if (component === 3) {
          return 1;
        }

        // color is interpolated based on year (min is 1910, max is 2013)
        // please note: most values are between 2000-2013
        const ratio = (feature.get('year') - 1950) / (2013 - 1950);
        return lerp(oldColor[component], newColor[component], ratio * ratio) / 255;
      },
      texCoordCallback: function(feature, component) {
        let coords = shapeTextureCoords[feature.get('shape')];
        if (!coords) {
          coords = shapeTextureCoords['default'];
        }
        return coords[component];
      },
      sizeCallback: function() {
        return 16;
      }
    });
  }
}


function loadData() {
  const client = new XMLHttpRequest();
  client.open('GET', 'data/csv/ufo_sighting_data.csv');
  client.onload = function() {
    const csv = client.responseText;
    const features = [];

    let prevIndex = csv.indexOf('\n') + 1; // scan past the header line

    let curIndex;
    while ((curIndex = csv.indexOf('\n', prevIndex)) != -1) {
      const line = csv.substr(prevIndex, curIndex - prevIndex).split(',');
      prevIndex = curIndex + 1;

      const coords = fromLonLat([parseFloat(line[5]), parseFloat(line[4])]);

      // only keep valid points
      if (isNaN(coords[0]) || isNaN(coords[1])) {
        continue;
      }

      features.push(new Feature({
        datetime: line[0],
        year: parseInt(/[0-9]{4}/.exec(line[0])[0]), // extract the year as int
        shape: line[2],
        duration: line[3],
        geometry: new Point(coords)
      }));
    }
    vectorSource.addFeatures(features);
  };
  client.send();
}

loadData();

new Map({
  layers: [
    new TileLayer({
      source: new TileJSON({
        url: 'https://api.tiles.mapbox.com/v3/mapbox.world-dark.json?secure',
        crossOrigin: 'anonymous'
      })
    }),
    new WebglPointsLayer({
      source: vectorSource
    })
  ],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 4000000],
    zoom: 2
  })
});
