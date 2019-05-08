import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import Zoomify from '../src/ol/source/Zoomify.js';

const imgWidth = 9911;
const imgHeight = 6100;

const zoomifyUrl = 'http://vips.vtech.fr/cgi-bin/iipsrv.fcgi?zoomify=' +
    '/mnt/MD1/AD00/plan_CHU-4HD-01/FOND.TIF/';
const iipUrl = 'http://vips.vtech.fr/cgi-bin/iipsrv.fcgi?FIF=' + '/mnt/MD1/AD00/plan_CHU-4HD-01/FOND.TIF' + '&JTL={z},{tileIndex}';

const layer = new TileLayer({
  source: new Zoomify({
    tileSize: 256,
    tilePixelRatio: 1,
    url: zoomifyUrl,
    size: [imgWidth, imgHeight],
    crossOrigin: 'anonymous'
  })
});

const extent = [0, -imgHeight, imgWidth, 0];

const resolutions = layer.getSource().getTileGrid().getResolutions();

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    // adjust zoom levels to those provided by the source
    minResolution: resolutions[resolutions.length - 1],
    maxResolution: resolutions[0],
    // constrain the center: center cannot be set outside this extent
    extent: extent
  })
});
map.getView().fit(extent);

const control = document.getElementById('zoomifyProtocol');
control.addEventListener('change', function(event) {
  const value = event.currentTarget.value;
  if (value === 'iip') {
    const extent = [0, -imgHeight, imgWidth, 0];
    layer.setSource(
      new Zoomify({
        tileSize: 256,
        tilePixelRatio: 1,
        url: iipUrl,
        size: [imgWidth, imgHeight],
        crossOrigin: 'anonymous'
      })
    );
    const resolutions = layer.getSource().getTileGrid().getResolutions();
    map.setView(
      new View({
        // adjust zoom levels to those provided by the source
        minResolution: resolutions[resolutions.length - 1],
        maxResolution: resolutions[0],
        // constrain the center: center cannot be set outside this extent
        extent: extent
      })
    );
    map.getView().fit(extent);
  } else if (value === 'zoomify') {
    const extent = [0, -imgHeight, imgWidth, 0];
    layer.setSource(
      new Zoomify({
        tileSize: 256,
        tilePixelRatio: 1,
        url: zoomifyUrl,
        size: [imgWidth, imgHeight],
        crossOrigin: 'anonymous'
      })
    );
    const resolutions = layer.getSource().getTileGrid().getResolutions();
    map.setView(
      new View({
        // adjust zoom levels to those provided by the source
        minResolution: resolutions[resolutions.length - 1],
        maxResolution: resolutions[0],
        // constrain the center: center cannot be set outside this extent
        extent: extent
      })
    );
    map.getView().fit(extent);
  } else if (value === 'zoomifyretina') {
    const pixelRatio = 4;
    // Be careful! Image extent will be modified by pixel ratio
    const extent = [0, -imgHeight / pixelRatio, imgWidth / pixelRatio, 0];
    layer.setSource(
      new Zoomify({
        tileSize: 256 / pixelRatio,
        tilePixelRatio: pixelRatio,
        url: zoomifyUrl,
        size: [imgWidth / pixelRatio, imgHeight / pixelRatio],
        crossOrigin: 'anonymous'
      })
    );
    const resolutions = layer.getSource().getTileGrid().getResolutions();
    map.setView(
      new View({
        // adjust zoom levels to those provided by the source
        minResolution: resolutions[resolutions.length - 1] / pixelRatio,
        maxResolution: resolutions[0],
        // constrain the center: center cannot be set outside this extent
        extent: extent
      })
    );
    map.getView().fit(extent);
  }

});
