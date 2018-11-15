/**
 * @module ol/render/ExecutorGroup
 */
import {abstract} from '../util.js';

/**
 * Base class for replay groups.
 */
class ExecutorGroup {
  /**
   * @abstract
   * @param {number|undefined} zIndex Z index.
   * @param {import("./ReplayType.js").default} replayType Replay type.
   * @return {import("./VectorContext.js").default} Replay.
   */
  getExecutor(zIndex, replayType) {
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

export default ExecutorGroup;
