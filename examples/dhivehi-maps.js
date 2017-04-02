goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.XYZ');


var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: 'https://dhivehi.mv/maps/server/live/?x={x}&y={y}&z={z}'
      })
    })
  ],
  view: new ol.View({
    center: [8183347.114659394, 465195.8486126661],
    zoom: 15
  })
});
