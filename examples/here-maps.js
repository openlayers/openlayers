goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.XYZ');

var appId = 'a2qhegvZZFIuJDkkqjhQ';
var appCode = 'lPJ3iaFLJDhD8fIAyU582A';
var hereLayers = [
  {
    base: 'base',
    type: 'maptile',
    scheme: 'normal.day',
    app_id: appId,
    app_code: appCode
  },
  {
    base: 'base',
    type: 'maptile',
    scheme: 'normal.day.transit',
    app_id: appId,
    app_code: appCode
  },
  {
    base: 'base',
    type: 'maptile',
    scheme: 'pedestrian.day',
    app_id: appId,
    app_code: appCode
  },
  {
    base: 'aerial',
    type: 'maptile',
    scheme: 'terrain.day',
    app_id: appId,
    app_code: appCode
  },
  {
    base: 'aerial',
    type: 'maptile',
    scheme: 'satellite.day',
    app_id: appId,
    app_code: appCode
  },
  {
    base: 'aerial',
    type: 'maptile',
    scheme: 'hybrid.day',
    app_id: appId,
    app_code: appCode
  }
];
var urlTpl = 'https://{1-4}.{base}.maps.cit.api.here.com' +
  '/{type}/2.1/maptile/newest/{scheme}/{z}/{x}/{y}/256/png' +
  '?app_id={app_id}&app_code={app_code}';
var layers = [];
var i, ii;
for (i = 0, ii = hereLayers.length; i < ii; ++i) {
  var layerDesc = hereLayers[i];
  layers.push(new ol.layer.Tile({
    visible: false,
    preload: Infinity,
    source: new ol.source.XYZ({
      url: createUrl(urlTpl, layerDesc),
      attributions: 'Map Tiles &copy; 2016 ' +
        '<a href="http://developer.here.com">HERE</a>'
    })
  }));
}

var map = new ol.Map({
  layers: layers,
  renderer: common.getRendererFromQueryString(),
  // Improve user experience by loading tiles while dragging/zooming. Will make
  // zooming choppy on mobile or slow devices.
  loadTilesWhileInteracting: true,
  target: 'map',
  view: new ol.View({
    center: [921371.9389, 6358337.7609],
    zoom: 10
  })
});

function createUrl(tpl, layerDesc) {
  return tpl
    .replace('{base}', layerDesc.base)
    .replace('{type}', layerDesc.type)
    .replace('{scheme}', layerDesc.scheme)
    .replace('{app_id}', layerDesc.app_id)
    .replace('{app_code}', layerDesc.app_code);
}

var select = document.getElementById('layer-select');
function onChange() {
  var scheme = select.value;
  for (var i = 0, ii = layers.length; i < ii; ++i) {
    layers[i].setVisible(hereLayers[i].scheme === scheme);
  }
}
select.addEventListener('change', onChange);
onChange();
