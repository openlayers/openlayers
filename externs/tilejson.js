/**
 * @externs
 * @see https://github.com/mapbox/tilejson-spec
 * @see https://github.com/mapbox/utfgrid-spec
 */



/**
 * @constructor
 */
var TileJSON = function() {};


/**
 * @type {string}
 */
TileJSON.prototype.tilejson;


/**
 * @type {string|undefined}
 */
TileJSON.prototype.name;


/**
 * @type {string|undefined}
 */
TileJSON.prototype.description;


/**
 * @type {string|undefined}
 */
TileJSON.prototype.version;


/**
 * @type {string|undefined}
 */
TileJSON.prototype.attribution;


/**
 * @type {string|undefined}
 */
TileJSON.prototype.template;


/**
 * @type {string|undefined}
 */
TileJSON.prototype.legend;


/**
 * @type {string|undefined}
 */
TileJSON.prototype.scheme;


/**
 * @type {!Array.<string>}
 */
TileJSON.prototype.tiles;


/**
 * @type {!Array.<string>|undefined}
 */
TileJSON.prototype.grids;


/**
 * @type {number|undefined}
 */
TileJSON.prototype.minzoom;


/**
 * @type {number|undefined}
 */
TileJSON.prototype.maxzoom;


/**
 * @type {!Array.<number>|undefined}
 */
TileJSON.prototype.bounds;


/**
 * @type {!Array.<number>|undefined}
 */
TileJSON.prototype.center;



/**
 * @constructor
 */
var UTFGridJSON = function() {};


/**
 * @type {!Array.<string>}
 */
UTFGridJSON.prototype.grid;


/**
 * @type {!Array.<string>}
 */
UTFGridJSON.prototype.keys;


/**
 * @type {!Object.<string, Object>|undefined}
 */
UTFGridJSON.prototype.data;
