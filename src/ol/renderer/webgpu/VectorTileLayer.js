/**
 * @module ol/renderer/webgpu/VectorTileLayer
 */
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
} from '../../render/webgpu/buffers.js';
import {
  collectStickyIds,
  resolveDeclutter,
  stickyIdsForView,
  VIEWPORT_PADDING,
} from '../../render/webgpu/declutter.js';
import {buildGeometryBuffers} from '../../render/webgpu/geometryBuffers.js';
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
import {
  countMetric,
  endMetric,
  maxMetric,
  metricsEnabled,
  startMetric,
} from '../../webgpu/metrics.js';
import {hitFeatures} from './hitTest.js';
import LabelRenderer from './LabelRenderer.js';
import LabelView from './LabelView.js';
import WebGPULayerRenderer from './Layer.js';
import {
  createVectorPipelines,
  FRAME_UNIFORM_SIZE,
  FrameUniformPool,
  labelUniforms,
  paintBatches,
  placementKey,
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
 * Flat styles always use the feature geometry. Classic styles can be filtered
 * early when none specifies an alternate geometry.
 * @param {*} style Layer style.
 * @return {boolean} Safe to filter by the feature geometry extent.
 */
function usesFeatureGeometry(style) {
  if (typeof style === 'function') {
    return false;
  }
  if (!Array.isArray(style)) {
    return !style?.getGeometry || style.getGeometry() === null;
  }
  if (!style.length || typeof style[0]?.getFill !== 'function') {
    return true;
  }
  return style.every((item) => item.getGeometry() === null);
}

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
   */
  constructor(key, worldOffset, buffers) {
    super();

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
  }

  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @return {VectorGpuBuffers} Persistent geometry, uploaded on first use.
   */
  getGpuBuffers(helper) {
    if (!this.gpu_) {
      const start = startMetric();
      this.gpu_ = new VectorGpuBuffers(helper, this.buffers);
      endMetric('gpuGeometryUpload', start);
      countMetric('gpuGeometryUploads');
    }
    return this.gpu_;
  }

  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @return {LabelRenderer} This tile's labels, uploaded on first use.
   */
  getLabelRenderer(helper) {
    if (!this.labels_) {
      const start = startMetric();
      this.labels_ = new LabelRenderer();
      this.labels_.setLabels(helper, this.buffers);
      endMetric('gpuLabelUpload', start);
      countMetric('gpuLabelUploads');
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
     * @private
     * @type {boolean}
     */
    this.featureExtentFilter_ = usesFeatureGeometry(options.style);

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
     * @private
     * @type {WeakSet<import("../../style/Image.js").default>}
     */
    this.loadingImages_ = new WeakSet();

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
     * Scratch for per-batch uniform writes.
     * @private
     * @type {Float32Array}
     */
    this.uniformData_ = new Float32Array(FRAME_UNIFORM_SIZE / 4);

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
     * Main-thread feature preparation allowed in the current frame. Expensive
     * cache misses wait until a gesture or view animation has finished, and
     * are then admitted one at a time as worker completions request frames.
     * @private
     * @type {number}
     */
    this.batchBuildBudget_ = 1;

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
     * @type {number|undefined}
     */
    this.declutterResolution_;

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
    this.imageAtlas_.dispose();
    this.tileCache_.clear();
    this.labelKey_ = '';
    this.placement_.reset();
    this.cornerBuffer_ = helper.createBuffer(
      new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
      GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    );
    createVectorPipelines(helper);
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @return {boolean} Ready.
   * @override
   */
  prepareFrameInternal(frameState) {
    // `layer.changed()` rebuilds the tile batches, e.g. for a style function
    // that depends on external state.
    const revision = this.getLayer().getRevision();
    if (this.renderedLayerRevision_ !== revision) {
      this.renderedLayerRevision_ = revision;
      ++this.batchGeneration_;
      this.tileCache_.clear();
    }
    const source = this.getLayer().getRenderSource();
    return !!source && source.getState() === 'ready';
  }

  /**
   * Rebuild cached tile batches when an image style becomes available.
   *
   * @param {Array<import("../../style/Image.js").default>} images Images.
   * @private
   */
  watchImages_(images) {
    for (const image of images) {
      if (this.loadingImages_.has(image)) {
        continue;
      }
      this.loadingImages_.add(image);
      image.ready().then(() => {
        this.loadingImages_.delete(image);
        if (!this.disposed) {
          this.getLayer().changed();
        }
      });
    }
  }

  /**
   * Build a GPU batch for a render tile that has at least one loaded source tile.
   * @param {import("../../VectorRenderTile.js").default} tile Render tile.
   * @param {import("../../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("../../View.js").State} viewState View state used to evaluate styles.
   * @param {number} pixelRatio Device pixel ratio.
   * @return {TileBatch|null} Batch, or null if nothing is ready to draw.
   * @private
   */
  getBatch_(tile, tileCoord, viewState, pixelRatio) {
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
    let cacheKey = getTileCoordKey(tileCoord) + '/' + tile.key + '/' + dpr;
    if (reuseSourceBatch) {
      // One subdivision above the source zoom avoids styling a full dense
      // source tile while still reusing work across deeper overzoom children.
      const batchZ = Math.min(tileCoord[0], sourceTileCoord[0] + 1);
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
        worldOffset;
    }
    const cacheable = tile.getState() === TileState.LOADED;
    if (cacheable && this.tileCache_.containsKey(cacheKey)) {
      countMetric(reuseSourceBatch ? 'sourceBatchCacheHits' : 'batchCacheHits');
      return this.tileCache_.get(cacheKey);
    }
    if (this.pendingKeys_.has(cacheKey)) {
      countMetric('pendingBatchHits');
      return null;
    }
    if (this.batchBuildBudget_ === 0) {
      countMetric('deferredBatchBuilds');
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
    if (reuseSourceBatch && this.featureExtentFilter_ && clipExtent) {
      const filterExtent = bufferExtent(
        clipExtent,
        viewState.resolution * VIEWPORT_PADDING,
        clipExtent.slice(),
      );
      buildFeatures = features.filter((feature) => {
        const geometry = feature.getGeometry();
        return geometry && intersects(geometry.getExtent(), filterExtent);
      });
      countMetric('filteredFeatures', features.length - buildFeatures.length);
    }
    countMetric('batchBuilds');
    countMetric('batchSourceTileRefs', sourceTiles.length);
    const sourceZ = sourceTiles.reduce(
      (value, sourceTile) => Math.max(value, sourceTile.tileCoord?.[0] ?? -1),
      -1,
    );
    if (sourceZ >= 0 && tileCoord[0] > sourceZ) {
      countMetric('overzoomBatchBuilds');
      countMetric('overzoomLevels', tileCoord[0] - sourceZ);
    }
    if (reuseSourceBatch) {
      countMetric('sourceBatchBuilds');
    }
    const {request, labelData} = buildVectorRequest(
      buildFeatures,
      this.styleFunction_,
      viewState.resolution,
      this.atlas_,
      clipExtent ? {clipExtent} : undefined,
      dpr,
      viewState.zoom,
      undefined,
      this.imageAtlas_,
    );
    this.watchImages_(labelData.pendingImageStyles);

    // Tessellation is the expensive part, so hand it to a worker when the tile
    // will still be around to receive it. Until it comes back the renderer
    // falls back to parent or child tiles, exactly as for a loading tile.
    const pending = cacheable ? getWorkerPool().build(request) : null;
    if (pending) {
      const generation = this.batchGeneration_;
      this.pendingKeys_.add(cacheKey);
      maxMetric('pendingBatchDepth', this.pendingKeys_.size);
      pending
        .then((geometry) => {
          this.pendingKeys_.delete(cacheKey);
          countMetric('completedBatchBuilds');
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
              ),
            );
          }
          if (!this.batchChangeScheduled_) {
            this.batchChangeScheduled_ = true;
            requestAnimationFrame(() => {
              this.batchChangeScheduled_ = false;
              if (!this.disposed) {
                this.redraw_();
              }
            });
          }
        })
        .catch(() => {
          this.pendingKeys_.delete(cacheKey);
        });
      return null;
    }

    const metricStart = startMetric();
    const geometry = buildGeometryBuffers(request);
    endMetric('mainThreadGeometry', metricStart);
    const batch = new TileBatch(
      cacheKey,
      worldOffset,
      combineVectorBuffers(geometry, labelData),
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
   * @param {Set<string>} added Render keys already queued for drawing.
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
    added,
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
        if (added.has(renderKey)) {
          continue;
        }
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
   * @private
   */
  commitAltTiles_(items, added, batches) {
    for (const item of items) {
      if (added.has(item.renderKey)) {
        continue;
      }
      added.add(item.renderKey);
      batches.push(item.batch);
      countMetric('fallbackBatches');
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
    this.batchBuildBudget_ =
      viewHints[ViewHint.ANIMATING] || viewHints[ViewHint.INTERACTING] ? 0 : 1;
    const tileGrid = source.getTileGridForProjection(viewState.projection);
    const z = tileGrid.getZForResolution(
      viewState.resolution,
      source.zDirection,
    );
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
    const measuredSourceTiles = metricsEnabled() ? new Set() : null;
    let measuredRenderTiles = 0;

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
      if (measuredSourceTiles) {
        ++measuredRenderTiles;
        for (const sourceTile of tile.sourceTiles || []) {
          measuredSourceTiles.add(sourceTile.getKey());
        }
      }
    }

    for (const entry of entries) {
      const batch = prepared.get(entry.renderKey);
      if (batch) {
        added.add(entry.renderKey);
        batches.push(batch);
        continue;
      }
      holes.push([z, entry.x, entry.y]);
    }

    const minZoom = tileGrid.getMinZoom();
    for (const hole of holes) {
      const children = this.findAltTiles_(
        tileGrid,
        hole,
        hole[0] + 1,
        source,
        sourceKey,
        viewState,
        frameState.pixelRatio,
        added,
      );
      if (children.covered) {
        this.commitAltTiles_(children.items, added, batches);
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
          added,
        );
        if (parents.covered) {
          this.commitAltTiles_(parents.items, added, batches);
          usedParent = true;
          break;
        }
      }
      if (!usedParent) {
        this.commitAltTiles_(children.items, added, batches);
      }
    }

    this.renderTiles_.highWaterMark = Math.max(
      this.renderTiles_.highWaterMark,
      Object.keys(wantedTiles).length * 2,
    );
    this.renderTiles_.expireCache();
    this.tileCache_.expireCache();
    if (measuredSourceTiles) {
      countMetric('renderTilesConsidered', measuredRenderTiles);
      countMetric('distinctSourceTiles', measuredSourceTiles.size);
      maxMetric(
        'renderTilesPerSourceTile',
        measuredRenderTiles / Math.max(1, measuredSourceTiles.size),
      );
    }
    const unique = [];
    const batchKeys = new Set();
    for (const batch of batches) {
      if (batchKeys.has(batch.key)) {
        countMetric('deduplicatedBatches');
        continue;
      }
      batchKeys.add(batch.key);
      unique.push(batch);
    }
    maxMetric('visibleBatches', unique.length);
    return unique;
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
    );
    helper.finalizeDraw(frameState);
  }

  /**
   * Paint a decluttered layer after placement, in ascending layer order.
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @override
   */
  renderDeferred(frameState) {
    if (!this.declutterGroup_) {
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
    }
    if (key !== this.labelKey_) {
      const start = startMetric();
      this.labelView_.update(
        batches.map((batch) => ({
          buffers: batch.buffers,
          worldOffset: batch.worldOffset,
        })),
      );
      endMetric('updateLabelView', start);
      this.labelKey_ = key;
      ++this.labelVersion_;
      this.opacities_ = new Float32Array(this.labelView_.getCount() * 3);
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
    const dpr = frameState.pixelRatio > 0 ? frameState.pixelRatio : 1;
    for (let x = range.minX; x <= range.maxX; ++x) {
      for (let y = range.minY; y <= range.maxY; ++y) {
        const renderKey = getCacheKey(source, sourceKey, z, x, y);
        if (!this.renderTiles_.containsKey(renderKey)) {
          continue;
        }
        const tile = this.renderTiles_.get(renderKey);
        const cacheKey =
          getTileCoordKey(tile.tileCoord) + '/' + tile.key + '/' + dpr;
        if (!this.tileCache_.containsKey(cacheKey)) {
          continue;
        }
        const batch = this.tileCache_.get(cacheKey);
        if (!added.has(batch)) {
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
    for (let i = 0; i < labels.length; ++i) {
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
      if (
        !current.has(batch) &&
        batch.labelIdentities &&
        !this.retiredBatches_.some((entry) => entry.batch === batch)
      ) {
        this.retiredBatches_.push({
          batch,
          until: now + LABEL_FADE_DURATION,
        });
      }
    }
    this.retiredBatches_ = this.retiredBatches_.filter(
      (entry) => !current.has(entry.batch) && entry.until > now,
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
    const resolution = frameState.viewState.resolution;
    const now = frameState.time || 0;
    const key = placementKey(this.labelVersion_, frameState);
    const runPlacement = this.placement_.shouldRun(key, now, frameState);
    if (runPlacement) {
      const start = performance.now();
      const screenLabels = view.toScreen(frameState);
      const stickyIds = stickyIdsForView(
        this.declutterResolution_,
        resolution,
        this.declutterStickyIds_,
      );
      this.visibility_ = resolveDeclutter(
        screenLabels,
        8,
        frameState.size[0],
        frameState.size[1],
        this.declutterGroup_,
        frameState.index,
        stickyIds,
      );
      this.declutterResolution_ = resolution;
      this.declutterStickyIds_ = collectStickyIds(
        screenLabels,
        this.visibility_,
      );
      this.storeVisibility_();
      const duration = performance.now() - start;
      endMetric('placement', start);
      countMetric('placementCommits');
      this.placement_.commit(key, now, duration, frameState);
    } else if (this.placement_.isDeferred(key, now, frameState)) {
      // Keep rendering so the deferred pass happens once the budget allows.
      frameState.animate = true;
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
    this.labelView_.setIdentities(
      this.symbolIdentities_.update(
        this.labelView_.labels,
        this.labelView_.worldOffsets,
        frameState.viewState.resolution,
        extent ? getWidth(extent) : undefined,
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
  }

  /**
   * @override
   */
  disposeInternal() {
    this.disposeUncachedBatches_();
    this.tileCache_.clear();
    this.uniforms_?.dispose();
    this.uniforms_ = null;
    this.imageAtlas_.dispose();
    super.disposeInternal();
  }
}

export default WebGPUVectorTileLayerRenderer;
