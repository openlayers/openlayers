/**
 * @module ol/renderer/webgpu/VectorTileLayer
 */
import {assert} from '../../asserts.js';
import Disposable from '../../Disposable.js';
import {
  buffer as bufferExtent,
  createEmpty,
  getWidth,
  intersects,
} from '../../extent.js';
import {equivalent} from '../../proj.js';
import {
  buildVectorRequest,
  combineVectorBuffers,
  resolveFeatureStyles,
} from '../../render/webgpu/buffers.js';
import {
  collectStickyIds,
  getDeclutterOccupancy,
  resolveDeclutter,
  retainVisibleIdentities,
  VIEWPORT_PADDING,
} from '../../render/webgpu/declutter.js';
import {buildGeometryBuffers} from '../../render/webgpu/geometryBuffers.js';
import {GLYPH_INSTANCE_STRIDE} from '../../render/webgpu/glyphLayout.js';
import {
  activeLabelIndices,
  LABEL_FADE_DURATION,
  LABEL_FADE_MATCH_PIXELS,
  LabelFade,
  writeGpuTransition,
} from '../../render/webgpu/labelFade.js';
import {PlacementScheduler} from '../../render/webgpu/placement.js';
import {compileStyle} from '../../render/webgpu/style.js';
import {SymbolIdentityIndex} from '../../render/webgpu/symbolIdentity.js';
import {getWorkerPool} from '../../render/webgpu/workerPool.js';
import LRUCache from '../../structs/LRUCache.js';
import {
  createOrUpdate as createTileCoord,
  getCacheKey,
  getKey as getTileCoordKey,
} from '../../tilecoord.js';
import TileRange from '../../TileRange.js';
import TileState from '../../TileState.js';
import {getUid} from '../../util.js';
import ViewHint from '../../ViewHint.js';
import FontAtlas from '../../webgpu/FontAtlas.js';
import ImageAtlas from '../../webgpu/ImageAtlas.js';
import {hitFeatures} from './hitTest.js';
import LabelRenderer from './LabelRenderer.js';
import LabelView from './LabelView.js';
import WebGPULayerRenderer from './Layer.js';
import {
  atlasPages,
  createVectorPipelines,
  FrameUniformPool,
  hasUnusedAtlasPages,
  labelUniforms,
  paintBatches,
  placementKey,
  startFontAtlasOver,
  startImageAtlasOver,
  VECTOR_FRAME_UNIFORM_SIZE,
  VectorGpuBuffers,
} from './vectorUtil.js';

/**
 * @typedef {Object} Options
 * @property {import("../../style/flat.js").FlatStyleLike|import("../../style/Style.js").StyleLike} [style] Style.
 * @property {import("../../style/flat.js").StyleVariables} [variables] Variables.
 * @property {boolean} [disableHitDetection=false] Disable hit detection.
 * @property {boolean|string|number} [declutter=false] Declutter group.
 * @property {number} [cacheSize=512] Cache size.
 */

/**
 * Style cache buckets kept at once. Each settled view resolution starts a new
 * bucket, so the oldest are dropped; tiles still on an older resolution keep
 * their built batches.
 * @type {number}
 */
const MAX_STYLE_CACHES = 8;

/**
 * Cached batches beyond this many bytes, or twice the bytes of the current
 * frame's batches if that is more, are evicted, in addition to those beyond
 * the cache size. Tiles differ a lot in how much geometry they carry, so a
 * tile count alone does not bound memory.
 * @type {number}
 */
const MAX_CACHE_BYTES = 256 * 1024 * 1024;

/**
 * @param {import("../../render/webgpu/buffers.js").VectorBuffers} buffers Buffers.
 * @return {number} Bytes of the GPU buffers built from these buffers.
 */
function getByteLength(buffers) {
  return (
    buffers.fillPositions.byteLength +
    buffers.fillStyles.byteLength +
    buffers.fillIndices.byteLength +
    buffers.strokePositions.byteLength +
    buffers.strokeAttributes.byteLength +
    buffers.strokeStyles.byteLength +
    buffers.strokeIndices.byteLength +
    buffers.styles.byteLength +
    buffers.symbolInstances.byteLength +
    buffers.iconInstances.byteLength +
    buffers.glyphs.length *
      GLYPH_INSTANCE_STRIDE *
      Float32Array.BYTES_PER_ELEMENT
  );
}

/**
 * @typedef {Object} StyleState
 * @property {number} resolution Resolution passed to the style function.
 * @property {number} zoom Zoom passed to the style function.
 */

/**
 * @classdesc
 * One tile's CPU geometry plus the GPU buffers built from it. Cached in an LRU
 * that disposes evicted entries, which is what releases the GPU buffers.
 */
class TileBatch extends Disposable {
  /**
   * @param {string} key Cache key.
   * @param {number} worldOffset X offset from the wrapped tile extent to the requested one.
   * @param {import("../../render/webgpu/buffers.js").VectorBuffers} buffers Buffers.
   * @param {function(TileBatch): void} onDispose Called when the batch is
   * disposed, so the renderer can drop all references to it.
   */
  constructor(key, worldOffset, buffers, onDispose) {
    super();

    /**
     * @private
     * @type {function(TileBatch): void}
     */
    this.onDispose_ = onDispose;

    /**
     * Renderer map entries that refer to this batch.
     * @type {Array<{map: Map<string, TileBatch>, key: string}>}
     */
    this.references = [];

    /**
     * Font atlas pages that this batch's labels are drawn from.
     * @type {Array<number>}
     */
    this.atlasPages = atlasPages(buffers.glyphs);

    /**
     * Bytes of this batch's GPU buffers, counted against the cache budget.
     * @type {number}
     */
    this.byteLength = getByteLength(buffers);

    /**
     * @type {string}
     */
    this.key = key;

    /**
     * @type {number}
     */
    this.worldOffset = worldOffset;

    /**
     * @type {import("../../render/webgpu/buffers.js").VectorBuffers}
     */
    this.buffers = buffers;

    /**
     * @private
     * @type {VectorGpuBuffers|null}
     */
    this.gpu_ = null;

    /**
     * @private
     * @type {LabelRenderer|null}
     */
    this.labels_ = null;

    /**
     * Declutter result for this tile's labels, kept so tiles that stay in view
     * across a tile-set change do not lose their placement.
     * @type {Array<boolean>|null}
     */
    this.labelVisibility = null;

    /**
     * Persistent identities from the last label view containing this batch.
     * @type {Array<number>|null}
     */
    this.labelIdentities = null;

    /**
     * Regions in this batch where fallback labels may be drawn. `null` means
     * that the batch itself is a current render tile.
     * @type {Array<import("../../extent.js").Extent>|null}
     */
    this.labelClipExtents = null;

    /**
     * Regions in which fallback geometry may be drawn. `null` means the whole
     * batch extent.
     * @type {Array<import("../../extent.js").Extent>|null}
     */
    this.geometryClipExtents = null;

    /**
     * Frame in which `geometryClipExtents` was assigned.
     * @type {number}
     */
    this.geometryClipFrame = -1;

    /**
     * Frame in which `labelClipExtents` was assigned.
     * @type {number}
     */
    this.labelClipFrame = -1;
  }

  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @return {VectorGpuBuffers} Persistent geometry, uploaded on first use.
   */
  getGpuBuffers(helper) {
    if (!this.gpu_) {
      // A disposed batch is no longer cached, so nothing would release these.
      assert(!this.disposed, 'Cannot upload the geometry of a disposed batch');
      const buffers = this.buffers;
      this.gpu_ = new VectorGpuBuffers(helper, buffers);
      // Only the GPU buffers are drawn from, so the CPU copy of the geometry
      // arrays is nullified (throws in case of unintentional subsequent access).
      const released = /** @type {*} */ (null);
      buffers.fillPositions = released;
      buffers.fillStyles = released;
      buffers.fillIndices = released;
      buffers.strokePositions = released;
      buffers.strokeAttributes = released;
      buffers.strokeStyles = released;
      buffers.strokeIndices = released;
      buffers.styles = released;
    }
    return this.gpu_;
  }

  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @return {LabelRenderer} This tile's labels, uploaded on first use.
   */
  getLabelRenderer(helper) {
    if (!this.labels_) {
      assert(!this.disposed, 'Cannot upload the labels of a disposed batch');
      this.labels_ = new LabelRenderer();
      this.labels_.setLabels(helper, this.buffers);
    }
    return this.labels_;
  }

