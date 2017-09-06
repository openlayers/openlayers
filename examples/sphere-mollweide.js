import _ol_Graticule_ from '../src/ol/graticule';
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_format_GeoJSON_ from '../src/ol/format/geojson';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_proj_Projection_ from '../src/ol/proj/projection';
import _ol_source_Vector_ from '../src/ol/source/vector';


proj4.defs('ESRI:53009', '+proj=moll +lon_0=0 +x_0=0 +y_0=0 +a=6371000 ' +
    '+b=6371000 +units=m +no_defs');

// Configure the Sphere Mollweide projection object with an extent,
// and a world extent. These are required for the Graticule.
var sphereMollweideProjection = new _ol_proj_Projection_({
  code: 'ESRI:53009',
  extent: [-9009954.605703328, -9009954.605703328,
    9009954.605703328, 9009954.605703328],
  worldExtent: [-179, -89.99, 179, 89.99]
});

var map = new _ol_Map_({
  keyboardEventTarget: document,
  layers: [
    new _ol_layer_Vector_({
      source: new _ol_source_Vector_({
        url: 'data/geojson/countries-110m.geojson',
        format: new _ol_format_GeoJSON_()
      })
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    projection: sphereMollweideProjection,
    resolutions: [65536, 32768, 16384, 8192, 4096, 2048],
    zoom: 0
  })
});

new _ol_Graticule_({
  map: map
});
