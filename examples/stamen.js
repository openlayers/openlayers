goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.Stamen');


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.Stamen({
        layer: 'watercolor'
      })
    }),
    new ol.layer.Tile({
      source: new ol.source.Stamen({
        layer: 'terrain-labels'
      })
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: ol.proj.transform(
        [-122.416667, 37.783333], 'EPSG:4326', 'EPSG:3857'),
    zoom: 12
  })
});
