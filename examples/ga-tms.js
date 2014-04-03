goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.control');
goog.require('ol.control.MousePosition');
goog.require('ol.control.FullScreen');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.TileGrid');

var width = 8954;
var height = 9525;
var imgName = '19701930012114'


var url = 'http://aerialimages{curInstance}.geo.admin.ch/tiles/' + imgName + '/';
var curInstance = 0;

// We calculate the list the resolutions that matches perfectly the pyramid
var TILE_SIZE = 256
var resolutions = [1]; // 1 is the min resolution of the pyramid (for all images)
var curResolution = resolutions[0]; 
var maxResolution = Math.max(width, height) / TILE_SIZE; // the max resolution possible
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
          if (tileCoord.x < 0 || tileCoord.y < 0 || tileCoord.z < 0) {
            return undefined;
          }

          var factor = this.getTileGrid().getTileSize() * this.getTileGrid().getResolutions()[tileCoord.z];
          if (tileCoord.x * factor > width || tileCoord.y * factor > height) {
            return undefined;
          }
 
          curInstance = (++curInstance > 4) ? 0 : curInstance;
          return url.replace('{curInstance}', curInstance) + 
              tileCoord.z.toString() + "/" +
              tileCoord.x.toString() + "/" +
              tileCoord.y.toString() + ".jpg";
        }
      })
    })
  ],
  controls: ol.control.defaults().extend([new ol.control.FullScreen(), new ol.control.MousePosition()]),
  renderer: 'canvas',
  target: 'map',
  ol3Logo: false,
  view: new ol.View2D({
    projection: new ol.proj.Projection({
      code: 'PIXELS',
      units: 'pixels',
      extent: [0, 0, TILE_SIZE * resolutions[0], TILE_SIZE * resolutions[0]] // max extent of the pyramid at zoom level 0
    }),
    maxZoom: resolutions.length + 1 // The min resolution of the pyramid is 1, so we add 2 client zoom equivalent to resolutions 0.5 and 0.25
  })
});

map.getView().fitExtent([0, 0, width, height], map.getSize());
