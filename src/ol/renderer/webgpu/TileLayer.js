/**
 * @module ol/renderer/webgpu/TileLayer
 */
import TileRange from '../../TileRange.js';
import TileState from '../../TileState.js';
import {descending} from '../../array.js';
import {
  compileTileColorPipeline,
  getStringNumberEquivalent,
} from '../../expr/wgsl.js';
import {
  containsCoordinate,
  getIntersection,
  getRotatedViewport,
  isEmpty,
} from '../../extent.js';
import {fromUserExtent, getTransform} from '../../proj.js';
import {toSize} from '../../size.js';
import LRUCache from '../../structs/LRUCache.js';
import {
  createOrUpdate as createTileCoord,
  getKey as getTileCoordKey,
} from '../../tilecoord.js';
import {
  apply as applyTransform,
  create as createTransform,
  reset as resetTransform,
  rotate as rotateTransform,
  scale as scaleTransform,
  translate as translateTransform,
} from '../../transform.js';
import {getUid} from '../../util.js';
import {
  create as createMat4,
  fromTransform as mat4FromTransform,
} from '../../vec/mat4.js';
import TileTexture from '../../webgpu/TileTexture.js';
import {
  buildReprojMesh,
  clipExtentToProjection,
  DEFAULT_REPROJ_SAMPLES,
  estimateSourceExtent,
  needsReprojection,
  projectionMatrixFromFrame,
  reprojMeshCacheKey,
  reprojMeshSamples,
  sourceResolutionForView,
} from '../../webgpu/reproj.js';
import {
  REPROJ_TILE_SHADER,
  TILE_SHADER,
  withTileColorPipeline,
  withUnfilterableTileSampling,
} from '../../webgpu/shaders.js';
import WebGPULayerRenderer from './Layer.js';

/**
 * Reprojection meshes outlive the tiles on screen so panning back does not
 * rebuild them, but a tile is meshed once per sample count and the densest of
 * those are the largest buffers this renderer holds, so they are bounded. The
 * bound only applies beyond what a frame itself needs.
 * @type {number}
 */
const REPROJ_MESH_CACHE_SIZE = 512;

/**
 * Meshes refined to match a finer neighbour cost a projection call per sample,
 * so no more than this many are built in one frame.
 * @type {number}
 */
const REPROJ_MESH_REFINES_PER_FRAME = 2;

/**
 * @param {number} z Zoom.
 * @return {number} Depth.
 */
function depthForZ(z) {
  return 1 / (z + 2);
}

/**
 * @param {import("../../source/Tile.js").default} source Source.
 * @param {import("../../tilecoord.js").TileCoord} tileCoord Coord.
 * @param {string} [key] Source key.
 * @return {string} Cache key.
 */
function getCacheKey(source, tileCoord, key = source.getKey()) {
  return `${getUid(source)},${key},${getTileCoordKey(tileCoord)}`;
}

/**
 * @param {import("../../Map.js").FrameState} frameState Frame state.
 * @param {import("../../extent.js").Extent} extent Extent.
 * @return {import("../../extent.js").Extent} Render extent.
 */
function getRenderExtent(frameState, extent) {
  const layerState = frameState.layerStatesArray[frameState.layerIndex];
  if (layerState.extent) {
    extent = getIntersection(
      extent,
      fromUserExtent(layerState.extent, frameState.viewState.projection),
    );
  }
  const layer = layerState.layer;
  if (!layer) {
    return extent;
  }
  const source = /** @type {import("../../source/Tile.js").default|null} */ (
    layer.getRenderSource()
  );
  if (source && !source.getWrapX()) {
    const gridExtent = source
      .getTileGridForProjection(frameState.viewState.projection)
      .getExtent();
    if (gridExtent) {
      extent = getIntersection(extent, gridExtent);
    }
  }
  return extent;
}

/**
 * Float index of `resolution` in the non-reprojected tile uniform buffer.
 * `zoom` and `time` follow, then one float per style variable.
 * @type {number}
 */
const TILE_STYLE_RESOLUTION_INDEX = 26;

/**
 * Float index of `resolution` in the reprojection uniform buffer.
 * @type {number}
 */
const REPROJ_STYLE_RESOLUTION_INDEX = 25;

/**
 * Subdivisions along each edge of a raster tile quad. A single oversized
 * triangle whose three vertices sit outside the clip volume can be dropped
 * by the rasterizer; a grid keeps some vertices inside the viewport when
 * zooming in on a parent tile.
 */
const TILE_QUAD_DIVISIONS = 16;

/**
 * @param {number} divisions Subdivisions per edge.
 * @return {{vertices: Float32Array, indices: Uint16Array}} Tessellated unit square.
 */
function createTessellatedQuad(divisions) {
  const stride = divisions + 1;
  const vertices = new Float32Array(stride * stride * 2);
  let i = 0;
  for (let y = 0; y <= divisions; ++y) {
    for (let x = 0; x <= divisions; ++x) {
      vertices[i++] = x / divisions;
      vertices[i++] = y / divisions;
    }
  }
  const indices = new Uint16Array(divisions * divisions * 6);
  let j = 0;
  for (let y = 0; y < divisions; ++y) {
    for (let x = 0; x < divisions; ++x) {
      const a = y * stride + x;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices[j++] = a;
      indices[j++] = b;
      indices[j++] = c;
      indices[j++] = b;
      indices[j++] = d;
      indices[j++] = c;
    }
  }
  return {vertices, indices};
}

/**
 * @typedef {Object} TileLookup
 * @property {Set<string>} tileIds Tile ids.
 * @property {Object<number, Set<TileTexture>>} representationsByZ By zoom.
 */

/**
 * @param {TileLookup} lookup Lookup.
 * @param {import("../../Tile.js").default} tile Tile.
 * @return {boolean} The tile is already in the lookup.
 */
function lookupHasTile(lookup, tile) {
  return lookup.tileIds.has(getUid(tile));
}

/**
 * @param {TileLookup} lookup Lookup.
 * @param {TileTexture} tileRepresentation Tile representation.
 * @param {number} z Zoom.
 */
function addTileRepresentationToLookup(lookup, tileRepresentation, z) {
  const representationsByZ = lookup.representationsByZ;
  if (!(z in representationsByZ)) {
    representationsByZ[z] = new Set();
  }
  representationsByZ[z].add(tileRepresentation);
  lookup.tileIds.add(getUid(tileRepresentation.tile));
}

