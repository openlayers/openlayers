/**
 * @module ol/renderer/webgpu/VectorLayer
 */
import {listen, unlistenByKey} from '../../events.js';
import EventType from '../../events/EventType.js';
import {
  buffer,
  containsExtent,
  createEmpty,
  getHeight,
  getWidth,
} from '../../extent.js';
import {
  get as getProjection,
  getTransform,
  getUserProjection,
  toUserExtent,
  toUserResolution,
} from '../../proj.js';
import {
  buildVectorRequest,
  combineVectorBuffers,
} from '../../render/webgpu/buffers.js';
import {
  collectStickyIds,
  getDeclutterOccupancy,
  resolveDeclutter,
} from '../../render/webgpu/declutter.js';
import {buildGeometryBuffers} from '../../render/webgpu/geometryBuffers.js';
import {
  activeLabelIndices,
  LABEL_FADE_MATCH_PIXELS,
  LabelFade,
  writeGpuTransition,
} from '../../render/webgpu/labelFade.js';
import {LOCAL_EXTENT} from '../../render/webgpu/localGrid.js';
import {PlacementScheduler} from '../../render/webgpu/placement.js';
import {compileStyle} from '../../render/webgpu/style.js';
import {SymbolIdentityIndex} from '../../render/webgpu/symbolIdentity.js';
import {buildWarpGrid, warpGridKey} from '../../render/webgpu/warpGrid.js';
import {getWorkerPool} from '../../render/webgpu/workerPool.js';
import {getUid} from '../../util.js';
import ViewHint from '../../ViewHint.js';
import FontAtlas from '../../webgpu/FontAtlas.js';
import ImageAtlas from '../../webgpu/ImageAtlas.js';
import {
  clipExtentToProjection,
  estimateSourceExtent,
  needsReprojection,
  poleInView,
  sourceResolutionForView,
  viewCoordinateToSource,
} from '../../webgpu/reproj.js';
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
 */

/**
 * @param {import("../../style/flat.js").StyleVariables} variables Variables.
 * @return {string} Cache key.
 */
function variablesKey(variables) {
  let key = '';
  for (const name in variables) {
    key += name + ':' + String(variables[name]) + ';';
  }
  return key;
}

/**
 * Pixel buffer around the view used when loading and querying features.
 * Matches {@link module:ol/layer/BaseVector} default `renderBuffer`.
 */
const RENDER_BUFFER = 100;

/**
 * Extra headroom around the view, as a fraction of the larger view dimension,
 * included when buffers are built. Panning and zooming within the result needs
 * no rebuild.
 */
const BUILD_HEADROOM = 0.25;

/**
 * The extent that buffers are built for: the view plus headroom, so small view
 * changes stay inside it.
 *
 * @param {import("../../extent.js").Extent} viewExtent View extent.
 * @param {number} resolution View resolution.
 * @return {import("../../extent.js").Extent} Build extent.
 */
function getBuildExtent(viewExtent, resolution) {
  const size = Math.max(getWidth(viewExtent), getHeight(viewExtent));
  return buffer(viewExtent, RENDER_BUFFER * resolution + size * BUILD_HEADROOM);
}

/**
 * Resolution bucket, one step per zoom level. Reprojection densification and
 * resolution-dependent styles are rebuilt when this changes, rather than on
 * every resolution change.
 *
 * @param {number} resolution Resolution.
 * @return {number} Bucket.
 */
function resolutionBucket(resolution) {
  return resolution > 0 ? Math.round(Math.log2(resolution)) : 0;
}

/**
 * @param {import("../../Map.js").FrameState} frameState Frame state.
 * @return {boolean} The view is neither animating nor being interacted with.
 */
function viewNotMoving(frameState) {
  return (
    !frameState.viewHints[ViewHint.ANIMATING] &&
    !frameState.viewHints[ViewHint.INTERACTING]
  );
}

/**
 * Keep geometries in a fixed feature CRS so a view CRS change does not mutate
 * coordinates. Matches the webgl-reproj VectorLayer approach.
 *
 * @param {import("../../source/Vector.js").default} source Source.
 * @param {import("../../Map.js").FrameState} frameState Frame.
 */
