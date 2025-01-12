import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Layer from '../../../../src/ol/layer/Tile.js';
import Source from '../../../../src/ol/source/ImageTile.js';
import {TileGrid, createXYZ} from '../../../../src/ol/tilegrid.js';

const style = document.getElementById('map').style;
style.position = 'relative';
style.left = '-128px';
style.top = '128px';
style.transform = 'scale(2)';

const fullGrid = createXYZ();
new Map({
  target: 'map',
  pixelRatio: 2,
  layers: [
    new Layer({
      source: new Source({
        url: '/data/tiles/retina/{z}/{x}/{y}@2x.png',
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
