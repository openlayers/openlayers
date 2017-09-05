import _ol_ from './index';
import _ol_structs_LRUCache_ from './structs/lrucache';

/**
 * @constructor
 * @extends {ol.structs.LRUCache.<ol.Tile>}
 * @param {number=} opt_highWaterMark High water mark.
 * @struct
 */
var _ol_TileCache_ = function(opt_highWaterMark) {

  _ol_structs_LRUCache_.call(this, opt_highWaterMark);

};

_ol_.inherits(_ol_TileCache_, _ol_structs_LRUCache_);


/**
 * @param {Object.<string, ol.TileRange>} usedTiles Used tiles.
 */
_ol_TileCache_.prototype.expireCache = function(usedTiles) {
  var tile, zKey;
  while (this.canExpireCache()) {
    tile = this.peekLast();
    zKey = tile.tileCoord[0].toString();
    if (zKey in usedTiles && usedTiles[zKey].contains(tile.tileCoord)) {
      break;
    } else {
      this.pop().dispose();
    }
  }
};
export default _ol_TileCache_;
