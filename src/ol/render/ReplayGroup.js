/**
 * @module ol/render/ReplayGroup
 */
/**
 * Base class for replay groups.
 */
class ReplayGroup {
  /**
   * @abstract
   * @param {number|undefined} zIndex Z index.
   * @param {module:ol/render/ReplayType} replayType Replay type.
   * @return {module:ol/render/VectorContext} Replay.
   */
  getReplay(zIndex, replayType) {}

  /**
   * @abstract
   * @return {boolean} Is empty.
   */
  isEmpty() {}
}

export default ReplayGroup;
