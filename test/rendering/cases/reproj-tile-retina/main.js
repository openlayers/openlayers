import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import {useGeographic} from '../../../../src/ol/proj.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

const style = document.getElementById('map').style;
style.position = 'relative';
style.left = '-128px';
style.top = '128px';
style.transform = 'scale(2)';

useGeographic();

const fullGrid = createXYZ();
new Map({
  target: 'map',
  pixelRatio: 2,
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/retina/{z}/{x}/{y}@2x.png',
        tilePixelRatio: 2,
        tileGrid: new TileGrid({
          extent: fullGrid.getTileCoordExtent([13, 1542, 3213]),
          origin: fullGrid.getOrigin(0),
          resolutions: fullGrid.getResolutions(),
          tileSize: fullGrid.getTileSize(0),
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
