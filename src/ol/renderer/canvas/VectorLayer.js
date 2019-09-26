/**
 * @module ol/renderer/canvas/VectorLayer
 */
import {getUid} from '../../util.js';
import ViewHint from '../../ViewHint.js';
import {buffer, createEmpty, containsExtent, getWidth, intersects as intersectsExtent} from '../../extent.js';
import {fromUserExtent, toUserExtent, getUserProjection, getTransformFromProjections} from '../../proj.js';
import CanvasBuilderGroup from '../../render/canvas/BuilderGroup.js';
import ExecutorGroup, {replayDeclutter} from '../../render/canvas/ExecutorGroup.js';
import CanvasLayerRenderer from './Layer.js';
import {defaultOrder as defaultRenderOrder, getTolerance as getRenderTolerance, getSquaredTolerance as getSquaredRenderTolerance, renderFeature} from '../vector.js';
import {toString as transformToString, makeScale, makeInverse, apply} from '../../transform.js';
import {createCanvasContext2D} from '../../dom.js';
import CanvasImmediateRenderer from '../../render/canvas/Immediate.js';
import {Icon} from '../../style.js';
import IconAnchorUnits from '../../style/IconAnchorUnits.js';
import GeometryType from '../../geom/GeometryType.js';
import {numberSafeCompareFunction} from '../../array.js';

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
  }

  /**
   * @inheritDoc
   */
  useContainer(target, transform, opacity) {
    if (opacity < 1) {
      target = null;
    }
    super.useContainer(target, transform, opacity);
  }

  /**
   * @inheritDoc
   */
  renderFrame(frameState, target) {

    const pixelRatio = frameState.pixelRatio;
    const layerState = frameState.layerStatesArray[frameState.layerIndex];

    // set forward and inverse pixel transforms
    makeScale(this.pixelTransform, 1 / pixelRatio, 1 / pixelRatio);
    makeInverse(this.inversePixelTransform, this.pixelTransform);

    this.useContainer(target, this.pixelTransform, layerState.opacity);
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
      const canvasTransform = transformToString(this.pixelTransform);
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
    if (layerState.extent) {
      const layerExtent = fromUserExtent(layerState.extent, projection);
      clipped = !containsExtent(layerExtent, frameState.extent) && intersectsExtent(layerExtent, frameState.extent);
      if (clipped) {
        this.clip(context, frameState, layerExtent);
      }
    }


    const viewHints = frameState.viewHints;
    const snapToPixel = !(viewHints[ViewHint.ANIMATING] || viewHints[ViewHint.INTERACTING]);

    const transform = this.getRenderTransform(center, resolution, rotation, pixelRatio, width, height, 0);
    const declutterReplays = this.getLayer().getDeclutter() ? {} : null;
    replayGroup.execute(context, transform, rotation, snapToPixel, undefined, declutterReplays);

    if (vectorSource.getWrapX() && projection.canWrapX() && !containsExtent(projectionExtent, extent)) {
      let startX = extent[0];
      const worldWidth = getWidth(projectionExtent);
      let world = 0;
      let offsetX;
      while (startX < projectionExtent[0]) {
        --world;
        offsetX = worldWidth * world;
        const transform = this.getRenderTransform(center, resolution, rotation, pixelRatio, width, height, offsetX);
        replayGroup.execute(context, transform, rotation, snapToPixel, undefined, declutterReplays);
        startX += worldWidth;
      }
      world = 0;
      startX = extent[2];
      while (startX > projectionExtent[2]) {
        ++world;
        offsetX = worldWidth * world;
        const transform = this.getRenderTransform(center, resolution, rotation, pixelRatio, width, height, offsetX);
        replayGroup.execute(context, transform, rotation, snapToPixel, undefined, declutterReplays);
        startX -= worldWidth;
      }
    }
    if (declutterReplays) {
      const viewHints = frameState.viewHints;
      const hifi = !(viewHints[ViewHint.ANIMATING] || viewHints[ViewHint.INTERACTING]);
      replayDeclutter(declutterReplays, context, rotation, 1, hifi, frameState.declutterItems);
    }

    if (clipped) {
      context.restore();
    }

    this.postRender(context, frameState);

    const opacity = layerState.opacity;
    const container = this.container;
    if (opacity !== parseFloat(container.style.opacity)) {
      container.style.opacity = opacity === 1 ? '' : opacity;
    }

    return this.container;
  }

  /**
   * @private
   */
  createHitDetectionImageData_() {
    const features = this.renderedFeatures_;
    const layer = this.getLayer();
    const resolution = this.renderedResolution_;
    const size = [this.context.canvas.width, this.context.canvas.height];
    apply(this.pixelTransform, size);
    const width = size[0] / 2;
    const height = size[1] / 2;
    const context = createCanvasContext2D(width, height);
    context.imageSmoothingEnabled = false;
    const canvas = context.canvas;
    const styleFunction = layer.getStyleFunction();
    const center = this.renderedCenter_;
    const rotation = this.renderedRotation_;
    const projection = this.renderedProjection_;
    const extent = this.renderedExtent_;
    const transforms = [];
    transforms.push(this.getRenderTransform(center, resolution, rotation, 0.5, width, height, 0).slice());
    const source = layer.getSource();
    const projectionExtent = projection.getExtent();
    if (source.getWrapX() && projection.canWrapX() && !containsExtent(projectionExtent, extent)) {
      let startX = extent[0];
      const worldWidth = getWidth(projectionExtent);
      let world = 0;
      let offsetX;
      while (startX < projectionExtent[0]) {
        --world;
        offsetX = worldWidth * world;
        transforms.push(this.getRenderTransform(center, resolution, rotation, 0.5, width, height, offsetX).slice());
        startX += worldWidth;
      }
      world = 0;
      startX = extent[2];
      while (startX > projectionExtent[2]) {
        ++world;
        offsetX = worldWidth * world;
        transforms.push(this.getRenderTransform(center, resolution, rotation, 0.5, width, height, offsetX).slice());
        startX -= worldWidth;
      }
    }
    const renderer = new CanvasImmediateRenderer(context, 0.5, extent, null, rotation);
    const featureCount = features.length;
    // Stretch hit detection index to use the whole available color range
    const indexFactor = Math.ceil((256 * 256 * 256) / featureCount);
    const featuresByZIndex = {};
    for (let i = 0; i < featureCount; ++i) {
      const feature = features[i];
      const featureStyleFunction = feature.getStyleFunction() || styleFunction;
      let styles = featureStyleFunction(feature, resolution);
      if (!Array.isArray(styles)) {
        styles = [styles];
      }
      const index = i * indexFactor;
      const color = '#' + ('000000' + index.toString(16)).slice(-6);
      for (let j = 0, jj = styles.length; j < jj; ++j) {
        const originalStyle = styles[j];
        const style = originalStyle.clone();
        const fill = style.getFill();
        if (fill) {
          fill.setColor(color);
        }
        const stroke = style.getStroke();
        if (stroke) {
          stroke.setColor(color);
        }
        style.setText(undefined);
        const image = originalStyle.getImage();
        if (image) {
          const imgSize = image.getImageSize();
          const imgContext = createCanvasContext2D(imgSize[0], imgSize[1]);
          imgContext.fillStyle = color;
          const img = imgContext.canvas;
          imgContext.fillRect(0, 0, img.width, img.height);
          const width = imgSize ? imgSize[0] : img.width;
          const height = imgSize ? imgSize[1] : img.height;
          const iconContext = createCanvasContext2D(width, height);
          iconContext.drawImage(img, 0, 0);
          style.setImage(new Icon({
            img: img,
            imgSize: imgSize,
            anchor: image.getAnchor(),
            anchorXUnits: IconAnchorUnits.PIXELS,
            anchorYUnits: IconAnchorUnits.PIXELS,
            offset: image.getOrigin(),
            size: image.getSize(),
            opacity: image.getOpacity(),
            scale: image.getScale(),
            rotation: image.getRotation(),
            rotateWithView: image.getRotateWithView()
          }));
        }
        const zIndex = Number(style.getZIndex());
        let byGeometryType = featuresByZIndex[zIndex];
        if (!byGeometryType) {
          byGeometryType = featuresByZIndex[zIndex] = {};
          byGeometryType[GeometryType.POLYGON] = [];
          byGeometryType[GeometryType.CIRCLE] = [];
          byGeometryType[GeometryType.LINE_STRING] = [];
          byGeometryType[GeometryType.POINT] = [];
        }
        const geometry = style.getGeometryFunction()(feature);
        if (geometry && intersectsExtent(extent, geometry.getExtent())) {
          byGeometryType[geometry.getType().replace('Multi', '')].push(geometry, style);
        }
      }
    }

    const zIndexKeys = Object.keys(featuresByZIndex).map(Number).sort(numberSafeCompareFunction);
    for (let i = 0, ii = zIndexKeys.length; i < ii; ++i) {
      const byGeometryType = featuresByZIndex[zIndexKeys[i]];
      for (const type in byGeometryType) {
        const geomAndStyle = byGeometryType[type];
        for (let j = 0, jj = geomAndStyle.length; j < jj; j += 2) {
          renderer.setStyle(geomAndStyle[j + 1]);
          for (let k = 0, kk = transforms.length; k < kk; ++k) {
            renderer.setTransform(transforms[k]);
            renderer.drawGeometry(geomAndStyle[j]);
          }
        }
      }
    }
    this.hitDetectionImageData_ = context.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * @param {import("../../pixel").Pixel} pixel Pixel.
   * @return {Array<import("../../Feature").default>} features Features.
   */
  hitDetect_(pixel) {
    const renderPixel = apply(this.pixelTransform, pixel.slice());
    const features = this.renderedFeatures_;
    const imageData = this.hitDetectionImageData_;
    const resultFeatures = [];
    if (imageData) {
      const index = (Math.round(renderPixel[0]) + Math.round(renderPixel[1]) * imageData.width) * 4;
      const r = imageData.data[index];
      const g = imageData.data[index + 1];
      const b = imageData.data[index + 2];
      const a = imageData.data[index + 3];
      if (a === 255) {
        const i = b + (256 * (g + (256 * r)));
        const indexFactor = Math.ceil((256 * 256 * 256) / features.length);
        if (i % indexFactor === 0) {
          resultFeatures.push(features[i / indexFactor]);
        }
      }
    }
    return resultFeatures;
  }

  /**
   * @inheritDoc
   */
  getFeatures(pixel) {
    return new Promise(function(resolve, reject) {
      if (!this.hitDetectionImageData_ && !this.animatingOrInteracting_) {
        requestAnimationFrame(function() {
          this.createHitDetectionImageData_();
          resolve(this.hitDetect_(pixel));
        }.bind(this));
      } else {
        resolve(this.hitDetect_(pixel));
      }
    }.bind(this));
  }

  /**
   * @inheritDoc
   */
  forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback, declutteredFeatures) {
    if (!this.replayGroup_) {
      return undefined;
    } else {
      const resolution = frameState.viewState.resolution;
      const rotation = frameState.viewState.rotation;
      const layer = this.getLayer();
      /** @type {!Object<string, boolean>} */
      const features = {};

      const result = this.replayGroup_.forEachFeatureAtCoordinate(coordinate, resolution, rotation, hitTolerance,
        /**
         * @param {import("../../Feature.js").FeatureLike} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          const key = getUid(feature);
          if (!(key in features)) {
            features[key] = true;
            return callback(feature, layer);
          }
        }, layer.getDeclutter() ? declutteredFeatures : null);

      return result;
    }
  }

  /**
   * @inheritDoc
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
   * @inheritDoc
   */
  prepareFrame(frameState) {
    const vectorLayer = this.getLayer();
    const vectorSource = vectorLayer.getSource();

    const animating = frameState.viewHints[ViewHint.ANIMATING];
    const interacting = frameState.viewHints[ViewHint.INTERACTING];
    const updateWhileAnimating = vectorLayer.getUpdateWhileAnimating();
    const updateWhileInteracting = vectorLayer.getUpdateWhileInteracting();

    if (!this.dirty_ && (!updateWhileAnimating && animating) ||
        (!updateWhileInteracting && interacting)) {
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
      const worldsAway = Math.floor((center[0] - projectionExtent[0]) / worldWidth);
      center[0] -= (worldsAway * worldWidth);
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
      pixelRatio, vectorLayer.getDeclutter());

    const userProjection = getUserProjection();
    let userTransform;
    if (userProjection) {
      vectorSource.loadFeatures(toUserExtent(extent, projection), resolution, userProjection);
      userTransform = getTransformFromProjections(userProjection, projection);
    } else {
      vectorSource.loadFeatures(extent, resolution, projection);
    }

    const squaredTolerance = getSquaredRenderTolerance(resolution, pixelRatio);

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
        const dirty = this.renderFeature(feature, squaredTolerance, styles, replayGroup, userTransform);
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
    const executorGroup = new ExecutorGroup(extent, resolution,
      pixelRatio, vectorSource.getOverlaps(),
      replayGroupInstructions, vectorLayer.getRenderBuffer());

    this.renderedResolution_ = resolution;
    this.renderedRevision_ = vectorLayerRevision;
    this.renderedRenderOrder_ = vectorLayerRenderOrder;
    this.renderedExtent_ = extent;
    this.renderedRotation_ = viewState.rotation;
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
   * @param {import("../../proj.js").TransformFunction} opt_transform Transform from user to view projection.
   * @return {boolean} `true` if an image is loading.
   */
  renderFeature(feature, squaredTolerance, styles, builderGroup, opt_transform) {
    if (!styles) {
      return false;
    }
    let loading = false;
    if (Array.isArray(styles)) {
      for (let i = 0, ii = styles.length; i < ii; ++i) {
        loading = renderFeature(
          builderGroup, feature, styles[i], squaredTolerance,
          this.boundHandleStyleImageChange_, opt_transform) || loading;
      }
    } else {
      loading = renderFeature(
        builderGroup, feature, styles, squaredTolerance,
        this.boundHandleStyleImageChange_, opt_transform);
    }
    return loading;
  }
}


export default CanvasVectorLayerRenderer;
