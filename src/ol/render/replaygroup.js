goog.provide('ol.render.ReplayGroup');


/**
 * Base class for replay groups.
 * @constructor
 */
ol.render.ReplayGroup = function() {};


/**
 * @abstract
 * @param {number|undefined} zIndex Z index.
 * @param {ol.render.ReplayType} replayType Replay type.
 * @return {ol.render.VectorContext} Replay.
 */
ol.render.ReplayGroup.prototype.getReplay = function(zIndex, replayType) {};


/**
 * @abstract
 * @return {boolean} Is empty.
 */
ol.render.ReplayGroup.prototype.isEmpty = function() {};