function ensureFeatureProjection(source, frameState) {
  if (source.getProjection()) {
    return;
  }
  const format = /** @type {any} */ (source).getFormat?.();
  const dataProjection = format?.dataProjection
    ? getProjection(format.dataProjection)
    : null;
  if (dataProjection) {
    source.setProjection(dataProjection);
  }
}

/**
 * Ask the vector source to load features for the current view (URL / bbox
 * strategies). When the view CRS differs from the source, the query is in the
 * source CRS.
 *
 * @param {import("../../source/Vector.js").default} source Source.
 * @param {import("../../Map.js").FrameState} frameState Frame state.
 * @param {import("../../extent.js").Extent} buffered Extent to load for.
 * @return {import("../../extent.js").Extent|null} Query extent in the source's projection.
 */
function loadSourceFeatures(source, frameState, buffered) {
  if (typeof source.loadFeatures !== 'function') {
    return null;
  }
  const viewState = frameState.viewState;
  const sourceProj = source.getProjection();
  const viewProj = viewState.projection;
  let queryExtent = buffered;
  let queryResolution = viewState.resolution;
  let queryProj = viewProj;
  if (needsReprojection(source, viewProj) && sourceProj) {
    const sourceExtent = estimateSourceExtent(buffered, sourceProj, viewProj);
    if (sourceExtent) {
      queryExtent = sourceExtent;
      queryResolution = sourceResolutionForView(
        sourceProj,
        viewProj,
        viewState.center,
        viewState.resolution,
        buffered,
      );
      queryProj = sourceProj;
    }
  }
  const userProjection = getUserProjection();
  if (userProjection) {
    const userExtent = toUserExtent(queryExtent, queryProj);
    source.loadFeatures(
      userExtent,
      toUserResolution(queryResolution, queryProj),
      userProjection,
    );
    return userExtent;
  }
  source.loadFeatures(queryExtent, queryResolution, queryProj);
  return queryExtent;
}

/**
 * How much wider than the view's own the source extent may grow before the
 * padding is dropped.
 * @type {number}
 */
const SOURCE_GROWTH_LIMIT = 2;

/**
 * The extent to build geometry for.
 *
 * Building for more than the view shows lets panning reuse the geometry, but
 * the padding is measured on screen and paid for in the source projection.
 * Near a pole those are wildly different: a quarter of a view further south
 * reaches the latitudes where every meridian converges, and the source extent
 * grows from a fraction of the world to most of it. Geometry is quantised
 * across whatever that extent turns out to be, so paying for the padding costs
 * the precision the fill is drawn with. Where it does, the view alone is built
 * for and panning rebuilds.
 *
 * @param {import("../../source/Vector.js").default} source Source.
 * @param {import("../../Map.js").FrameState} frameState Frame.
 * @param {import("../../extent.js").Extent} onScreen Extent the view shows.
 * @return {import("../../extent.js").Extent} Extent to build for.
 */
function chooseBuildExtent(source, frameState, onScreen) {
  const padded = getBuildExtent(onScreen, frameState.viewState.resolution);
  const sourceProj = source.getProjection();
  const viewProj = frameState.viewState.projection;
  if (!needsReprojection(source, viewProj) || !sourceProj) {
    return padded;
  }
  const forPadded = estimateSourceExtent(
    padded,
    sourceProj,
    viewProj,
    undefined,
    onScreen,
  );
  const forScreen = estimateSourceExtent(
    onScreen,
    sourceProj,
    viewProj,
    undefined,
    onScreen,
  );
  if (!forPadded || !forScreen) {
    return padded;
  }
  return getWidth(forPadded) > getWidth(forScreen) * SOURCE_GROWTH_LIMIT
    ? onScreen
    : padded;
}

/**
 * Which poles a view shows, as a key to compare frames by.
 *
 * @param {import("../../extent.js").Extent} extent View extent.
 * @param {import("../../proj/Projection.js").default} viewProj View projection.
 * @return {string} Empty when neither pole is on screen.
 */
