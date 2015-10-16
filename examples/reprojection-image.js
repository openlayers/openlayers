goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.ImageStatic');
goog.require('ol.source.MapQuest');


proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 ' +
    '+x_0=400000 +y_0=-100000 +ellps=airy ' +
    '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
    '+units=m +no_defs');
var imageExtent = [0, 0, 700000, 1300000];

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuest({layer: 'osm'})
    }),
    new ol.layer.Image({
      source: new ol.source.ImageStatic({
        url: 'http://upload.wikimedia.org/wikipedia/commons/thumb/1/18/' +
               'British_National_Grid.svg/2000px-British_National_Grid.svg.png',
        crossOrigin: '',
        projection: 'EPSG:27700',
        imageExtent: imageExtent
      })
    })
  ],
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: ol.proj.transform(ol.extent.getCenter(imageExtent),
                              'EPSG:27700', 'EPSG:3857'),
    zoom: 4
  })
});
