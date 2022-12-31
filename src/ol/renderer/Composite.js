/**
 * @module ol/renderer/Composite
 */
import MapRenderer from './Map.js';
import ObjectEventType from '../ObjectEventType.js';
import RenderEvent from '../render/Event.js';
import RenderEventType from '../render/EventType.js';
import {CLASS_UNSELECTABLE} from '../css.js';
import {checkedFonts} from '../render/canvas.js';
import {inView} from '../layer/Layer.js';
import {listen, unlistenByKey} from '../events.js';
import {replaceChildren} from '../dom.js';

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
     * @type {import("../events.js").EventsKey}
     */
    this.fontChangeListenerKey_ = listen(
      checkedFonts,
      ObjectEventType.PROPERTYCHANGE,
      map.redrawText.bind(map)
    );

    /**
     * @private
     * @type {HTMLDivElement}
     */
    this.element_ = document.createElement('div');
    const style = this.element_.style;
    style.position = 'absolute';
    style.width = '100%';
    style.height = '100%';
    style.zIndex = '0';

    this.element_.className = CLASS_UNSELECTABLE + ' ol-layers';

    const container = map.getViewport();
    container.insertBefore(this.element_, container.firstChild || null);

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
   */
  dispatchRenderEvent(type, frameState) {
    const map = this.getMap();
    if (map.hasListener(type)) {
      const event = new RenderEvent(type, undefined, frameState);
      map.dispatchEvent(event);
    }
  }

  disposeInternal() {
    unlistenByKey(this.fontChangeListenerKey_);
    this.element_.parentNode.removeChild(this.element_);
    super.disposeInternal();
  }

  /**
   * Render.
   * @param {?import("../Map.js").FrameState} frameState Frame state.
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

    const layerStatesArray = frameState.layerStatesArray.sort(function (a, b) {
      return a.zIndex - b.zIndex;
    });
    const viewState = frameState.viewState;

    this.children_.length = 0;
    /**
     * @type {Array<import("../layer/BaseVector.js").default>}
     */
    const declutterLayers = [];
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
      if ('getDeclutter' in layer) {
        declutterLayers.push(
          /** @type {import("../layer/BaseVector.js").default} */ (layer)
        );
      }
    }
    /** @type {Array<Array<{0: import('../render/canvas/Executor.js').default, 1: Array<import('../render/canvas/Executor.js').ReplayImageOrLabelArgs>}>>} */
    const layerImageOrLabelArgs = [];
    for (let i = declutterLayers.length - 1; i >= 0; --i) {
      const imageOrLabelArgs = [];
      declutterLayers[i].renderDeclutter(frameState, imageOrLabelArgs);
      layerImageOrLabelArgs.push(imageOrLabelArgs);
    }
    for (let l = layerImageOrLabelArgs.length - 1; l >= 0; --l) {
      const imageOrLabelArgs = layerImageOrLabelArgs[l];
      for (let i = 0, ii = imageOrLabelArgs.length; i < ii; ++i) {
        const arg = imageOrLabelArgs[i];
        arg[1].forEach((args) => arg[0].replayImageOrLabel.apply(arg[0], args));
      }
    }

    replaceChildren(this.element_, this.children_);

    this.dispatchRenderEvent(RenderEventType.POSTCOMPOSE, frameState);

    if (!this.renderedVisible_) {
      this.element_.style.display = '';
      this.renderedVisible_ = true;
    }

    this.scheduleExpireIconCache(frameState);
  }
}

export default CompositeMapRenderer;
