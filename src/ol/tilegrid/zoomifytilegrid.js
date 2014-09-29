goog.provide('ol.tilegrid.Zoomify');

goog.require('goog.math');
goog.require('ol.TileCoord');
goog.require('ol.proj');
goog.require('ol.tilecoord');
goog.require('ol.tilegrid.TileGrid');



/**
 * @classdesc
 * Set the grid pattern for sources accessing Zoomify tiled-image servers.
 *
 * @constructor
 * @extends {ol.tilegrid.TileGrid}
 * @param {olx.tilegrid.ZoomifyOptions=} opt_options Options.
 * @api
 */
ol.tilegrid.Zoomify = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : options;
  goog.base(this, {
    origin: [0, 0],
    resolutions: options.resolutions
  });

};
goog.inherits(ol.tilegrid.Zoomify, ol.tilegrid.TileGrid);


/**
 * @inheritDoc
 */
ol.tilegrid.Zoomify.prototype.createTileCoordTransform = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};
  var minZ = this.minZoom;
  var maxZ = this.maxZoom;
  /** @type {Array.<ol.TileRange>} */
  var tileRangeByZ = null;
  if (goog.isDef(options.extent)) {
    tileRangeByZ = new Array(maxZ + 1);
    var z;
    for (z = 0; z <= maxZ; ++z) {
      if (z < minZ) {
        tileRangeByZ[z] = null;
      } else {
        tileRangeByZ[z] = this.getTileRangeForExtentAndZ(options.extent, z);
      }
    }
  }
  return (
      /**
       * @param {ol.TileCoord} tileCoord Tile coordinate.
       * @param {ol.proj.Projection} projection Projection.
       * @param {ol.TileCoord=} opt_tileCoord Destination tile coordinate.
       * @return {ol.TileCoord} Tile coordinate.
       */
      function(tileCoord, projection, opt_tileCoord) {
        var z = tileCoord[0];
        if (z < minZ || maxZ < z) {
          return null;
        }
        var n = Math.pow(2, z);
        var x = tileCoord[1];
        if (x < 0 || n <= x) {
          return null;
        }
        var y = tileCoord[2];
        if (y < -n || -1 < y) {
          return null;
        }
        if (!goog.isNull(tileRangeByZ)) {
          if (!tileRangeByZ[z].containsXY(x, -y - 1)) {
            return null;
          }
        }
        return ol.tilecoord.createOrUpdate(z, x, -y - 1, opt_tileCoord);
      });
};
