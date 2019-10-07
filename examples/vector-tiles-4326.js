import View from '../src/ol/View.js';
import MVT from '../src/ol/format/MVT.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import TileGrid from '../src/ol/tilegrid/TileGrid.js';

import olms from 'ol-mapbox-style';
import {defaultResolutions} from 'ol-mapbox-style/util.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';

// Match the server resolutions
const maxResolution = 360 / 512;
defaultResolutions.length = 14;
for (let i = 0; i < 14; ++i) {
  defaultResolutions[i] = maxResolution / Math.pow(2, i + 1);
}

olms('map', 'https://api.maptiler.com/maps/basic-4326/style.json?key=' + key).then(function(map) {

  // Custom tile grid for the EPSG:4326 projection
  const tileGrid = new TileGrid({
    extent: [-180, -90, 180, 90],
    tileSize: 512,
    resolutions: defaultResolutions
  });

  const mapboxStyle = map.get('mapbox-style');

  // Replace the source with a EPSG:4326 projection source for each vector tile layer
  map.getLayers().forEach(function(layer) {
    const mapboxSource = layer.get('mapbox-source');
    if (mapboxSource && mapboxStyle.sources[mapboxSource].type === 'vector') {
      const source = layer.getSource();
      layer.setSource(new VectorTileSource({
        format: new MVT(),
        projection: 'EPSG:4326',
        urls: source.getUrls(),
        tileGrid: tileGrid
      }));
    }
  });

  // Configure the map with a view with EPSG:4326 projection
  map.setView(new View({
    projection: 'EPSG:4326',
    zoom: mapboxStyle.zoom,
    center: mapboxStyle.center
  }));

});
