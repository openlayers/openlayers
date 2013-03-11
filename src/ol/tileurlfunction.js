goog.provide('ol.TileUrlFunction');
goog.provide('ol.TileUrlFunctionType');

goog.require('goog.array');
goog.require('goog.math');
goog.require('ol.TileCoord');
goog.require('ol.source.wms');
goog.require('ol.tilegrid.TileGrid');


/**
 * @typedef {function(ol.TileCoord, ol.tilegrid.TileGrid, ol.Projection):
 *     (string|undefined)}
 */
ol.TileUrlFunctionType;


/**
 * @param {string} template Template.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.createFromTemplate = function(template) {
  var match =
      /\{(\d)-(\d)\}/.exec(template) || /\{([a-z])-([a-z])\}/.exec(template);
  if (match) {
    var templates = [];
    var startCharCode = match[1].charCodeAt(0);
    var stopCharCode = match[2].charCodeAt(0);
    var charCode;
    for (charCode = startCharCode; charCode <= stopCharCode; ++charCode) {
      templates.push(template.replace(match[0], String.fromCharCode(charCode)));
    }
    return ol.TileUrlFunction.createFromTemplates(templates);
  } else {
    return function(tileCoord) {
      if (goog.isNull(tileCoord)) {
        return undefined;
      } else {
        return template.replace('{z}', tileCoord.z)
                       .replace('{x}', tileCoord.x)
                       .replace('{y}', tileCoord.y);
      }
    };
  }
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
 * @param {Object.<string, string|number>} params WMS parameters.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.createWMSParams =
    function(baseUrl, params) {
  return function(tileCoord, tileGrid, projection) {
    if (goog.isNull(tileCoord)) {
      return undefined;
    } else {
      var size = tileGrid.getTileSize(tileCoord.z);
      var extent = tileGrid.getTileCoordExtent(tileCoord);
      return ol.source.wms.getUrl(
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
      return tileUrlFunction(
          transformFn(tileCoord, tileGrid, projection), tileGrid, projection);
    }
  };
};