function polesInView(extent, viewProj) {
  return [90, -90]
    .filter((latitude) => poleInView(latitude, extent, viewProj))
    .join(',');
}

/**
 * The features to build for an extent, each one once.
 *
 * A source that wraps answers an extent reaching past the edge of the world by
 * querying its index once per world the extent covers, so a feature wide enough
 * to appear in two of them comes back twice. Building it twice draws it twice,
 * which is invisible under an opaque style and doubles the alpha under a
 * translucent one.
 *
 * @param {import("../../source/Vector.js").default} source Source.
 * @param {import("../../extent.js").Extent} extent Extent to query.
 * @param {import("../../proj/Projection.js").default} projection Feature projection.
 * @return {Array<import("../../Feature.js").default>} Features.
 */
export function featuresForExtent(source, extent, projection) {
  if (!source.getFeaturesInExtent) {
    return source.getFeatures();
  }
  // slice(), because a source with wrapX shifts the extent in place.
  const features = source.getFeaturesInExtent(extent.slice(), projection);
  return features.length > 1 ? Array.from(new Set(features)) : features;
}

/**
 * How geometry should be tessellated, and how it will be warped afterwards.
 *
 * Geometry is built in the source projection and subdivided finely enough that
 * the GPU warp can bend it; the projection itself never runs per vertex here.
 *
 * @param {import("../../source/Vector.js").default} source Source.
 * @param {import("../../Map.js").FrameState} frameState Frame.
 * @param {import("../../extent.js").Extent} viewExtent Extent geometry is built for.
 * @param {import("../../extent.js").Extent} onScreen Extent the view actually shows.
 * @return {{tessellate: import("../../render/webgpu/tessellate.js").TessellateOptions, warp: WarpSetup|null}|null} Plan.
 */
function getBuildPlan(source, frameState, viewExtent, onScreen) {
  const viewState = frameState.viewState;
  const viewProj = viewState.projection;
  const sourceProj = source.getProjection();
  const transformFn =
    needsReprojection(source, viewProj) && sourceProj
      ? getTransform(sourceProj, viewProj)
      : null;

  if (!transformFn || !sourceProj) {
    // Source and view agree, so the clip extent doubles as the local grid.
    return {tessellate: {clipExtent: viewExtent}, warp: null};
  }

  // Geometry is clipped to this extent and quantized against it, so it has to
  // cover everything the view can see and stay inside the source's own world.
  // Geometry is built for more than the view shows so panning need not rebuild
  // it. Whether a pole is on screen is judged by the view alone: a pole just
  // outside it would widen the extent to every longitude, and a batch that
  // wide loses the precision its grid is quantised to.
  const estimated = estimateSourceExtent(
    viewExtent,
    sourceProj,
    viewProj,
    undefined,
    onScreen,
  );
  const sourceExtent =
    estimated &&
    clipExtentToProjection(estimated, sourceProj, sourceProj.canWrapX());
  if (!sourceExtent) {
    return null;
  }
  const sourceResolution = sourceResolutionForView(
    sourceProj,
    viewProj,
    viewState.center,
    viewState.resolution,
    viewExtent,
  );
  // Subdivision granularity follows the zoom, as tile renderers do: coarser
  // when zoomed out, finer as the view closes in.
  const bucket = Math.pow(2, Math.round(Math.log2(sourceResolution) || 0));
  // Geometry is quantised onto a grid spanning the clip extent, so densifying
  // below one step of it cannot add anything: the points land on the
  // coordinate their neighbours already have. Without the floor, a resolution
  // that comes out near zero asks for an unbounded number of them.
  const gridStep =
    Math.max(getWidth(sourceExtent), getHeight(sourceExtent)) / LOCAL_EXTENT;
  const sourceWorld = sourceProj.getExtent();
  const worldWidth =
    sourceProj.canWrapX() && sourceWorld ? getWidth(sourceWorld) : 0;
  const viewCut = Math.min(getWidth(viewExtent), getHeight(viewExtent));

  return {
    tessellate: {
      clipExtent: sourceExtent,
      maxSegmentLength: Math.max(bucket * 8, gridStep),
      maxSpanX: worldWidth > 0 ? worldWidth * 0.5 : 0,
      worldWidth,
    },
    warp: {
      extent: sourceExtent,
      sourceProj,
      targetProj: viewProj,
      maxEdge: viewCut > 0 ? viewCut : 0,
      projectToTarget: (coord) => {
        const projected = transformFn(coord);
        if (!projected || !isFinite(projected[0]) || !isFinite(projected[1])) {
          return null;
        }
        return [projected[0], projected[1]];
      },
    },
  };
}

