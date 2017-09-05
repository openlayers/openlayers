import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_extent_ from '../src/ol/extent';
import _ol_format_WMTSCapabilities_ from '../src/ol/format/wmtscapabilities';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_TileImage_ from '../src/ol/source/tileimage';
import _ol_source_TileWMS_ from '../src/ol/source/tilewms';
import _ol_source_WMTS_ from '../src/ol/source/wmts';
import _ol_source_XYZ_ from '../src/ol/source/xyz';
import _ol_tilegrid_TileGrid_ from '../src/ol/tilegrid/tilegrid';


proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 ' +
    '+x_0=400000 +y_0=-100000 +ellps=airy ' +
    '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
    '+units=m +no_defs');
var proj27700 = _ol_proj_.get('EPSG:27700');
proj27700.setExtent([0, 0, 700000, 1300000]);

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl ' +
    '+towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');
var proj23032 = _ol_proj_.get('EPSG:23032');
proj23032.setExtent([-1206118.71, 4021309.92, 1295389.00, 8051813.28]);

proj4.defs('EPSG:5479', '+proj=lcc +lat_1=-76.66666666666667 +lat_2=' +
    '-79.33333333333333 +lat_0=-78 +lon_0=163 +x_0=7000000 +y_0=5000000 ' +
    '+ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
var proj5479 = _ol_proj_.get('EPSG:5479');
proj5479.setExtent([6825737.53, 4189159.80, 9633741.96, 5782472.71]);

proj4.defs('EPSG:21781', '+proj=somerc +lat_0=46.95240555555556 ' +
    '+lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
    '+towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs');
var proj21781 = _ol_proj_.get('EPSG:21781');
proj21781.setExtent([485071.54, 75346.36, 828515.78, 299941.84]);

proj4.defs('EPSG:3413', '+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 ' +
    '+x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');
var proj3413 = _ol_proj_.get('EPSG:3413');
proj3413.setExtent([-4194304, -4194304, 4194304, 4194304]);

proj4.defs('EPSG:2163', '+proj=laea +lat_0=45 +lon_0=-100 +x_0=0 +y_0=0 ' +
    '+a=6370997 +b=6370997 +units=m +no_defs');
var proj2163 = _ol_proj_.get('EPSG:2163');
proj2163.setExtent([-8040784.5135, -2577524.9210, 3668901.4484, 4785105.1096]);

proj4.defs('ESRI:54009', '+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 ' +
    '+units=m +no_defs');
var proj54009 = _ol_proj_.get('ESRI:54009');
proj54009.setExtent([-18e6, -9e6, 18e6, 9e6]);


var layers = {};

layers['bng'] = new _ol_layer_Tile_({
  source: new _ol_source_XYZ_({
    projection: 'EPSG:27700',
    url: 'https://tileserver.maptiler.com/miniscale/{z}/{x}/{y}.png',
    crossOrigin: '',
    maxZoom: 6
  })
});

layers['osm'] = new _ol_layer_Tile_({
  source: new _ol_source_OSM_()
});

layers['wms4326'] = new _ol_layer_Tile_({
  source: new _ol_source_TileWMS_({
    url: 'https://ahocevar.com/geoserver/wms',
    crossOrigin: '',
    params: {
      'LAYERS': 'ne:NE1_HR_LC_SR_W_DR',
      'TILED': true
    },
    projection: 'EPSG:4326'
  })
});

layers['wms21781'] = new _ol_layer_Tile_({
  source: new _ol_source_TileWMS_({
    attributions: '© <a href="http://www.geo.admin.ch/internet/geoportal/' +
      'en/home.html">Pixelmap 1:1000000 / geo.admin.ch</a>',
    crossOrigin: 'anonymous',
    params: {
      'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
      'FORMAT': 'image/jpeg'
    },
    url: 'https://wms.geo.admin.ch/',
    projection: 'EPSG:21781'
  })
});

var parser = new _ol_format_WMTSCapabilities_();
var url = 'https://map1.vis.earthdata.nasa.gov/wmts-arctic/' +
    'wmts.cgi?SERVICE=WMTS&request=GetCapabilities';
fetch(url).then(function(response) {
  return response.text();
}).then(function(text) {
  var result = parser.read(text);
  var options = _ol_source_WMTS_.optionsFromCapabilities(result, {
    layer: 'OSM_Land_Mask',
    matrixSet: 'EPSG3413_250m'
  });
  options.crossOrigin = '';
  options.projection = 'EPSG:3413';
  options.wrapX = false;
  layers['wmts3413'] = new _ol_layer_Tile_({
    source: new _ol_source_WMTS_(/** @type {!olx.source.WMTSOptions} */ (options))
  });
});

layers['grandcanyon'] = new _ol_layer_Tile_({
  source: new _ol_source_XYZ_({
    url: 'https://tileserver.maptiler.com/grandcanyon@2x/{z}/{x}/{y}.png',
    crossOrigin: '',
    tilePixelRatio: 2,
    maxZoom: 15,
    attributions: 'Tiles © USGS, rendered with ' +
      '<a href="http://www.maptiler.com/">MapTiler</a>'
  })
});

var startResolution =
    _ol_extent_.getWidth(_ol_proj_.get('EPSG:3857').getExtent()) / 256;
var resolutions = new Array(22);
for (var i = 0, ii = resolutions.length; i < ii; ++i) {
  resolutions[i] = startResolution / Math.pow(2, i);
}

layers['states'] = new _ol_layer_Tile_({
  source: new _ol_source_TileWMS_({
    url: 'https://ahocevar.com/geoserver/wms',
    crossOrigin: '',
    params: {'LAYERS': 'topp:states'},
    serverType: 'geoserver',
    tileGrid: new _ol_tilegrid_TileGrid_({
      extent: [-13884991, 2870341, -7455066, 6338219],
      resolutions: resolutions,
      tileSize: [512, 256]
    }),
    projection: 'EPSG:3857'
  })
});


var map = new _ol_Map_({
  layers: [
    layers['osm'],
    layers['bng']
  ],
  target: 'map',
  view: new _ol_View_({
    projection: 'EPSG:3857',
    center: [0, 0],
    zoom: 2
  })
});


var baseLayerSelect = document.getElementById('base-layer');
var overlayLayerSelect = document.getElementById('overlay-layer');
var viewProjSelect = document.getElementById('view-projection');
var renderEdgesCheckbox = document.getElementById('render-edges');
var renderEdges = false;

function updateViewProjection() {
  var newProj = _ol_proj_.get(viewProjSelect.value);
  var newProjExtent = newProj.getExtent();
  var newView = new _ol_View_({
    projection: newProj,
    center: _ol_extent_.getCenter(newProjExtent || [0, 0, 0, 0]),
    zoom: 0,
    extent: newProjExtent || undefined
  });
  map.setView(newView);

  // Example how to prevent double occurrence of map by limiting layer extent
  if (newProj == _ol_proj_.get('EPSG:3857')) {
    layers['bng'].setExtent([-1057216, 6405988, 404315, 8759696]);
  } else {
    layers['bng'].setExtent(undefined);
  }
}


/**
 * Handle change event.
 */
viewProjSelect.onchange = function() {
  updateViewProjection();
};

updateViewProjection();

var updateRenderEdgesOnLayer = function(layer) {
  if (layer instanceof _ol_layer_Tile_) {
    var source = layer.getSource();
    if (source instanceof _ol_source_TileImage_) {
      source.setRenderReprojectionEdges(renderEdges);
    }
  }
};


/**
 * Handle change event.
 */
baseLayerSelect.onchange = function() {
  var layer = layers[baseLayerSelect.value];
  if (layer) {
    layer.setOpacity(1);
    updateRenderEdgesOnLayer(layer);
    map.getLayers().setAt(0, layer);
  }
};


/**
 * Handle change event.
 */
overlayLayerSelect.onchange = function() {
  var layer = layers[overlayLayerSelect.value];
  if (layer) {
    layer.setOpacity(0.7);
    updateRenderEdgesOnLayer(layer);
    map.getLayers().setAt(1, layer);
  }
};


/**
 * Handle change event.
 */
renderEdgesCheckbox.onchange = function() {
  renderEdges = renderEdgesCheckbox.checked;
  map.getLayers().forEach(function(layer) {
    updateRenderEdgesOnLayer(layer);
  });
};
