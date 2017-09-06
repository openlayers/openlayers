import _ol_asserts_ from './asserts';
import _ol_math_ from './math';
import _ol_tilecoord_ from './tilecoord';
var _ol_TileUrlFunction_ = {};


/**
 * @param {string} template Template.
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
_ol_TileUrlFunction_.createFromTemplate = function(template, tileGrid) {
  var zRegEx = /\{z\}/g;
  var xRegEx = /\{x\}/g;
  var yRegEx = /\{y\}/g;
  var dashYRegEx = /\{-y\}/g;
  return (
    /**
     * @param {ol.TileCoord} tileCoord Tile Coordinate.
     * @param {number} pixelRatio Pixel ratio.
     * @param {ol.proj.Projection} projection Projection.
     * @return {string|undefined} Tile URL.
     */
    function(tileCoord, pixelRatio, projection) {
      if (!tileCoord) {
        return undefined;
      } else {
        return template.replace(zRegEx, tileCoord[0].toString())
            .replace(xRegEx, tileCoord[1].toString())
            .replace(yRegEx, function() {
              var y = -tileCoord[2] - 1;
              return y.toString();
            })
            .replace(dashYRegEx, function() {
              var z = tileCoord[0];
              var range = tileGrid.getFullTileRange(z);
              _ol_asserts_.assert(range, 55); // The {-y} placeholder requires a tile grid with extent
              var y = range.getHeight() + tileCoord[2];
              return y.toString();
            });
      }
    }
  );
};


/**
 * @param {Array.<string>} templates Templates.
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
_ol_TileUrlFunction_.createFromTemplates = function(templates, tileGrid) {
  var len = templates.length;
  var tileUrlFunctions = new Array(len);
  for (var i = 0; i < len; ++i) {
    tileUrlFunctions[i] = _ol_TileUrlFunction_.createFromTemplate(
        templates[i], tileGrid);
  }
  return _ol_TileUrlFunction_.createFromTileUrlFunctions(tileUrlFunctions);
};


/**
 * @param {Array.<ol.TileUrlFunctionType>} tileUrlFunctions Tile URL Functions.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
_ol_TileUrlFunction_.createFromTileUrlFunctions = function(tileUrlFunctions) {
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
      if (!tileCoord) {
        return undefined;
      } else {
        var h = _ol_tilecoord_.hash(tileCoord);
        var index = _ol_math_.modulo(h, tileUrlFunctions.length);
        return tileUrlFunctions[index](tileCoord, pixelRatio, projection);
      }
    }
  );
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @return {string|undefined} Tile URL.
 */
_ol_TileUrlFunction_.nullTileUrlFunction = function(tileCoord, pixelRatio, projection) {
  return undefined;
};


/**
 * @param {string} url URL.
 * @return {Array.<string>} Array of urls.
 */
_ol_TileUrlFunction_.expandUrl = function(url) {
  var urls = [];
  var match = /\{([a-z])-([a-z])\}/.exec(url);
  if (match) {
    // char range
    var startCharCode = match[1].charCodeAt(0);
    var stopCharCode = match[2].charCodeAt(0);
    var charCode;
    for (charCode = startCharCode; charCode <= stopCharCode; ++charCode) {
      urls.push(url.replace(match[0], String.fromCharCode(charCode)));
    }
    return urls;
  }
  match = match = /\{(\d+)-(\d+)\}/.exec(url);
  if (match) {
    // number range
    var stop = parseInt(match[2], 10);
    for (var i = parseInt(match[1], 10); i <= stop; i++) {
      urls.push(url.replace(match[0], i.toString()));
    }
    return urls;
  }
  urls.push(url);
  return urls;
};
export default _ol_TileUrlFunction_;
