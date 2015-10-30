goog.provide('ol.TileLoadFunctionType');
goog.provide('ol.TileVectorLoadFunctionType');


/**
 * A function that takes an {@link ol.Tile} for the tile and a
 * `{string}` for the url as arguments.
 *
 * @typedef {function(ol.Tile, string)}
 * @api
 */
ol.TileLoadFunctionType;


/**
 * A function that is called with a tile url for the features to load and
 * a callback that takes the loaded features as argument.
 *
 * @typedef {function(string, function(Array.<ol.Feature>))}
 * @api
 */
ol.TileVectorLoadFunctionType;
