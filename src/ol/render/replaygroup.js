/**
 * Base class for replay groups.
 * @constructor
 * @abstract
 */
var _ol_render_ReplayGroup_ = function() {};


/**
 * @abstract
 * @param {number|undefined} zIndex Z index.
 * @param {ol.render.ReplayType} replayType Replay type.
 * @return {ol.render.VectorContext} Replay.
 */
_ol_render_ReplayGroup_.prototype.getReplay = function(zIndex, replayType) {};


/**
 * @abstract
 * @return {boolean} Is empty.
 */
_ol_render_ReplayGroup_.prototype.isEmpty = function() {};
export default _ol_render_ReplayGroup_;
