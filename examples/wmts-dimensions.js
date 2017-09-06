import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_extent_ from '../src/ol/extent';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_WMTS_ from '../src/ol/source/wmts';
import _ol_tilegrid_WMTS_ from '../src/ol/tilegrid/wmts';


// create the WMTS tile grid in the google projection
var projection = _ol_proj_.get('EPSG:3857');
var tileSizePixels = 256;
var tileSizeMtrs = _ol_extent_.getWidth(projection.getExtent()) / tileSizePixels;
var matrixIds = [];
var resolutions = [];
for (var i = 0; i <= 14; i++) {
  matrixIds[i] = i;
  resolutions[i] = tileSizeMtrs / Math.pow(2, i);
}
var tileGrid = new _ol_tilegrid_WMTS_({
  origin: _ol_extent_.getTopLeft(projection.getExtent()),
  resolutions: resolutions,
  matrixIds: matrixIds
});

var scalgoToken = 'CC5BF28A7D96B320C7DFBFD1236B5BEB';

var wmtsSource = new _ol_source_WMTS_({
  url: 'http://ts2.scalgo.com/olpatch/wmts?token=' + scalgoToken,
  layer: 'SRTM_4_1:SRTM_4_1_flooded_sealevels',
  format: 'image/png',
  matrixSet: 'EPSG:3857',
  attributions: [
    '<a href="http://scalgo.com">SCALGO</a>',
    '<a href="http://www.cgiar-csi.org/data/' +
        'srtm-90m-digital-elevation-database-v4-1">CGIAR-CSI SRTM</a>'
  ],
  tileGrid: tileGrid,
  style: 'default',
  dimensions: {
    'threshold': 100
  }
});

var map = new _ol_Map_({
  target: 'map',
  view: new _ol_View_({
    projection: projection,
    center: [-9871995, 3566245],
    zoom: 6
  }),
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    }),
    new _ol_layer_Tile_({
      opacity: 0.5,
      source: wmtsSource
    })
  ]
});

var updateSourceDimension = function(source, sliderVal) {
  source.updateDimensions({'threshold': sliderVal});
  document.getElementById('theinfo').innerHTML = sliderVal + ' meters';
};

updateSourceDimension(wmtsSource, 10);

document.getElementById('slider').addEventListener('input', function() {
  updateSourceDimension(wmtsSource, this.value);
});