  /**
   * @override
   */
  disposeInternal() {
    this.gpu_?.dispose();
    this.gpu_ = null;
    this.labels_?.dispose();
    this.labels_ = null;
    this.onDispose_(this);
  }

  /**
   * @return {boolean} The batch was disposed.
   */
  isDisposed() {
    return this.disposed;
  }
}

/**
 * @classdesc
 * WebGPU vector tile renderer. Labels from all tiles share one map-level declutter pass.
 * @extends {WebGPULayerRenderer<import("../../layer/Layer.js").default>}
 */
class WebGPUVectorTileLayerRenderer extends WebGPULayerRenderer {
  /**
   * @param {import("../../layer/Layer.js").default} layer Layer.
   * @param {Options} options Options.
   */
  constructor(layer, options) {
    super(layer);

    /**
     * @private
     */
    this.styleFunction_ = compileStyle(options.style, options.variables);

    /**
     * @private
     * @type {number}
     */
    this.renderedLayerRevision_ = this.getLayer().getRevision();

    /**
     * Function styles are resolved in bounded slices and reused by overlapping
     * overzoom subdivisions.
     * @private
     * @type {boolean}
     */
    this.cacheResolvedStyles_ = typeof options.style === 'function';

    /**
     * @private
     */
    this.hitDetectionEnabled_ = !options.disableHitDetection;

    /**
     * @private
     * @type {string|undefined}
     */
    this.declutterGroup_ =
      options.declutter === true
        ? 'true'
        : options.declutter
          ? String(options.declutter)
          : undefined;

    /**
     * @private
     * @type {FontAtlas}
     */
    this.atlas_ = new FontAtlas();

    /**
     * @private
     * @type {ImageAtlas}
     */
    this.imageAtlas_ = new ImageAtlas();

    /**
     * Images and pattern fills that are still loading, by uid.
     * @private
     * @type {Object<string, true>}
     */
    this.loadingImages_ = {};

    const cacheSize = options.cacheSize !== undefined ? options.cacheSize : 512;

    /**
     * @protected
     * @type {import("../../structs/LRUCache.js").default<import("../../VectorRenderTile.js").default>}
     */
    this.renderTiles_ = new LRUCache(cacheSize);

    /**
     * @protected
     * @type {import("../../structs/LRUCache.js").default<TileBatch>}
     */
    this.tileCache_ = new LRUCache(cacheSize);

    /**
     * @private
     * @type {FrameUniformPool|null}
     */
    this.uniforms_ = null;

    /**
     * @private
     * @type {import("./vectorUtil.js").PaintCache}
     */
    this.paintCache_ = {};

    /**
     * Scratch for per-batch uniform writes.
     * @private
     * @type {Float32Array}
     */
    this.uniformData_ = new Float32Array(VECTOR_FRAME_UNIFORM_SIZE / 4);

    /**
     * @private
     * @type {Float32Array}
     */
    this.projMat_ = new Float32Array(16);

    /**
     * @private
     * @type {GPUBuffer|null}
     */
    this.cornerBuffer_ = null;

    /**
     * Batches for tiles that are still loading. They are rebuilt every frame,
     * so they are disposed at the start of the next one.
     * @private
     * @type {Array<TileBatch>}
     */
    this.uncachedBatches_ = [];

    /**
     * Cache keys handed to a worker, so the same tile is only sent once.
     * @private
     * @type {Set<string>}
     */
    this.pendingKeys_ = new Set();

    /**
     * Incremented when the batches are discarded, so worker results that were
     * built before are not cached.
     * @private
     * @type {number}
     */
    this.batchGeneration_ = 0;

    /**
     * Main-thread feature preparations allowed in the current frame. Moving
     * frames admit one center-first miss within a short elapsed-time budget;
     * settled frames admit another so missing detail converges faster.
     * @private
     * @type {number}
     */
    this.batchBuildBudget_ = 1;

    /**
     * End of the current frame's main-thread batch preparation allowance.
     * @private
     * @type {number}
     */
    this.batchBuildDeadline_ = 0;

    /**
     * Already associated render tiles and batches, used to include cached
     * neighboring labels without reconstructing internal cache keys.
     * @private
     * @type {Map<string, TileBatch>}
     */
    this.renderBatchesByKey_ = new Map();

    /**
     * Resolved function styles shared by overlapping subdivisions at a render
     * zoom.
     * @private
     * @type {Map<string, WeakMap<import("../../Feature.js").FeatureLike, Array<import("../../render/webgpu/buffers.js").ResolvedStyleGeometry>>>}
     */
    this.styleCaches_ = new Map();

    /**
     * Resolution and zoom each render tile's styles are evaluated at. Like the
     * Canvas renderer, a tile follows the view resolution once the view has
     * settled at its zoom level, and keeps its last value while the view moves.
     * Without this, tiles built at different points of a zoom gesture would
     * keep showing different zoom-dependent styles side by side.
     * @private
     * @type {WeakMap<import("../../VectorRenderTile.js").default, StyleState>}
     */
    this.styleStates_ = new WeakMap();

    /**
     * Last batch drawn for each render tile, by tile uid, drawn again while a
     * batch for the tile's new style resolution is being built.
     * @private
     * @type {Map<string, TileBatch>}
     */
    this.drawnBatches_ = new Map();

    /**
     * Removes a disposed batch from everything that refers to it.
     * @private
     * @type {function(TileBatch): void}
     */
    this.handleBatchDispose_ = this.handleBatchDispose_.bind(this);

    /**
     * Whether render tiles at `restyleZ_` follow the view resolution this frame.
     * @private
     * @type {boolean}
     */
    this.restyle_ = false;

    /**
     * Render tile zoom level for the current frame.
     * @private
     * @type {number}
     */
    this.restyleZ_ = NaN;

    /**
     * Worker completions are coalesced into one render request per animation
     * frame, avoiding repeated label placement for a burst of finished tiles.
     * @private
     * @type {boolean}
     */
    this.batchChangeScheduled_ = false;

    /**
     * A flat view over the visible tiles' labels, for the map-level declutter
     * pass. Each tile keeps its own GPU buffers.
     * @private
     * @type {LabelView}
     */
    this.labelView_ = new LabelView();

    /**
     * @private
     * @type {PlacementScheduler}
     */
    this.placement_ = new PlacementScheduler();

    /**
     * Identifies the set of tiles the label view covers.
     * @private
     * @type {string}
     */
    this.labelKey_ = '';

    /**
     * Per-label opacity, shared by every tile's label renderer.
     * @private
     * @type {Float32Array}
     */
    this.opacities_ = new Float32Array(0);

    /**
     * Labels with a non-zero transition in the previous opacity update.
     * @private
     * @type {Set<number>}
     */
    this.activeOpacityIndices_ = new Set();

    /**
     * @private
     * @type {number}
     */
    this.labelVersion_ = 0;

    /**
     * @private
     * @type {number}
     */
    this.identityVersion_ = -1;

    /**
     * @private
     * @type {SymbolIdentityIndex}
     */
    this.symbolIdentities_ = new SymbolIdentityIndex();

    /**
     * @private
     * @type {Array<TileBatch>}
     */
    this.renderedBatches_ = [];

    /**
     * Rendered batches followed by cached neighboring label-only batches.
     * @private
     * @type {Array<TileBatch>}
     */
    this.declutterBatches_ = [];

    /**
     * Label-only batches retained long enough for unmatched symbols to fade.
     * @private
     * @type {Array<{batch: TileBatch, until: number}>}
     */
    this.retiredBatches_ = [];

    /**
     * @private
     * @type {Array<boolean>|null}
     */
    this.visibility_ = null;

    /**
     * @private
     * @type {Set<number>}
     */
    this.declutterStickyIds_ = new Set();

    /**
     * @private
     * @type {LabelFade}
     */
    this.labelFade_ = new LabelFade();

    /**
     * @private
     * @type {import("../../tilecoord.js").TileCoord}
     */
    this.tempTileCoord_ = createTileCoord(0, 0, 0);

    /**
     * @private
     * @type {import("../../TileRange.js").default}
     */
    this.tempTileRange_ = new TileRange(0, 0, 0, 0);

    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    this.labelExtent_ = createEmpty();

    /**
     * @private
     * @type {import("../../TileRange.js").default}
     */
    this.labelTileRange_ = new TileRange(0, 0, 0, 0);

    /**
     * Tile range reused when looking up parent/child fallbacks.
     * @private
     * @type {import("../../TileRange.js").default}
     */
    this.altTileRange_ = new TileRange(0, 0, 0, 0);

    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    this.tempExtent_ = createEmpty();

    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    this.tempWrappedExtent_ = createEmpty();
  }

