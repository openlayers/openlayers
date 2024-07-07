/**
 * @module ol/render/canvas/ZIndexContext
 */

import {getSharedCanvasContext2D} from '../../dom.js';

/** @typedef {CanvasRenderingContext2D & {globalAlpha: any}} ZIndexContextProxy */

/**
 * @extends {CanvasRenderingContext2D}
 */
class ZIndexContext {
  constructor() {
    /**
     * @private
     * @type {Array<Array<*>>}
     */
    this.instructions_ = [];
    /**
     * @type {number}
     */
    this.zIndex = 0;
    /**
     * @private
     * @type {number}
     */
    this.offset_ = 0;

    /**
     * @private
     * @type {ZIndexContextProxy}
     */
    this.context_ = /** @type {ZIndexContextProxy} */ (
      new Proxy(getSharedCanvasContext2D(), {
        get: (target, property) => {
          if (
            typeof (/** @type {*} */ (getSharedCanvasContext2D())[property]) !==
            'function'
          ) {
            // we only accept calling functions on the proxy, not accessing properties
            return undefined;
          }
          if (!this.instructions_[this.zIndex + this.offset_]) {
            this.instructions_[this.zIndex + this.offset_] = [];
          }
          this.instructions_[this.zIndex + this.offset_].push(property);
          return this.pushMethodArgs_;
        },
        set: (target, property, value) => {
          if (!this.instructions_[this.zIndex + this.offset_]) {
            this.instructions_[this.zIndex + this.offset_] = [];
          }
          this.instructions_[this.zIndex + this.offset_].push(property, value);
          return true;
        },
      })
    );
  }

  /**
   * @private
   * @param {...*} args Args.
   * @return {ZIndexContext} This.
   */
  pushMethodArgs_ = (...args) => {
    this.instructions_[this.zIndex + this.offset_].push(args);
    return this;
  };

  /**
   * Push a function that renders to the context directly.
   * @param {function(CanvasRenderingContext2D): void} render Function.
   */
  pushFunction(render) {
    this.instructions_[this.zIndex + this.offset_].push(render);
  }

  /**
   * Get a proxy for CanvasRenderingContext2D which does not support getting state
   * (e.g. `context.globalAlpha`, which will return `undefined`). To set state, if it relies on a
   * previous state (e.g. `context.globalAlpha = context.globalAlpha / 2`), set a function,
   * e.g. `context.globalAlpha = (context) => context.globalAlpha / 2`.
   * @return {ZIndexContextProxy} Context.
   */
  getContext() {
    return this.context_;
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   */
  draw(context) {
    this.instructions_.forEach((instructionsAtIndex) => {
      for (let i = 0, ii = instructionsAtIndex.length; i < ii; ++i) {
        const property = instructionsAtIndex[i];
        if (typeof property === 'function') {
          property(context);
          continue;
        }
        const instructionAtIndex = instructionsAtIndex[++i];
        if (typeof (/** @type {*} */ (context)[property]) === 'function') {
          /** @type {*} */ (context)[property](...instructionAtIndex);
        } else {
          if (typeof instructionAtIndex === 'function') {
            /** @type {*} */ (context)[property] = instructionAtIndex(context);
            continue;
          }
          /** @type {*} */ (context)[property] = instructionAtIndex;
        }
      }
    });
  }

  clear() {
    this.instructions_.length = 0;
    this.zIndex = 0;
    this.offset_ = 0;
  }

  /**
   * Offsets the zIndex by the highest current zIndex. Useful for rendering multiple worlds or tiles, to
   * avoid conflicting context.clip() or context.save()/restore() calls.
   */
  offset() {
    this.offset_ = this.instructions_.length;
    this.zIndex = 0;
  }
}

export default ZIndexContext;
