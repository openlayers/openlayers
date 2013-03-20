goog.provide('ol.TileUrlFunction');
goog.provide('ol.TileUrlFunctionType');

goog.require('goog.array');
goog.require('goog.math');
goog.require('ol.TileCoord');
goog.require('ol.tilegrid.TileGrid');


/**
 * @typedef {function(this:ol.source.Source, ol.TileCoord, ol.tilegrid.TileGrid,
 *     ol.Projection): (string|undefined)}
 */
ol.TileUrlFunctionType;


/**
 * @param {string} template Template.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.createFromTemplate = function(template) {
  return function(tileCoord) {
    if (goog.isNull(tileCoord)) {
      return undefined;
    } else {
      return template.replace('{z}', tileCoord.z)
                      .replace('{x}', tileCoord.x)
                      .replace('{y}', tileCoord.y);
    }
  };
};


/**
 * @param {Array.<string>} templates Templates.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.createFromTemplates = function(templates) {
  return ol.TileUrlFunction.createFromTileUrlFunctions(
      goog.array.map(templates, ol.TileUrlFunction.createFromTemplate));
};


/**
 * @param {Array.<ol.TileUrlFunctionType>} tileUrlFunctions Tile URL Functions.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.createFromTileUrlFunctions = function(tileUrlFunctions) {
  if (tileUrlFunctions.length === 1) {
    return tileUrlFunctions[0];
  }
  return function(tileCoord, tileGrid, projection) {
    if (goog.isNull(tileCoord)) {
      return undefined;
    } else {
      var index = goog.math.modulo(tileCoord.hash(), tileUrlFunctions.length);
      return tileUrlFunctions[index](tileCoord, tileGrid, projection);
    }
  };
};


/**
 * @param {string} baseUrl Base URL (may have query data).
 * @param {Object.<string,*>} params to encode in the url.
 * @param {function(string, Object.<string,*>, ol.Extent, ol.Size,
 *     ol.Projection)} paramsFunction params function.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.createFromParamsFunction =
    function(baseUrl, params, paramsFunction) {
  return function(tileCoord, tileGrid, projection) {
    if (goog.isNull(tileCoord)) {
      return undefined;
    } else {
      var size = tileGrid.getTileSize(tileCoord.z);
      var extent = tileGrid.getTileCoordExtent(tileCoord);
      return paramsFunction(
          baseUrl, params, extent, size, projection);
    }
  };
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {string|undefined} Tile URL.
 */
ol.TileUrlFunction.nullTileUrlFunction = function(tileCoord) {
  return undefined;
};


/**
 * @param {function(ol.TileCoord, ol.tilegrid.TileGrid, ol.Projection):
 *     ol.TileCoord} transformFn Transform.function.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.withTileCoordTransform =
    function(transformFn, tileUrlFunction) {
  return function(tileCoord, tileGrid, projection) {
    if (goog.isNull(tileCoord)) {
      return undefined;
    } else {
      return tileUrlFunction.call(this,
          transformFn(tileCoord, tileGrid, projection), tileGrid, projection);
    }
  };
};


/**
 * @param {string} url Url.
 * @return {Array.<string>} Array of urls.
 */
ol.TileUrlFunction.expandUrl = function(url) {
  var urls = [];
  var match = /\{(\d)-(\d)\}/.exec(url) || /\{([a-z])-([a-z])\}/.exec(url);
  if (match) {
    var startCharCode = match[1].charCodeAt(0);
    var stopCharCode = match[2].charCodeAt(0);
    var charCode;
    for (charCode = startCharCode; charCode <= stopCharCode; ++charCode) {
      urls.push(url.replace(match[0], String.fromCharCode(charCode)));
    }
  } else {
    urls.push(url);
  }
  return urls;
};