  /**
   * @return {string|undefined} Declutter group.
   */
  getDeclutterGroup() {
    return this.declutterGroup_;
  }

  /**
   * @override
   */
  afterHelperCreated() {
    const helper = this.helper;
    if (!helper) {
      return;
    }
    // A new helper means a new device, so nothing built for the old one can be
    // reused.
    this.uniforms_?.dispose();
    this.uniforms_ = new FrameUniformPool(helper);
    this.paintCache_ = {};
    this.imageAtlas_.clear();
    this.atlas_.clear();
    this.tileCache_.clear();
    this.renderBatchesByKey_.clear();
    this.styleCaches_.clear();
    this.labelKey_ = '';
    this.placement_.reset();
    this.cornerBuffer_?.destroy();
    this.cornerBuffer_ = helper.createBuffer(
      new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
      GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    );
    createVectorPipelines(helper);
  }

  /**
   * @return {boolean} Work is pending.
   * @override
   */
  hasPendingWork() {
    return (
      this.pendingKeys_.size > 0 || Object.keys(this.loadingImages_).length > 0
    );
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @return {boolean} Ready.
   * @override
   */
  prepareFrameInternal(frameState) {
    if (
      hasUnusedAtlasPages(this.atlas_, frameState, () =>
        this.declutterBatches_.map((batch) => batch.atlasPages),
      )
    ) {
      startFontAtlasOver(this.atlas_, this.getLayer());
    }
    if (this.imageAtlas_.isFull()) {
      startImageAtlasOver(this.imageAtlas_, this.getLayer());
    }
    // `layer.changed()` rebuilds the tile batches, e.g. for a style function
    // that depends on external state.
    const revision = this.getLayer().getRevision();
    if (this.renderedLayerRevision_ !== revision) {
      this.renderedLayerRevision_ = revision;
      ++this.batchGeneration_;
      this.tileCache_.clear();
      this.renderBatchesByKey_.clear();
      this.styleCaches_.clear();
    }
    const source = this.getLayer().getRenderSource();
    return !!source && source.getState() === 'ready';
  }

  /**
   * Rebuild cached tile batches when an image style or pattern fill becomes
   * available.
   *
   * @param {Array<import("../../style/Image.js").default|import("../../style/Fill.js").default>} images Images and pattern fills.
   * @private
   */
  watchImages_(images) {
    for (const image of images) {
      const uid = getUid(image);
      if (this.loadingImages_[uid]) {
        continue;
      }
      this.loadingImages_[uid] = true;
      this.updateReady();
      image.ready().then(() => {
        delete this.loadingImages_[uid];
        this.updateReady();
        if (!this.disposed) {
          this.getLayer().changed();
        }
      });
    }
  }

  /**
   * Coalesce asynchronous batch progress into one redraw per animation frame.
   * @private
   */
  scheduleBatchChange_() {
    if (this.batchChangeScheduled_) {
      return;
    }
    this.batchChangeScheduled_ = true;
    requestAnimationFrame(() => {
      this.batchChangeScheduled_ = false;
      if (!this.disposed) {
        this.redraw_();
      }
    });
  }

  /**
   * Resolve function styles in short slices before constructing a batch.
   *
   * Features have already passed the buffered original-geometry test. Resolve
   * those candidates once per render zoom so overlapping subdivisions reuse
   * the result without styling unrelated source-tile features.
   *
   * @param {Array<import("../../Feature.js").FeatureLike>} features Candidate features.
   * @param {string} bucket Resolution/zoom bucket.
   * @param {number} resolution Style resolution.
   * @param {number} zoom Style zoom.
   * @return {WeakMap<import("../../Feature.js").FeatureLike, Array<import("../../render/webgpu/buffers.js").ResolvedStyleGeometry>>|null} Cache, or null while preparation continues.
   * @private
   */
  prepareStyleCache_(features, bucket, resolution, zoom) {
    let resolved = this.styleCaches_.get(bucket);
    if (!resolved) {
      resolved = new WeakMap();
      this.styleCaches_.set(bucket, resolved);
      if (this.styleCaches_.size > MAX_STYLE_CACHES) {
        this.styleCaches_.delete(
          /** @type {string} */ (this.styleCaches_.keys().next().value),
        );
      }
    }
    let prepared = false;
    const sorted = features
      .slice()
      .sort((a, b) => Number(getUid(a)) - Number(getUid(b)));
    for (const feature of sorted) {
      if (resolved.has(feature)) {
        continue;
      }
      resolved.set(
        feature,
        resolveFeatureStyles(
          feature,
          this.styleFunction_,
          resolution,
          zoom,
          true,
        ),
      );
      prepared = true;
      if (performance.now() >= this.batchBuildDeadline_) {
        this.scheduleBatchChange_();
        return null;
      }
    }
    if (prepared) {
      this.scheduleBatchChange_();
      return null;
    }
    return resolved;
  }

  /**
   * @param {import("../../VectorRenderTile.js").default} tile Render tile.
   * @param {number} z Render tile zoom level.
   * @param {import("../../View.js").State} viewState View state.
   * @return {StyleState} Resolution and zoom to evaluate the tile's styles at.
   * @private
   */
  getStyleState_(tile, z, viewState) {
    const stored = this.styleStates_.get(tile);
    if (stored && !(this.restyle_ && z === this.restyleZ_)) {
      return stored;
    }
    if (stored && stored.resolution === viewState.resolution) {
      return stored;
    }
    const state = {resolution: viewState.resolution, zoom: viewState.zoom};
    this.styleStates_.set(tile, state);
    return state;
  }

  /**
   * Get the GPU batch for a render tile that has at least one loaded source
   * tile. While the batch for the tile's current style state is not ready, the
   * batch last drawn for the tile is returned instead.
   * @param {import("../../VectorRenderTile.js").default} tile Render tile.
   * @param {import("../../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("../../View.js").State} viewState View state.
   * @param {number} pixelRatio Device pixel ratio.
   * @return {TileBatch|null} Batch, or null if nothing is ready to draw.
   * @private
   */
  getBatch_(tile, tileCoord, viewState, pixelRatio) {
    const styleState = this.getStyleState_(tile, tileCoord[0], viewState);
    const batch = this.buildBatch_(
      tile,
      tileCoord,
      viewState,
      styleState,
      pixelRatio,
    );
    if (batch) {
      if (tile.getState() === TileState.LOADED) {
        this.setBatchReference_(this.drawnBatches_, getUid(tile), batch);
      }
      return batch;
    }
    const drawn = this.drawnBatches_.get(getUid(tile));
    if (drawn && this.tileCache_.containsKey(drawn.key)) {
      return this.tileCache_.get(drawn.key);
    }
    return null;
  }

  /**
   * Build a GPU batch for a render tile that has at least one loaded source tile.
   * @param {import("../../VectorRenderTile.js").default} tile Render tile.
   * @param {import("../../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("../../View.js").State} viewState View state.
   * @param {StyleState} styleState Resolution and zoom to evaluate styles at.
   * @param {number} pixelRatio Device pixel ratio.
   * @return {TileBatch|null} Batch, or null if nothing is ready to draw.
   * @private
   */
  buildBatch_(tile, tileCoord, viewState, styleState, pixelRatio) {
    const sourceTiles =
      typeof tile.getSourceTiles === 'function' ? tile.getSourceTiles() : [];
    const loadedSourceTiles = [];
    let hasLoaded = false;
    for (const sourceTile of sourceTiles) {
      if (sourceTile.getState() !== TileState.LOADED) {
        continue;
      }
      hasLoaded = true;
      loadedSourceTiles.push(sourceTile);
    }
    if (!hasLoaded) {
      return null;
    }

    const dpr = pixelRatio > 0 ? pixelRatio : 1;
    const source = /** @type {import("../../source/VectorTile.js").default} */ (
      this.getLayer().getRenderSource()
    );
    const sourceProjection = source.getProjection();
    const tileGrid = source.getTileGridForProjection(viewState.projection);
    const wrappedCoord = tile.wrappedTileCoord || tileCoord;
    let clipExtent = tileGrid
      ? tileGrid.getTileCoordExtent(wrappedCoord)
      : undefined;
    const worldOffset = tileGrid
      ? tileGrid.getTileCoordExtent(tileCoord, this.tempExtent_)[0] -
        tileGrid.getTileCoordExtent(wrappedCoord, this.tempWrappedExtent_)[0]
      : 0;
    const sourceTile = loadedSourceTiles[0];
    const sourceTileCoord = sourceTile?.tileCoord;
    const reuseSourceBatch =
      sourceTiles.length === 1 &&
      loadedSourceTiles.length === 1 &&
      !!sourceProjection &&
      equivalent(sourceProjection, viewState.projection) &&
      !!sourceTileCoord &&
      tileCoord[0] > sourceTileCoord[0];
    const styleResolution = styleState.resolution;
    let cacheKey =
      getTileCoordKey(tileCoord) +
      '/' +
      tile.key +
      '/' +
      dpr +
      '/' +
      styleResolution;
    if (reuseSourceBatch) {
      // Keep an overzoom batch no more than one zoom level coarser than its
      // render tiles. At deep overzoom this bounds synchronous style/label
      // work while four children can still share one cached batch.
      const batchZ = Math.min(
        tileCoord[0],
        Math.max(sourceTileCoord[0] + 1, tileCoord[0] - 1),
      );
      const scale = Math.pow(2, tileCoord[0] - batchZ);
      const batchCoord = [
        batchZ,
        Math.floor(wrappedCoord[1] / scale),
        Math.floor(wrappedCoord[2] / scale),
      ];
      clipExtent = tileGrid?.getTileCoordExtent(batchCoord);
      cacheKey =
        'source/' +
        getUid(sourceTile) +
        '/' +
        tileCoord[0] +
        '/' +
        batchCoord.join('/') +
        '/' +
        dpr +
        '/' +
        worldOffset +
        '/' +
        styleResolution;
    }
    const cacheable = tile.getState() === TileState.LOADED;
    if (cacheable && this.tileCache_.containsKey(cacheKey)) {
      return this.tileCache_.get(cacheKey);
    }
    if (this.pendingKeys_.has(cacheKey)) {
      return null;
    }
    if (
      this.batchBuildBudget_ === 0 ||
      performance.now() >= this.batchBuildDeadline_
    ) {
      return null;
    }
    --this.batchBuildBudget_;
    const features = [];
    for (const loadedSourceTile of loadedSourceTiles) {
      const tileFeatures = loadedSourceTile.getFeatures() ?? [];
      for (const feature of tileFeatures) {
        features.push(feature);
      }
    }
    let buildFeatures = features;
    const filterExtent =
      reuseSourceBatch && clipExtent
        ? bufferExtent(
            clipExtent,
            styleResolution * VIEWPORT_PADDING,
            clipExtent.slice(),
          )
        : undefined;
    if (filterExtent) {
      buildFeatures = features.filter((feature) => {
        const geometry = feature.getGeometry();
        return geometry && intersects(geometry.getExtent(), filterExtent);
      });
    }
    /** @type {WeakMap<import("../../Feature.js").FeatureLike, Array<import("../../render/webgpu/buffers.js").ResolvedStyleGeometry>>|undefined} */
    let styleCache;
    if (this.cacheResolvedStyles_) {
      const prepared = this.prepareStyleCache_(
        buildFeatures,
        tileCoord[0] + '/' + dpr + '/' + styleResolution,
        styleResolution,
        styleState.zoom,
      );
      if (!prepared) {
        return null;
      }
      styleCache = prepared;
    }
    const {request, labelData} = buildVectorRequest(
      buildFeatures,
      this.styleFunction_,
      styleResolution,
      this.atlas_,
      clipExtent ? {clipExtent, filterExtent} : undefined,
      dpr,
      styleState.zoom,
      undefined,
      this.imageAtlas_,
      styleCache,
    );
    this.watchImages_(labelData.pendingImageStyles);

    // Tessellation is the expensive part, so hand it to a worker when the tile
    // will still be around to receive it. Until it comes back the renderer
    // falls back to parent or child tiles, exactly as for a loading tile.
    const pending = cacheable ? getWorkerPool().build(request) : null;
    if (pending) {
      const generation = this.batchGeneration_;
      this.pendingKeys_.add(cacheKey);
      this.updateReady();
      pending.then(
        (geometry) => {
          this.pendingKeys_.delete(cacheKey);
          this.updateReady();
          if (this.disposed) {
            return;
          }
          if (
            generation === this.batchGeneration_ &&
            !this.tileCache_.containsKey(cacheKey)
          ) {
            this.tileCache_.set(
              cacheKey,
              new TileBatch(
                cacheKey,
                worldOffset,
                combineVectorBuffers(geometry, labelData),
                this.handleBatchDispose_,
              ),
            );
          }
          this.scheduleBatchChange_();
        },
        () => {
          this.pendingKeys_.delete(cacheKey);
          this.updateReady();
          if (this.disposed) {
            return;
          }
          // Render again so the tile is requested anew, from a remaining
          // worker or on the main thread.
          this.scheduleBatchChange_();
        },
      );
      return null;
    }

    const geometry = buildGeometryBuffers(request);
    const batch = new TileBatch(
      cacheKey,
      worldOffset,
      combineVectorBuffers(geometry, labelData),
      this.handleBatchDispose_,
    );
    if (cacheable) {
      this.tileCache_.set(cacheKey, batch);
    } else {
      this.uncachedBatches_.push(batch);
    }
    return batch;
  }

  /**
   * Look up cached parent or child tiles covering `tileCoord` at `altZ`.
   * Does not enqueue or create tiles — only uses what is already in
   * `renderTiles_`.
   *
   * @param {import("../../tilegrid/TileGrid.js").default} tileGrid Tile grid.
   * @param {import("../../tilecoord.js").TileCoord} tileCoord Current-Z tile that is not ready.
   * @param {number} altZ Alternate zoom to search.
   * @param {import("../../source/Tile.js").default} source Tile source.
   * @param {string} sourceKey Source revision key.
   * @param {import("../../View.js").State} viewState View state.
   * @param {number} pixelRatio Device pixel ratio.
   * @return {{covered: boolean, items: Array<{renderKey: string, batch: TileBatch}>}}
   * Coverage and batches to draw if committed.
   * @private
   */
  findAltTiles_(
    tileGrid,
    tileCoord,
    altZ,
    source,
    sourceKey,
    viewState,
    pixelRatio,
  ) {
    const altRange = tileGrid.getTileRangeForTileCoordAndZ(
      tileCoord,
      altZ,
      this.altTileRange_,
    );
    if (!altRange) {
      return {covered: false, items: []};
    }
    /** @type {Array<{renderKey: string, batch: TileBatch}>} */
    const items = [];
    let covered = true;
    for (let x = altRange.minX; x <= altRange.maxX; ++x) {
      for (let y = altRange.minY; y <= altRange.maxY; ++y) {
        const renderKey = getCacheKey(source, sourceKey, altZ, x, y);
        if (!this.renderTiles_.containsKey(renderKey)) {
          covered = false;
          continue;
        }
        const tile = this.renderTiles_.get(renderKey);
        if (tile.getState() === TileState.EMPTY) {
          covered = false;
          continue;
        }
        const batch = this.getBatch_(
          tile,
          tile.tileCoord,
          viewState,
          pixelRatio,
        );
        if (!batch) {
          covered = false;
          continue;
        }
        items.push({renderKey, batch});
      }
    }
    return {covered, items};
  }

  /**
   * @param {Array<{renderKey: string, batch: TileBatch}>} items Alt batches.
   * @param {Set<string>} added Render keys already queued.
   * @param {Array<TileBatch>} batches Batches to draw.
   * @param {import("../../extent.js").Extent} labelExtent Missing region whose labels the fallback may supply.
   * @param {number} frameIndex Frame index.
   * @private
   */
  commitAltTiles_(items, added, batches, labelExtent, frameIndex) {
    for (const item of items) {
      const batch = item.batch;
      if (batch.labelClipFrame !== frameIndex) {
        batch.labelClipFrame = frameIndex;
        batch.labelClipExtents = [];
      }
      if (batch.labelClipExtents) {
        batch.labelClipExtents.push([
          labelExtent[0] - batch.worldOffset,
          labelExtent[1],
          labelExtent[2] - batch.worldOffset,
          labelExtent[3],
        ]);
      }
      if (batch.geometryClipFrame !== frameIndex) {
        batch.geometryClipFrame = frameIndex;
        batch.geometryClipExtents = [];
      }
      /** @type {Array<import("../../extent.js").Extent>} */ (
        batch.geometryClipExtents
      ).push(labelExtent.slice());
      if (added.has(item.renderKey)) {
        continue;
      }
      added.add(item.renderKey);
      batches.push(batch);
    }
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @return {Array<TileBatch>} Batches.
   * @private
   */
  collectBatches_(frameState) {
    const layer = this.getLayer();
    const source = /** @type {import("../../source/VectorTile.js").default} */ (
      layer.getRenderSource()
    );
    const viewState = frameState.viewState;
    const viewHints = frameState.viewHints || [];
    const moving =
      viewHints[ViewHint.ANIMATING] || viewHints[ViewHint.INTERACTING];
    this.batchBuildBudget_ = moving ? 1 : 2;
    this.batchBuildDeadline_ = performance.now() + (moving ? 4 : 8);
    const tileGrid = source.getTileGridForProjection(viewState.projection);
    const z = tileGrid.getZForResolution(
      viewState.resolution,
      source.zDirection,
    );
    this.restyle_ = !moving;
    this.restyleZ_ = z;
    const extent = frameState.extent;
    if (!extent) {
      return [];
    }
    const tileRange = tileGrid.getTileRangeForExtentAndZ(
      extent,
      z,
      this.tempTileRange_,
    );
    const tileSourceKey = getUid(source);
    if (!(tileSourceKey in frameState.wantedTiles)) {
      frameState.wantedTiles[tileSourceKey] = {};
    }
    const wantedTiles = frameState.wantedTiles[tileSourceKey];
    /** @type {Array<TileBatch>} */
    const batches = [];
    /** @type {Set<string>} */
    const added = new Set();
    /** @type {Array<import("../../tilecoord.js").TileCoord>} */
    const holes = [];

    const sourceKey = source.getKey();
    /** @type {Array<{tile: import("../../VectorRenderTile.js").default, renderKey: string, x: number, y: number}>} */
    const entries = [];
    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        const tileCoord = createTileCoord(z, x, y, this.tempTileCoord_);
        const renderKey = getCacheKey(source, sourceKey, z, x, y);
        let tile;
        if (this.renderTiles_.containsKey(renderKey)) {
          tile = this.renderTiles_.get(renderKey);
        } else {
          tile = source.getTile(
            z,
            x,
            y,
            frameState.pixelRatio,
            viewState.projection,
          );
          if (tile) {
            this.renderTiles_.set(renderKey, tile);
          }
        }
        if (!tile || tile.getState() === TileState.EMPTY) {
          continue;
        }
        const tileQueueKey = tile.getKey();
        wantedTiles[tileQueueKey] = true;
        if (tile.getState() === TileState.IDLE) {
          if (!frameState.tileQueue.isKeyQueued(tileQueueKey)) {
            frameState.tileQueue.enqueue([
              tile,
              tileSourceKey,
              tileGrid.getTileCoordCenter(tileCoord),
              tileGrid.getResolution(z),
            ]);
          }
        }
        entries.push({tile, renderKey, x, y});
      }
    }

    // Cache misses nearest the center are admitted first. The original tile
    // order below is retained for painting and fallback selection.
    const center = viewState.center;
    const preparationEntries = entries.slice().sort((a, b) => {
      const aCenter = tileGrid.getTileCoordCenter([z, a.x, a.y]);
      const bCenter = tileGrid.getTileCoordCenter([z, b.x, b.y]);
      const adx = aCenter[0] - center[0];
      const ady = aCenter[1] - center[1];
      const bdx = bCenter[0] - center[0];
      const bdy = bCenter[1] - center[1];
      return adx * adx + ady * ady - (bdx * bdx + bdy * bdy);
    });
    /** @type {Map<string, TileBatch|null>} */
    const prepared = new Map();
    for (const entry of preparationEntries) {
      const tile = entry.tile;
      const batch = this.getBatch_(
        tile,
        tile.tileCoord,
        viewState,
        frameState.pixelRatio,
      );
      prepared.set(entry.renderKey, batch);
      if (batch) {
        this.setBatchReference_(
          this.renderBatchesByKey_,
          entry.renderKey,
          batch,
        );
      }
    }

    for (const entry of entries) {
      const batch = prepared.get(entry.renderKey);
      if (batch) {
        batch.labelClipFrame = frameState.index;
        batch.labelClipExtents = null;
        if (batch.geometryClipFrame !== frameState.index) {
          batch.geometryClipFrame = frameState.index;
          batch.geometryClipExtents = [];
        }
        /** @type {Array<import("../../extent.js").Extent>} */ (
          batch.geometryClipExtents
        ).push(tileGrid.getTileCoordExtent([z, entry.x, entry.y]));
        added.add(entry.renderKey);
        batches.push(batch);
        continue;
      }
      holes.push([z, entry.x, entry.y]);
    }

    const minZoom = tileGrid.getMinZoom();
    for (const hole of holes) {
      const labelExtent = tileGrid.getTileCoordExtent(hole);
      const children = this.findAltTiles_(
        tileGrid,
        hole,
        hole[0] + 1,
        source,
        sourceKey,
        viewState,
        frameState.pixelRatio,
      );
      if (children.covered) {
        this.commitAltTiles_(
          children.items,
          added,
          batches,
          labelExtent,
          frameState.index,
        );
        continue;
      }
      let usedParent = false;
      for (let parentZ = hole[0] - 1; parentZ >= minZoom; --parentZ) {
        const parents = this.findAltTiles_(
          tileGrid,
          hole,
          parentZ,
          source,
          sourceKey,
          viewState,
          frameState.pixelRatio,
        );
        if (parents.covered) {
          this.commitAltTiles_(
            parents.items,
            added,
            batches,
            labelExtent,
            frameState.index,
          );
          usedParent = true;
          break;
        }
      }
      if (!usedParent) {
        this.commitAltTiles_(
          children.items,
          added,
          batches,
          labelExtent,
          frameState.index,
        );
      }
    }

    this.renderTiles_.highWaterMark = Math.max(
      this.renderTiles_.highWaterMark,
      Object.keys(wantedTiles).length * 2,
    );
    this.renderTiles_.expireCache();
    this.expireTileCache_(batches);
    const unique = [];
    const batchKeys = new Set();
    for (const batch of batches) {
      if (batchKeys.has(batch.key)) {
        continue;
      }
      batchKeys.add(batch.key);
      unique.push(batch);
    }
    return unique;
  }

