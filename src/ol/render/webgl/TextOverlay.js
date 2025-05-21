/**
 * @module ol/render/webgl/TextOverlay
 */
import {createCanvasContext2D} from '../../dom.js';
import {expressionToFunction} from '../../expr/cpu.js';
import {BooleanType} from '../../expr/expression.js';
import {inView} from '../../layer/Layer.js';
import VectorLayer from '../../layer/Vector.js';
import VectorSource from '../../source/Vector.js';

class TextOverlay {
  /**
   * @param {Array<import('../../style/flat.js').Rule>} style Style rules
   */
  constructor(style) {
    /**
     * @private
     */
    this.vectorSource_ = new VectorSource({
      features: [],
    });

    this.textStyles_ = style
      .map((styleRule) => {
        const style = styleRule.style;
        const textStyle = Object.keys(style).reduce(
          (prev, key) =>
            key.startsWith('text-')
              ? {
                  ...prev,
                  [key]: style[key],
                }
              : prev,
          {},
        );
        return {
          ...styleRule,
          style: textStyle,
        };
      })
      .filter((styleRule) => Object.keys(styleRule.style).length > 0);

    const textStyleFilters = this.textStyles_.filter((style) => !!style.filter);
    let collectedFilters;
    if (textStyleFilters.length === 0) {
      collectedFilters = true;
    } else if (textStyleFilters.length === 1) {
      collectedFilters = textStyleFilters[0].filter;
    } else {
      collectedFilters = textStyleFilters.reduce(
        (prev, curr) => [...prev, curr.filter],
        ['any'],
      );
    }

    this.textFilterFn_ = expressionToFunction(collectedFilters, BooleanType);

    /**
     * @private
     */
    this.vectorLayer_ = new VectorLayer({
      source: this.vectorSource_,
      style: this.textStyles_,
      updateWhileInteracting: true,
      updateWhileAnimating: true,
      declutter: true,
    });

    /**
     * @private
     */
    this.context_ = createCanvasContext2D(1, 1);

    /**
     * @type {Object<string, Array<import("../../Feature.js").FeatureLike>>}
     * @private
     */
    this.featureBatches_ = {};

    /**
     * @type {Array<string>}
     * @private
     */
    this.batchesRendered_ = [];
  }

  loadFeatureBatch(features, batchId) {
    const filteredFeatures = features.filter(this.textFilterFn_);
    this.featureBatches_[batchId] = filteredFeatures;
  }

  unloadFeatureBatch(batchId) {
    this.vectorSource_.removeFeatures(this.featureBatches_[batchId]);
    this.batchesRendered_.splice(this.batchesRendered_.indexOf(batchId));
    delete this.featureBatches_[batchId];
  }

  /**
   * @param {?import("../../Map.js").FrameState} frameState Frame state.
   * @param {Array<string>} batchesToRender Batches to render
   */
  render(frameState, batchesToRender) {
    for (const batchId of batchesToRender) {
      if (this.batchesRendered_.includes(batchId)) {
        continue;
      }
      this.vectorSource_.addFeatures(this.featureBatches_[batchId]);
    }
    for (const oldBatchId of this.batchesRendered_) {
      if (batchesToRender.includes(oldBatchId)) {
        continue;
      }
      this.vectorSource_.removeFeatures(this.featureBatches_[oldBatchId]);
    }
    this.batchesRendered_ = [...batchesToRender];

    const renderer =
      /** @type {import('../../renderer/canvas/VectorLayer.js').default} */ (
        this.vectorLayer_.getRenderer()
      );

    function useContainer(context) {
      this.containerReused = false;
      this.canvas = context.canvas;
      this.context = context;
      this.container = {
        firstElementChild: context.canvas,
        style: {
          opacity: 1,
        },
      };
    }

    if (!frameState.declutter) {
      frameState.declutter = {};
    }
    frameState.layerIndex = 0;
    frameState.layerStatesArray = [this.vectorLayer_.getLayerState()];
    renderer.context = this.context_;
    renderer.useContainer = useContainer.bind(renderer, this.context_);
    const layerState = this.vectorLayer_.getLayerState();

    if (!inView(layerState, frameState.viewState)) {
      return;
    }
    if (!renderer.prepareFrame(frameState)) {
      return;
    }
    if (!frameState.declutter) {
      frameState.declutter = {};
    }
    renderer.renderFrame(frameState, this.context_.canvas);
    this.vectorLayer_.renderDeclutter(frameState, layerState);
    this.vectorLayer_.renderDeferred(frameState);
  }

  getCanvas() {
    return /** @type {OffscreenCanvas} */ (this.context_.canvas);
  }

  getLayer() {
    return this.vectorLayer_;
  }
}

export default TextOverlay;
