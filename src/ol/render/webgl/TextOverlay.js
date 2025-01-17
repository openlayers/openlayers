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
   * @param {import('../../webgl/Helper.js').default} helper Helper
   * @param {Array<import('../../style/flat.js').Rule>} style Style rules
   */
  constructor(helper, style) {
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
    // this.textStyleFn_ = rulesToStyleFunction(this.textStyles_);

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
    // console.log('collectedFilters', collectedFilters);

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
    // console.log(
    //   'filtered features',
    //   filteredFeatures.length,
    //   'left from',
    //   features.length,
    // );
    this.featureBatches_[batchId] = filteredFeatures;
    console.log(
      'loaded batch',
      batchId,
      'with features',
      filteredFeatures.length,
    );
  }

  unloadFeatureBatch(batchId) {
    this.vectorSource_.removeFeatures(this.featureBatches_[batchId]);
    this.batchesRendered_.splice(this.batchesRendered_.indexOf(batchId));
    // console.log(
    //   `unloaded ${this.featureBatches[batchId].length} features in text overlay`,
    // );
    delete this.featureBatches_[batchId];
    console.log('unloaded batch', batchId);
  }

  /**
   * @param {?import("../../Map.js").FrameState} frameState Frame state.
   * @param {Array<string>} batchesToRender Batches to render
   */
  render(frameState, batchesToRender) {
    // console.log(
    //   'rendering, new batches',
    //   batchesToRender,
    //   'old batches',
    //   this.batchesRendered_,
    // );
    for (const batchId of batchesToRender) {
      if (this.batchesRendered_.includes(batchId)) {
        continue;
      }
      this.vectorSource_.addFeatures(this.featureBatches_[batchId]);
      console.log('added features from batch', batchId);
    }
    for (const oldBatchId of this.batchesRendered_) {
      if (batchesToRender.includes(oldBatchId)) {
        continue;
      }
      this.vectorSource_.removeFeatures(this.featureBatches_[oldBatchId]);
      console.log('remove features from batch', oldBatchId);
    }
    this.batchesRendered_ = [...batchesToRender];
    // console.log(
    //   `rendering ${this.vectorSource_.getFeatures().length} features in text overlay`,
    // );

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

    // renderer.prepareFrame(frameState);
    // renderer.renderDeclutter(frameState);
    // renderer.renderDeferred(frameState);
    // renderer.renderFrame(frameState, this.context_.canvas);

    this.context_.strokeStyle = 'black';
    this.context_.lineWidth = 4;
    this.context_.strokeRect(
      4,
      4,
      this.context_.canvas.width - 8,
      this.context_.canvas.height - 8,
    );
  }

  getCanvas() {
    return this.context_.canvas;
  }
}

export default TextOverlay;
