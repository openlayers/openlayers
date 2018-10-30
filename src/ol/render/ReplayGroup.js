/**
 * @module ol/render/ReplayGroup
 */
import {abstract} from '../util.js';

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
  getReplay(zIndex, replayType) {
    return abstract();
  }

  /**
   * @abstract
   * @return {boolean} Is empty.
   */
  isEmpty() {
    return abstract();
  }

  /**
   * @abstract
   * @param {boolean} group Group with previous replay
   * @return {Array<*>} The resulting instruction group
   */
  addDeclutter(group) {
    return abstract();
  }
}

export default ReplayGroup;
