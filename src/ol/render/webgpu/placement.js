/**
 * @module ol/render/webgpu/placement
 */
import ViewHint from '../../ViewHint.js';

/**
 * Milliseconds of declutter work a frame should absorb before the next pass is
 * deferred. Borrowed from MapLibre's pauseable placement, which budgets about
 * this much per frame and lets the previous result stay on screen meanwhile.
 * @type {number}
 */
const DEFAULT_BUDGET = 2;

/**
 * Longest a deferred pass may wait, so labels cannot lag indefinitely behind a
 * continuous gesture.
 * @type {number}
 */
const MAX_DEFER = 250;

/**
 * Minimum time between placements whose scale or rotation changed during a
 * moving view. Reusing the previous winners briefly avoids labels flashing in
 * and out on consecutive animation frames.
 * @type {number}
 */
const MOVING_PLACEMENT_INTERVAL = 200;

/**
 * @param {import("../../Map.js").FrameState} frameState Frame state.
 * @return {boolean} The view is neither animating nor being interacted with.
 */
function viewNotMoving(frameState) {
  const hints = frameState.viewHints;
  return !hints[ViewHint.ANIMATING] && !hints[ViewHint.INTERACTING];
}

/**
 * @classdesc
 * Decides when the declutter pass should run.
 *
 * Placing labels means projecting every one of them and resolving collisions
 * across the whole map, which is far too much to repeat for each frame of a
 * pan. Translation moves every box equally and therefore cannot change which
 * boxes collide. Placement is invalidated only when the label set or the
 * linear part of the view transform changes.
 */
export class PlacementScheduler {
  /**
   * @param {number} [budget] Per-frame budget in milliseconds.
   */
  constructor(budget = DEFAULT_BUDGET) {
    /**
     * @private
     * @type {number}
     */
    this.budget_ = budget;

    /**
     * @private
     * @type {string}
     */
    this.key_ = '';

    /**
     * @private
     * @type {number}
     */
    this.deferUntil_ = 0;

    /**
     * Earliest time a scale or rotation change should be placed while the view
     * is moving.
     * @private
     * @type {number}
     */
    this.movingPlacementAfter_ = 0;

    /**
     * @private
     * @type {boolean}
     */
    this.placed_ = false;
  }

  /**
   * @param {string} key Describes the placement inputs other than translation.
   * @param {number} now Frame time.
   * @param {import("../../Map.js").FrameState} [frameState] Frame state.
   * @return {boolean} Placement should run this frame.
   */
  shouldRun(key, now, frameState) {
    if (!this.placed_) {
      return true;
    }
    // Never throttle the final placement. It is the last frame's only chance
    // to replace a layout retained during the animation.
    if (frameState && viewNotMoving(frameState)) {
      return key !== this.key_;
    }
    if (now < this.deferUntil_) {
      return false;
    }
    if (key !== this.key_) {
      if (frameState && now < this.movingPlacementAfter_) {
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Whether a pass is waiting on the budget, in which case the caller should
   * keep rendering so it eventually happens.
   *
   * @param {string} key Describes the placement inputs.
   * @param {number} now Frame time.
   * @return {boolean} A pass is pending.
   */
  isDeferred(key, now) {
    return (
      key !== this.key_ &&
      (now < this.deferUntil_ || now < this.movingPlacementAfter_)
    );
  }

  /**
   * @param {string} key Inputs the completed pass used.
   * @param {number} now Frame time.
   * @param {number} duration Milliseconds the pass took.
   * @param {import("../../Map.js").FrameState} [frameState] Frame state.
   */
  commit(key, now, duration, frameState) {
    this.key_ = key;
    this.placed_ = true;
    if (frameState) {
      this.movingPlacementAfter_ = viewNotMoving(frameState)
        ? now
        : now + MOVING_PLACEMENT_INTERVAL;
    }
    this.deferUntil_ =
      duration > this.budget_ ? now + Math.min(MAX_DEFER, duration * 4) : now;
  }

  /**
   * Forget the last pass, so the next frame places again.
   */
  reset() {
    this.key_ = '';
    this.deferUntil_ = 0;
    this.movingPlacementAfter_ = 0;
    this.placed_ = false;
  }
}
