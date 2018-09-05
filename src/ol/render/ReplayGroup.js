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
   * @param {import("./ReplayType.js").default} replayType Replay type.
   * @return {import("./VectorContext.js").default} Replay.
   */
  getReplay(zIndex, replayType) {}

  /**
   * @abstract
   * @return {boolean} Is empty.
   */
  isEmpty() {}
}

export default ReplayGroup;
