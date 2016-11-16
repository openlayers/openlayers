goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.control.FullScreen');
goog.require('ol.control.MousePosition');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.proj.Projection');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.TileGrid');

var width = 8954;
var height = 9525;
var imgName = '19701930012114';


var url = 'http://aerialimages{curInstance}.geo.admin.ch/tiles/' + imgName +
    '/';
var curInstance = 0;

// We calculate the list the resolutions that matches perfectly the pyramid
var TILE_SIZE = 256;
// 1 is the min resolution of the pyramid (for all images)
var resolutions = [1];
var curResolution = resolutions[0];
// the max resolution possible
var maxResolution = Math.max(width, height) / TILE_SIZE;
while (curResolution < maxResolution) {
  curResolution *= 2;
  resolutions.unshift(curResolution);
}

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      preload: 0,
      source: new ol.source.TileImage({
        crossOrigin: null,
        tileGrid: new ol.tilegrid.TileGrid({
          origin: [0, 0],
          resolutions: resolutions
        }),
        tileUrlFunction: function(tileCoord, pixelRatio, projection) {
          tileCoord.x = tileCoord[1];
          tileCoord.y = tileCoord[2];
          tileCoord.z = tileCoord[0];
          if (tileCoord.x < 0 || tileCoord.y < 0 || tileCoord.z < 0) {
            return undefined;
          }

          var factor = this.getTileGrid().getTileSize() *
              this.getTileGrid().getResolutions()[tileCoord.z];
          if (tileCoord.x * factor > width || tileCoord.y * factor > height) {
            return undefined;
          }

          curInstance = (++curInstance > 4) ? 0 : curInstance;
          return url.replace('{curInstance}', curInstance) +
              tileCoord.z.toString() + '/' +
              tileCoord.x.toString() + '/' +
              tileCoord.y.toString() + '.jpg';
        }
      })
    })
  ],
  controls: ol.control.defaults().extend([
    new ol.control.FullScreen(),
    new ol.control.MousePosition()
  ]),
  renderer: 'canvas',
  target: 'map',
  ol3Logo: false,
  view: new ol.View({
    projection: new ol.proj.Projection({
      code: 'PIXELS',
      units: 'pixels',
      // max extent of the pyramid at zoom level 0
      extent: [0, 0, TILE_SIZE * resolutions[0], TILE_SIZE * resolutions[0]]
    }),
    // The min resolution of the pyramid is 1, so we add 2 client zoom
    // equivalent to resolutions 0.5 and 0.25
    maxZoom: resolutions.length + 1
  })
});

map.getView().fit([0, 0, width, height], map.getSize());
