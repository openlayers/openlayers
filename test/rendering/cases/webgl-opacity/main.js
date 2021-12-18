import Heatmap from '../../../../src/ol/layer/Heatmap.js';
import KML from '../../../../src/ol/format/KML.js';
import Map from '../../../../src/ol/Map.js';
import Tile from '../../../../src/ol/layer/Tile.js';
import Vector from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {fromLonLat} from '../../../../src/ol/proj.js';

const map = new Map({
  layers: [
    new Tile({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        transition: 0,
      }),
    }),
    new Heatmap({
      source: new Vector({
        url: '/data/2012_Earthquakes_Mag5.kml',
        format: new KML({
          extractStyles: false,
        }),
      }),
      blur: 15,
      radius: 5,
      weight: function (feature) {
        const name = feature.get('name');
        const magnitude = parseFloat(name.substr(2));
        return magnitude - 5;
      },
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

setTimeout(() => {
  map.getView().setCenter(fromLonLat([45, 0]));

  render({message: 'Properly handles opacity in the first webgl layer'});
}, 500);
