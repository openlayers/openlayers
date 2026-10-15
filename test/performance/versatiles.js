import {applyBackground, applyStyle} from 'ol-mapbox-style';
import Map from '../../src/ol/Map.js';
import View from '../../src/ol/View.js';
import Link from '../../src/ol/interaction/Link.js';
import WebGPUVectorTileLayer from '../../src/ol/layer/WebGPUVectorTile.js';
import '../../src/ol/ol.css';
import VectorTileSource from '../../src/ol/source/VectorTile.js';
import {startFrameHud} from './frame-hud.js';

const stylePath = 'data/versatiles/style.json';

const response = await fetch(stylePath);
if (!response.ok) {
  document.getElementById('map').remove();
  document.getElementById('missing').hidden = false;
} else {
  const style = await response.json();
  const styleUrl = new URL(stylePath, location.href).href;
  const layer = new WebGPUVectorTileLayer({
    declutter: true,
    source: new VectorTileSource({}),
  });
  // Mapbox GL zoom levels are based on 512 pixel tiles. With the same
  // resolution at zoom level 0, view zoom levels match the zoom levels of the
  // style. The center and zoom are the focus view the dataset was built around.
  const map = new Map({
    target: 'map',
    layers: [layer],
    view: new View({
      center: [1813976.46267, 6141328.17996],
      zoom: 14.16667,
      maxResolution: 78271.51696402048,
    }),
  });
  map.addInteraction(new Link());
  const options = {
    styleUrl,
    webfonts: 'data/versatiles/fonts/{font-family}/{fontweight}.css',
  };
  applyStyle(layer, style, options);
  applyBackground(layer, style, options);
  startFrameHud();
}
