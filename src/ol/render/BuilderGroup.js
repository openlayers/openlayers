/**
 * @module ol/render/BuilderGroup
 */
import {abstract} from '../util.js';

/**
 * Base class for builder groups.
 */
class BuilderGroup {
  /**
   * @abstract
   * @param {number|undefined} zIndex Z index.
   * @param {import("./ReplayType.js").default} replayType Replay type.
   * @return {import("./VectorContext.js").default} Replay.
   */
  getBuilder(zIndex, replayType) {
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
   * @param {boolean} group Group with previous builder
   * @return {Array<*>} The resulting instruction group
   */
  addDeclutter(group) {
    return abstract();
  }
}

export default BuilderGroup;
