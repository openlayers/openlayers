goog.provide('ol.render.webgl.TextReplay');

goog.require('ol');

/**
 * @constructor
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @struct
 */
ol.render.webgl.TextReplay = function(tolerance, maxExtent) {};

/**
 * @param {ol.style.Text} textStyle Text style.
 */
ol.render.webgl.TextReplay.prototype.setTextStyle = function(textStyle) {};

/**
 * @param {ol.webgl.Context} context Context.
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} opacity Global opacity.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined} featureCallback Feature callback.
 * @param {boolean} oneByOne Draw features one-by-one for the hit-detecion.
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.TextReplay.prototype.replay = function(context,
    center, resolution, rotation, size, pixelRatio,
    opacity, skippedFeaturesHash,
    featureCallback, oneByOne, opt_hitExtent) {
  return undefined;
};

/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.webgl.TextReplay.prototype.drawText = function(flatCoordinates, offset,
    end, stride, geometry, feature) {};

/**
 * @abstract
 * @param {ol.webgl.Context} context Context.
 */
ol.render.webgl.TextReplay.prototype.finish = function(context) {};

/**
 * @param {ol.webgl.Context} context WebGL context.
 * @return {function()} Delete resources function.
 */
ol.render.webgl.TextReplay.prototype.getDeleteResourcesFunction = function(context) {
  return ol.nullFunction;
};
