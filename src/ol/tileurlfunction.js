goog.provide('ol.TileUrlFunction');
goog.provide('ol.TileUrlFunctionType');

goog.require('goog.math');
goog.require('ol.TileCoord');
goog.require('ol.tilegrid.TileGrid');


/**
 * @typedef {function(ol.TileCoord): (string|undefined)}
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
  return function(tileCoord) {
    if (goog.isNull(tileCoord)) {
      return undefined;
    } else {
      var index = goog.math.modulo(tileCoord.hash(), tileUrlFunctions.length);
      return tileUrlFunctions[index](tileCoord);
    }
  };
};


/**
 * @param {string} baseUrl WMS base URL.
 * @param {Object} baseParams Query string parameters.
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.createBboxParam = function(baseUrl, baseParams, tileGrid) {
  return function(tileCoord) {
    if (goog.isNull(tileCoord)) {
      return undefined;
    } else {
      var tileExtent = tileGrid.getTileCoordExtent(tileCoord);
      var params = goog.object.clone(baseParams);
      // FIXME Projection dependant axis order.
      var bboxValue = [
        tileExtent.minX, tileExtent.minY, tileExtent.maxX, tileExtent.maxY
      ].join(',');
      goog.object.extend(params, {'BBOX': bboxValue});
      var url = baseUrl;
      for (var p in params) {
        url += (~url.indexOf('?') ? '&' : '?') +
            p + '=' + encodeURIComponent(params[p]);
      }
      return url;
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
 * @param {function(ol.TileCoord): ol.TileCoord} transformFn
 *     Transform.function.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.withTileCoordTransform =
    function(transformFn, tileUrlFunction) {
  return function(tileCoord) {
    if (goog.isNull(tileCoord)) {
      return undefined;
    } else {
      return tileUrlFunction(transformFn(tileCoord));
    }
  };
};
