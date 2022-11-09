/**
 * @module ol/renderer/Layer
 */
import EventType from '../events/EventType.js';
import ImageState from '../ImageState.js';
import Observable from '../Observable.js';
import {abstract} from '../util.js';

/**
 * @template {import("../layer/Layer.js").default} LayerType
 */
class LayerRenderer extends Observable {
  /**
   * @param {LayerType} layer Layer.
   */
  constructor(layer) {
    super();

    /**
     * The renderer is initialized and ready to render.
     * @type {boolean}
     */
    this.ready = true;

    /** @private */
    this.boundHandleImageChange_ = this.handleImageChange_.bind(this);

    /**
     * @protected
     * @type {LayerType}
     */
    this.layer_ = layer;

    /**
     * @type {import("../render/canvas/ExecutorGroup").default}
     */
    this.declutterExecutorGroup = null;
  }

  /**
   * Asynchronous layer level hit detection.
   * @param {import("../pixel.js").Pixel} pixel Pixel.
   * @return {Promise<Array<import("../Feature").FeatureLike>>} Promise that resolves with
   * an array of features.
   */
  getFeatures(pixel) {
    return abstract();
  }

  /**
   * @param {import("../pixel.js").Pixel} pixel Pixel.
   * @return {Uint8ClampedArray|Uint8Array|Float32Array|DataView|null} Pixel data.
   */
  getData(pixel) {
    return null;
  }

  /**
   * Determine whether render should be called.
   * @abstract
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   */
  prepareFrame(frameState) {
    return abstract();
  }

  /**
   * Render the layer.
   * @abstract
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @param {HTMLElement} target Target that may be used to render content to.
   * @return {HTMLElement} The rendered element.
   */
  renderFrame(frameState, target) {
    return abstract();
  }

  /**
   * @abstract
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {import("./vector.js").FeatureCallback<T>} callback Feature callback.
   * @param {Array<import("./Map.js").HitMatch<T>>} matches The hit detected matches with tolerance.
   * @return {T|undefined} Callback result.
   * @template T
   */
  forEachFeatureAtCoordinate(
    coordinate,
    frameState,
    hitTolerance,
    callback,
    matches
  ) {
    return undefined;
  }

  /**
   * @return {LayerType} Layer.
   */
  getLayer() {
    return this.layer_;
  }

  /**
   * Perform action necessary to get the layer rendered after new fonts have loaded
   * @abstract
   */
  handleFontsChanged() {}

  /**
   * Handle changes in image state.
   * @param {import("../events/Event.js").default} event Image change event.
   * @private
   */
  handleImageChange_(event) {
    const image = /** @type {import("../Image.js").default} */ (event.target);
    if (image.getState() === ImageState.LOADED) {
      this.renderIfReadyAndVisible();
    }
  }

  /**
   * Load the image if not already loaded, and register the image change
   * listener if needed.
   * @param {import("../ImageBase.js").default} image Image.
   * @return {boolean} `true` if the image is already loaded, `false` otherwise.
   * @protected
   */
  loadImage(image) {
    let imageState = image.getState();
    if (imageState != ImageState.LOADED && imageState != ImageState.ERROR) {
      image.addEventListener(EventType.CHANGE, this.boundHandleImageChange_);
    }
    if (imageState == ImageState.IDLE) {
      image.load();
      imageState = image.getState();
    }
    return imageState == ImageState.LOADED;
  }

  /**
   * @protected
   */
  renderIfReadyAndVisible() {
    const layer = this.getLayer();
    if (layer && layer.getVisible() && layer.getSourceState() === 'ready') {
      layer.changed();
    }
  }

  /**
   * Clean up.
   */
  disposeInternal() {
    delete this.layer_;
    super.disposeInternal();
  }
}

export default LayerRenderer;
