/**
 * @module ol/renderer/canvas/VectorLayer
 */
import CanvasBuilderGroup from '../../render/canvas/BuilderGroup.js';
import CanvasLayerRenderer from './Layer.js';
import ExecutorGroup, {
  replayDeclutter,
} from '../../render/canvas/ExecutorGroup.js';
import ViewHint from '../../ViewHint.js';
import {
  apply,
  makeInverse,
  makeScale,
  toString as transformToString,
} from '../../transform.js';
import {
  buffer,
  containsExtent,
  createEmpty,
  getWidth,
  intersects as intersectsExtent,
  wrapX as wrapExtentX,
} from '../../extent.js';
import {
  createHitDetectionImageData,
  hitDetect,
} from '../../render/canvas/hitdetect.js';
import {
  defaultOrder as defaultRenderOrder,
  getTolerance as getRenderTolerance,
  getSquaredTolerance as getSquaredRenderTolerance,
  renderFeature,
} from '../vector.js';
import {
  fromUserExtent,
  getTransformFromProjections,
  getUserProjection,
  toUserExtent,
} from '../../proj.js';
import {getUid} from '../../util.js';
import {wrapX as wrapCoordinateX} from '../../coordinate.js';

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

    /** @private */
    this.boundHandleStyleImageChange_ = this.handleStyleImageChange_.bind(this);

    /**
     * @type {boolean}
     */
    this.animatingOrInteracting_;

    /**
     * @private
     * @type {boolean}
     */
    this.dirty_ = false;

    /**
     * @type {ImageData}
     */
    this.hitDetectionImageData_ = null;

    /**
     * @type {Array<import("../../Feature.js").default>}
     */
    this.renderedFeatures_ = null;

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
     * @type {number}
     */
    this.renderedRotation_;

    /**
     * @private
     * @type {import("../../coordinate").Coordinate}
     */
    this.renderedCenter_ = null;

    /**
     * @private
     * @type {import("../../proj/Projection").default}
     */
    this.renderedProjection_ = null;

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

    /**
     * Clipping to be performed by `renderFrame()`
     * @type {boolean}
     */
    this.clipping = true;
  }

  /**
   * Get a rendering container from an existing target, if compatible.
   * @param {HTMLElement} target Potential render target.
   * @param {string} transform CSS Transform.
   * @param {number} opacity Opacity.
   */
  useContainer(target, transform, opacity) {
    if (opacity < 1) {
      target = null;
    }
    super.useContainer(target, transform, opacity);
  }

  /**
   * Render the layer.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {HTMLElement} target Target that may be used to render content to.
   * @return {HTMLElement} The rendered element.
   */
  renderFrame(frameState, target) {
    const pixelRatio = frameState.pixelRatio;
    const layerState = frameState.layerStatesArray[frameState.layerIndex];

    // set forward and inverse pixel transforms
    makeScale(this.pixelTransform, 1 / pixelRatio, 1 / pixelRatio);
    makeInverse(this.inversePixelTransform, this.pixelTransform);

    const canvasTransform = transformToString(this.pixelTransform);

    this.useContainer(target, canvasTransform, layerState.opacity);
    const context = this.context;
    const canvas = context.canvas;

    const replayGroup = this.replayGroup_;
    if (!replayGroup || replayGroup.isEmpty()) {
      if (!this.containerReused && canvas.width > 0) {
        canvas.width = 0;
      }
      return this.container;
    }

    // resize and clear
    const width = Math.round(frameState.size[0] * pixelRatio);
    const height = Math.round(frameState.size[1] * pixelRatio);
    if (canvas.width != width || canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
      if (canvas.style.transform !== canvasTransform) {
        canvas.style.transform = canvasTransform;
      }
    } else if (!this.containerReused) {
      context.clearRect(0, 0, width, height);
    }

    this.preRender(context, frameState);

    const extent = frameState.extent;
    const viewState = frameState.viewState;
    const center = viewState.center;
    const resolution = viewState.resolution;
    const projection = viewState.projection;
    const rotation = viewState.rotation;
    const projectionExtent = projection.getExtent();
    const vectorSource = this.getLayer().getSource();

    // clipped rendering if layer extent is set
    let clipped = false;
    if (layerState.extent && this.clipping) {
      const layerExtent = fromUserExtent(layerState.extent, projection);
      clipped =
        !containsExtent(layerExtent, frameState.extent) &&
        intersectsExtent(layerExtent, frameState.extent);
      if (clipped) {
        this.clipUnrotated(context, frameState, layerExtent);
      }
    }

    const viewHints = frameState.viewHints;
    const snapToPixel = !(
      viewHints[ViewHint.ANIMATING] || viewHints[ViewHint.INTERACTING]
    );

    const transform = this.getRenderTransform(
      center,
      resolution,
      rotation,
      pixelRatio,
      width,
      height,
      0
    );
    const declutterReplays = this.getLayer().getDeclutter() ? {} : null;
    replayGroup.execute(
      context,
      1,
      transform,
      rotation,
      snapToPixel,
      undefined,
      declutterReplays
    );

    if (
      vectorSource.getWrapX() &&
      projection.canWrapX() &&
      !containsExtent(projectionExtent, extent)
    ) {
      let startX = extent[0];
      const worldWidth = getWidth(projectionExtent);
      let world = 0;
      let offsetX;
      while (startX < projectionExtent[0]) {
        --world;
        offsetX = worldWidth * world;
        const transform = this.getRenderTransform(
          center,
          resolution,
          rotation,
          pixelRatio,
          width,
          height,
          offsetX
        );
        replayGroup.execute(
          context,
          1,
          transform,
          rotation,
          snapToPixel,
          undefined,
          declutterReplays
        );
        startX += worldWidth;
      }
      world = 0;
      startX = extent[2];
      while (startX > projectionExtent[2]) {
        ++world;
        offsetX = worldWidth * world;
        const transform = this.getRenderTransform(
          center,
          resolution,
          rotation,
          pixelRatio,
          width,
          height,
          offsetX
        );
        replayGroup.execute(
          context,
          1,
          transform,
          rotation,
          snapToPixel,
          undefined,
          declutterReplays
        );
        startX -= worldWidth;
      }
    }
    if (declutterReplays) {
      const viewHints = frameState.viewHints;
      const hifi = !(
        viewHints[ViewHint.ANIMATING] || viewHints[ViewHint.INTERACTING]
      );
      replayDeclutter(
        declutterReplays,
        context,
        rotation,
        1,
        hifi,
        frameState.declutterItems
      );
    }

    if (clipped) {
      context.restore();
    }

    this.postRender(context, frameState);

    const opacity = layerState.opacity;
    const container = this.container;
    if (opacity !== parseFloat(container.style.opacity)) {
      container.style.opacity = opacity === 1 ? '' : String(opacity);
    }

    if (this.renderedRotation_ !== viewState.rotation) {
      this.renderedRotation_ = viewState.rotation;
      this.hitDetectionImageData_ = null;
    }
    return this.container;
  }

  /**
   * Asynchronous layer level hit detection.
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @return {Promise<Array<import("../../Feature").default>>} Promise that resolves with an array of features.
   */
  getFeatures(pixel) {
    return new Promise(
      function (resolve, reject) {
        if (!this.hitDetectionImageData_ && !this.animatingOrInteracting_) {
          const size = [this.context.canvas.width, this.context.canvas.height];
          apply(this.pixelTransform, size);
          const center = this.renderedCenter_;
          const resolution = this.renderedResolution_;
          const rotation = this.renderedRotation_;
          const projection = this.renderedProjection_;
          const extent = this.renderedExtent_;
          const layer = this.getLayer();
          const transforms = [];
          const width = size[0] / 2;
          const height = size[1] / 2;
          transforms.push(
            this.getRenderTransform(
              center,
              resolution,
              rotation,
              0.5,
              width,
              height,
              0
            ).slice()
          );
          const source = layer.getSource();
          const projectionExtent = projection.getExtent();
          if (
            source.getWrapX() &&
            projection.canWrapX() &&
            !containsExtent(projectionExtent, extent)
          ) {
            let startX = extent[0];
            const worldWidth = getWidth(projectionExtent);
            let world = 0;
            let offsetX;
            while (startX < projectionExtent[0]) {
              --world;
              offsetX = worldWidth * world;
              transforms.push(
                this.getRenderTransform(
                  center,
                  resolution,
                  rotation,
                  0.5,
                  width,
                  height,
                  offsetX
                ).slice()
              );
              startX += worldWidth;
            }
            world = 0;
            startX = extent[2];
            while (startX > projectionExtent[2]) {
              ++world;
              offsetX = worldWidth * world;
              transforms.push(
                this.getRenderTransform(
                  center,
                  resolution,
                  rotation,
                  0.5,
                  width,
                  height,
                  offsetX
                ).slice()
              );
              startX -= worldWidth;
            }
          }

          this.hitDetectionImageData_ = createHitDetectionImageData(
            size,
            transforms,
            this.renderedFeatures_,
            layer.getStyleFunction(),
            extent,
            resolution,
            rotation
          );
        }
        resolve(
          hitDetect(pixel, this.renderedFeatures_, this.hitDetectionImageData_)
        );
      }.bind(this)
    );
  }

  /**
   * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {function(import("../../Feature.js").FeatureLike, import("../../layer/Layer.js").default): T} callback Feature callback.
   * @param {Array<import("../../Feature.js").FeatureLike>} declutteredFeatures Decluttered features.
   * @return {T|void} Callback result.
   * @template T
   */
  forEachFeatureAtCoordinate(
    coordinate,
    frameState,
    hitTolerance,
    callback,
    declutteredFeatures
  ) {
    if (!this.replayGroup_) {
      return undefined;
    } else {
      const resolution = frameState.viewState.resolution;
      const rotation = frameState.viewState.rotation;
      const layer = this.getLayer();
      /** @type {!Object<string, boolean>} */
      const features = {};

      const result = this.replayGroup_.forEachFeatureAtCoordinate(
        coordinate,
        resolution,
        rotation,
        hitTolerance,
        /**
         * @param {import("../../Feature.js").FeatureLike} feature Feature.
         * @return {?} Callback result.
         */
        function (feature) {
          const key = getUid(feature);
          if (!(key in features)) {
            features[key] = true;
            return callback(feature, layer);
          }
        },
        layer.getDeclutter() ? declutteredFeatures : null
      );

      return result;
    }
  }

  /**
   * Perform action necessary to get the layer rendered after new fonts have loaded
   */
  handleFontsChanged() {
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
   * Determine whether render should be called.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   */
  prepareFrame(frameState) {
    const vectorLayer = this.getLayer();
    const vectorSource = vectorLayer.getSource();
    if (!vectorSource) {
      return false;
    }

    const animating = frameState.viewHints[ViewHint.ANIMATING];
    const interacting = frameState.viewHints[ViewHint.INTERACTING];
    const updateWhileAnimating = vectorLayer.getUpdateWhileAnimating();
    const updateWhileInteracting = vectorLayer.getUpdateWhileInteracting();

    if (
      (!this.dirty_ && !updateWhileAnimating && animating) ||
      (!updateWhileInteracting && interacting)
    ) {
      this.animatingOrInteracting_ = true;
      return true;
    }
    this.animatingOrInteracting_ = false;

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

    const center = viewState.center.slice();
    const extent = buffer(
      frameStateExtent,
      vectorLayerRenderBuffer * resolution
    );
    const loadExtents = [extent.slice()];
    const projectionExtent = projection.getExtent();

    if (
      vectorSource.getWrapX() &&
      projection.canWrapX() &&
      !containsExtent(projectionExtent, frameState.extent)
    ) {
      // For the replay group, we need an extent that intersects the real world
      // (-180° to +180°). To support geometries in a coordinate range from -540°
      // to +540°, we add at least 1 world width on each side of the projection
      // extent. If the viewport is wider than the world, we need to add half of
      // the viewport width to make sure we cover the whole viewport.
      const worldWidth = getWidth(projectionExtent);
      const gutter = Math.max(getWidth(extent) / 2, worldWidth);
      extent[0] = projectionExtent[0] - gutter;
      extent[2] = projectionExtent[2] + gutter;
      wrapCoordinateX(center, projection);
      const loadExtent = wrapExtentX(loadExtents[0], projection);
      // If the extent crosses the date line, we load data for both edges of the worlds
      if (
        loadExtent[0] < projectionExtent[0] &&
        loadExtent[2] < projectionExtent[2]
      ) {
        loadExtents.push([
          loadExtent[0] + worldWidth,
          loadExtent[1],
          loadExtent[2] + worldWidth,
          loadExtent[3],
        ]);
      } else if (
        loadExtent[0] > projectionExtent[0] &&
        loadExtent[2] > projectionExtent[2]
      ) {
        loadExtents.push([
          loadExtent[0] - worldWidth,
          loadExtent[1],
          loadExtent[2] - worldWidth,
          loadExtent[3],
        ]);
      }
    }

    if (
      !this.dirty_ &&
      this.renderedResolution_ == resolution &&
      this.renderedRevision_ == vectorLayerRevision &&
      this.renderedRenderOrder_ == vectorLayerRenderOrder &&
      containsExtent(this.renderedExtent_, extent)
    ) {
      this.replayGroupChanged = false;
      return true;
    }

    this.replayGroup_ = null;

    this.dirty_ = false;

    const replayGroup = new CanvasBuilderGroup(
      getRenderTolerance(resolution, pixelRatio),
      extent,
      resolution,
      pixelRatio,
      vectorLayer.getDeclutter()
    );

    const userProjection = getUserProjection();
    let userTransform;
    if (userProjection) {
      for (let i = 0, ii = loadExtents.length; i < ii; ++i) {
        vectorSource.loadFeatures(
          toUserExtent(loadExtents[i], projection),
          resolution,
          userProjection
        );
      }
      userTransform = getTransformFromProjections(userProjection, projection);
    } else {
      for (let i = 0, ii = loadExtents.length; i < ii; ++i) {
        vectorSource.loadFeatures(loadExtents[i], resolution, projection);
      }
    }

    const squaredTolerance = getSquaredRenderTolerance(resolution, pixelRatio);

    /**
     * @param {import("../../Feature.js").default} feature Feature.
     * @this {CanvasVectorLayerRenderer}
     */
    const render = function (feature) {
      let styles;
      const styleFunction =
        feature.getStyleFunction() || vectorLayer.getStyleFunction();
      if (styleFunction) {
        styles = styleFunction(feature, resolution);
      }
      if (styles) {
        const dirty = this.renderFeature(
          feature,
          squaredTolerance,
          styles,
          replayGroup,
          userTransform
        );
        this.dirty_ = this.dirty_ || dirty;
      }
    }.bind(this);

    const userExtent = toUserExtent(extent, projection);
    /** @type {Array<import("../../Feature.js").default>} */
    const features = vectorSource.getFeaturesInExtent(userExtent);
    if (vectorLayerRenderOrder) {
      features.sort(vectorLayerRenderOrder);
    }
    for (let i = 0, ii = features.length; i < ii; ++i) {
      render(features[i]);
    }
    this.renderedFeatures_ = features;

    const replayGroupInstructions = replayGroup.finish();
    const executorGroup = new ExecutorGroup(
      extent,
      resolution,
      pixelRatio,
      vectorSource.getOverlaps(),
      replayGroupInstructions,
      vectorLayer.getRenderBuffer()
    );

    this.renderedResolution_ = resolution;
    this.renderedRevision_ = vectorLayerRevision;
    this.renderedRenderOrder_ = vectorLayerRenderOrder;
    this.renderedExtent_ = extent;
    this.renderedCenter_ = center;
    this.renderedProjection_ = projection;
    this.replayGroup_ = executorGroup;
    this.hitDetectionImageData_ = null;

    this.replayGroupChanged = true;
    return true;
  }

  /**
   * @param {import("../../Feature.js").default} feature Feature.
   * @param {number} squaredTolerance Squared render tolerance.
   * @param {import("../../style/Style.js").default|Array<import("../../style/Style.js").default>} styles The style or array of styles.
   * @param {import("../../render/canvas/BuilderGroup.js").default} builderGroup Builder group.
   * @param {import("../../proj.js").TransformFunction=} opt_transform Transform from user to view projection.
   * @return {boolean} `true` if an image is loading.
   */
  renderFeature(
    feature,
    squaredTolerance,
    styles,
    builderGroup,
    opt_transform
  ) {
    if (!styles) {
      return false;
    }
    let loading = false;
    if (Array.isArray(styles)) {
      for (let i = 0, ii = styles.length; i < ii; ++i) {
        loading =
          renderFeature(
            builderGroup,
            feature,
            styles[i],
            squaredTolerance,
            this.boundHandleStyleImageChange_,
            opt_transform
          ) || loading;
      }
    } else {
      loading = renderFeature(
        builderGroup,
        feature,
        styles,
        squaredTolerance,
        this.boundHandleStyleImageChange_,
        opt_transform
      );
    }
    return loading;
  }
}

export default CanvasVectorLayerRenderer;
