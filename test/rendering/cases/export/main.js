import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import HeatmapLayer from '../../../../src/ol/layer/Heatmap.js';
import KML from '../../../../src/ol/format/KML.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {Fill, Stroke, Style} from '../../../../src/ol/style.js';

const target = document.createElement('div');
target.style.width = '100%';
target.style.height = '100%';
target.style.visibility = 'hidden';

document.body.appendChild(target);

const map = new Map({
  target: target,
  pixelRatio: 1,
  view: new View({
    center: [0, 0],
    zoom: 1,
    rotation: Math.PI / 4,
  }),
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        transition: 0,
      }),
    }),
    new VectorLayer({
      background: '#a9d3df',
      opacity: 0.5,
      source: new VectorSource({
        url: '/data/countries.json',
        format: new GeoJSON(),
      }),
      style: new Style({
        stroke: new Stroke({
          color: '#ccc',
        }),
        fill: new Fill({
          color: 'white',
        }),
      }),
    }),
    new HeatmapLayer({
      opacity: 0.5,
      source: new VectorSource({
        url: '/data/2012_Earthquakes_Mag5.kml',
        format: new KML({
          extractStyles: false,
        }),
      }),
      blur: 3,
      radius: 3,
      weight: function (feature) {
        const name = feature.get('name');
        const magnitude = parseFloat(name.substr(2));
        return magnitude - 5;
      },
      className: 'heatmap',
    }),
  ],
});

map.once('rendercomplete', function () {
  map.once('rendercomplete', function () {
    const mapCanvas = map.getCompositeCanvas();
    document.getElementById('map').appendChild(mapCanvas);
    render();
  });
  map.renderSync();
});
