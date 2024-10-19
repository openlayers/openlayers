import Layer from '../../../../src/ol/layer/WebGLTile.js';
import Map from '../../../../src/ol/Map.js';
import Source from '../../../../src/ol/source/ImageTile.js';
import View from '../../../../src/ol/View.js';
import {TileGrid, createXYZ} from '../../../../src/ol/tilegrid.js';
import {useGeographic} from '../../../../src/ol/proj.js';

useGeographic();

const fullGrid = createXYZ({tileSize: 256});
new Map({
  target: 'map',
  layers: [
    new Layer({
      source: new Source({
        url: '/data/tiles/retina/{z}/{x}/{y}@2x.png',
        tileSize: 512,
        tileGrid: new TileGrid({
          extent: fullGrid.getTileCoordExtent([13, 1542, 3213]),
          origin: fullGrid.getOrigin(),
          resolutions: fullGrid.getResolutions(),
          tileSize: 256,
        }),
        transition: 0,
      }),
    }),
  ],
  view: new View({
    center: [-112.216, 36.12],
    zoom: 13,
    projection: 'EPSG:4326',
  }),
});

render();
