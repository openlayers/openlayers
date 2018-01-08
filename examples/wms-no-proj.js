import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import ImageLayer from '../src/ol/layer/Image.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_proj_Projection_ from '../src/ol/proj/Projection.js';
import ImageWMS from '../src/ol/source/ImageWMS.js';
import _ol_source_TileWMS_ from '../src/ol/source/TileWMS.js';


var layers = [
  new TileLayer({
    source: new _ol_source_TileWMS_({
      attributions: '© <a href="http://www.geo.admin.ch/internet/geoportal/' +
          'en/home.html">Pixelmap 1:1000000 / geo.admin.ch</a>',
      crossOrigin: 'anonymous',
      params: {
        'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
        'FORMAT': 'image/jpeg'
      },
      url: 'https://wms.geo.admin.ch/'
    })
  }),
  new ImageLayer({
    source: new ImageWMS({
      attributions: '© <a href="http://www.geo.admin.ch/internet/geoportal/' +
          'en/home.html">National parks / geo.admin.ch</a>',
      crossOrigin: 'anonymous',
      params: {'LAYERS': 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'},
      serverType: 'mapserver',
      url: 'https://wms.geo.admin.ch/'
    })
  })
];

// A minimal projection object is configured with only the SRS code and the map
// units. No client-side coordinate transforms are possible with such a
// projection object. Requesting tiles only needs the code together with a
// tile grid of Cartesian coordinates; it does not matter how those
// coordinates relate to latitude or longitude.
var projection = new _ol_proj_Projection_({
  code: 'EPSG:21781',
  units: 'm'
});

var map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [660000, 190000],
    projection: projection,
    zoom: 9
  })
});
