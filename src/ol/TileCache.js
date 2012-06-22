goog.provide('ol.TileCache');

goog.require('goog.structs.LinkedMap');

/**
 * A cache of ol.Tile objects.
 * @constructor
 * @extends {goog.structs.LinkedMap}
 * @param {number=} opt_size
 */
ol.TileCache = function(opt_size) {
    goog.base(this, opt_size || 100, true /* cache mode */);
};

goog.inherits(ol.TileCache, goog.structs.LinkedMap);

/**
 * @inheritDoc
 */
ol.TileCache.prototype.removeNode = function(node) {
    goog.base(this, 'removeNode', node);
    node.value.destroy();
};
