import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MVT from '../src/ol/format/MVT.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import TileGrid from '../src/ol/tilegrid/TileGrid.js';

import {applyStyle, applyBackground} from 'ol-mapbox-style';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';

const tileGridOptions = {
  extent: [-180, -90, 180, 90],
  sizes: [[2, 1], [4, 2], [8, 4], [16, 8], [32, 16], [64, 32], [128, 64], [256, 128], [512, 256], [1024, 512], [2048, 1024], [4096, 2048], [8192, 4096], [16384, 8192]],
  tileSize: 512,
  resolutions: [0.3515625, 0.17578125, 0.087890625, 0.0439453125, 0.02197265625, 0.010986328125, 0.0054931640625, 0.00274658203125, 0.001373291015625, 0.0006866455078125, 0.00034332275390625, 0.000171661376953125, 8.58306884765625e-05, 4.291534423828125e-05]
};

const map = new Map({
  target: 'map',
  view: new View({
    projection: 'EPSG:4326',
    center: [0, 35],
    zoom: 1
  })
});

fetch('https://api.maptiler.com/maps/basic-4326/style.json?key=' + key)
  .then(function(res) {
    return res.json();
  })
  .then(function(style) {
    Object.keys(style.sources).forEach(function(sourceId) {
      const source = style.sources[sourceId];
      if (source && source.url && source.type == 'vector') {
        fetch(source.url)
          .then(function(res) {
            return res.json();
          })
          .then(function(tilejson) {
            const layer = new VectorTileLayer({
              declutter: true,
              source: new VectorTileSource({
                attribution: tilejson.attribution,
                format: new MVT(),
                projection: 'EPSG:4326',
                tileGrid: new TileGrid(tileGridOptions),
                urls: tilejson.tiles
              })
            });
            map.addLayer(layer);

            applyStyle(layer, style, sourceId, undefined, tileGridOptions.resolutions);
          });
      }
    });
    applyBackground(map, style);
  });
