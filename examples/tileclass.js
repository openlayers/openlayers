goog.require('ol');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OSM');


/**
 * Define a namespace for the application.
 */
window.app = {};
var app = window.app;


/**
 * @constructor
 * @extends {ol.ImageTile}
 */
app.Tile = function(tileCoord, state, src, crossOrigin) {
  ol.ImageTile.call(this, tileCoord, state, src, crossOrigin);
};
ol.inherits(app.Tile, ol.ImageTile);


app.Tile.prototype.loadImage = function(src) {
  var that = this;
  window.setTimeout(function() {
    var finalTileUrl = 'http://tile.openstreetmap.org/' + src;
    ol.ImageTile.prototype.loadImage.call(that, finalTileUrl);
  }, 1000);
};


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.ImageTileSource({
        projection: ol.proj.get('EPSG:3857'),
        // The `tileUrlFunction` must return something that is not
        // `undefined`, else an empty tile will be displayed.
        tileUrlFunction: function(tileCoord, projection) {
          return '2/2/1.png';
        },
        tileClass: app.Tile,
        crossOrigin: 'anonymous'
      })
    })
  ],
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
