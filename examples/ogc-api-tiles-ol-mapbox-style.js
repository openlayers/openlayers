import {applyStyle} from 'ol-mapbox-style';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MVT from '../src/ol/format/MVT.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import {useGeographic} from '../src/ol/proj.js';
import OGCVectorTile from '../src/ol/source/OGCVectorTile.js';

useGeographic();

const api = 'https://api.pdok.nl/kadaster/brt-achtergrondkaart/ogc/v1';
const title = 'BRT Achtergrondkaart';

// Create the layer with an OGC API - Tiles source first.
const layer = new VectorTileLayer({
  declutter: true,
  properties: {title: title},
  source: new OGCVectorTile({
    url: api + '/tiles/WebMercatorQuad',
    format: new MVT(),
    attributions: `<a href="${api}">${title}</a> © <a href="https://www.kadaster.nl/">Kadaster</a>`,
  }),
});

// Then style it with a Mapbox style from the OGC API - Styles endpoint
// of the same service. With `updateSource: false`, the style is only
// used for styling, and the OGC API - Tiles source of the layer is kept.
// For a dark map, use '/styles/darkmode__webmercatorquad' instead.
applyStyle(layer, api + '/styles/standaard__webmercatorquad', {
  updateSource: false,
});

// Finally create the map with the styled layer.
const map = new Map({
  target: 'map',
  layers: [layer],
  view: new View({
    center: [5.387201, 52.155172],
    zoom: 7,
  }),
});
