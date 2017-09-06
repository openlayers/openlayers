import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_control_ from '../src/ol/control';
import _ol_control_ScaleLine_ from '../src/ol/control/scaleline';
import _ol_layer_Image_ from '../src/ol/layer/image';
import _ol_proj_ from '../src/ol/proj';
import _ol_proj_Projection_ from '../src/ol/proj/projection';
import _ol_source_ImageWMS_ from '../src/ol/source/imagewms';


// Transparent Proj4js support:
//
// EPSG:21781 is known to Proj4js because its definition was loaded in the html.
// Now when we create an ol.proj.Projection instance with the 'EPSG:21781' code,
// OpenLayers will pick up parameters like units and transform functions from
// Proj4js.
//
// Note that we are setting the projection's extent here, which is used to
// determine the view resolution for zoom level 0. Recommended values for a
// projection's validity extent can be found at https://epsg.io/.
//
// If you use Proj4js only to transform coordinates, you don't even need to
// create an ol.proj.Projection instance. ol.proj.get() will take care of it
// internally.

var projection = new _ol_proj_Projection_({
  code: 'EPSG:21781',
  extent: [485869.5728, 76443.1884, 837076.5648, 299941.7864]
});

var extent = [420000, 30000, 900000, 350000];
var layers = [
  new _ol_layer_Image_({
    extent: extent,
    source: new _ol_source_ImageWMS_({
      url: 'https://wms.geo.admin.ch/',
      crossOrigin: 'anonymous',
      attributions: '© <a href="http://www.geo.admin.ch/internet/geoportal/' +
          'en/home.html">Pixelmap 1:1000000 / geo.admin.ch</a>',
      params: {
        'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
        'FORMAT': 'image/jpeg'
      },
      serverType: /** @type {ol.source.WMSServerType} */ ('mapserver')
    })
  }),
  new _ol_layer_Image_({
    extent: extent,
    source: new _ol_source_ImageWMS_({
      url: 'https://wms.geo.admin.ch/',
      crossOrigin: 'anonymous',
      attributions: '© <a href="http://www.geo.admin.ch/internet/geoportal/' +
          'en/home.html">National parks / geo.admin.ch</a>',
      params: {'LAYERS': 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'},
      serverType: /** @type {ol.source.WMSServerType} */ ('mapserver')
    })
  })
];

var map = new _ol_Map_({
  controls: _ol_control_.defaults().extend([
    new _ol_control_ScaleLine_()
  ]),
  layers: layers,
  target: 'map',
  view: new _ol_View_({
    projection: projection,
    center: _ol_proj_.fromLonLat([8.23, 46.86], projection),
    extent: extent,
    zoom: 2
  })
});
