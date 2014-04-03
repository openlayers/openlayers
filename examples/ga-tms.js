goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.control');
goog.require('ol.control.FullScreen');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.TileGrid');

var width = 16370;
var height = 16321;
//var imgName = 'test2'
//var url = 'http://bfj3jexwekgw4htsqabc-aerialimages.s3-external-3.amazonaws.com/' + imgName + '/';
var imgName = 'test_alcapat'
var url = 'http://mf-geoadmin3.dev.bgdi.ch/ltteo/src/' + imgName + '/';

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      preload: 0,
      source: new ol.source.TileImage({
        crossOrigin: null,
        tileGrid: new ol.tilegrid.TileGrid({
          origin: [0, -height], // bottom-left coordinate ?
          resolutions: [64, 32, 16, 8, 4, 2, 1, 0.5]
        }),
        tileUrlFunction: function(tileCoord, pixelRatio, projection) {
          if (tileCoord.x < 0 || tileCoord.y < 0) {
            return "";
          }
          return url + tileCoord.z.toString()+'/'+ tileCoord.x.toString() +'/'+ tileCoord.y.toString() +'.png';
        }
      })
    })
  ],
  controls: ol.control.defaults().extend([new ol.control.FullScreen()]),
  renderer: 'canvas',
  target: 'map',
  ol3Logo: false,
  view: new ol.View2D({
    projection: new ol.proj.Projection({
      code: 'EPSG:4326',
      units: 'degrees',
      extent: [0, -height, width, 0]
    }),
    maxZoom: 7
  })
});

map.getView().fitExtent([0, -height, width, 0], map.getSize());