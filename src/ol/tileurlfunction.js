goog.provide('ol.TileUrlFunction');
goog.provide('ol.TileUrlFunctionType');

goog.require('goog.array');
goog.require('goog.math');
goog.require('ol.TileCoord');


/**
 * A function that takes an {@link ol.TileCoord} for the tile coordinate,
 * a `{number}` representing the pixel ratio and an {@link ol.proj.Projection}
 * for the projection  as arguments and returns a `{string}` or
 * undefined representing the tile URL.
 *
 * @typedef {function(ol.TileCoord, number,
 *           ol.proj.Projection): (string|undefined)}
 * @todo api
 */
ol.TileUrlFunctionType;


/**
 * @typedef {function(ol.TileCoord, ol.proj.Projection, ol.TileCoord=):
 *     ol.TileCoord}
 */
ol.TileCoordTransformType;


/**
 * @param {string} template Template.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.createFromTemplate = function(template) {
  return (
      /**
       * @param {ol.TileCoord} tileCoord Tile Coordinate.
       * @param {number} pixelRatio Pixel ratio.
       * @param {ol.proj.Projection} projection Projection.
       * @return {string|undefined} Tile URL.
       */
      function(tileCoord, pixelRatio, projection) {
        if (goog.isNull(tileCoord)) {
          return undefined;
        } else {
          return template.replace('{z}', tileCoord.z.toString())
                         .replace('{x}', tileCoord.x.toString())
                         .replace('{y}', tileCoord.y.toString())
                         .replace('{-y}', function() {
                           var y = (1 << tileCoord.z) - tileCoord.y - 1;
                           return y.toString();
                         });
        }
      });
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
  return (
      /**
       * @param {ol.TileCoord} tileCoord Tile Coordinate.
       * @param {number} pixelRatio Pixel ratio.
       * @param {ol.proj.Projection} projection Projection.
       * @return {string|undefined} Tile URL.
       */
      function(tileCoord, pixelRatio, projection) {
        if (goog.isNull(tileCoord)) {
          return undefined;
        } else {
          var index =
              goog.math.modulo(tileCoord.hash(), tileUrlFunctions.length);
          return tileUrlFunctions[index](tileCoord, pixelRatio, projection);
        }
      });
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @return {string|undefined} Tile URL.
 */
ol.TileUrlFunction.nullTileUrlFunction =
    function(tileCoord, pixelRatio, projection) {
  return undefined;
};


/**
 * @param {ol.TileCoordTransformType} transformFn Transform function.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.withTileCoordTransform =
    function(transformFn, tileUrlFunction) {
  var tmpTileCoord = new ol.TileCoord(0, 0, 0);
  return (
      /**
       * @param {ol.TileCoord} tileCoord Tile Coordinate.
       * @param {number} pixelRatio Pixel ratio.
       * @param {ol.proj.Projection} projection Projection.
       * @return {string|undefined} Tile URL.
       */
      function(tileCoord, pixelRatio, projection) {
        if (goog.isNull(tileCoord)) {
          return undefined;
        } else {
          return tileUrlFunction(
              transformFn(tileCoord, projection, tmpTileCoord),
              pixelRatio,
              projection);
        }
      });
};


/**
 * @param {string} url URL.
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
