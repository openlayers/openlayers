import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Image_ from '../src/ol/layer/image';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_Projection_ from '../src/ol/proj/projection';
import _ol_source_ImageWMS_ from '../src/ol/source/imagewms';
import _ol_source_TileWMS_ from '../src/ol/source/tilewms';


var layers = [
  new _ol_layer_Tile_({
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
  new _ol_layer_Image_({
    source: new _ol_source_ImageWMS_({
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

var map = new _ol_Map_({
  layers: layers,
  target: 'map',
  view: new _ol_View_({
    center: [660000, 190000],
    projection: projection,
    zoom: 9
  })
});