/**
 * @typedef {Object} WarpSetup
 * @property {import("../../extent.js").Extent} extent Source extent the grid covers.
 * @property {import("../../proj/Projection.js").default} sourceProj Source projection.
 * @property {import("../../proj/Projection.js").default} targetProj Target projection.
 * @property {number} maxEdge Target distance treated as a projection cut.
 * @property {function(import("../../coordinate.js").Coordinate): (import("../../coordinate.js").Coordinate|null)} projectToTarget Source to target.
 */

/**
 * @classdesc
 * WebGPU vector renderer with decluttering for text and symbols.
 * @extends {WebGPULayerRenderer<import("../../layer/Layer.js").default>}
 */
class WebGPUVectorLayerRenderer extends WebGPULayerRenderer {
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
     * @type {import("../../style/flat.js").StyleVariables}
     */
    this.variables_ = options.variables || {};

    /**
     * @private
     * @type {string}
     */
    this.renderedVariablesKey_ = '';

    /**
     * Layer revision the buffers were built for, so `layer.changed()` rebuilds
     * them, e.g. for a style function that depends on external state.
     * @private
     * @type {number}
     */
    this.renderedLayerRevision_ = -1;

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

    /**
     * @private
     * @type {boolean}
     */
    this.imageChangeScheduled_ = false;

    /**
     * @private
     * @type {import("../../render/webgpu/buffers.js").VectorBuffers|null}
     */
    this.buffers_ = null;

    /**
     * @private
     * @type {VectorGpuBuffers|null}
     */
    this.gpu_ = null;

    /**
     * @private
     * @type {number}
     */
    this.renderedResolutionBucket_ = NaN;

    /**
     * Incremented per rebuild so a worker result that arrives after a newer
     * rebuild started can be dropped.
     * @private
     * @type {number}
     */
    this.buildGeneration_ = 0;

    /**
     * Incremented when a new label set is installed, not when a rebuild is
     * merely scheduled. `buildGeneration_` moves first, while the previous
     * labels are still on screen; keying placement off that makes the pass
     * look up to date once the worker result arrives and the view has stopped.
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
     * @type {boolean}
     */
    this.buildPending_ = false;

    /**
     * How the next batch should be warped, if at all.
     * @private
     * @type {WarpSetup|null}
     */
    this.pendingWarp_ = null;

    /**
     * @private
     * @type {import("../../render/webgpu/warpGrid.js").WarpGrid|null}
     */
    this.warpGrid_ = null;

    /**
     * @private
     * @type {string}
     */
    this.warpKey_ = '';

    /**
     * @private
     * @type {string}
     */
    this.renderedPoles_ = '';

    /**
     * @private
     * @type {number}
     */
    this.sourceRevision_ = -1;

    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    this.renderedExtent_ = createEmpty();

    /**
     * @private
     * @type {import("../../proj/Projection.js").default|null}
     */
    this.renderedProjection_ = null;

    /**
     * @private
     * @type {number}
     */
    this.renderedPixelRatio_ = 0;

    /**
     * @private
     * @type {import("../../render.js").OrderFunction|null|undefined}
     */
    this.renderedRenderOrder_ = undefined;

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
     * Scratch for the batch uniform write.
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
     * @private
     * @type {import("../../events.js").EventsKey|undefined}
     */
    this.sourceListenKey_;

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
     * @type {LabelRenderer}
     */
    this.labels_ = new LabelRenderer();

