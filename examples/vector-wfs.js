import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_format_GeoJSON_ from '../src/ol/format/geojson';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_loadingstrategy_ from '../src/ol/loadingstrategy';
import _ol_source_BingMaps_ from '../src/ol/source/bingmaps';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';


var vectorSource = new _ol_source_Vector_({
  format: new _ol_format_GeoJSON_(),
  url: function(extent) {
    return 'https://ahocevar.com/geoserver/wfs?service=WFS&' +
        'version=1.1.0&request=GetFeature&typename=osm:water_areas&' +
        'outputFormat=application/json&srsname=EPSG:3857&' +
        'bbox=' + extent.join(',') + ',EPSG:3857';
  },
  strategy: _ol_loadingstrategy_.bbox
});


var vector = new _ol_layer_Vector_({
  source: vectorSource,
  style: new _ol_style_Style_({
    stroke: new _ol_style_Stroke_({
      color: 'rgba(0, 0, 255, 1.0)',
      width: 2
    })
  })
});

var raster = new _ol_layer_Tile_({
  source: new _ol_source_BingMaps_({
    imagerySet: 'Aerial',
    key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5'
  })
});

var map = new _ol_Map_({
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new _ol_View_({
    center: [-8908887.277395891, 5381918.072437216],
    maxZoom: 19,
    zoom: 12
  })
});
