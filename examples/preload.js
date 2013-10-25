goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.source.BingMaps');


var map1 = new ol.Map({
  layers: [
    new ol.layer.Tile({
      preload: Infinity,
      source: new ol.source.BingMaps({
        key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
        style: 'Aerial'
      })
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map1',
  view: new ol.View2D({
    center: [-4808600, -2620936],
    zoom: 8
  })
});

var map2 = new ol.Map({
  layers: [
    new ol.layer.Tile({
      preload: 0, // default value
      source: new ol.source.BingMaps({
        key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
        style: 'AerialWithLabels'
      })
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map2'
});
map2.bindTo('view', map1);
