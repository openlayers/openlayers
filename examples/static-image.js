import ImageLayer from '../src/ol/layer/Image.js';
import Map from '../src/ol/Map.js';
import Projection from '../src/ol/proj/Projection.js';
import Static from '../src/ol/source/ImageStatic.js';
import View from '../src/ol/View.js';
import {getCenter} from '../src/ol/extent.js';

// Map views always need a projection.  Here we just want to map image
// coordinates directly to map coordinates, so we create a projection that uses
// the image extent in pixels.
const extent = [0, 0, 1024, 968];
const projection = new Projection({
  code: 'xkcd-image',
  units: 'pixels',
  extent: extent,
});

const map = new Map({
  layers: [
    new ImageLayer({
      source: new Static({
        attributions: '© <a href="https://xkcd.com/license.html">xkcd</a>',
        url: 'https://imgs.xkcd.com/comics/online_communities.png',
        projection: projection,
        imageExtent: extent,
      }),
    }),
  ],
  target: 'map',
  view: new View({
    projection: projection,
    center: getCenter(extent),
    zoom: 2,
    maxZoom: 8,
  }),
});