/**
 * @param {TileLookup} lookup Lookup.
 * @param {TileTexture} tileRepresentation Tile representation.
 * @param {number} z Zoom.
 */
function removeTileRepresentationFromLookup(lookup, tileRepresentation, z) {
  const representations = lookup.representationsByZ[z];
  if (representations) {
    representations.delete(tileRepresentation);
  }
  lookup.tileIds.delete(getUid(tileRepresentation.tile));
}

/**
 * @param {TileTexture} tileRepresentation Tile representation.
 * @return {boolean} Ready to draw.
 */
function isDrawable(tileRepresentation) {
  return !!(tileRepresentation.ready && tileRepresentation.texture);
}

/**
 * Re-upload if the source tile is loaded but the GPU texture was lost.
 * @param {TileTexture} tileRepresentation Tile representation.
 * @return {boolean} Ready to draw.
 */
function ensureDrawable(tileRepresentation) {
  if (isDrawable(tileRepresentation)) {
    return true;
  }
  tileRepresentation.ensureUploaded();
  return isDrawable(tileRepresentation);
}

/**
 * @typedef {Object} Options
 * @property {number} [cacheSize] Cache size.
 * @property {import("../../expr/wgsl.js").TileStyle} [style] Style.
 */

/**
 * @classdesc
 * WebGPU renderer for raster tile layers.
 * @extends {WebGPULayerRenderer<import("../../layer/WebGPUTile.js").default>}
 */
class WebGPUTileLayerRenderer extends WebGPULayerRenderer {
  /**
   * @param {import("../../layer/WebGPUTile.js").default} layer Layer.
   * @param {Options} [options] Options.
   */
  constructor(layer, options) {
    super(layer);

    const cacheSize =
      options?.cacheSize !== undefined ? options.cacheSize : 512;

    /**
     * @private
     * @type {import("../../expr/wgsl.js").TileStyle|undefined}
     */
    this.style_ = options?.style;

    /**
     * @protected
     * @type {import("../../structs/LRUCache.js").default<TileTexture>}
     */
    this.tileRepresentationCache = new LRUCache(cacheSize);
    this.maxStaleKeys = cacheSize * 0.5;

    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.tileTransform_ = createTransform();

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
     * @type {import("../../size.js").Size}
     */
    this.tempSize_ = [0, 0];

    /**
     * @private
     * @type {Float32Array}
     */
    this.uniformData_ = new Float32Array(32);

    /**
     * Style variable names, in the order they were appended to the uniform struct.
     * @private
     * @type {Array<string>}
     */
    this.styleVariableNames_ = [];

    /**
     * Bumped when the style changes so a new pipeline is not served from the
     * helper's pipeline cache.
     * @private
     * @type {number}
     */
    this.styleGeneration_ = 0;

    /**
     * Sources chosen for the frame in prepareFrame, so render does not ask a
     * sources function for a second set of instances.
     * @private
     * @type {Array<import("../../source/Tile.js").default>|null}
     */
    this.frameSources_ = null;

    /**
     * @private
     * @type {Set<import("../../source/Tile.js").default>}
     */
    this.loadingSources_ = new Set();

    /**
     * Uniform buffers for the current frame. Destroyed the frame after they
     * are submitted so the GPU is done with them.
     * @private
     * @type {Array<GPUBuffer>}
     */
    this.pendingUniforms_ = [];

    /**
     * @private
     * @type {Array<GPUBuffer>}
     */
    this.retiredUniforms_ = [];

    /**
     * @private
     * @type {GPURenderPipeline|null}
     */
    this.pipeline_ = null;

    /**
     * @private
     * @type {GPURenderPipeline|null}
     */
    this.reprojPipeline_ = null;

    /**
     * @private
     * @type {GPURenderPipeline|null}
     */
    this.floatPipeline_ = null;

    /**
     * @private
     * @type {GPURenderPipeline|null}
     */
    this.floatReprojPipeline_ = null;

    /**
     * @protected
     * @type {import("../../Map.js").FrameState|null}
     */
    this.frameState = null;

    /**
     * @type {boolean}
     */
    this.renderComplete = false;

    /**
     * @private
     * @type {import("../../structs/LRUCache.js").default<{vertexBuffer: GPUBuffer, indexBuffer: GPUBuffer, indexCount: number}>}
     */
    this.reprojMeshes_ = new LRUCache(REPROJ_MESH_CACHE_SIZE);

    /**
     * @private
     * @type {number}
     */
    this.meshRefineBudget_ = 0;

    /**
     * @private
     * @type {number}
     */
    this.meshesThisFrame_ = 0;

    /**
     * @private
     * @type {Float32Array}
     */
    this.projMat_ = new Float32Array(16);

    /**
     * Identity-based 4x4 used by {@link module:ol/vec/mat4.fromTransform}.
     * Starting from zeros leaves clip-space w at 0 and discards all vertices.
     * @private
     * @type {Array<number>}
     */
    this.tmpMat4_ = createMat4();

    /**
     * @private
     * @type {GPUBuffer|null}
     */
    this.tileQuadBuffer_ = null;

    /**
     * @private
     * @type {GPUBuffer|null}
     */
    this.tileQuadIndexBuffer_ = null;

    /**
     * @private
     * @type {number}
     */
    this.tileQuadIndexCount_ = 0;
  }

  /**
   * @override
   */
  afterHelperCreated() {
    const helper = this.helper;
    if (!helper) {
      return;
    }
    if (this.tileQuadBuffer_) {
      this.tileQuadBuffer_.destroy();
      this.tileQuadBuffer_ = null;
    }
    if (this.tileQuadIndexBuffer_) {
      this.tileQuadIndexBuffer_.destroy();
      this.tileQuadIndexBuffer_ = null;
    }
    const quad = createTessellatedQuad(TILE_QUAD_DIVISIONS);
    this.tileQuadBuffer_ = helper.createBuffer(
      quad.vertices,
      GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    );
    this.tileQuadIndexBuffer_ = helper.createBuffer(
      quad.indices,
      GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    );
    this.tileQuadIndexCount_ = quad.indices.length;
    this.createPipelines_();

    this.tileRepresentationCache.forEach((tileTexture) =>
      tileTexture.setHelper(helper),
    );
  }

  /**
   * @param {import("../../expr/wgsl.js").TileStyle|undefined} style Style.
   */
  setStyle(style) {
    this.style_ = style;
    ++this.styleGeneration_;
    if (this.helper) {
      this.createPipelines_();
    }
  }

