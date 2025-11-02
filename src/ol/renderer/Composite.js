/**
 * @module ol/renderer/Composite
 */
import ObjectEventType from '../ObjectEventType.js';
import {CLASS_UNSELECTABLE} from '../css.js';
import {createMockDiv, isCanvas, replaceChildren} from '../dom.js';
import {listen, unlistenByKey} from '../events.js';
import {WORKER_OFFSCREEN_CANVAS} from '../has.js';
import BaseVectorLayer from '../layer/BaseVector.js';
import {inView} from '../layer/Layer.js';
import RenderEvent from '../render/Event.js';
import RenderEventType from '../render/EventType.js';
import {checkedFonts} from '../render/canvas.js';
import {fromString} from '../transform.js';
import MapRenderer from './Map.js';

/**
 * @classdesc
 * Canvas map renderer.
 * @api
 */
class CompositeMapRenderer extends MapRenderer {
  /**
   * @param {import("../Map.js").default} map Map.
   */
  constructor(map) {
    super(map);

    /**
     * @private
     * @type {import("../events.js").EventsKey}
     */
    this.fontChangeListenerKey_ = listen(
      checkedFonts,
      ObjectEventType.PROPERTYCHANGE,
      map.redrawText,
      map,
    );

    /**
     * @private
     * @type {HTMLDivElement}
     */
    this.element_ = WORKER_OFFSCREEN_CANVAS
      ? createMockDiv()
      : document.createElement('div');
    const style = this.element_.style;
    style.position = 'absolute';
    style.width = '100%';
    style.height = '100%';
    style.zIndex = '0';

    this.element_.className = CLASS_UNSELECTABLE + ' ol-layers';

    const container = map.getViewport();
    if (container) {
      // maps in a worker do not have a viewport.
      container.insertBefore(this.element_, container.firstChild || null);
    }

    /**
     * @private
     * @type {Array<HTMLElement>}
     */
    this.children_ = [];

    /**
     * @private
     * @type {boolean}
     */
    this.renderedVisible_ = true;
  }

  /**
   * @param {import("../render/EventType.js").default} type Event type.
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @override
   */
  dispatchRenderEvent(type, frameState) {
    const map = this.getMap();
    if (map.hasListener(type)) {
      const event = new RenderEvent(type, undefined, frameState);
      map.dispatchEvent(event);
    }
  }

  /**
   * @override
   */
  disposeInternal() {
    unlistenByKey(this.fontChangeListenerKey_);
    this.element_.remove();
    super.disposeInternal();
  }

  /**
   * Render.
   * @param {?import("../Map.js").FrameState} frameState Frame state.
   * @override
   */
  renderFrame(frameState) {
    if (!frameState) {
      if (this.renderedVisible_) {
        this.element_.style.display = 'none';
        this.renderedVisible_ = false;
      }
      return;
    }

    this.calculateMatrices2D(frameState);
    this.dispatchRenderEvent(RenderEventType.PRECOMPOSE, frameState);

    const layerStatesArray = frameState.layerStatesArray.sort(
      (a, b) => a.zIndex - b.zIndex,
    );
    const declutter = layerStatesArray.some(
      (layerState) =>
        layerState.layer instanceof BaseVectorLayer &&
        layerState.layer.getDeclutter(),
    );
    if (declutter) {
      // Some layers need decluttering, turn on deferred rendering hint
      frameState.declutter = {};
    }
    const viewState = frameState.viewState;

    this.children_.length = 0;

    const renderedLayerStates = [];
    let previousElement = null;
    for (let i = 0, ii = layerStatesArray.length; i < ii; ++i) {
      const layerState = layerStatesArray[i];
      frameState.layerIndex = i;

      const layer = layerState.layer;
      const sourceState = layer.getSourceState();
      if (
        !inView(layerState, viewState) ||
        (sourceState != 'ready' && sourceState != 'undefined')
      ) {
        layer.unrender();
        continue;
      }

      const element = layer.render(frameState, previousElement);
      if (!element) {
        continue;
      }
      if (element !== previousElement) {
        this.children_.push(element);
        previousElement = element;
      }

      renderedLayerStates.push(layerState);
    }

    this.declutter(frameState, renderedLayerStates);

    replaceChildren(this.element_, this.children_);

    const map = this.getMap();
    const mapCanvas = map.getTargetElement();
    if (isCanvas(mapCanvas)) {
      // Canvas composition when container is a canvas
      const mapContext = mapCanvas.getContext('2d');
      for (const container of this.children_) {
        const canvas = container.firstElementChild || container;
        const backgroundColor = container.style.backgroundColor;
        if (backgroundColor && (!isCanvas(canvas) || canvas.width > 0)) {
          mapContext.fillStyle = backgroundColor;
          mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
        }
        if (isCanvas(canvas) && canvas.width > 0) {
          const opacity = container.style.opacity || canvas.style.opacity;
          mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
          const transform = canvas.style.transform;
          if (transform) {
            // Get the transform parameters from the style's transform matrix
            mapContext.setTransform(
              .../** @type {[number, number, number, number, number, number]} */ (
                fromString(transform)
              ),
            );
          } else {
            const w = parseFloat(canvas.style.width) / canvas.width;
            const h = parseFloat(canvas.style.height) / canvas.height;
            mapContext.setTransform(w, 0, 0, h, 0, 0);
          }
          mapContext.drawImage(canvas, 0, 0);
        }
      }
      mapContext.globalAlpha = 1;
      mapContext.setTransform(1, 0, 0, 1, 0, 0);
    }

    this.dispatchRenderEvent(RenderEventType.POSTCOMPOSE, frameState);

    if (!this.renderedVisible_) {
      this.element_.style.display = '';
      this.renderedVisible_ = true;
    }

    this.scheduleExpireIconCache(frameState);
  }

  /**
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @param {Array<import('../layer/Layer.js').State>} layerStates Layers.
   */
  declutter(frameState, layerStates) {
    if (!frameState.declutter) {
      return;
    }
    for (let i = layerStates.length - 1; i >= 0; --i) {
      const layerState = layerStates[i];
      const layer = layerState.layer;
      if (layer.getDeclutter()) {
        layer.renderDeclutter(frameState, layerState);
      }
    }
    layerStates.forEach((layerState) =>
      layerState.layer.renderDeferred(frameState),
    );
  }
}

export default CompositeMapRenderer;
