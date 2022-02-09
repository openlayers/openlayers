import Map from '../../../../src/ol/Map.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';
import {get} from '../../../../src/ol/proj.js';
import {sourcesFromTileGrid} from '../../../../src/ol/source.js';

const resolutions = createXYZ({maxZoom: 1}).getResolutions();
const tilePyramid = new TileGrid({
  extent: get('EPSG:3857').getExtent(),
  resolutions: [resolutions[1]],
  tileSizes: [[256, 512]],
});

new Map({
  target: 'map',
  layers: [
    new TileLayer({
      sources: sourcesFromTileGrid(tilePyramid, (tileCoord) => {
        let source;
        switch (tileCoord.toString()) {
          case '0,1,0':
            source = new XYZ({
              url: '/data/tiles/osm/{z}/{x}/{y}.png',
              tileGrid: new TileGrid({
                resolutions,
                minZoom: tileCoord[0],
                maxZoom: tileCoord[0] + 1,
                extent: tilePyramid.getTileCoordExtent(tileCoord),
                origin: [-20037508.342789244, 20037508.342789244],
              }),
            });
            break;
          default:
            source = new XYZ({
              url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
              tileGrid: new TileGrid({
                resolutions,
                minZoom: tileCoord[0],
                maxZoom: tileCoord[0] + 1,
                extent: tilePyramid.getTileCoordExtent(tileCoord),
                origin: [-20037508.342789244, 20037508.342789244],
              }),
            });
        }
        return source;
      }),
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

render();