  /**
   * Compile the current style and build the filterable and float pipelines.
   * @private
   */
  createPipelines_() {
    const helper = this.helper;
    if (!helper) {
      return;
    }
    const compiled = compileTileColorPipeline(this.style_);
    const names = Array.from(compiled.context.variables.keys());
    const variables = this.style_?.variables || {};
    for (const name of names) {
      if (!(name in variables)) {
        throw new Error(`Missing '${name}' in style variables`);
      }
    }
    this.styleVariableNames_ = names;
    const floatCount =
      Math.ceil(
        Math.max(
          TILE_STYLE_RESOLUTION_INDEX + 3 + names.length,
          REPROJ_STYLE_RESOLUTION_INDEX + 3 + names.length,
        ) / 4,
      ) * 4;
    if (this.uniformData_.length < floatCount) {
      this.uniformData_ = new Float32Array(floatCount);
    }

    const tileShader = withTileColorPipeline(
      TILE_SHADER,
      compiled.fragmentBody,
      compiled.functions,
      names,
    );
    const reprojShader = withTileColorPipeline(
      REPROJ_TILE_SHADER,
      compiled.fragmentBody,
      compiled.functions,
      names,
    );
    const generation = this.styleGeneration_;
    this.pipeline_ = this.createTilePipeline_(
      helper,
      `tile-grid/${generation}`,
      tileShader,
      false,
    );
    this.floatPipeline_ = this.createTilePipeline_(
      helper,
      `tile-grid-float/${generation}`,
      withUnfilterableTileSampling(tileShader),
      false,
    );
    this.reprojPipeline_ = this.createTilePipeline_(
      helper,
      `tile-reproj/${generation}`,
      reprojShader,
      true,
    );
    this.floatReprojPipeline_ = this.createTilePipeline_(
      helper,
      `tile-reproj-float/${generation}`,
      withUnfilterableTileSampling(reprojShader),
      true,
    );
  }

  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @param {string} key Pipeline cache key.
   * @param {string} shader Shader source.
   * @param {boolean} reproj Reprojection vertex layout.
   * @return {GPURenderPipeline} Pipeline.
   * @private
   */
  createTilePipeline_(helper, key, shader, reproj) {
    const module = helper.createShaderModule(shader);
    return helper.getRenderPipeline(key, {
      layout: 'auto',
      vertex: {
        module,
        entryPoint: 'vs_main',
        buffers: [
          reproj
            ? {
                arrayStride: 16,
                attributes: [
                  {shaderLocation: 0, offset: 0, format: 'float32x2'},
                  {shaderLocation: 1, offset: 8, format: 'float32x2'},
                ],
              }
            : {
                arrayStride: 8,
                attributes: [
                  {shaderLocation: 0, offset: 0, format: 'float32x2'},
                ],
              },
        ],
      },
      fragment: {
        module,
        entryPoint: 'fs_main',
        targets: [
          {
            format: helper.getFormat(),
            blend: {
              color: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
      },
      primitive: {topology: 'triangle-list'},
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
      },
    });
  }

  /**
   * @param {Float32Array} data Uniform data.
   * @param {number} resolutionIndex Index of the resolution field.
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @private
   */
  writeStyleUniforms_(data, resolutionIndex, frameState) {
    const viewState = frameState.viewState;
    data[resolutionIndex] = viewState.resolution;
    data[resolutionIndex + 1] = viewState.zoom;
    data[resolutionIndex + 2] = frameState.time || 0;
    const variables = this.style_?.variables || {};
    const names = this.styleVariableNames_;
    for (let i = 0; i < names.length; ++i) {
      let value = variables[names[i]];
      if (typeof value === 'string') {
        value = getStringNumberEquivalent(value);
      }
      data[resolutionIndex + 3 + i] =
        typeof value === 'number' ? value : -9999999;
    }
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Ready.
   * @override
   */
  prepareFrameInternal(frameState) {
    const extent = frameState.extent;
    if (!extent || isEmpty(getRenderExtent(frameState, extent))) {
      this.frameSources_ = [];
      return false;
    }
    this.frameSources_ = this.collectFrameSources_(frameState);
    return this.frameSources_.some((source) => source.getState() === 'ready');
  }

  /**
   * Choose the tile grid used for fetching (source grid when reprojecting).
   *
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @param {import("../../extent.js").Extent} viewExtent View render extent.
   * @param {number} [resolution] Resolution (defaults to the current view resolution).
   * @return {{reprojecting: boolean, tileGrid: import("../../tilegrid/TileGrid.js").default, gutter: number, projection: import("../../proj/Projection.js").default, extent: import("../../extent.js").Extent, z: number}|null} Query.
   * @private
   */
  getTileQuery_(frameState, viewExtent, resolution) {
    const viewState = frameState.viewState;
    const viewResolution =
      resolution !== undefined ? resolution : viewState.resolution;
    const tileSource = this.getLayer().getRenderSource();
    if (!tileSource) {
      return null;
    }
    const sourceProj = tileSource.getProjection();
    const reprojecting = needsReprojection(tileSource, viewState.projection);
    if (!reprojecting || !sourceProj) {
      const tileGrid = tileSource.getTileGridForProjection(
        viewState.projection,
      );
      return {
        reprojecting: false,
        tileGrid,
        gutter: tileSource.getGutterForProjection(viewState.projection),
        projection: viewState.projection,
        extent: viewExtent,
        z: tileGrid.getZForResolution(viewResolution, tileSource.zDirection),
      };
    }
    const tileGrid =
      tileSource.getTileGrid() ||
      tileSource.getTileGridForProjection(sourceProj);
    const estimated =
      estimateSourceExtent(viewExtent, sourceProj, viewState.projection) ||
      viewExtent;
    const sourceExtent =
      clipExtentToProjection(estimated, sourceProj, tileSource.getWrapX()) ||
      estimated;
    const sourceResolution = sourceResolutionForView(
      sourceProj,
      viewState.projection,
      viewState.center,
      viewResolution,
      viewExtent,
    );
    return {
      reprojecting: true,
      tileGrid,
      gutter: tileSource.getGutterForProjection(sourceProj),
      projection: sourceProj,
      extent: sourceExtent,
      z: tileGrid.getZForResolution(sourceResolution, tileSource.zDirection),
    };
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {import("../../extent.js").Extent} extent Extent.
   * @param {number} initialZ Z.
   * @param {TileLookup} lookup Lookup.
   * @param {number} preload Preload.
   * @param {import("../../proj/Projection.js").default} tileProjection Projection used for getTile.
   */
  enqueueTiles(frameState, extent, initialZ, lookup, preload, tileProjection) {
    const viewState = frameState.viewState;
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getRenderSource();
    if (!tileSource) {
      return;
    }
    const reprojecting = needsReprojection(tileSource, viewState.projection);
    const tileGrid = reprojecting
      ? tileSource.getTileGrid() ||
        tileSource.getTileGridForProjection(tileProjection)
      : tileSource.getTileGridForProjection(tileProjection);
    const gutter = tileSource.getGutterForProjection(tileProjection);
    const tileSourceKey = getUid(tileSource);
    if (!(tileSourceKey in frameState.wantedTiles)) {
      frameState.wantedTiles[tileSourceKey] = {};
    }
    const wantedTiles = frameState.wantedTiles[tileSourceKey];
    const cache = this.tileRepresentationCache;
    const helper = this.helper;
    if (!helper) {
      return;
    }

    const map = tileLayer.getMapInternal();
    let minZoomResolution = tileGrid.getResolution(0);
    if (map) {
      const viewResolutionAtMinZoom = map
        .getView()
        .getResolutionForZoom(Math.max(tileLayer.getMinZoom(), 0));
      minZoomResolution = reprojecting
        ? sourceResolutionForView(
            tileProjection,
            viewState.projection,
            viewState.center,
            viewResolutionAtMinZoom,
          )
        : viewResolutionAtMinZoom;
    }
    // Never skip the target zoom: a 4326 view resolution in degrees used on a
    // mercator grid looks like a huge Z and emptied this loop.
    const minZ = Math.min(
      initialZ,
      Math.max(
        initialZ - preload,
        tileGrid.getMinZoom(),
        tileGrid.getZForResolution(
          Math.min(tileLayer.getMaxResolution(), minZoomResolution),
          tileSource.zDirection,
        ),
      ),
    );
    const rotation = viewState.rotation;
    const viewport = rotation
      ? getRotatedViewport(
          viewState.center,
          viewState.resolution,
          rotation,
          frameState.size,
        )
      : undefined;

    for (let z = initialZ; z >= minZ; --z) {
      const tileRange = tileGrid.getTileRangeForExtentAndZ(
        extent,
        z,
        this.tempTileRange_,
      );
      for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
        for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
          if (
            !needsReprojection(tileSource, viewState.projection) &&
            rotation &&
            viewport &&
            !tileGrid.tileCoordIntersectsViewport([z, x, y], viewport)
          ) {
            continue;
          }
          const fullRange = tileGrid.getFullTileRange(z);
          if (fullRange && (y < fullRange.minY || y > fullRange.maxY)) {
            continue;
          }
          const tileCoord = createTileCoord(z, x, y, this.tempTileCoord_);
          const cacheKey = getCacheKey(tileSource, tileCoord);
          /** @type {TileTexture|undefined} */
          let tileRepresentation;
          /** @type {import("../../Tile.js").default|undefined} */
          let tile;
          if (cache.containsKey(cacheKey)) {
            tileRepresentation = cache.get(cacheKey);
            tile = tileRepresentation.tile;
          }
          if (
            !tileRepresentation ||
            tileRepresentation.tile.key !== tileSource.getKey()
          ) {
            tile =
              tileSource.getTile(
                z,
                x,
                y,
                frameState.pixelRatio,
                tileProjection,
              ) || undefined;
            if (!tile) {
              continue;
            }
          }
          if (!tile) {
            continue;
          }
          if (lookupHasTile(lookup, tile)) {
            continue;
          }
          if (!tileRepresentation) {
            tileRepresentation = new TileTexture({
              tile,
              helper,
              gutter,
            });
            cache.set(cacheKey, tileRepresentation);
          } else {
            tileRepresentation.setTile(tile);
          }
          addTileRepresentationToLookup(lookup, tileRepresentation, z);

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
        }
      }
    }
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {HTMLElement|null} target Target.
   * @return {HTMLElement} Canvas.
   * @override
   */
  renderFrame(frameState, target) {
    this.frameState = frameState;
    this.renderComplete = true;
    this.preRender(frameState);

    const helper = this.helper;
    const tileLayer = this.getLayer();
    if (!helper || !frameState.extent) {
      return helper ? helper.getCanvas() : /** @type {HTMLElement} */ (target);
    }
    const sources = this.frameSources_ || this.collectFrameSources_(frameState);
    this.frameSources_ = null;
    if (!sources.length) {
      return helper.getCanvas();
    }
    this.recycleUniformBuffers_();
    helper.prepareDraw(frameState, true);
    const pass = helper.getRenderPass();
    let wanted = 0;
    for (let i = 0; i < sources.length; ++i) {
      const source = sources[i];
      if (source.getState() !== 'ready') {
        this.renderComplete = false;
        continue;
      }
      tileLayer.setRenderSource(source);
      wanted += this.drawSource_(frameState, pass);
    }
    tileLayer.setRenderSource(null);
    helper.finalizeDraw(frameState);
    this.expireMeshes_();
    if (this.renderComplete) {
      this.tileRepresentationCache.highWaterMark = Math.max(
        this.tileRepresentationCache.highWaterMark,
        wanted * 2,
      );
      this.tileRepresentationCache.expireCache();
    }
    this.postRender(frameState);
    return helper.getCanvas();
  }

  /**
   * Sources for this frame. A layer `sources` function or array is used when
   * present; otherwise the single layer source.
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @return {Array<import("../../source/Tile.js").default>} Sources.
   * @private
   */
  collectFrameSources_(frameState) {
    const layer = this.getLayer();
    /** @type {Array<import("../../source/Tile.js").default>} */
    let sources = [];
    if (frameState.extent && typeof layer.getSources === 'function') {
      sources =
        layer.getSources(frameState.extent, frameState.viewState.resolution) ||
        [];
    }
    if (!sources.length) {
      const single = layer.getSource();
      if (single) {
        sources = [single];
      }
    }
    for (let i = 0; i < sources.length; ++i) {
      const source = sources[i];
      if (
        source.getState() === 'loading' &&
        !this.loadingSources_.has(source)
      ) {
        this.loadingSources_.add(source);
        const onChange = () => {
          if (source.getState() === 'ready') {
            source.removeEventListener('change', onChange);
            this.loadingSources_.delete(source);
            layer.changed();
          }
        };
        source.addEventListener('change', onChange);
      }
    }
    return sources;
  }

  /**
   * Draw the layer's current render source into an open pass.
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @param {GPURenderPassEncoder} pass Pass.
   * @return {number} Number of wanted tiles.
   * @private
   */
  drawSource_(frameState, pass) {
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getRenderSource();
    if (!tileSource || !frameState.extent) {
      return 0;
    }
    const viewExtent = getRenderExtent(frameState, frameState.extent);
    const query = this.getTileQuery_(frameState, viewExtent);
    if (!query) {
      return 0;
    }
    const {tileGrid, gutter, projection, extent, z} = query;

    this.updateStaleKeys(tileSource.getKey());

    /** @type {TileLookup} */
    const lookup = {tileIds: new Set(), representationsByZ: {}};
    const preload = tileLayer.getPreload();
    if (frameState.nextExtent) {
      const nextExtent = getRenderExtent(frameState, frameState.nextExtent);
      const nextQuery = this.getTileQuery_(
        frameState,
        nextExtent,
        frameState.viewState.nextResolution,
      );
      if (nextQuery) {
        this.enqueueTiles(
          frameState,
          nextQuery.extent,
          nextQuery.z,
          lookup,
          preload,
          nextQuery.projection,
        );
      }
    }
    this.enqueueTiles(frameState, extent, z, lookup, 0, projection);
    if (preload > 0) {
      setTimeout(() => {
        this.enqueueTiles(
          frameState,
          extent,
          z - 1,
          lookup,
          preload - 1,
          projection,
        );
      }, 0);
    }

    const representationsByZ = lookup.representationsByZ;
    /**
     * Alpha for target-zoom tiles that are still fading in. Absent keys are
     * drawn opaque. Matching WebGL, fading tiles are drawn after parent/child
     * fallbacks so the map never flashes empty.
     * @type {Object<string, number>}
     */
    const alphaLookup = {};

    if (z in representationsByZ) {
      const uid = getUid(this);
      const time = frameState.time;
      for (const tileRepresentation of Array.from(representationsByZ[z])) {
        const tile = tileRepresentation.tile;
        if (tile.getState() === TileState.EMPTY) {
          continue;
        }
        const tileCoord = tile.tileCoord;
        const tileCoordKey = getTileCoordKey(tileCoord);
        if (isDrawable(tileRepresentation)) {
          const alpha = tile.getAlpha(uid, time);
          if (alpha === 1) {
            tile.endTransition(uid);
            continue;
          }
          alphaLookup[tileCoordKey] = alpha;
        }
        this.renderComplete = false;

        if (this.findStaleTile_(tileCoord, lookup)) {
          delete alphaLookup[tileCoordKey];
          removeTileRepresentationFromLookup(lookup, tileRepresentation, z);
          frameState.animate = true;
          continue;
        }

        const coveredByChildren = this.findAltTiles_(
          tileGrid,
          tileCoord,
          z + 1,
          lookup,
        );
        if (coveredByChildren) {
          continue;
        }

        const minZoom = tileGrid.getMinZoom();
        for (let parentZ = z - 1; parentZ >= minZoom; --parentZ) {
          if (this.findAltTiles_(tileGrid, tileCoord, parentZ, lookup)) {
            break;
          }
        }
      }
    }

    if (!this.renderComplete) {
      const minZoom = tileGrid.getMinZoom();
      for (let parentZ = z - 1; parentZ >= minZoom; --parentZ) {
        this.addCachedTilesAtZ_(tileGrid, tileSource, parentZ, extent, lookup);
        if (lookup.representationsByZ[parentZ]?.size) {
          break;
        }
      }
      frameState.animate = true;
    }

    const zs = Object.keys(representationsByZ).map(Number).sort(descending);

    // Tiles only meet without a seam when they mesh their shared edge at the
    // same spacing, so every tile in the frame is meshed at the spacing of the
    // finest one on screen. Stand-ins can be finer as well as coarser than the
    // zoom the view asked for.
    const finestZ = zs.length ? Math.max(zs[0], z) : z;
    this.meshRefineBudget_ = REPROJ_MESH_REFINES_PER_FRAME;
    this.meshesThisFrame_ = 0;

    const sourceProj = tileSource.getProjection();
    const needsReproj = query.reprojecting;

    for (let j = 0, jj = zs.length; j < jj; ++j) {
      const tileZ = zs[j];
      for (const tileRepresentation of representationsByZ[tileZ]) {
        const tileCoordKey = getTileCoordKey(tileRepresentation.tile.tileCoord);
        if (tileCoordKey in alphaLookup) {
          continue;
        }
        this.drawRepresentation_(
          frameState,
          tileRepresentation,
          tileZ,
          gutter,
          extent,
          tileGrid,
          1,
          pass,
          needsReproj,
          sourceProj,
          finestZ,
        );
      }
    }

    if (z in representationsByZ) {
      for (const tileRepresentation of representationsByZ[z]) {
        const tileCoordKey = getTileCoordKey(tileRepresentation.tile.tileCoord);
        if (tileCoordKey in alphaLookup) {
          this.drawRepresentation_(
            frameState,
            tileRepresentation,
            z,
            gutter,
            extent,
            tileGrid,
            alphaLookup[tileCoordKey],
            pass,
            needsReproj,
            sourceProj,
            finestZ,
          );
        }
      }
    }

    const wantedTiles = frameState.wantedTiles[getUid(tileSource)];
    return wantedTiles ? Object.keys(wantedTiles).length : 0;
  }

  /**
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @return {Uint8ClampedArray|Uint8Array|Float32Array|DataView|null} Data at the pixel location.
   * @override
   */
  getData(pixel) {
    const frameState = this.frameState;
    if (!frameState) {
      return null;
    }
    const layer = this.getLayer();
    const sources = this.collectFrameSources_(frameState);
    let result = null;
    for (let i = 0; i < sources.length && !result; ++i) {
      layer.setRenderSource(sources[i]);
      result = this.readPixel_(pixel);
    }
    layer.setRenderSource(null);
    return result;
  }

  /**
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @return {Uint8ClampedArray|Uint8Array|Float32Array|DataView|null} Data.
   * @private
   */
  readPixel_(pixel) {
    const frameState = this.frameState;
    if (!frameState) {
      return null;
    }

    const layer = this.getLayer();
    const tileSource = layer.getRenderSource();
    if (!tileSource) {
      return null;
    }

    const coordinate = applyTransform(
      frameState.pixelToCoordinateTransform,
      pixel.slice(),
    );

    const viewState = frameState.viewState;
    const layerExtent = layer.getExtent();
    if (layerExtent) {
      if (
        !containsCoordinate(
          fromUserExtent(layerExtent, viewState.projection),
          coordinate,
        )
      ) {
        return null;
      }
    }

    const reprojecting = needsReprojection(tileSource, viewState.projection);
    const sourceProj = tileSource.getProjection() || viewState.projection;
    const tileGrid = reprojecting
      ? tileSource.getTileGrid() ||
        tileSource.getTileGridForProjection(sourceProj)
      : tileSource.getTileGridForProjection(viewState.projection);

    let sampleCoordinate = coordinate;
    let sourceResolution = viewState.resolution;
    if (reprojecting) {
      const inverse = getTransform(viewState.projection, sourceProj);
      if (!inverse) {
        return null;
      }
      sampleCoordinate = inverse(coordinate.slice(), undefined, undefined, 2);
      sourceResolution = sourceResolutionForView(
        sourceProj,
        viewState.projection,
        viewState.center,
        viewState.resolution,
        frameState.extent
          ? getRenderExtent(frameState, frameState.extent)
          : undefined,
      );
    }

    const gridExtent = tileGrid.getExtent();
    if (
      !reprojecting &&
      !tileSource.getWrapX() &&
      gridExtent &&
      !containsCoordinate(gridExtent, sampleCoordinate)
    ) {
      return null;
    }

    const tileTextureCache = this.tileRepresentationCache;
    for (
      let z = tileGrid.getZForResolution(sourceResolution);
      z >= tileGrid.getMinZoom();
      --z
    ) {
      const tileCoord = tileGrid.getTileCoordForCoordAndZ(sampleCoordinate, z);
      const cacheKey = getCacheKey(tileSource, tileCoord);
      if (!tileTextureCache.containsKey(cacheKey)) {
        continue;
      }
      const tileTexture = tileTextureCache.get(cacheKey);
      const tile = tileTexture.tile;
      if (tile.getState() === TileState.EMPTY) {
        return null;
      }
      if (!tileTexture.loaded) {
        continue;
      }
      const tileOrigin = tileGrid.getOrigin(z);
      const tileSize = toSize(tileGrid.getTileSize(z));
      const tileResolution = tileGrid.getResolution(z);

      const col =
        (sampleCoordinate[0] - tileOrigin[0]) / tileResolution -
        tileCoord[1] * tileSize[0];

      const row =
        (tileOrigin[1] - sampleCoordinate[1]) / tileResolution -
        tileCoord[2] * tileSize[1];

      return tileTexture.getPixelData(col, row) ?? null;
    }
    return null;
  }

  /**
   * Look for a ready tile at the same coordinate from a previous source key.
   * @param {import("../../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {TileLookup} lookup Lookup.
   * @return {boolean} A stale tile was found.
   * @private
   */
  findStaleTile_(tileCoord, lookup) {
    const cache = this.tileRepresentationCache;
    const source = this.getLayer().getRenderSource();
    if (!source) {
      return false;
    }
    const z = tileCoord[0];
    const staleKeys = this.getStaleKeys();
    for (let i = 0, ii = staleKeys.length; i < ii; ++i) {
      const cacheKey = getCacheKey(source, tileCoord, staleKeys[i]);
      if (!cache.containsKey(cacheKey)) {
        continue;
      }
      const tileRepresentation = cache.get(cacheKey);
      if (
        ensureDrawable(tileRepresentation) &&
        !lookupHasTile(lookup, tileRepresentation.tile)
      ) {
        tileRepresentation.tile.endTransition(getUid(this));
        addTileRepresentationToLookup(lookup, tileRepresentation, z);
        return true;
      }
    }
    return false;
  }

  /**
   * Look for cached tiles covering `tileCoord` at an alternate zoom level.
   * @param {import("../../tilegrid/TileGrid.js").default} tileGrid Tile grid.
   * @param {import("../../tilecoord.js").TileCoord} tileCoord Target tile coordinate.
   * @param {number} altZ Alternate zoom.
   * @param {TileLookup} lookup Lookup.
   * @return {boolean} The tile is fully covered by loaded tiles at altZ.
   * @private
   */
  findAltTiles_(tileGrid, tileCoord, altZ, lookup) {
    const tileRange = tileGrid.getTileRangeForTileCoordAndZ(
      tileCoord,
      altZ,
      this.tempTileRange_,
    );
    if (!tileRange) {
      return false;
    }
    let covered = true;
    const cache = this.tileRepresentationCache;
    const source = this.getLayer().getRenderSource();
    if (!source) {
      return false;
    }
    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        const cacheKey = getCacheKey(source, [altZ, x, y]);
        let loaded = false;
        if (cache.containsKey(cacheKey)) {
          const tileRepresentation = cache.get(cacheKey);
          if (ensureDrawable(tileRepresentation)) {
            if (!lookupHasTile(lookup, tileRepresentation.tile)) {
              addTileRepresentationToLookup(lookup, tileRepresentation, altZ);
            }
            loaded = true;
          }
        }
        if (!loaded) {
          covered = false;
        }
      }
    }
    return covered;
  }

  /**
   * Add GPU tiles already in the representation cache that cover `extent` at `z`.
   * Parent lookup by tile-coord can miss wrapX and previously cached tiles that
   * still overlap the view; this uses the same range as enqueueTiles.
   * @param {import("../../tilegrid/TileGrid.js").default} tileGrid Grid.
   * @param {import("../../source/Tile.js").default} source Source.
   * @param {number} z Zoom.
   * @param {import("../../extent.js").Extent} extent Extent.
   * @param {TileLookup} lookup Lookup.
   * @private
   */
  addCachedTilesAtZ_(tileGrid, source, z, extent, lookup) {
    const tileRange = tileGrid.getTileRangeForExtentAndZ(
      extent,
      z,
      this.tempTileRange_,
    );
    const cache = this.tileRepresentationCache;
    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        const cacheKey = getCacheKey(source, [z, x, y]);
        if (!cache.containsKey(cacheKey)) {
          continue;
        }
        const tileRepresentation = cache.get(cacheKey);
        if (
          ensureDrawable(tileRepresentation) &&
          !lookupHasTile(lookup, tileRepresentation.tile)
        ) {
          addTileRepresentationToLookup(lookup, tileRepresentation, z);
        }
      }
    }
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @param {TileTexture} tileRepresentation Tile.
   * @param {number} tileZ Z.
   * @param {number} gutter Gutter.
   * @param {import("../../extent.js").Extent} extent Extent.
   * @param {import("../../tilegrid/TileGrid.js").default} tileGrid Grid.
   * @param {number} alpha Alpha.
   * @param {GPURenderPassEncoder} pass Pass.
   * @param {boolean} needsReproj Reprojecting.
   * @param {import("../../proj/Projection.js").default|null} sourceProj Source projection.
   * @param {number} finestZ Zoom of the finest tiles in this frame.
   * @private
   */
  drawRepresentation_(
    frameState,
    tileRepresentation,
    tileZ,
    gutter,
    extent,
    tileGrid,
    alpha,
    pass,
    needsReproj,
    sourceProj,
    finestZ,
  ) {
    if (!isDrawable(tileRepresentation) || alpha <= 0) {
      return;
    }
    if (alpha < 1) {
      frameState.animate = true;
    } else {
      tileRepresentation.tile.endTransition(getUid(this));
    }
    const depth = alpha < 1 ? -1 : depthForZ(tileZ);
    if (needsReproj && sourceProj) {
      this.drawReprojTile_(
        frameState,
        tileRepresentation,
        tileGrid,
        sourceProj,
        alpha,
        depth,
        pass,
        finestZ,
      );
    } else {
      this.drawTile_(
        frameState,
        tileRepresentation,
        tileZ,
        gutter,
        extent,
        tileGrid,
        alpha,
        depth,
        pass,
      );
    }
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @param {TileTexture} tileTexture Tile.
   * @param {number} tileZ Z.
   * @param {number} gutter Gutter.
   * @param {import("../../extent.js").Extent} extent Extent.
   * @param {import("../../tilegrid/TileGrid.js").default} tileGrid Grid.
   * @param {number} alpha Alpha.
   * @param {number} depth Depth.
   * @param {GPURenderPassEncoder} pass Pass.
   * @private
   */
  drawTile_(
    frameState,
    tileTexture,
    tileZ,
    gutter,
    extent,
    tileGrid,
    alpha,
    depth,
    pass,
  ) {
    const helper = this.helper;
    const pipeline = tileTexture.unfilterable
      ? this.floatPipeline_
      : this.pipeline_;
    const tileQuadBuffer = this.tileQuadBuffer_;
    const tileQuadIndexBuffer = this.tileQuadIndexBuffer_;
    if (
      !helper ||
      !pipeline ||
      !tileTexture.texture ||
      !tileQuadBuffer ||
      !tileQuadIndexBuffer
    ) {
      return;
    }
    const tile = tileTexture.tile;
    const tileCoord = tile.tileCoord;
    const tileSize = toSize(tileGrid.getTileSize(tileZ), this.tempSize_);
    const tileOrigin = tileGrid.getOrigin(tileZ);
    const tileResolution = tileGrid.getResolution(tileZ);
    const tileExtent = tileGrid.getTileCoordExtent(tileCoord);
    const viewState = frameState.viewState;

    const tileWidthWithGutter = tileSize[0] + 2 * gutter;
    const tileHeightWithGutter = tileSize[1] + 2 * gutter;
    const aspectRatio = tileWidthWithGutter / tileHeightWithGutter;
    const centerX = viewState.center[0];
    const centerY = viewState.center[1];
    const centerI = (centerX - tileOrigin[0]) / (tileSize[0] * tileResolution);
    const centerJ = (tileOrigin[1] - centerY) / (tileSize[1] * tileResolution);
    const tileScale = viewState.resolution / tileResolution;

    resetTransform(this.tileTransform_);
    scaleTransform(
      this.tileTransform_,
      2 / ((frameState.size[0] * tileScale) / tileWidthWithGutter),
      -2 / ((frameState.size[1] * tileScale) / tileWidthWithGutter),
    );
    rotateTransform(this.tileTransform_, viewState.rotation);
    scaleTransform(this.tileTransform_, 1, 1 / aspectRatio);
    translateTransform(
      this.tileTransform_,
      (tileSize[0] * (tileCoord[1] - centerI) - gutter) / tileWidthWithGutter,
      (tileSize[1] * (tileCoord[2] - centerJ) - gutter) / tileHeightWithGutter,
    );

    const data = this.uniformData_;
    data.fill(0);
    data.set(mat4FromTransform(this.tmpMat4_, this.tileTransform_), 0);
    let gutterExtent = extent;
    if (gutter > 0) {
      gutterExtent = getIntersection(tileExtent.slice(), extent);
    }
    const textureOriginX =
      tileOrigin[0] +
      tileCoord[1] * tileSize[0] * tileResolution -
      gutter * tileResolution;
    const textureOriginY =
      tileOrigin[1] -
      tileCoord[2] * tileSize[1] * tileResolution +
      gutter * tileResolution;
    data[16] = gutterExtent[0] - textureOriginX;
    data[17] = gutterExtent[1] - textureOriginY;
    data[18] = gutterExtent[2] - textureOriginX;
    data[19] = gutterExtent[3] - textureOriginY;
    data[20] = Math.max(depth, 0);
    data[21] = alpha;
    data[22] = tileWidthWithGutter;
    data[23] = tileHeightWithGutter;
    data[24] = tileResolution;
    data[25] = frameState.layerStatesArray[frameState.layerIndex].opacity;
    this.writeStyleUniforms_(data, TILE_STYLE_RESOLUTION_INDEX, frameState);

    const uniformBuffer = this.createTileUniformBuffer_(data);
    if (!uniformBuffer) {
      return;
    }

    /** @type {Array<GPUBindGroupEntry>} */
    const entries = [{binding: 0, resource: {buffer: uniformBuffer}}];
    if (!tileTexture.unfilterable) {
      entries.push({binding: 1, resource: helper.getLinearSampler()});
    }
    entries.push({binding: 2, resource: tileTexture.texture.createView()});
    const bindGroup = helper.getDevice().createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries,
    });

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, tileQuadBuffer);
    pass.setIndexBuffer(tileQuadIndexBuffer, 'uint16');
    pass.drawIndexed(this.tileQuadIndexCount_);
  }

  /**
   * Drop the meshes a frame no longer needs, once its commands have been
   * submitted: a mesh drawn this frame is still referenced by them, so
   * destroying its buffers any earlier loses the whole pass. A view needing
   * more meshes than the cache holds keeps them all rather than rebuilding
   * every one on the next frame.
   * @private
   */
  expireMeshes_() {
    this.reprojMeshes_.highWaterMark = Math.max(
      REPROJ_MESH_CACHE_SIZE,
      this.meshesThisFrame_,
    );
    while (this.reprojMeshes_.canExpireCache()) {
      const expired = this.reprojMeshes_.pop();
      expired.vertexBuffer.destroy();
      expired.indexBuffer.destroy();
    }
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @param {TileTexture} tileTexture Tile.
   * @param {import("../../tilegrid/TileGrid.js").default} tileGrid Grid.
   * @param {import("../../proj/Projection.js").default} sourceProj Source projection.
   * @param {number} alpha Alpha.
   * @param {number} depth Depth.
   * @param {GPURenderPassEncoder} pass Pass.
   * @param {number} finestZ Zoom of the finest tiles in this frame.
   * @private
   */
  drawReprojTile_(
    frameState,
    tileTexture,
    tileGrid,
    sourceProj,
    alpha,
    depth,
    pass,
    finestZ,
  ) {
    const helper = this.helper;
    const pipeline = tileTexture.unfilterable
      ? this.floatReprojPipeline_
      : this.reprojPipeline_;
    if (!helper || !pipeline || !tileTexture.texture) {
      return;
    }
    const tile = tileTexture.tile;
    const tileCoord = tile.tileCoord;
    const sourceExtent = tileGrid.getTileCoordExtent(tileCoord);
    const targetProj = frameState.viewState.projection;
    // A tile standing in for finer ones has to be meshed at their sample
    // spacing, or its straight edges cut inside theirs and the seam shows.
    let samples = reprojMeshSamples(finestZ - tileCoord[0]);
    let meshKey = reprojMeshCacheKey(
      tileCoord,
      sourceProj,
      targetProj,
      samples,
    );
    if (
      samples !== DEFAULT_REPROJ_SAMPLES &&
      !this.reprojMeshes_.containsKey(meshKey)
    ) {
      if (this.meshRefineBudget_ > 0) {
        --this.meshRefineBudget_;
      } else {
        // Stand-ins tend to arrive in bursts. Rather than refine them all in
        // one frame, draw at the ordinary spacing and refine on a later frame;
        // the seam that leaves lasts a frame or two.
        samples = DEFAULT_REPROJ_SAMPLES;
        meshKey = reprojMeshCacheKey(tileCoord, sourceProj, targetProj);
        frameState.animate = true;
      }
    }
    let mesh = this.reprojMeshes_.containsKey(meshKey)
      ? this.reprojMeshes_.get(meshKey)
      : null;
    if (!mesh) {
      const built = buildReprojMesh(
        sourceExtent,
        sourceProj,
        targetProj,
        samples,
      );
      if (!built || built.indices.length === 0) {
        return;
      }
      mesh = {
        vertexBuffer: helper.createBuffer(
          built.vertices,
          GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        ),
        indexBuffer: helper.createBuffer(
          built.indices,
          GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        ),
        indexCount: built.indices.length,
      };
      this.reprojMeshes_.set(meshKey, mesh);
    }
    ++this.meshesThisFrame_;

    projectionMatrixFromFrame(
      frameState,
      frameState.coordinateToPixelTransform,
      this.projMat_,
    );
    const data = this.uniformData_;
    data.fill(0);
    data.set(this.projMat_, 0);
    data[16] = -Infinity;
    data[17] = -Infinity;
    data[18] = Infinity;
    data[19] = Infinity;
    data[20] = Math.max(depth, 0);
    data[21] = alpha;
    data[22] = frameState.layerStatesArray[frameState.layerIndex].opacity;
    data[23] = tileTexture.texture.width;
    data[24] = tileTexture.texture.height;
    this.writeStyleUniforms_(data, REPROJ_STYLE_RESOLUTION_INDEX, frameState);
    const uniformBuffer = this.createTileUniformBuffer_(data);
    if (!uniformBuffer) {
      return;
    }

    /** @type {Array<GPUBindGroupEntry>} */
    const reprojEntries = [{binding: 0, resource: {buffer: uniformBuffer}}];
    if (!tileTexture.unfilterable) {
      reprojEntries.push({binding: 1, resource: helper.getLinearSampler()});
    }
    reprojEntries.push({
      binding: 2,
      resource: tileTexture.texture.createView(),
    });
    const bindGroup = helper.getDevice().createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: reprojEntries,
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, mesh.vertexBuffer);
    pass.setIndexBuffer(mesh.indexBuffer, 'uint32');
    pass.drawIndexed(mesh.indexCount);
  }

  /**
   * @param {Float32Array} data Uniform data.
   * @return {GPUBuffer|null} Buffer.
   * @private
   */
  createTileUniformBuffer_(data) {
    const helper = this.helper;
    if (!helper) {
      return null;
    }
    const buffer = helper.createBuffer(
      data,
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    );
    this.pendingUniforms_.push(buffer);
    return buffer;
  }

  /**
   * @param {Array<GPUBuffer>} buffers Buffers.
   * @private
   */
  destroyUniformBuffers_(buffers) {
    for (const buffer of buffers) {
      buffer.destroy();
    }
    buffers.length = 0;
  }

  /**
   * @private
   */
  recycleUniformBuffers_() {
    this.destroyUniformBuffers_(this.retiredUniforms_);
    this.retiredUniforms_ = this.pendingUniforms_;
    this.pendingUniforms_ = [];
  }

  /**
   * @override
   */
  clearCache() {
    this.destroyUniformBuffers_(this.pendingUniforms_);
    this.destroyUniformBuffers_(this.retiredUniforms_);
    this.tileRepresentationCache.forEach((tileTexture) =>
      tileTexture.dispose(),
    );
    this.tileRepresentationCache.clear();
    this.reprojMeshes_.forEach((mesh) => {
      mesh.vertexBuffer.destroy();
      mesh.indexBuffer.destroy();
    });
    this.reprojMeshes_.clear();
    if (this.tileQuadBuffer_) {
      this.tileQuadBuffer_.destroy();
      this.tileQuadBuffer_ = null;
    }
    if (this.tileQuadIndexBuffer_) {
      this.tileQuadIndexBuffer_.destroy();
      this.tileQuadIndexBuffer_ = null;
    }
    this.tileQuadIndexCount_ = 0;
  }
}

export default WebGPUTileLayerRenderer;
