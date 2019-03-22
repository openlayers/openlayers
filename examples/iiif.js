import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import IIIF from '../src/ol/source/IIIF.js';
import IIIFInfo from '../src/ol/format/IIIFInfo.js';

const layer = new TileLayer(),
    map = new Map({
      layers: [layer],
      target: 'map'
    });

const notifyDiv = document.getElementById('iiif-notification');

function refreshMap(imageInfoUrl) {
  fetch(imageInfoUrl).then(function(response) {
    response.json().then(function(imageInfo) {
      const options = new IIIFInfo().readFromJson(imageInfo);
      if (options === undefined || options.version === undefined) {
        notifyDiv.textContent = 'Data seems to be no valid IIIF image information.';
        return;
      }
      const extent = [0, -options.size[1], options.size[0], 0];
      options.zDirection = -1;
      layer.setSource(new IIIF(options));
      map.setView(new View({
        resolutions: layer.getSource().getTileGrid().getResolutions(),
        extent: extent,
        constrainOnlyCenter: true
      }));
      map.getView().fit(extent);
      notifyDiv.textContent = '';
    }).catch(function(body) {
      notifyDiv.textContent = 'Could not read image info json. ' + body;
    });
  }).catch(function() {
    notifyDiv.textContent = 'Could not read data from URL.';
  });
}

const urlInput = document.getElementById('imageInfoUrl');
const displayButton = document.getElementById('display');

displayButton.addEventListener('click', function() {
  const imageInfoUrl = urlInput.value;
  refreshMap(imageInfoUrl);
});

refreshMap(urlInput.value);
