goog.provide('ol.TileURLFunction');
goog.provide('ol.TileURLFunctionType');

goog.require('goog.array');
goog.require('goog.math');
goog.require('ol.TileCoord');
goog.require('ol.extent');


/**
 * @typedef {function(ol.TileCoord, ol.Projection): (string|undefined)}
 */
ol.TileURLFunctionType;


/**
 * @param {string} template Template.
 * @return {ol.TileURLFunctionType} Tile URL function.
 */
ol.TileURLFunction.createFromTemplate = function(template) {
  return (
      /**
       * @param {ol.TileCoord} tileCoord Tile Coordinate.
       * @param {ol.Projection} projection Projection.
       * @return {string|undefined} Tile URL.
       */
      function(tileCoord, projection) {
        if (goog.isNull(tileCoord)) {
          return undefined;
        } else {
          return template.replace('{z}', '' + tileCoord.z)
                         .replace('{x}', '' + tileCoord.x)
                         .replace('{y}', '' + tileCoord.y);
        }
      });
};


/**
 * @param {Array.<string>} templates Templates.
 * @return {ol.TileURLFunctionType} Tile URL function.
 */
ol.TileURLFunction.createFromTemplates = function(templates) {
  return ol.TileURLFunction.createFromTileURLFunctions(
      goog.array.map(templates, ol.TileURLFunction.createFromTemplate));
};


/**
 * @param {Array.<ol.TileURLFunctionType>} tileURLFunctions Tile URL Functions.
 * @return {ol.TileURLFunctionType} Tile URL function.
 */
ol.TileURLFunction.createFromTileURLFunctions = function(tileURLFunctions) {
  if (tileURLFunctions.length === 1) {
    return tileURLFunctions[0];
  }
  return (
      /**
       * @param {ol.TileCoord} tileCoord Tile Coordinate.
       * @param {ol.Projection} projection Projection.
       * @return {string|undefined} Tile URL.
       */
      function(tileCoord, projection) {
        if (goog.isNull(tileCoord)) {
          return undefined;
        } else {
          var index =
              goog.math.modulo(tileCoord.hash(), tileURLFunctions.length);
          return tileURLFunctions[index].call(this, tileCoord, projection);
        }
      });
};


/**
 * @param {string} baseUrl Base URL (may have query data).
 * @param {Object.<string,*>} params to encode in the url.
 * @param {function(this: ol.source.ImageTileSource, string, Object.<string,*>,
 *     ol.Extent, ol.Size, ol.Projection)} paramsFunction params function.
 * @return {ol.TileURLFunctionType} Tile URL function.
 */
ol.TileURLFunction.createFromParamsFunction =
    function(baseUrl, params, paramsFunction) {
  var tmpExtent = ol.extent.createEmpty();
  return (
      /**
       * @param {ol.TileCoord} tileCoord Tile Coordinate.
       * @param {ol.Projection} projection Projection.
       * @return {string|undefined} Tile URL.
       */
      function(tileCoord, projection) {
        if (goog.isNull(tileCoord)) {
          return undefined;
        } else {
          var tileGrid = this.getTileGrid();
          if (goog.isNull(tileGrid)) {
            tileGrid = ol.tilegrid.getForProjection(projection);
          }
          var size = tileGrid.getTileSize(tileCoord.z);
          var extent = tileGrid.getTileCoordExtent(tileCoord, tmpExtent);
          return paramsFunction.call(this, baseUrl, params,
              extent, size, projection);
        }
      });
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.Projection} projection Projection.
 * @return {string|undefined} Tile URL.
 */
ol.TileURLFunction.nullTileURLFunction = function(tileCoord, projection) {
  return undefined;
};


/**
 * @param {function(ol.TileCoord, ol.Projection, ol.TileCoord=): ol.TileCoord}
 *     transformFn Transform function.
 * @param {ol.TileURLFunctionType} tileURLFunction Tile URL function.
 * @return {ol.TileURLFunctionType} Tile URL function.
 */
ol.TileURLFunction.withTileCoordTransform =
    function(transformFn, tileURLFunction) {
  var tmpTileCoord = new ol.TileCoord(0, 0, 0);
  return (
      /**
       * @param {ol.TileCoord} tileCoord Tile Coordinate.
       * @param {ol.Projection} projection Projection.
       * @return {string|undefined} Tile URL.
       */
      function(tileCoord, projection) {
        if (goog.isNull(tileCoord)) {
          return undefined;
        } else {
          return tileURLFunction.call(
              this,
              transformFn.call(this, tileCoord, projection, tmpTileCoord),
              projection);
        }
      });
};


/**
 * @param {string} url Url.
 * @return {Array.<string>} Array of urls.
 */
ol.TileURLFunction.expandUrl = function(url) {
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
