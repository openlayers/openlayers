/**
 * @module ol/renderer/canvas/Map
 */
import {create as createTransform, apply as applyTransform, compose as composeTransform} from '../../transform.js';
import {includes, stableSort} from '../../array.js';
import {CLASS_UNSELECTABLE} from '../../css.js';
import {createCanvasContext2D} from '../../dom.js';
import {visibleAtResolution} from '../../layer/Layer.js';
import RenderEvent from '../../render/Event.js';
import RenderEventType from '../../render/EventType.js';
import {rotateAtOffset} from '../../render/canvas.js';
import CanvasImmediateRenderer from '../../render/canvas/Immediate.js';
import MapRenderer, {sortByZIndex} from '../Map.js';
import SourceState from '../../source/State.js';


/**
 * @type {Array<typeof import("../Layer.js").default>}
 */
export const layerRendererConstructors = [];

/**
 * @classdesc
 * Canvas map renderer.
 * @api
 */
class CanvasMapRenderer extends MapRenderer {

  /**
   * @param {import("../../PluggableMap.js").default} map Map.
   */
  constructor(map) {
    super(map);

    const container = map.getViewport();

    /**
     * @private
     * @type {CanvasRenderingContext2D}
     */
    this.context_ = createCanvasContext2D();

    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.canvas_ = this.context_.canvas;

    this.canvas_.style.width = '100%';
    this.canvas_.style.height = '100%';
    this.canvas_.style.display = 'block';
    this.canvas_.className = CLASS_UNSELECTABLE;
    container.insertBefore(this.canvas_, container.childNodes[0] || null);

    /**
     * @private
     * @type {boolean}
     */
    this.renderedVisible_ = true;

    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.transform_ = createTransform();

  }

  /**
   * @param {import("../../render/EventType.js").default} type Event type.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   */
  dispatchRenderEvent(type, frameState) {
    const map = this.getMap();
    const context = this.context_;
    if (map.hasListener(type)) {
      const extent = frameState.extent;
      const pixelRatio = frameState.pixelRatio;
      const viewState = frameState.viewState;
      const rotation = viewState.rotation;

      const transform = this.getTransform(frameState);

      const vectorContext = new CanvasImmediateRenderer(context, pixelRatio,
        extent, transform, rotation);
      const composeEvent = new RenderEvent(type, vectorContext,
        frameState, context, null);
      map.dispatchEvent(composeEvent);
    }
  }

  /**
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @protected
   * @return {!import("../../transform.js").Transform} Transform.
   */
  getTransform(frameState) {
    const viewState = frameState.viewState;
    const dx1 = this.canvas_.width / 2;
    const dy1 = this.canvas_.height / 2;
    const sx = frameState.pixelRatio / viewState.resolution;
    const sy = -sx;
    const angle = -viewState.rotation;
    const dx2 = -viewState.center[0];
    const dy2 = -viewState.center[1];
    return composeTransform(this.transform_, dx1, dy1, sx, sy, angle, dx2, dy2);
  }

  /**
   * @inheritDoc
   */
  renderFrame(frameState) {

    if (!frameState) {
      if (this.renderedVisible_) {
        this.canvas_.style.display = 'none';
        this.renderedVisible_ = false;
      }
      return;
    }

    const context = this.context_;
    const pixelRatio = frameState.pixelRatio;
    const width = Math.round(frameState.size[0] * pixelRatio);
    const height = Math.round(frameState.size[1] * pixelRatio);
    if (this.canvas_.width != width || this.canvas_.height != height) {
      this.canvas_.width = width;
      this.canvas_.height = height;
    } else {
      context.clearRect(0, 0, width, height);
    }

    const rotation = frameState.viewState.rotation;

    this.calculateMatrices2D(frameState);

    this.dispatchRenderEvent(RenderEventType.PRECOMPOSE, frameState);

    const layerStatesArray = frameState.layerStatesArray;
    stableSort(layerStatesArray, sortByZIndex);

    if (rotation) {
      context.save();
      rotateAtOffset(context, rotation, width / 2, height / 2);
    }

    const viewResolution = frameState.viewState.resolution;
    let i, ii;
    for (i = 0, ii = layerStatesArray.length; i < ii; ++i) {
      const layerState = layerStatesArray[i];
      const layer = layerState.layer;
      const layerRenderer = /** @type {import("./Layer.js").default} */ (this.getLayerRenderer(layer));
      if (!visibleAtResolution(layerState, viewResolution) ||
          layerState.sourceState != SourceState.READY) {
        continue;
      }
      if (layerRenderer.prepareFrame(frameState, layerState)) {
        layerRenderer.composeFrame(frameState, layerState, context);
      }
    }

    if (rotation) {
      context.restore();
    }

    this.dispatchRenderEvent(RenderEventType.POSTCOMPOSE, frameState);

    if (!this.renderedVisible_) {
      this.canvas_.style.display = '';
      this.renderedVisible_ = true;
    }

    this.scheduleRemoveUnusedLayerRenderers(frameState);
    this.scheduleExpireIconCache(frameState);
  }

  /**
   * @inheritDoc
   */
  forEachLayerAtPixel(pixel, frameState, hitTolerance, callback, thisArg, layerFilter, thisArg2) {
    let result;
    const viewState = frameState.viewState;
    const viewResolution = viewState.resolution;

    const layerStates = frameState.layerStatesArray;
    const numLayers = layerStates.length;

    const coordinate = applyTransform(
      frameState.pixelToCoordinateTransform, pixel.slice());

    let i;
    for (i = numLayers - 1; i >= 0; --i) {
      const layerState = layerStates[i];
      const layer = layerState.layer;
      if (visibleAtResolution(layerState, viewResolution) && layerFilter.call(thisArg2, layer)) {
        const layerRenderer = /** @type {import("./Layer.js").default} */ (this.getLayerRenderer(layer));
        result = layerRenderer.forEachLayerAtCoordinate(
          coordinate, frameState, hitTolerance, callback, thisArg);
        if (result) {
          return result;
        }
      }
    }
    return undefined;
  }

  /**
   * @inheritDoc
   */
  registerLayerRenderers(constructors) {
    super.registerLayerRenderers(constructors);
    for (let i = 0, ii = constructors.length; i < ii; ++i) {
      const ctor = constructors[i];
      if (!includes(layerRendererConstructors, ctor)) {
        layerRendererConstructors.push(ctor);
      }
    }
  }
}


export default CanvasMapRenderer;
