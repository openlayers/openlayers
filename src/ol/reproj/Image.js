/**
 * @module ol/reproj/Image
 */
import {ERROR_THRESHOLD} from './common.js';

import EventType from '../events/EventType.js';
import ImageState from '../ImageState.js';
import ImageWrapper from '../Image.js';
import Triangulation from './Triangulation.js';
import {
  calculateSourceResolution,
  render as renderReprojected,
} from '../reproj.js';
import {fromResolutionLike} from '../resolution.js';
import {
  getCenter,
  getHeight,
  getIntersection,
  getWidth,
  isEmpty,
} from '../extent.js';
import {listen, unlistenByKey} from '../events.js';

/**
 * @typedef {function(import("../extent.js").Extent, number, number) : import("../Image.js").default} FunctionType
 */

/**
 * @classdesc
 * Class encapsulating single reprojected image.
 * See {@link module:ol/source/Image~ImageSource}.
 */
class ReprojImage extends ImageWrapper {
  /**
   * @param {import("../proj/Projection.js").default} sourceProj Source projection (of the data).
   * @param {import("../proj/Projection.js").default} targetProj Target projection.
   * @param {import("../extent.js").Extent} targetExtent Target extent.
   * @param {number} targetResolution Target resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {FunctionType} getImageFunction
   *     Function returning source images (extent, resolution, pixelRatio).
   * @param {boolean} interpolate Use linear interpolation when resampling.
   */
  constructor(
    sourceProj,
    targetProj,
    targetExtent,
    targetResolution,
    pixelRatio,
    getImageFunction,
    interpolate,
  ) {
    let maxSourceExtent = sourceProj.getExtent();
    if (maxSourceExtent && sourceProj.canWrapX()) {
      maxSourceExtent = maxSourceExtent.slice();
      maxSourceExtent[0] = -Infinity;
      maxSourceExtent[2] = Infinity;
    }
    let maxTargetExtent = targetProj.getExtent();
    if (maxTargetExtent && targetProj.canWrapX()) {
      maxTargetExtent = maxTargetExtent.slice();
      maxTargetExtent[0] = -Infinity;
      maxTargetExtent[2] = Infinity;
    }

    const limitedTargetExtent = maxTargetExtent
      ? getIntersection(targetExtent, maxTargetExtent)
      : targetExtent;

    const targetCenter = getCenter(limitedTargetExtent);
    const sourceResolution = calculateSourceResolution(
      sourceProj,
      targetProj,
      targetCenter,
      targetResolution,
    );

    const errorThresholdInPixels = ERROR_THRESHOLD;

    const triangulation = new Triangulation(
      sourceProj,
      targetProj,
      limitedTargetExtent,
      maxSourceExtent,
      sourceResolution * errorThresholdInPixels,
      targetResolution,
    );

    const sourceExtent = triangulation.calculateSourceExtent();
    const sourceImage = isEmpty(sourceExtent)
      ? null
      : getImageFunction(sourceExtent, sourceResolution, pixelRatio);
    const state = sourceImage ? ImageState.IDLE : ImageState.EMPTY;
    const sourcePixelRatio = sourceImage ? sourceImage.getPixelRatio() : 1;

    super(targetExtent, targetResolution, sourcePixelRatio, state);

    /**
     * @private
     * @type {import("../proj/Projection.js").default}
     */
    this.targetProj_ = targetProj;

    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    this.maxSourceExtent_ = maxSourceExtent;

    /**
     * @private
     * @type {!import("./Triangulation.js").default}
     */
    this.triangulation_ = triangulation;

    /**
     * @private
     * @type {number}
     */
    this.targetResolution_ = targetResolution;

    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    this.targetExtent_ = targetExtent;

    /**
     * @private
     * @type {import("../Image.js").default}
     */
    this.sourceImage_ = sourceImage;

    /**
     * @private
     * @type {number}
     */
    this.sourcePixelRatio_ = sourcePixelRatio;

    /**
     * @private
     * @type {boolean}
     */
    this.interpolate_ = interpolate;

    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.canvas_ = null;

    /**
     * @private
     * @type {?import("../events.js").EventsKey}
     */
    this.sourceListenerKey_ = null;
  }

  /**
   * Clean up.
   * @override
   */
  disposeInternal() {
    if (this.state == ImageState.LOADING) {
      this.unlistenSource_();
    }
    super.disposeInternal();
  }

  /**
   * @return {HTMLCanvasElement} Image.
   * @override
   */
  getImage() {
    return this.canvas_;
  }

  /**
   * @return {import("../proj/Projection.js").default} Projection.
   */
  getProjection() {
    return this.targetProj_;
  }

  /**
   * @private
   */
  reproject_() {
    const sourceState = this.sourceImage_.getState();
    if (sourceState == ImageState.LOADED) {
      const width = getWidth(this.targetExtent_) / this.targetResolution_;
      const height = getHeight(this.targetExtent_) / this.targetResolution_;
      this.canvas_ = renderReprojected(
        width,
        height,
        this.sourcePixelRatio_,
        fromResolutionLike(this.sourceImage_.getResolution()),
        this.maxSourceExtent_,
        this.targetResolution_,
        this.targetExtent_,
        this.triangulation_,
        [
          {
            extent: this.sourceImage_.getExtent(),
            image: this.sourceImage_.getImage(),
          },
        ],
        0,
        undefined,
        this.interpolate_,
        true,
      );
    }
    this.state = sourceState;
    this.changed();
  }

  /**
   * Load not yet loaded URI.
   * @override
   */
  load() {
    if (this.state == ImageState.IDLE) {
      this.state = ImageState.LOADING;
      this.changed();

      const sourceState = this.sourceImage_.getState();
      if (sourceState == ImageState.LOADED || sourceState == ImageState.ERROR) {
        this.reproject_();
      } else {
        this.sourceListenerKey_ = listen(
          this.sourceImage_,
          EventType.CHANGE,
          (e) => {
            const sourceState = this.sourceImage_.getState();
            if (
              sourceState == ImageState.LOADED ||
              sourceState == ImageState.ERROR
            ) {
              this.unlistenSource_();
              this.reproject_();
            }
          },
        );
        this.sourceImage_.load();
      }
    }
  }

  /**
   * @private
   */
  unlistenSource_() {
    unlistenByKey(
      /** @type {!import("../events.js").EventsKey} */ (
        this.sourceListenerKey_
      ),
    );
    this.sourceListenerKey_ = null;
  }
}

export default ReprojImage;