  /**
   * Evict the least recently used batches beyond the cache size and beyond
   * the byte budget. Like the cache size of the Canvas 2D renderer, the byte
   * budget leaves room for at least twice the batches of this frame, and it
   * never evicts those.
   * @param {Array<TileBatch>} batches Batches of this frame.
   * @private
   */
  expireTileCache_(batches) {
    const cache = this.tileCache_;
    const current = new Set();
    let currentBytes = 0;
    for (const batch of batches) {
      if (cache.peek(batch.key) !== batch || current.has(batch)) {
        continue;
      }
      // Not every lookup marks a batch as used, so this frame's batches are
      // moved to the newest end here.
      cache.get(batch.key);
      current.add(batch);
      currentBytes += batch.byteLength;
    }
    cache.expireCache();
    let bytes = 0;
    cache.forEach((batch) => {
      bytes += batch.byteLength;
    });
    const budget = Math.max(MAX_CACHE_BYTES, 2 * currentBytes);
    while (bytes > budget && !current.has(cache.peekLast())) {
      bytes -= cache.peekLast().byteLength;
      cache.deleteOldest();
    }
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @param {HTMLElement|null} target Target.
   * @return {HTMLElement} Canvas.
   * @override
   */
  renderFrame(frameState, target) {
    const helper = this.helper;
    const uniforms = this.uniforms_;
    if (!helper || !uniforms) {
      return /** @type {HTMLElement} */ (target);
    }
    this.preRender(frameState);
    this.disposeUncachedBatches_();
    const batches = this.collectBatches_(frameState);
    this.updateRetiredBatches_(batches, frameState.time || 0);
    this.renderedBatches_ = batches;
    this.declutterBatches_ = this.collectLabelBatches_(frameState, batches);
    if (!this.declutterGroup_) {
      // Without a declutter group nothing hides labels, so every one is drawn
      // at full opacity and only fades apply.
      if (this.cornerBuffer_) {
        const view = this.updateLabelView_(batches);
        this.updateIdentities_(frameState);
        const count = view.getCount();
        this.visibility_ = new Array(count).fill(true);
        if (this.updateOpacities_(frameState)) {
          frameState.animate = true;
        }
      }
    }
    // Every WebGPU layer on this canvas, including tile layers, paints in
    // renderDeferred when any layer declutters. Painting here would put this
    // layer under a decluttered layer below it, or over a tile layer above it.
    if (!frameState.declutter) {
      this.paintSorted_(frameState);
    }
    this.postRender(frameState);
    return helper.getCanvas();
  }

  /**
   * Draw the visible tiles, and fading labels from tiles that just left, in
   * one z-index order. Switching tiles rebinds that tile's grid and world offset.
   *
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @private
   */
  paintSorted_(frameState) {
    const helper = this.helper;
    const uniforms = this.uniforms_;
    if (!helper || !uniforms) {
      return;
    }
    helper.prepareDraw(frameState, false, this.getClearColor(frameState));
    uniforms.begin();
    /** @type {Array<import("./vectorUtil.js").PaintBatch>} */
    const entries = [];
    const view = this.labelView_;
    for (let i = 0; i < this.renderedBatches_.length; ++i) {
      const batch = this.renderedBatches_[i];
      const gpu = batch.getGpuBuffers(helper);
      const labels = this.cornerBuffer_ ? batch.getLabelRenderer(helper) : null;
      if (labels && this.opacities_) {
        labels.setOpacities(this.opacities_, view.starts[i] ?? 0);
      }
      const worldOffset = batch.worldOffset;
      entries.push({
        commands: batch.buffers.commands || [],
        tileOrder: i,
        gpu,
        labels,
        slot: this.cornerBuffer_
          ? labelUniforms(uniforms, frameState, batch.buffers, worldOffset)
          : null,
        prepare: () => {
          gpu.writeUniforms(
            helper,
            this.uniformData_,
            this.projMat_,
            frameState,
            0,
            worldOffset,
            batch.geometryClipExtents,
          );
        },
      });
    }
    if (this.cornerBuffer_) {
      // Tiles just outside the viewport still contribute labels. A polygon
      // label can sit on screen while its tile no longer intersects the view,
      // and that label wins declutter against the copy that would have been
      // drawn. Paint those labels without their geometry.
      const stillLabeling = new Set(this.declutterBatches_);
      for (
        let i = this.renderedBatches_.length;
        i < this.declutterBatches_.length;
        ++i
      ) {
        const batch = this.declutterBatches_[i];
        const labels = batch.getLabelRenderer(helper);
        if (this.opacities_) {
          labels.setOpacities(this.opacities_, view.starts[i] ?? 0);
        }
        entries.push({
          commands: batch.buffers.commands || [],
          tileOrder: i,
          gpu: null,
          labels,
          labelsOnly: true,
          slot: labelUniforms(
            uniforms,
            frameState,
            batch.buffers,
            batch.worldOffset,
          ),
          prepare: () => {},
        });
      }
      const currentIds = new Set(view.identities);
      let tileOrder = this.declutterBatches_.length;
      for (let r = 0; r < this.retiredBatches_.length; ++r) {
        const batch = this.retiredBatches_[r].batch;
        // This tile is still a label source. Fading it out would clear the
        // opacities just written above, and its replacement is itself.
        if (stillLabeling.has(batch)) {
          continue;
        }
        const identities = batch.labelIdentities;
        if (!identities) {
          continue;
        }
        const transitions = new Float32Array(identities.length * 3);
        for (let i = 0; i < identities.length; ++i) {
          writeGpuTransition(
            transitions,
            i * 3,
            currentIds.has(identities[i]) || batch.labelVisibility?.[i] !== true
              ? [0, 0, frameState.time || 0]
              : this.labelFade_.transition(identities[i]),
          );
        }
        const labels = batch.getLabelRenderer(helper);
        labels.setOpacities(transitions, 0);
        const order = tileOrder++;
        entries.push({
          commands: batch.buffers.commands || [],
          tileOrder: order,
          gpu: null,
          labels,
          labelsOnly: true,
          slot: labelUniforms(
            uniforms,
            frameState,
            batch.buffers,
            batch.worldOffset,
          ),
          prepare: () => {},
        });
      }
    }
    paintBatches(
      helper,
      entries,
      this.atlas_,
      this.imageAtlas_,
      this.cornerBuffer_,
      this.paintCache_,
    );
    helper.finalizeDraw(frameState);
  }

  /**
   * Paint this layer after placement, in ascending layer order.
   *
   * Layers without their own declutter group share this canvas. Drawing them
   * here keeps their geometry in map order, with symbols and labels above
   * that geometry and below any higher layer.
   *
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @override
   */
  renderDeferred(frameState) {
    if (!frameState.declutter) {
      return;
    }
    this.paintSorted_(frameState);
  }

  /**
   * Point the label view at the currently drawn tiles. The flat arrays only
   * hold references, so a tile coming or going costs one pass over the labels
   * rather than a rebuild of their geometry.
   *
   * @param {Array<TileBatch>} batches Batches.
   * @return {LabelView} View.
   * @private
   */
  updateLabelView_(batches) {
    let key = '';
    for (const batch of batches) {
      key += batch.key + '@' + batch.worldOffset + ';';
      if (batch.labelClipExtents) {
        for (const extent of batch.labelClipExtents) {
          key += extent.join(',') + ';';
        }
      }
    }
    if (key !== this.labelKey_) {
      this.labelView_.update(
        batches.map((batch) => ({
          buffers: batch.buffers,
          worldOffset: batch.worldOffset,
          labelClipExtents: batch.labelClipExtents,
        })),
      );
      this.labelKey_ = key;
      ++this.labelVersion_;
      this.opacities_ = new Float32Array(this.labelView_.getCount() * 3);
      this.activeOpacityIndices_.clear();
      // Tiles that were already on screen keep their placement. New labels
      // stay hidden until a complete pass accepts them.
      const visibility = [];
      for (const batch of batches) {
        const count = batch.buffers.labels.length;
        const previous = batch.labelVisibility;
        for (let i = 0; i < count; ++i) {
          visibility.push(previous ? previous[i] === true : false);
        }
      }
      this.visibility_ = visibility;
    }
    return this.labelView_;
  }

  /**
   * Add already-built neighboring tiles as label candidates without drawing
   * their geometry or initiating additional tile work. Their labels are drawn
   * with the rendered tiles.
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @param {Array<TileBatch>} rendered Rendered batches.
   * @return {Array<TileBatch>} Rendered and neighboring label batches.
   * @private
   */
  collectLabelBatches_(frameState, rendered) {
    const extent = frameState.extent;
    if (!extent) {
      return rendered;
    }
    const source = /** @type {import("../../source/VectorTile.js").default} */ (
      this.getLayer().getRenderSource()
    );
    const tileGrid = source.getTileGridForProjection(
      frameState.viewState.projection,
    );
    const z = tileGrid.getZForResolution(
      frameState.viewState.resolution,
      source.zDirection,
    );
    bufferExtent(
      extent,
      frameState.viewState.resolution * VIEWPORT_PADDING,
      this.labelExtent_,
    );
    const range = tileGrid.getTileRangeForExtentAndZ(
      this.labelExtent_,
      z,
      this.labelTileRange_,
    );
    const batches = rendered.slice();
    const added = new Set(rendered);
    const sourceKey = source.getKey();
    for (let x = range.minX; x <= range.maxX; ++x) {
      for (let y = range.minY; y <= range.maxY; ++y) {
        const renderKey = getCacheKey(source, sourceKey, z, x, y);
        if (!this.renderTiles_.containsKey(renderKey)) {
          continue;
        }
        const batch = this.renderBatchesByKey_.get(renderKey);
        // Batches of loading tiles are rebuilt every frame and not cached.
        if (!batch || !this.tileCache_.containsKey(batch.key)) {
          continue;
        }
        if (!added.has(batch)) {
          batch.labelClipExtents = null;
          batch.labelClipFrame = frameState.index;
          added.add(batch);
          batches.push(batch);
        }
      }
    }
    return batches;
  }

  /**
   * Remember each tile's share of the declutter result.
   * @private
   */
  storeVisibility_() {
    const starts = this.labelView_.starts;
    const visibility = this.visibility_;
    if (!visibility) {
      return;
    }
    for (let source = 0; source < this.declutterBatches_.length; ++source) {
      const start = starts[source] ?? 0;
      const count = this.declutterBatches_[source].buffers.labels.length;
      this.declutterBatches_[source].labelVisibility = visibility.slice(
        start,
        start + count,
      );
    }
  }

  /**
   * Turn visibility and fades into a per-label opacity, and tell the tiles to
   * re-upload only when the result actually changed.
   *
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @param {Array<boolean>|null} [previousVisibility] Previous placement.
   * @return {boolean} A fade is still running.
   * @private
   */
  updateOpacities_(frameState, previousVisibility) {
    const labels = this.labelView_.labels;
    const visibility = this.visibility_;
    if (!visibility) {
      return false;
    }
    const now = frameState.time || 0;
    const fading = this.labelFade_.update(
      labels,
      visibility,
      now,
      frameState.viewState.resolution * LABEL_FADE_MATCH_PIXELS,
      this.labelView_.identities,
    );
    // Each tile compares this against what it last uploaded, so during a pan
    // only the handful with a fade running write anything to the GPU.
    const opacities = this.opacities_;
    const active = activeLabelIndices(
      labels,
      visibility,
      previousVisibility,
      this.labelView_.identities,
    );
    const dirty = new Set(this.activeOpacityIndices_);
    for (const index of active) {
      dirty.add(index);
    }
    for (const i of dirty) {
      writeGpuTransition(
        opacities,
        i * 3,
        active.has(i)
          ? this.labelFade_.transition(
              this.labelView_.identities[i] ?? labels[i].id,
            )
          : [0, 0, 0],
      );
    }
    this.activeOpacityIndices_ = active;
    return fading;
  }

  /**
   * Keep outgoing label buffers for one fade interval without drawing their
   * geometry buffers.
   * @param {Array<TileBatch>} batches Current batches.
   * @param {number} now Frame time.
   * @private
   */
  updateRetiredBatches_(batches, now) {
    const current = new Set(batches);
    for (const batch of this.renderedBatches_) {
      // The last frame's batches stay in order for hit detection, so batches
      // disposed since then are skipped here instead of being removed.
      if (
        batch.isDisposed() ||
        current.has(batch) ||
        !batch.labelIdentities ||
        this.retiredBatches_.some((entry) => entry.batch === batch)
      ) {
        continue;
      }
      this.retiredBatches_.push({
        batch,
        until: now + LABEL_FADE_DURATION,
      });
    }
    this.retiredBatches_ = this.retiredBatches_.filter(
      (entry) => !current.has(entry.batch) && entry.until > now,
    );
  }

  /**
   * @param {Map<string, TileBatch>} map Map that refers to batches.
   * @param {string} key Key.
   * @param {TileBatch} batch Batch.
   * @private
   */
  setBatchReference_(map, key, batch) {
    if (map.get(key) === batch) {
      return;
    }
    map.set(key, batch);
    batch.references.push({map, key});
  }

  /**
   * A disposed batch must not stay reachable, or it would keep its features,
   * and fading its labels would upload them again without releasing them.
   * @param {TileBatch} batch Disposed batch.
   * @private
   */
  handleBatchDispose_(batch) {
    for (const {map, key} of batch.references) {
      // The key may refer to a newer batch by now.
      if (map.get(key) === batch) {
        map.delete(key);
      }
    }
    batch.references.length = 0;
    this.retiredBatches_ = this.retiredBatches_.filter(
      (entry) => entry.batch !== batch,
    );
  }

  /**
   * @private
   */
  disposeUncachedBatches_() {
    for (const batch of this.uncachedBatches_) {
      batch.dispose();
    }
    this.uncachedBatches_.length = 0;
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @param {import("../../layer/Layer.js").State} layerState Layer state.
   */
  renderDeclutter(frameState, layerState) {
    const helper = this.helper;
    const uniforms = this.uniforms_;
    if (!helper || !uniforms || !this.declutterGroup_ || !this.cornerBuffer_) {
      return;
    }
    const view = this.updateLabelView_(this.declutterBatches_);
    this.updateIdentities_(frameState);
    const previousVisibility = this.visibility_;
    const count = view.getCount();
    const now = frameState.time || 0;
    const key = placementKey(this.labelVersion_, frameState);
    const runPlacement = this.placement_.shouldRun(key, now, frameState);
    if (runPlacement) {
      const start = performance.now();
      const screenLabels = view.toScreen(frameState);
      this.visibility_ = resolveDeclutter(
        screenLabels,
        frameState.size[0],
        frameState.size[1],
        getDeclutterOccupancy(frameState, this.declutterGroup_),
        this.declutterStickyIds_,
      );
      this.declutterStickyIds_ = collectStickyIds(
        screenLabels,
        this.visibility_,
      );
      this.storeVisibility_();
      const duration = performance.now() - start;
      this.placement_.commit(key, now, duration, frameState);
    } else if (this.placement_.isDeferred(key, now, frameState)) {
      // Keep rendering so the deferred pass happens once the budget allows.
      frameState.animate = true;
    }
    if (!runPlacement && this.visibility_) {
      retainVisibleIdentities(
        this.visibility_,
        this.labelView_.identities,
        this.declutterStickyIds_,
        this.labelView_.worldOffsets,
      );
    }
    const previous = this.visibility_;
    if (!previous || previous.length !== count) {
      const visibility = new Array(count).fill(false);
      if (previous) {
        const carried = Math.min(count, previous.length);
        for (let i = 0; i < carried; ++i) {
          visibility[i] = previous[i];
        }
      }
      this.visibility_ = visibility;
    }
    const fading = this.updateOpacities_(frameState, previousVisibility);
    if (fading) {
      frameState.animate = true;
    }
  }

  /**
   * Assign identities only when the tile label set changes.
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @private
   */
  updateIdentities_(frameState) {
    if (this.identityVersion_ === this.labelVersion_) {
      return;
    }
    const extent = frameState.viewState.projection.getExtent();
    const existing = new Array(this.labelView_.getCount()).fill(undefined);
    for (let i = 0; i < this.declutterBatches_.length; ++i) {
      const identities = this.declutterBatches_[i].labelIdentities;
      const start = this.labelView_.starts[i] || 0;
      if (
        !identities ||
        identities.length !== this.declutterBatches_[i].buffers.labels.length
      ) {
        continue;
      }
      for (let j = 0; j < identities.length; ++j) {
        existing[start + j] = identities[j];
      }
    }
    this.labelView_.setIdentities(
      this.symbolIdentities_.update(
        this.labelView_.labels,
        this.labelView_.worldOffsets,
        frameState.viewState.resolution,
        extent ? getWidth(extent) : undefined,
        existing,
      ),
    );
    for (let i = 0; i < this.declutterBatches_.length; ++i) {
      const start = this.labelView_.starts[i] || 0;
      const count = this.declutterBatches_[i].buffers.labels.length;
      this.declutterBatches_[i].labelIdentities =
        this.labelView_.identities.slice(start, start + count);
    }
    this.identityVersion_ = this.labelVersion_;
  }

  /**
   * Walk the paint order from the top, across the tiles currently drawn.
   * Labels from tiles kept only for declutter are included. Geometry uses
   * containment. Icons and text use their label boxes.
   *
   * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {number} hitTolerance Hit tolerance.
   * @param {import("../vector.js").FeatureCallback<T>} callback Callback.
   * @param {Array<import("../Map.js").HitMatch<T>>} matches Matches.
   * @return {T|undefined} Result.
   * @template T
   * @override
   */
  forEachFeatureAtCoordinate(
    coordinate,
    frameState,
    hitTolerance,
    callback,
    matches,
  ) {
    if (!this.hitDetectionEnabled_) {
      return undefined;
    }
    /** @type {Array<import("./hitTest.js").HitItem>} */
    const items = [];
    const batchCount = this.declutterGroup_
      ? this.declutterBatches_.length
      : this.renderedBatches_.length;
    const batches = this.declutterGroup_
      ? this.declutterBatches_
      : this.renderedBatches_;
    for (let i = 0; i < batchCount; ++i) {
      const batch = batches[i];
      const commands = batch.buffers.commands || [];
      const labelsOnly = i >= this.renderedBatches_.length;
      for (let c = 0; c < commands.length; ++c) {
        const command = commands[c];
        if (
          labelsOnly &&
          command.pipeline !== 'glyph' &&
          command.pipeline !== 'symbol' &&
          command.pipeline !== 'icon'
        ) {
          continue;
        }
        items.push({
          command,
          buffers: batch.buffers,
          worldOffset: batch.worldOffset || 0,
          labelOffset: this.labelView_.starts[i] || 0,
          tileOrder: i,
        });
      }
    }
    const features = hitFeatures(
      items,
      coordinate,
      frameState,
      hitTolerance,
      this.visibility_,
      coordinate,
      (viewCoordinate) => viewCoordinate,
    );
    for (let i = 0; i < features.length; ++i) {
      const feature = features[i];
      const result = callback(
        feature,
        this.getLayer(),
        /** @type {import("../../geom/SimpleGeometry.js").default} */ (
          feature.getGeometry()
        ),
      );
      if (result) {
        return result;
      }
    }
    return undefined;
  }

  /**
   * Requests a frame for a finished batch. Unlike other `layer.changed()`
   * calls, this one does not discard the batches.
   * @private
   */
  redraw_() {
    const layer = this.getLayer();
    const upToDate = this.renderedLayerRevision_ === layer.getRevision();
    layer.changed();
    if (upToDate) {
      this.renderedLayerRevision_ = layer.getRevision();
    }
  }

  /**
   * @override
   */
  clearCache() {
    this.renderTiles_.clear();
    this.tileCache_.clear();
    this.renderBatchesByKey_.clear();
    this.styleCaches_.clear();
  }

  /**
   * Rebuild labels after a font has loaded, so they no longer use glyphs and
   * metrics of a fallback font.
   * @override
   */
  handleFontsChanged() {
    startFontAtlasOver(this.atlas_, this.getLayer());
  }

  /**
   * @override
   */
  disposeInternal() {
    this.disposeUncachedBatches_();
    this.tileCache_.clear();
    this.renderBatchesByKey_.clear();
    this.styleCaches_.clear();
    this.uniforms_?.dispose();
    this.uniforms_ = null;
    this.cornerBuffer_?.destroy();
    this.cornerBuffer_ = null;
    this.imageAtlas_.clear();
    this.atlas_.clear();
    super.disposeInternal();
  }
}

export default WebGPUVectorTileLayerRenderer;
