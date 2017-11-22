goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


var openCycleMapLayer = new ol.layer.Tile({
  source: new ol.source.OSM({
    attributions: [
      'All maps © <a href="https://www.opencyclemap.org/">OpenCycleMap</a>',
      ol.source.OSM.ATTRIBUTION
    ],
    url: 'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png' +
        '?apikey=0e6fc415256d4fbb9b5166a718591d71'
  })
});

var openSeaMapLayer = new ol.layer.Tile({
  source: new ol.source.OSM({
    attributions: [
      'All maps © <a href="http://www.openseamap.org/">OpenSeaMap</a>',
      ol.source.OSM.ATTRIBUTION
    ],
    opaque: false,
    url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png'
  })
});


var map = new ol.Map({
  layers: [
    openCycleMapLayer,
    openSeaMapLayer
  ],
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new ol.View({
    maxZoom: 18,
    center: [-244780.24508882355, 5986452.183179816],
    zoom: 15
  })
});
