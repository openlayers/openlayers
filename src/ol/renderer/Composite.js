/**
 * @module ol/renderer/canvas/Map
 */
import {apply as applyTransform} from '../transform.js';
import {stableSort} from '../array.js';
import {CLASS_UNSELECTABLE} from '../css.js';
import {visibleAtResolution} from '../layer/Layer.js';
import RenderEvent from '../render/Event.js';
import RenderEventType from '../render/EventType.js';
import MapRenderer, {sortByZIndex} from './Map.js';
import SourceState from '../source/State.js';
import {replaceChildren} from '../dom.js';


/**
 * @classdesc
 * Canvas map renderer.
 * @api
 */
class CompositeMapRenderer extends MapRenderer {

  /**
   * @param {import("../PluggableMap.js").default} map Map.
   */
  constructor(map) {
    super(map);

    /**
     * @private
     * @type {HTMLDivElement}
     */
    this.element_ = document.createElement('div');
    const style = this.element_.style;
    style.width = '100%';
    style.height = '100%';

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
   * @param {import("../PluggableMap.js").FrameState} frameState Frame state.
   */
  dispatchRenderEvent(type, frameState) {
    const map = this.getMap();
    if (map.hasListener(type)) {
      const event = new RenderEvent(type, undefined, frameState);
      map.dispatchEvent(event);
    }
  }

  /**
   * @inheritDoc
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

    const layerStatesArray = frameState.layerStatesArray;
    stableSort(layerStatesArray, sortByZIndex);

    const viewResolution = frameState.viewState.resolution;

    this.children_.length = 0;
    for (let i = 0, ii = layerStatesArray.length; i < ii; ++i) {
      const layerState = layerStatesArray[i];
      if (!visibleAtResolution(layerState, viewResolution) || layerState.sourceState != SourceState.READY) {
        continue;
      }

      const layer = layerState.layer;
      this.children_.push(layer.render(frameState));
    }

    replaceChildren(this.element_, this.children_);

    this.dispatchRenderEvent(RenderEventType.POSTCOMPOSE, frameState);

    if (!this.renderedVisible_) {
      this.element_.style.display = '';
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

    for (let i = numLayers - 1; i >= 0; --i) {
      const layerState = layerStates[i];
      const layer = layerState.layer;
      if (visibleAtResolution(layerState, viewResolution) && layerFilter.call(thisArg2, layer)) {
        const layerRenderer = this.getLayerRenderer(layer);
        if (!layerRenderer) {
          continue;
        }
        result = layerRenderer.forEachLayerAtCoordinate(coordinate, frameState, hitTolerance, callback, thisArg);
        if (result) {
          return result;
        }
      }
    }
    return undefined;
  }

}


export default CompositeMapRenderer;
