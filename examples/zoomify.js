import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import Zoomify from '../src/ol/source/Zoomify.js';

const imgWidth = 4000;
const imgHeight = 3000;

const zoomifyUrl = 'https://ol-zoomify.surge.sh/zoomify/';

const source = new Zoomify({
  url: zoomifyUrl,
  size: [imgWidth, imgHeight],
  crossOrigin: 'anonymous',
  zDirection: -1, // Ensure we get a tile with the screen resolution or higher
});
const extent = source.getTileGrid().getExtent();

const retinaPixelRatio = 2;
const retinaSource = new Zoomify({
  url: zoomifyUrl,
  size: [imgWidth, imgHeight],
  crossOrigin: 'anonymous',
  zDirection: -1, // Ensure we get a tile with the screen resolution or higher
  tilePixelRatio: retinaPixelRatio, // Display retina tiles
  tileSize: 256 / retinaPixelRatio, // from a higher zoom level
});

const layer = new TileLayer({
  source: source,
});

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    // adjust zoom levels to those provided by the source
    resolutions: layer.getSource().getTileGrid().getResolutions(),
    // constrain the center: center cannot be set outside this extent
    extent: extent,
    constrainOnlyCenter: true,
  }),
});
map.getView().fit(extent);

const control = document.getElementById('zoomifyProtocol');
control.addEventListener('change', function (event) {
  const value = event.currentTarget.value;
  if (value === 'zoomify') {
    layer.setSource(source);
  } else if (value === 'zoomifyretina') {
    layer.setSource(retinaSource);
  }
});
