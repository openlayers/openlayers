/**
 * @module ol/render/ReplayGroup
 */
/**
 * Base class for replay groups.
 * @constructor
 * @abstract
 */
const ReplayGroup = function() {};


/**
 * @abstract
 * @param {number|undefined} zIndex Z index.
 * @param {module:ol/render/ReplayType} replayType Replay type.
 * @return {module:ol/render/VectorContext} Replay.
 */
ReplayGroup.prototype.getReplay = function(zIndex, replayType) {};


/**
 * @abstract
 * @return {boolean} Is empty.
 */
ReplayGroup.prototype.isEmpty = function() {};
export default ReplayGroup;
