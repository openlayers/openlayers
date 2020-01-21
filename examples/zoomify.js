import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import Zoomify from '../src/ol/source/Zoomify.js';

const imgWidth = 4000;
const imgHeight = 3000;

const zoomifyUrl = 'https://ol-zoomify.surge.sh/zoomify/';

const layer = new TileLayer({
  source: new Zoomify({
    url: zoomifyUrl,
    size: [imgWidth, imgHeight],
    crossOrigin: 'anonymous'
  })
});

const extent = [0, -imgHeight, imgWidth, 0];

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    // adjust zoom levels to those provided by the source
    resolutions: layer.getSource().getTileGrid().getResolutions(),
    // constrain the center: center cannot be set outside this extent
    extent: extent,
    constrainOnlyCenter: true
  })
});
map.getView().fit(extent);

const control = document.getElementById('zoomifyProtocol');
control.addEventListener('change', function(event) {
  const value = event.currentTarget.value;
  if (value === 'zoomify') {
    layer.setSource(new Zoomify({
      url: zoomifyUrl,
      size: [imgWidth, imgHeight],
      crossOrigin: 'anonymous'
    }));
  } else if (value === 'zoomifyretina') {
    layer.setSource(new Zoomify({
      tileSize: 256, // The tile size is 256px on the server, this is the default value
      tilePixelRatio: 2, // We want to display this on a retina screen
      tilePixelRatioOriginal: 1, // But the server serves 256px tiles, not 512px tiles that would be needed nominally.
      zDirection: -1, //Ensure we get the most precise tile in any case
      url: zoomifyUrl,
      size: [imgWidth, imgHeight],
      crossOrigin: 'anonymous'
    }));
  }
});


