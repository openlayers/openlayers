goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');

var logoElement = document.createElement('a');
logoElement.href = 'http://www.osgeo.org/';
logoElement.target = '_blank';

var logoImage = document.createElement('img');
logoImage.src = 'https://www.osgeo.org/sites/all/themes/osgeo/logo.png';

logoElement.appendChild(logoImage);

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  }),
  logo: logoElement
});