    /**
     * @private
     * @type {LabelView}
     */
    this.labelView_ = new LabelView();

    /**
     * @private
     * @type {import("../../render/webgpu/buffers.js").VectorBuffers|null}
     */
    this.labelBuffers_ = null;

    /**
     * @private
     * @type {Float32Array}
     */
    this.opacities_ = new Float32Array(0);

    /**
     * @private
     * @type {PlacementScheduler}
     */
    this.placement_ = new PlacementScheduler();
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
    this.gpu_?.dispose();
    this.gpu_ = null;
    this.labels_.clear();
    this.labelBuffers_ = null;
    this.placement_.reset();
    this.cornerBuffer_?.destroy();
    this.cornerBuffer_ = helper.createBuffer(
      new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
      GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    );
    createVectorPipelines(helper);
    const source = this.getLayer().getSource();
    if (source && !this.sourceListenKey_) {
      this.sourceListenKey_ = listen(
        source,
        EventType.CHANGE,
        () => {
          this.releaseBuffers_();
          this.getLayer().changed();
        },
        this,
      );
    }
  }

  /**
   * @return {boolean} Work is pending.
   * @override
   */
  hasPendingWork() {
    return (
      this.buildPending_ ||
      this.imageChangeScheduled_ ||
      Object.keys(this.loadingImages_).length > 0
    );
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Ready.
   * @override
   */
  prepareFrameInternal(frameState) {
    if (
      hasUnusedAtlasPages(this.atlas_, frameState, () =>
        this.buffers_ ? [atlasPages(this.buffers_.glyphs)] : [],
      )
    ) {
      startFontAtlasOver(this.atlas_, this.getLayer());
    }
    if (this.imageAtlas_.isFull()) {
      startImageAtlasOver(this.imageAtlas_, this.getLayer());
    }
    const source =
      /** @type {import("../../source/Vector.js").default|null} */ (
        this.getLayer().getSource()
      );
    if (!source) {
      return false;
    }
    ensureFeatureProjection(source, frameState);
    const extent = frameState.extent;
    if (extent) {
      loadSourceFeatures(
        source,
        frameState,
        getBuildExtent(extent, frameState.viewState.resolution),
      );
    }
    return true;
  }

  /**
   * @private
   */
  releaseBuffers_() {
    this.buffers_ = null;
    this.gpu_?.dispose();
    this.gpu_ = null;
  }

  /**
   * Whether the geometry on hand no longer matches what should be drawn. The
   * view extent only counts when it leaves the extent buffers were built for,
   * and resolution only counts once it crosses a zoom level, so panning and
   * zooming reuse the same buffers.
   *
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @return {boolean} Buffers should be rebuilt.
   * @private
   */
  needsRebuild_(frameState) {
    if (!this.buffers_) {
      return true;
    }
    const source = this.getLayer().getSource();
    if (source && source.getRevision() !== this.sourceRevision_) {
      return true;
    }
    const viewState = frameState.viewState;
    if (
      this.renderedProjection_ !== viewState.projection ||
      this.renderedPixelRatio_ !== frameState.pixelRatio ||
      this.renderedRenderOrder_ !== this.renderOrder_() ||
      this.renderedVariablesKey_ !== variablesKey(this.variables_) ||
      this.renderedLayerRevision_ !== this.getLayer().getRevision() ||
      this.renderedResolutionBucket_ !== resolutionBucket(viewState.resolution)
    ) {
      return true;
    }
    const extent = frameState.extent;
    if (!extent || !containsExtent(this.renderedExtent_, extent)) {
      return true;
    }
    return this.renderedPoles_ !== polesInView(extent, viewState.projection);
  }

  /**
   * The sampled projection for a warp setup, built once and reused. Sampling
   * is the only proj4 work left in the vector path, and it happens per grid
   * rather than per vertex.
   *
   * @param {WarpSetup} setup Warp setup.
   * @return {import("../../render/webgpu/warpGrid.js").WarpGrid} Grid.
   * @private
   */
  warpGridFor_(setup) {
    const key = warpGridKey(
      null,
      setup.extent,
      setup.sourceProj,
      setup.targetProj,
    );
    if (key !== this.warpKey_ || !this.warpGrid_) {
      this.warpGrid_ = buildWarpGrid(
        setup.extent,
        setup.projectToTarget,
        setup.maxEdge,
      );
      this.warpKey_ = key;
    }
    return this.warpGrid_;
  }

  /**
   * Rebuild when an image style or pattern fill becomes available.
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
        if (this.disposed || this.imageChangeScheduled_) {
          return;
        }
        // Still pending until the frame that rebuilds with the image.
        this.imageChangeScheduled_ = true;
        requestAnimationFrame(() => {
          this.imageChangeScheduled_ = false;
          this.updateReady();
          if (!this.disposed) {
            this.getLayer().changed();
          }
        });
      });
    }
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @private
   */
  rebuildBuffers_(frameState) {
    const layer = this.getLayer();
    const source = /** @type {import("../../source/Vector.js").default} */ (
      layer.getSource()
    );
    if (!source) {
      return;
    }
    const extent = frameState.extent;
    if (!extent) {
      return;
    }
    const resolution = frameState.viewState.resolution;
    const buildExtent = chooseBuildExtent(source, frameState, extent);
    ensureFeatureProjection(source, frameState);
    const queryExtent = loadSourceFeatures(source, frameState, buildExtent);
    const features = featuresForExtent(
      source,
      queryExtent || buildExtent,
      source.getProjection() || frameState.viewState.projection,
    );
    const plan = getBuildPlan(source, frameState, buildExtent, extent);
    if (!plan) {
      return;
    }
    const {request, labelData} = buildVectorRequest(
      features,
      this.styleFunction_,
      resolution,
      this.atlas_,
      // Anchors still need real coordinates, so labels are projected here; it
      // is a handful of points, not a vertex-by-vertex cost.
      plan.warp
        ? {
            ...plan.tessellate,
            projectAnchorsToTarget: plan.warp.projectToTarget,
            warpGrid: this.warpGridFor_(plan.warp),
            warpExtent: plan.warp.extent,
            maxTargetError: frameState.viewState.resolution,
          }
        : plan.tessellate,
      frameState.pixelRatio,
      frameState.viewState.zoom,
      this.renderOrder_(),
      this.imageAtlas_,
    );
    this.watchImages_(labelData.pendingImageStyles);
    this.pendingWarp_ = plan.warp;

    const pending = getWorkerPool().build(request);
    if (pending) {
      // Keep drawing what is on hand until the worker answers.
      const generation = ++this.buildGeneration_;
      this.buildPending_ = true;
      this.updateReady();
      pending.then(
        (geometry) => {
          if (generation !== this.buildGeneration_) {
            return;
          }
          this.buildPending_ = false;
          this.updateReady();
          if (this.disposed) {
            return;
          }
          this.releaseBuffers_();
          this.buffers_ = combineVectorBuffers(geometry, labelData);
          // Request a frame without counting it as a style change, which
          // would rebuild the buffers again.
          const layer = this.getLayer();
          const upToDate = this.renderedLayerRevision_ === layer.getRevision();
          layer.changed();
          if (upToDate) {
            this.renderedLayerRevision_ = layer.getRevision();
          }
        },
        () => {
          if (generation !== this.buildGeneration_) {
            return;
          }
          this.buildPending_ = false;
          this.updateReady();
          if (this.disposed) {
            return;
          }
          // The request's arrays went to the failed worker. Changing the
          // layer revision makes the next frame build everything again.
          this.getLayer().changed();
        },
      );
    } else {
      ++this.buildGeneration_;
      this.releaseBuffers_();
      this.buffers_ = combineVectorBuffers(
        buildGeometryBuffers(request),
        labelData,
      );
    }
    this.sourceRevision_ = source.getRevision();
    this.renderedExtent_ = buildExtent;
    this.renderedPoles_ = polesInView(extent, frameState.viewState.projection);
    this.renderedResolutionBucket_ = resolutionBucket(resolution);
    this.renderedProjection_ = frameState.viewState.projection;
    this.renderedPixelRatio_ = frameState.pixelRatio;
    this.renderedRenderOrder_ = this.renderOrder_();
    this.renderedVariablesKey_ = variablesKey(this.variables_);
    this.renderedLayerRevision_ = this.getLayer().getRevision();
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
    // Rebuilding is O(features): tessellation, and a proj4 call per vertex when
    // reprojecting. Only do it once the view settles, and reuse what is on hand
    // in the meantime.
    if (
      !this.buildPending_ &&
      this.needsRebuild_(frameState) &&
      (!this.buffers_ || viewNotMoving(frameState))
    ) {
      this.rebuildBuffers_(frameState);
    }
    const buffers = this.buffers_;
    if (buffers && !this.gpu_) {
      this.gpu_ = new VectorGpuBuffers(helper, buffers);
      const setup = this.pendingWarp_;
      if (setup) {
        this.gpu_.applyWarp(helper, this.warpGridFor_(setup));
      }
    }
    if (!this.declutterGroup_ && buffers && this.cornerBuffer_) {
      // Without a declutter group nothing hides labels, so every one is drawn
      // at full opacity and only fades apply.
      this.updateLabelView_(buffers);
      this.updateIdentities_(frameState);
      this.labels_.setLabels(helper, buffers);
      this.visibility_ = new Array(buffers.labels.length).fill(true);
      if (this.updateOpacities_(frameState)) {
        frameState.animate = true;
      }
    }
    // Every WebGPU layer on this canvas, including tile layers, paints in
    // renderDeferred when any layer declutters. Painting now would cover a
    // decluttered layer below, or land under a tile layer above. The layer
    // stays together in that pass: its fills and strokes, then its symbols
    // and labels. The hover outline in the vector layer example is a higher
    // layer, so it covers the labels underneath.
    if (frameState.declutter) {
      this.postRender(frameState);
      return helper.getCanvas();
    }
    this.paintSorted_(frameState);
    this.postRender(frameState);
    return helper.getCanvas();
  }

  /**
   * @return {import("../../render.js").OrderFunction|null|undefined} Render order.
   * @private
   */
  renderOrder_() {
    const layer = /** @type {import("../../layer/WebGPUVector.js").default} */ (
      this.getLayer()
    );
    return layer.getRenderOrder();
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @private
   */
  paintSorted_(frameState) {
    const helper = this.helper;
    const uniforms = this.uniforms_;
    if (!helper || !uniforms) {
      return;
    }
    const buffers = this.buffers_;
    const gpu = this.gpu_;
    helper.prepareDraw(frameState, false, this.getClearColor(frameState));
    uniforms.begin();
    if (gpu && buffers) {
      if (this.cornerBuffer_) {
        this.labels_.setLabels(helper, buffers);
        if (this.opacities_) {
          this.labels_.setOpacities(this.opacities_, 0);
        }
      }
      paintBatches(
        helper,
        [
          {
            commands: buffers.commands || [],
            tileOrder: 0,
            gpu,
            labels: this.cornerBuffer_ ? this.labels_ : null,
            slot: labelUniforms(uniforms, frameState, buffers),
            prepare: () => {
              gpu.writeUniforms(
                helper,
                this.uniformData_,
                this.projMat_,
                frameState,
                0,
              );
            },
          },
        ],
        this.atlas_,
        this.imageAtlas_,
        this.cornerBuffer_,
        this.paintCache_,
      );
    }
    helper.finalizeDraw(frameState);
  }

  /**
   * Paint this layer after placement, in ascending layer order.
   *
   * Layers without their own declutter group share this canvas. Drawing them
   * here, after every lower layer and before every higher one, keeps their
   * fills and strokes in map order and their symbols and labels above their
   * own geometry.
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
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @param {import("../../layer/Layer.js").State} layerState Layer state.
   */
  renderDeclutter(frameState, layerState) {
    const helper = this.helper;
    const buffers = this.buffers_;
    const uniforms = this.uniforms_;
    if (
      !helper ||
      !buffers ||
      !uniforms ||
      !this.declutterGroup_ ||
      !this.cornerBuffer_
    ) {
      return;
    }
    const view = this.updateLabelView_(buffers);
    this.updateIdentities_(frameState);
    this.labels_.setLabels(helper, buffers);
    const previousVisibility = this.visibility_;
    const now = frameState.time || 0;
    const key = this.labelPlacementKey_(frameState);
    if (this.placement_.shouldRun(key, now, frameState)) {
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
      const duration = performance.now() - start;
      this.placement_.commit(key, now, duration, frameState);
    } else if (this.placement_.isDeferred(key, now, frameState)) {
      // Keep rendering so the deferred pass happens once the budget allows.
      frameState.animate = true;
    }
    if (
      !this.visibility_ ||
      this.visibility_.length !== buffers.labels.length
    ) {
      this.visibility_ = new Array(buffers.labels.length).fill(false);
    }

    if (this.updateOpacities_(frameState, previousVisibility)) {
      frameState.animate = true;
    }
  }

  /**
   * @param {import("../../render/webgpu/buffers.js").VectorBuffers} buffers Buffers.
   * @return {LabelView} View over this layer's labels.
   * @private
   */
  updateLabelView_(buffers) {
    if (this.labelBuffers_ !== buffers) {
      this.labelView_.update([{buffers, worldOffset: 0}]);
      this.labelBuffers_ = buffers;
      this.opacities_ = new Float32Array(buffers.labels.length * 3);
      this.visibility_ = new Array(buffers.labels.length).fill(false);
      this.labels_.setOpacityDirty();
      ++this.labelVersion_;
      // The pass that already ran was for the previous labels. A zoom that
      // ends on a settled view will not move again, so the new set has to be
      // placed even if a frame budget is still pending.
      this.placement_.reset();
    }
    return this.labelView_;
  }

  /**
   * Placement key for the labels currently installed. Translation is left out;
   * the scheduler accounts for it.
   *
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @return {string} Key.
   * @private
   */
  labelPlacementKey_(frameState) {
    return placementKey(this.labelVersion_, frameState);
  }

  /**
   * Assign identities only when the installed label set changes.
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
    this.identityVersion_ = this.labelVersion_;
  }

  /**
   * Turn visibility and fades into a per-label opacity, and upload only when
   * the result actually changed.
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
   * Walk the paint order from the top. Geometry uses containment. Icons and
   * text use their label boxes, so a click on text returns that feature.
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
    const buffers = this.buffers_;
    if (!this.hitDetectionEnabled_ || !buffers) {
      return undefined;
    }
    const source =
      /** @type {import("../../source/Vector.js").default|null} */ (
        this.getLayer().getSource()
      );
    const featureCoord = viewCoordinateToSource(
      coordinate,
      source?.getProjection() || null,
      frameState.viewState.projection,
    );
    /** @type {Array<import("./hitTest.js").HitItem>} */
    const items = [];
    const commands = buffers.commands || [];
    for (let i = 0; i < commands.length; ++i) {
      items.push({
        command: commands[i],
        buffers,
        worldOffset: 0,
        labelOffset: 0,
        tileOrder: 0,
      });
    }
    const features = hitFeatures(
      items,
      coordinate,
      frameState,
      hitTolerance,
      this.visibility_,
      featureCoord,
      (viewCoordinate) =>
        viewCoordinateToSource(
          viewCoordinate,
          source?.getProjection() || null,
          frameState.viewState.projection,
        ),
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
    if (this.sourceListenKey_) {
      unlistenByKey(this.sourceListenKey_);
    }
    this.releaseBuffers_();
    this.imageAtlas_.clear();
    this.atlas_.clear();
    this.uniforms_?.dispose();
    this.uniforms_ = null;
    this.cornerBuffer_?.destroy();
    this.cornerBuffer_ = null;
    this.labels_.dispose();
    super.disposeInternal();
  }
}

export default WebGPUVectorLayerRenderer;
