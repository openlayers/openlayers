/**
 * @module ol/renderer/canvas/VectorLayer
 */
import {getUid} from '../../util.js';
import ViewHint from '../../ViewHint.js';
import {listen, unlisten} from '../../events.js';
import EventType from '../../events/EventType.js';
import rbush from 'rbush';
import {buffer, createEmpty, containsExtent, getWidth} from '../../extent.js';
import {labelCache} from '../../render/canvas.js';
import CanvasBuilderGroup from '../../render/canvas/BuilderGroup.js';
import ExecutorGroup from '../../render/canvas/ExecutorGroup.js';
import CanvasLayerRenderer from './Layer.js';
import {defaultOrder as defaultRenderOrder, getTolerance as getRenderTolerance, getSquaredTolerance as getSquaredRenderTolerance, renderFeature} from '../vector.js';
import {toString as transformToString, makeScale, makeInverse} from '../../transform.js';

/**
 * @classdesc
 * Canvas renderer for vector layers.
 * @api
 */
class CanvasVectorLayerRenderer extends CanvasLayerRenderer {

  /**
   * @param {import("../../layer/Vector.js").default} vectorLayer Vector layer.
   */
  constructor(vectorLayer) {

    super(vectorLayer);

    /**
     * Declutter tree.
     * @private
     */
    this.declutterTree_ = vectorLayer.getDeclutter() ? rbush(9, undefined) : null;

    /**
     * @private
     * @type {boolean}
     */
    this.dirty_ = false;

    /**
     * @private
     * @type {number}
     */
    this.renderedRevision_ = -1;

    /**
     * @private
     * @type {number}
     */
    this.renderedResolution_ = NaN;

    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    this.renderedExtent_ = createEmpty();

    /**
     * @private
     * @type {function(import("../../Feature.js").default, import("../../Feature.js").default): number|null}
     */
    this.renderedRenderOrder_ = null;

    /**
     * @private
     * @type {import("../../render/canvas/ExecutorGroup").default}
     */
    this.replayGroup_ = null;

    /**
     * A new replay group had to be created by `prepareFrame()`
     * @type {boolean}
     */
    this.replayGroupChanged = true;

    listen(labelCache, EventType.CLEAR, this.handleFontsChanged_, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    unlisten(labelCache, EventType.CLEAR, this.handleFontsChanged_, this);
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  renderFrame(frameState, layerState) {
    const context = this.context;
    const canvas = context.canvas;

    const replayGroup = this.replayGroup_;
    if (!replayGroup || replayGroup.isEmpty()) {
      if (canvas.width > 0) {
        canvas.width = 0;
      }
      return canvas;
    }

    const pixelRatio = frameState.pixelRatio;

    // set forward and inverse pixel transforms
    makeScale(this.pixelTransform_, 1 / pixelRatio, 1 / pixelRatio);
    makeInverse(this.inversePixelTransform_, this.pixelTransform_);

    // resize and clear
    const width = Math.round(frameState.size[0] * pixelRatio);
    const height = Math.round(frameState.size[1] * pixelRatio);
    if (canvas.width != width || canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
      const canvasTransform = transformToString(this.pixelTransform_);
      if (canvas.style.transform !== canvasTransform) {
        canvas.style.transform = canvasTransform;
      }
    } else {
      context.clearRect(0, 0, width, height);
    }

    this.preRender(context, frameState);

    const extent = frameState.extent;
    const viewState = frameState.viewState;
    const projection = viewState.projection;
    const rotation = viewState.rotation;
    const projectionExtent = projection.getExtent();
    const vectorSource = this.getLayer().getSource();

    // clipped rendering if layer extent is set
    const clipExtent = layerState.extent;
    const clipped = clipExtent !== undefined;
    if (clipped) {
      this.clip(context, frameState, clipExtent);
    }

    if (this.declutterTree_) {
      this.declutterTree_.clear();
    }


    const viewHints = frameState.viewHints;
    const snapToPixel = !(viewHints[ViewHint.ANIMATING] || viewHints[ViewHint.INTERACTING]);

    const transform = this.getRenderTransform(frameState, width, height, 0);
    const skippedFeatureUids = layerState.managed ? frameState.skippedFeatureUids : {};
    replayGroup.execute(context, transform, rotation, skippedFeatureUids, snapToPixel);

    if (vectorSource.getWrapX() && projection.canWrapX() && !containsExtent(projectionExtent, extent)) {
      let startX = extent[0];
      const worldWidth = getWidth(projectionExtent);
      let world = 0;
      let offsetX;
      while (startX < projectionExtent[0]) {
        --world;
        offsetX = worldWidth * world;
        const transform = this.getRenderTransform(frameState, width, height, offsetX);
        replayGroup.execute(context, transform, rotation, skippedFeatureUids, snapToPixel);
        startX += worldWidth;
      }
      world = 0;
      startX = extent[2];
      while (startX > projectionExtent[2]) {
        ++world;
        offsetX = worldWidth * world;
        const transform = this.getRenderTransform(frameState, width, height, offsetX);
        replayGroup.execute(context, transform, rotation, skippedFeatureUids, snapToPixel);
        startX -= worldWidth;
      }
    }

    if (clipped) {
      context.restore();
    }

    this.postRender(context, frameState);

    const opacity = layerState.opacity;
    if (opacity !== parseFloat(canvas.style.opacity)) {
      canvas.style.opacity = opacity;
    }

    return canvas;
  }

  /**
   * @inheritDoc
   */
  forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback, thisArg) {
    if (!this.replayGroup_) {
      return undefined;
    } else {
      const resolution = frameState.viewState.resolution;
      const rotation = frameState.viewState.rotation;
      const layer = this.getLayer();
      /** @type {!Object<string, boolean>} */
      const features = {};
      const result = this.replayGroup_.forEachFeatureAtCoordinate(coordinate, resolution, rotation, hitTolerance, {},
        /**
         * @param {import("../../Feature.js").FeatureLike} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          const key = getUid(feature);
          if (!(key in features)) {
            features[key] = true;
            return callback.call(thisArg, feature, layer);
          }
        }, null);
      return result;
    }
  }

  /**
   * @param {import("../../events/Event.js").default} event Event.
   */
  handleFontsChanged_(event) {
    const layer = this.getLayer();
    if (layer.getVisible() && this.replayGroup_) {
      layer.changed();
    }
  }

  /**
   * Handle changes in image style state.
   * @param {import("../../events/Event.js").default} event Image style change event.
   * @private
   */
  handleStyleImageChange_(event) {
    this.renderIfReadyAndVisible();
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState, layerState) {
    const vectorLayer = /** @type {import("../../layer/Vector.js").default} */ (this.getLayer());
    const vectorSource = vectorLayer.getSource();

    const animating = frameState.viewHints[ViewHint.ANIMATING];
    const interacting = frameState.viewHints[ViewHint.INTERACTING];
    const updateWhileAnimating = vectorLayer.getUpdateWhileAnimating();
    const updateWhileInteracting = vectorLayer.getUpdateWhileInteracting();

    if (!this.dirty_ && (!updateWhileAnimating && animating) ||
        (!updateWhileInteracting && interacting)) {
      return true;
    }

    const frameStateExtent = frameState.extent;
    const viewState = frameState.viewState;
    const projection = viewState.projection;
    const resolution = viewState.resolution;
    const pixelRatio = frameState.pixelRatio;
    const vectorLayerRevision = vectorLayer.getRevision();
    const vectorLayerRenderBuffer = vectorLayer.getRenderBuffer();
    let vectorLayerRenderOrder = vectorLayer.getRenderOrder();

    if (vectorLayerRenderOrder === undefined) {
      vectorLayerRenderOrder = defaultRenderOrder;
    }

    const extent = buffer(frameStateExtent,
      vectorLayerRenderBuffer * resolution);
    const projectionExtent = viewState.projection.getExtent();

    if (vectorSource.getWrapX() && viewState.projection.canWrapX() &&
        !containsExtent(projectionExtent, frameState.extent)) {
      // For the replay group, we need an extent that intersects the real world
      // (-180° to +180°). To support geometries in a coordinate range from -540°
      // to +540°, we add at least 1 world width on each side of the projection
      // extent. If the viewport is wider than the world, we need to add half of
      // the viewport width to make sure we cover the whole viewport.
      const worldWidth = getWidth(projectionExtent);
      const gutter = Math.max(getWidth(extent) / 2, worldWidth);
      extent[0] = projectionExtent[0] - gutter;
      extent[2] = projectionExtent[2] + gutter;
    }

    if (!this.dirty_ &&
        this.renderedResolution_ == resolution &&
        this.renderedRevision_ == vectorLayerRevision &&
        this.renderedRenderOrder_ == vectorLayerRenderOrder &&
        containsExtent(this.renderedExtent_, extent)) {
      this.replayGroupChanged = false;
      return true;
    }

    if (this.replayGroup_) {
      this.replayGroup_.dispose();
    }
    this.replayGroup_ = null;

    this.dirty_ = false;

    const replayGroup = new CanvasBuilderGroup(
      getRenderTolerance(resolution, pixelRatio), extent, resolution,
      pixelRatio, !!this.declutterTree_);

    vectorSource.loadFeatures(extent, resolution, projection);

    /**
     * @param {import("../../Feature.js").default} feature Feature.
     * @this {CanvasVectorLayerRenderer}
     */
    const render = function(feature) {
      let styles;
      const styleFunction = feature.getStyleFunction() || vectorLayer.getStyleFunction();
      if (styleFunction) {
        styles = styleFunction(feature, resolution);
      }
      if (styles) {
        const dirty = this.renderFeature(
          feature, resolution, pixelRatio, styles, replayGroup);
        this.dirty_ = this.dirty_ || dirty;
      }
    }.bind(this);
    if (vectorLayerRenderOrder) {
      /** @type {Array<import("../../Feature.js").default>} */
      const features = [];
      vectorSource.forEachFeatureInExtent(extent,
        /**
         * @param {import("../../Feature.js").default} feature Feature.
         */
        function(feature) {
          features.push(feature);
        });
      features.sort(vectorLayerRenderOrder);
      for (let i = 0, ii = features.length; i < ii; ++i) {
        render(features[i]);
      }
    } else {
      vectorSource.forEachFeatureInExtent(extent, render);
    }

    const replayGroupInstructions = replayGroup.finish();
    const executorGroup = new ExecutorGroup(extent, resolution,
      pixelRatio, vectorSource.getOverlaps(), this.declutterTree_,
      replayGroupInstructions, vectorLayer.getRenderBuffer());

    this.renderedResolution_ = resolution;
    this.renderedRevision_ = vectorLayerRevision;
    this.renderedRenderOrder_ = vectorLayerRenderOrder;
    this.renderedExtent_ = extent;
    this.replayGroup_ = executorGroup;

    this.replayGroupChanged = true;
    return true;
  }

  /**
   * @param {import("../../Feature.js").default} feature Feature.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../../style/Style.js").default|Array<import("../../style/Style.js").default>} styles The style or array of styles.
   * @param {import("../../render/canvas/BuilderGroup.js").default} builderGroup Builder group.
   * @return {boolean} `true` if an image is loading.
   */
  renderFeature(feature, resolution, pixelRatio, styles, builderGroup) {
    if (!styles) {
      return false;
    }
    let loading = false;
    if (Array.isArray(styles)) {
      for (let i = 0, ii = styles.length; i < ii; ++i) {
        loading = renderFeature(
          builderGroup, feature, styles[i],
          getSquaredRenderTolerance(resolution, pixelRatio),
          this.handleStyleImageChange_, this) || loading;
      }
    } else {
      loading = renderFeature(
        builderGroup, feature, styles,
        getSquaredRenderTolerance(resolution, pixelRatio),
        this.handleStyleImageChange_, this);
    }
    return loading;
  }
}


export default CanvasVectorLayerRenderer;
