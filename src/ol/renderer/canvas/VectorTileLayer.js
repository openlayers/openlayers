/**
 * @module ol/renderer/canvas/VectorTileLayer
 */
import CanvasBuilderGroup from '../../render/canvas/BuilderGroup.js';
import CanvasExecutorGroup from '../../render/canvas/ExecutorGroup.js';
import CanvasTileLayerRenderer from './TileLayer.js';
import TileState from '../../TileState.js';
import VectorTileRenderType from '../../layer/VectorTileRenderType.js';
import ViewHint from '../../ViewHint.js';
import {
  HIT_DETECT_RESOLUTION,
  createHitDetectionImageData,
  hitDetect,
} from '../../render/canvas/hitdetect.js';
import {
  apply as applyTransform,
  create as createTransform,
  multiply,
  reset as resetTransform,
  scale,
  scale as scaleTransform,
  translate as translateTransform,
} from '../../transform.js';
import {
  boundingExtent,
  buffer,
  containsExtent,
  equals,
  getIntersection,
  getTopLeft,
  intersects,
} from '../../extent.js';
import {
  getSquaredTolerance as getSquaredRenderTolerance,
  renderFeature,
} from '../vector.js';
import {getUid} from '../../util.js';
import {toSize} from '../../size.js';
import {wrapX} from '../../coordinate.js';

/**
 * @type {!Object<string, Array<import("../../render/canvas.js").BuilderType>>}
 */
const IMAGE_REPLAYS = {
  'image': ['Polygon', 'Circle', 'LineString', 'Image', 'Text'],
  'hybrid': ['Polygon', 'LineString'],
  'vector': [],
};

/**
 * @type {!Object<string, Array<import("../../render/canvas.js").BuilderType>>}
 */
const VECTOR_REPLAYS = {
  'hybrid': ['Image', 'Text', 'Default'],
  'vector': ['Polygon', 'Circle', 'LineString', 'Image', 'Text', 'Default'],
};

/**
 * @classdesc
 * Canvas renderer for vector tile layers.
 * @api
 * @extends {CanvasTileLayerRenderer<import("../../layer/VectorTile.js").default>}
 */
class CanvasVectorTileLayerRenderer extends CanvasTileLayerRenderer {
  /**
   * @param {import("../../layer/VectorTile.js").default} layer VectorTile layer.
   */
  constructor(layer) {
    super(layer);

    /** @private */
    this.boundHandleStyleImageChange_ = this.handleStyleImageChange_.bind(this);

    /**
     * @private
     * @type {number}
     */
    this.renderedLayerRevision_;

    /**
     * @private
     * @type {import("../../transform").Transform}
     */
    this.renderedPixelToCoordinateTransform_ = null;

    /**
     * @private
     * @type {number}
     */
    this.renderedRotation_;

    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.tmpTransform_ = createTransform();
  }

  /**
   * @param {import("../../VectorRenderTile.js").default} tile Tile.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../../proj/Projection").default} projection Projection.
   * @return {boolean|undefined} Tile needs to be rendered.
   */
  prepareTile(tile, pixelRatio, projection) {
    let render;
    const state = tile.getState();
    if (state === TileState.LOADED || state === TileState.ERROR) {
      this.updateExecutorGroup_(tile, pixelRatio, projection);
      if (this.tileImageNeedsRender_(tile)) {
        render = true;
      }
    }
    return render;
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @return {!import("../../Tile.js").default} Tile.
   */
  getTile(z, x, y, frameState) {
    const pixelRatio = frameState.pixelRatio;
    const viewState = frameState.viewState;
    const resolution = viewState.resolution;
    const projection = viewState.projection;
    const layer = this.getLayer();
    const tile = layer.getSource().getTile(z, x, y, pixelRatio, projection);
    const viewHints = frameState.viewHints;
    const hifi = !(
      viewHints[ViewHint.ANIMATING] || viewHints[ViewHint.INTERACTING]
    );
    if (hifi || !tile.wantedResolution) {
      tile.wantedResolution = resolution;
    }
    const render = this.prepareTile(tile, pixelRatio, projection);
    if (
      render &&
      (hifi || Date.now() - frameState.time < 8) &&
      layer.getRenderMode() !== VectorTileRenderType.VECTOR
    ) {
      this.renderTileImage_(tile, frameState);
    }
    return super.getTile(z, x, y, frameState);
  }

  /**
   * @param {import("../../VectorRenderTile.js").default} tile Tile.
   * @return {boolean} Tile is drawable.
   */
  isDrawableTile(tile) {
    const layer = this.getLayer();
    return (
      super.isDrawableTile(tile) &&
      (layer.getRenderMode() === VectorTileRenderType.VECTOR
        ? getUid(layer) in tile.executorGroups
        : tile.hasContext(layer))
    );
  }

  /**
   * @inheritDoc
   */
  getTileImage(tile) {
    return tile.getImage(this.getLayer());
  }

  /**
   * Determine whether render should be called.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   */
  prepareFrame(frameState) {
    const layerRevision = this.getLayer().getRevision();
    if (this.renderedLayerRevision_ !== layerRevision) {
      this.renderedLayerRevision_ = layerRevision;
      this.renderedTiles.length = 0;
    }
    return super.prepareFrame(frameState);
  }

  /**
   * @param {import("../../VectorRenderTile.js").default} tile Tile.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../../proj/Projection.js").default} projection Projection.
   * @private
   */
  updateExecutorGroup_(tile, pixelRatio, projection) {
    const layer = /** @type {import("../../layer/VectorTile.js").default} */ (
      this.getLayer()
    );
    const revision = layer.getRevision();
    const renderOrder = layer.getRenderOrder() || null;

    const resolution = tile.wantedResolution;
    const builderState = tile.getReplayState(layer);
    if (
      !builderState.dirty &&
      builderState.renderedResolution === resolution &&
      builderState.renderedRevision == revision &&
      builderState.renderedRenderOrder == renderOrder
    ) {
      return;
    }

    const source = layer.getSource();
    const declutter = layer.getDeclutter();
    const sourceTileGrid = source.getTileGrid();
    const tileGrid = source.getTileGridForProjection(projection);
    const tileExtent = tileGrid.getTileCoordExtent(tile.wrappedTileCoord);

    const sourceTiles = source.getSourceTiles(pixelRatio, projection, tile);
    const layerUid = getUid(layer);
    delete tile.hitDetectionImageData[layerUid];
    tile.executorGroups[layerUid] = [];
    if (declutter) {
      tile.declutterExecutorGroups[layerUid] = [];
    }
    builderState.dirty = false;
    for (let t = 0, tt = sourceTiles.length; t < tt; ++t) {
      const sourceTile = sourceTiles[t];
      if (sourceTile.getState() != TileState.LOADED) {
        continue;
      }
      const sourceTileCoord = sourceTile.tileCoord;
      const sourceTileExtent =
        sourceTileGrid.getTileCoordExtent(sourceTileCoord);
      const sharedExtent = getIntersection(tileExtent, sourceTileExtent);
      const builderExtent = buffer(
        sharedExtent,
        layer.getRenderBuffer() * resolution,
        this.tmpExtent
      );
      const bufferedExtent = equals(sourceTileExtent, sharedExtent)
        ? null
        : builderExtent;
      const builderGroup = new CanvasBuilderGroup(
        0,
        builderExtent,
        resolution,
        pixelRatio
      );
      const declutterBuilderGroup = declutter
        ? new CanvasBuilderGroup(0, sharedExtent, resolution, pixelRatio)
        : undefined;
      const squaredTolerance = getSquaredRenderTolerance(
        resolution,
        pixelRatio
      );

      /**
       * @param {import("../../Feature.js").FeatureLike} feature Feature.
       * @this {CanvasVectorTileLayerRenderer}
       */
      const render = function (feature) {
        let styles;
        const styleFunction =
          feature.getStyleFunction() || layer.getStyleFunction();
        if (styleFunction) {
          styles = styleFunction(feature, resolution);
        }
        if (styles) {
          const dirty = this.renderFeature(
            feature,
            squaredTolerance,
            styles,
            builderGroup,
            declutterBuilderGroup
          );
          builderState.dirty = builderState.dirty || dirty;
        }
      };

      const features = sourceTile.getFeatures();
      if (renderOrder && renderOrder !== builderState.renderedRenderOrder) {
        features.sort(renderOrder);
      }
      for (let i = 0, ii = features.length; i < ii; ++i) {
        const feature = features[i];
        if (
          !bufferedExtent ||
          intersects(bufferedExtent, feature.getGeometry().getExtent())
        ) {
          render.call(this, feature);
        }
      }
      const executorGroupInstructions = builderGroup.finish();
      // no need to clip when the render tile is covered by a single source tile
      const replayExtent =
        layer.getRenderMode() !== VectorTileRenderType.VECTOR &&
        declutter &&
        sourceTiles.length === 1
          ? null
          : sharedExtent;
      const renderingReplayGroup = new CanvasExecutorGroup(
        replayExtent,
        resolution,
        pixelRatio,
        source.getOverlaps(),
        executorGroupInstructions,
        layer.getRenderBuffer()
      );
      tile.executorGroups[layerUid].push(renderingReplayGroup);
      if (declutterBuilderGroup) {
        const declutterExecutorGroup = new CanvasExecutorGroup(
          null,
          resolution,
          pixelRatio,
          source.getOverlaps(),
          declutterBuilderGroup.finish(),
          layer.getRenderBuffer()
        );
        tile.declutterExecutorGroups[layerUid].push(declutterExecutorGroup);
      }
    }
    builderState.renderedRevision = revision;
    builderState.renderedRenderOrder = renderOrder;
    builderState.renderedResolution = resolution;
  }

  /**
   * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {import("../vector.js").FeatureCallback<T>} callback Feature callback.
   * @param {Array<import("../Map.js").HitMatch<T>>} matches The hit detected matches with tolerance.
   * @return {T|undefined} Callback result.
   * @template T
   */
  forEachFeatureAtCoordinate(
    coordinate,
    frameState,
    hitTolerance,
    callback,
    matches
  ) {
    const resolution = frameState.viewState.resolution;
    const rotation = frameState.viewState.rotation;
    hitTolerance = hitTolerance == undefined ? 0 : hitTolerance;
    const layer = this.getLayer();
    const source = layer.getSource();
    const tileGrid = source.getTileGridForProjection(
      frameState.viewState.projection
    );

    const hitExtent = boundingExtent([coordinate]);
    buffer(hitExtent, resolution * hitTolerance, hitExtent);

    /** @type {!Object<string, import("../Map.js").HitMatch<T>|true>} */
    const features = {};

    /**
     * @param {import("../../Feature.js").FeatureLike} feature Feature.
     * @param {import("../../geom/SimpleGeometry.js").default} geometry Geometry.
     * @param {number} distanceSq The squared distance to the click position.
     * @return {T|undefined} Callback result.
     */
    const featureCallback = function (feature, geometry, distanceSq) {
      let key = feature.getId();
      if (key === undefined) {
        key = getUid(feature);
      }
      const match = features[key];
      if (!match) {
        if (distanceSq === 0) {
          features[key] = true;
          return callback(feature, layer, geometry);
        }
        matches.push(
          (features[key] = {
            feature: feature,
            layer: layer,
            geometry: geometry,
            distanceSq: distanceSq,
            callback: callback,
          })
        );
      } else if (match !== true && distanceSq < match.distanceSq) {
        if (distanceSq === 0) {
          features[key] = true;
          matches.splice(matches.lastIndexOf(match), 1);
          return callback(feature, layer, geometry);
        }
        match.geometry = geometry;
        match.distanceSq = distanceSq;
      }
      return undefined;
    };

    const renderedTiles =
      /** @type {Array<import("../../VectorRenderTile.js").default>} */ (
        this.renderedTiles
      );

    let found;
    for (let i = 0, ii = renderedTiles.length; !found && i < ii; ++i) {
      const tile = renderedTiles[i];
      const tileExtent = tileGrid.getTileCoordExtent(tile.wrappedTileCoord);
      if (!intersects(tileExtent, hitExtent)) {
        continue;
      }

      const layerUid = getUid(layer);
      const executorGroups = [tile.executorGroups[layerUid]];
      const declutterExecutorGroups = tile.declutterExecutorGroups[layerUid];
      if (declutterExecutorGroups) {
        executorGroups.push(declutterExecutorGroups);
      }
      executorGroups.some((executorGroups) => {
        const declutteredFeatures =
          executorGroups === declutterExecutorGroups
            ? frameState.declutterTree.all().map((item) => item.value)
            : null;
        for (let t = 0, tt = executorGroups.length; t < tt; ++t) {
          const executorGroup = executorGroups[t];
          found = executorGroup.forEachFeatureAtCoordinate(
            coordinate,
            resolution,
            rotation,
            hitTolerance,
            featureCallback,
            declutteredFeatures
          );
          if (found) {
            return true;
          }
        }
      });
    }
    return found;
  }

  /**
   * Asynchronous layer level hit detection.
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @return {Promise<Array<import("../../Feature").default>>} Promise that resolves with an array of features.
   */
  getFeatures(pixel) {
    return new Promise(
      function (resolve, reject) {
        const layer =
          /** @type {import("../../layer/VectorTile.js").default} */ (
            this.getLayer()
          );
        const layerUid = getUid(layer);
        const source = layer.getSource();
        const projection = this.renderedProjection;
        const projectionExtent = projection.getExtent();
        const resolution = this.renderedResolution;
        const tileGrid = source.getTileGridForProjection(projection);
        const coordinate = applyTransform(
          this.renderedPixelToCoordinateTransform_,
          pixel.slice()
        );
        const tileCoord = tileGrid.getTileCoordForCoordAndResolution(
          coordinate,
          resolution
        );
        let tile;
        for (let i = 0, ii = this.renderedTiles.length; i < ii; ++i) {
          if (
            tileCoord.toString() === this.renderedTiles[i].tileCoord.toString()
          ) {
            tile = this.renderedTiles[i];
            if (tile.getState() === TileState.LOADED) {
              const extent = tileGrid.getTileCoordExtent(tile.tileCoord);
              if (
                source.getWrapX() &&
                projection.canWrapX() &&
                !containsExtent(projectionExtent, extent)
              ) {
                wrapX(coordinate, projection);
              }
              break;
            }
            tile = undefined;
          }
        }
        if (!tile || tile.loadingSourceTiles > 0) {
          resolve([]);
          return;
        }
        const extent = tileGrid.getTileCoordExtent(tile.wrappedTileCoord);
        const corner = getTopLeft(extent);
        const tilePixel = [
          (coordinate[0] - corner[0]) / resolution,
          (corner[1] - coordinate[1]) / resolution,
        ];
        const features = tile
          .getSourceTiles()
          .reduce(function (accumulator, sourceTile) {
            return accumulator.concat(sourceTile.getFeatures());
          }, []);
        let hitDetectionImageData = tile.hitDetectionImageData[layerUid];
        if (!hitDetectionImageData && !this.animatingOrInteracting_) {
          const tileSize = toSize(
            tileGrid.getTileSize(
              tileGrid.getZForResolution(resolution, source.zDirection)
            )
          );
          const rotation = this.renderedRotation_;
          const transforms = [
            this.getRenderTransform(
              tileGrid.getTileCoordCenter(tile.wrappedTileCoord),
              resolution,
              0,
              HIT_DETECT_RESOLUTION,
              tileSize[0] * HIT_DETECT_RESOLUTION,
              tileSize[1] * HIT_DETECT_RESOLUTION,
              0
            ),
          ];
          hitDetectionImageData = createHitDetectionImageData(
            tileSize,
            transforms,
            features,
            layer.getStyleFunction(),
            tileGrid.getTileCoordExtent(tile.wrappedTileCoord),
            tile.getReplayState(layer).renderedResolution,
            rotation
          );
          tile.hitDetectionImageData[layerUid] = hitDetectionImageData;
        }
        resolve(hitDetect(tilePixel, features, hitDetectionImageData));
      }.bind(this)
    );
  }

  /**
   * Perform action necessary to get the layer rendered after new fonts have loaded
   */
  handleFontsChanged() {
    const layer = this.getLayer();
    if (layer.getVisible() && this.renderedLayerRevision_ !== undefined) {
      layer.changed();
    }
  }

  /**
   * Handle changes in image style state.
   * @param {import("../../events/Event.js").default} event Image style change event.
   * @private
   */
  handleStyleImageChange_(event) {
    this.renderIfReadyAndVisible();
  }

  /**
   * Render declutter items for this layer
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   */
  renderDeclutter(frameState) {
    const context = this.context;
    const alpha = context.globalAlpha;
    context.globalAlpha = this.getLayer().getOpacity();
    const viewHints = frameState.viewHints;
    const hifi = !(
      viewHints[ViewHint.ANIMATING] || viewHints[ViewHint.INTERACTING]
    );
    const tiles =
      /** @type {Array<import("../../VectorRenderTile.js").default>} */ (
        this.renderedTiles
      );
    for (let i = 0, ii = tiles.length; i < ii; ++i) {
      const tile = tiles[i];
      const declutterExecutorGroups =
        tile.declutterExecutorGroups[getUid(this.getLayer())];
      if (declutterExecutorGroups) {
        for (let j = declutterExecutorGroups.length - 1; j >= 0; --j) {
          declutterExecutorGroups[j].execute(
            this.context,
            1,
            this.getTileRenderTransform(tile, frameState),
            frameState.viewState.rotation,
            hifi,
            undefined,
            frameState.declutterTree
          );
        }
      }
    }
    context.globalAlpha = alpha;
  }

  getTileRenderTransform(tile, frameState) {
    const pixelRatio = frameState.pixelRatio;
    const viewState = frameState.viewState;
    const center = viewState.center;
    const resolution = viewState.resolution;
    const rotation = viewState.rotation;
    const size = frameState.size;
    const width = Math.round(size[0] * pixelRatio);
    const height = Math.round(size[1] * pixelRatio);

    const source = this.getLayer().getSource();
    const tileGrid = source.getTileGridForProjection(
      frameState.viewState.projection
    );
    const tileCoord = tile.tileCoord;
    const tileExtent = tileGrid.getTileCoordExtent(tile.wrappedTileCoord);
    const worldOffset =
      tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent)[0] - tileExtent[0];
    const transform = multiply(
      scale(this.inversePixelTransform.slice(), 1 / pixelRatio, 1 / pixelRatio),
      this.getRenderTransform(
        center,
        resolution,
        rotation,
        pixelRatio,
        width,
        height,
        worldOffset
      )
    );
    return transform;
  }

  /**
   * Render the layer.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {HTMLElement} target Target that may be used to render content to.
   * @return {HTMLElement} The rendered element.
   */
  renderFrame(frameState, target) {
    const viewHints = frameState.viewHints;
    const hifi = !(
      viewHints[ViewHint.ANIMATING] || viewHints[ViewHint.INTERACTING]
    );

    super.renderFrame(frameState, target);
    this.renderedPixelToCoordinateTransform_ =
      frameState.pixelToCoordinateTransform.slice();
    this.renderedRotation_ = frameState.viewState.rotation;

    const layer = /** @type {import("../../layer/VectorTile.js").default} */ (
      this.getLayer()
    );
    const renderMode = layer.getRenderMode();
    const context = this.context;
    const alpha = context.globalAlpha;
    context.globalAlpha = layer.getOpacity();
    const replayTypes = VECTOR_REPLAYS[renderMode];
    const viewState = frameState.viewState;
    const rotation = viewState.rotation;
    const tileSource = layer.getSource();
    const tileGrid = tileSource.getTileGridForProjection(viewState.projection);
    const z = tileGrid.getZForResolution(
      viewState.resolution,
      tileSource.zDirection
    );

    const tiles = this.renderedTiles;
    const clips = [];
    const clipZs = [];
    let ready = true;
    for (let i = tiles.length - 1; i >= 0; --i) {
      const tile = /** @type {import("../../VectorRenderTile.js").default} */ (
        tiles[i]
      );
      ready = ready && !tile.getReplayState(layer).dirty;
      const executorGroups = tile.executorGroups[getUid(layer)].filter(
        (group) => group.hasExecutors(replayTypes)
      );
      if (executorGroups.length === 0) {
        continue;
      }
      const transform = this.getTileRenderTransform(tile, frameState);
      const currentZ = tile.tileCoord[0];
      let contextSaved = false;
      // Clip mask for regions in this tile that already filled by a higher z tile
      const currentClip = executorGroups[0].getClipCoords(transform);
      if (currentClip) {
        for (let j = 0, jj = clips.length; j < jj; ++j) {
          if (z !== currentZ && currentZ < clipZs[j]) {
            const clip = clips[j];
            if (
              intersects(
                [
                  currentClip[0],
                  currentClip[3],
                  currentClip[4],
                  currentClip[7],
                ],
                [clip[0], clip[3], clip[4], clip[7]]
              )
            ) {
              if (!contextSaved) {
                context.save();
                contextSaved = true;
              }
              context.beginPath();
              // counter-clockwise (outer ring) for current tile
              context.moveTo(currentClip[0], currentClip[1]);
              context.lineTo(currentClip[2], currentClip[3]);
              context.lineTo(currentClip[4], currentClip[5]);
              context.lineTo(currentClip[6], currentClip[7]);
              // clockwise (inner ring) for higher z tile
              context.moveTo(clip[6], clip[7]);
              context.lineTo(clip[4], clip[5]);
              context.lineTo(clip[2], clip[3]);
              context.lineTo(clip[0], clip[1]);
              context.clip();
            }
          }
        }
        clips.push(currentClip);
        clipZs.push(currentZ);
      }
      for (let t = 0, tt = executorGroups.length; t < tt; ++t) {
        const executorGroup = executorGroups[t];
        executorGroup.execute(
          context,
          1,
          transform,
          rotation,
          hifi,
          replayTypes
        );
      }
      if (contextSaved) {
        context.restore();
      }
    }
    context.globalAlpha = alpha;
    this.ready = ready;

    return this.container;
  }

  /**
   * @param {import("../../Feature.js").FeatureLike} feature Feature.
   * @param {number} squaredTolerance Squared tolerance.
   * @param {import("../../style/Style.js").default|Array<import("../../style/Style.js").default>} styles The style or array of styles.
   * @param {import("../../render/canvas/BuilderGroup.js").default} builderGroup Replay group.
   * @param {import("../../render/canvas/BuilderGroup.js").default} [opt_declutterBuilderGroup] Builder group for decluttering.
   * @return {boolean} `true` if an image is loading.
   */
  renderFeature(
    feature,
    squaredTolerance,
    styles,
    builderGroup,
    opt_declutterBuilderGroup
  ) {
    if (!styles) {
      return false;
    }
    let loading = false;
    if (Array.isArray(styles)) {
      for (let i = 0, ii = styles.length; i < ii; ++i) {
        loading =
          renderFeature(
            builderGroup,
            feature,
            styles[i],
            squaredTolerance,
            this.boundHandleStyleImageChange_,
            undefined,
            opt_declutterBuilderGroup
          ) || loading;
      }
    } else {
      loading = renderFeature(
        builderGroup,
        feature,
        styles,
        squaredTolerance,
        this.boundHandleStyleImageChange_,
        undefined,
        opt_declutterBuilderGroup
      );
    }
    return loading;
  }

  /**
   * @param {import("../../VectorRenderTile.js").default} tile Tile.
   * @return {boolean} A new tile image was rendered.
   * @private
   */
  tileImageNeedsRender_(tile) {
    const layer = /** @type {import("../../layer/VectorTile.js").default} */ (
      this.getLayer()
    );
    if (layer.getRenderMode() === VectorTileRenderType.VECTOR) {
      return false;
    }
    const replayState = tile.getReplayState(layer);
    const revision = layer.getRevision();
    const resolution = tile.wantedResolution;
    return (
      replayState.renderedTileResolution !== resolution ||
      replayState.renderedTileRevision !== revision
    );
  }

  /**
   * @param {import("../../VectorRenderTile.js").default} tile Tile.
   * @param {import("../../PluggableMap").FrameState} frameState Frame state.
   * @private
   */
  renderTileImage_(tile, frameState) {
    const layer = /** @type {import("../../layer/VectorTile.js").default} */ (
      this.getLayer()
    );
    const replayState = tile.getReplayState(layer);
    const revision = layer.getRevision();
    const executorGroups = tile.executorGroups[getUid(layer)];
    replayState.renderedTileRevision = revision;

    const tileCoord = tile.wrappedTileCoord;
    const z = tileCoord[0];
    const source = layer.getSource();
    let pixelRatio = frameState.pixelRatio;
    const viewState = frameState.viewState;
    const projection = viewState.projection;
    const tileGrid = source.getTileGridForProjection(projection);
    const tileResolution = tileGrid.getResolution(tile.tileCoord[0]);
    const renderPixelRatio =
      (frameState.pixelRatio / tile.wantedResolution) * tileResolution;
    const resolution = tileGrid.getResolution(z);
    const context = tile.getContext(layer);

    // Increase tile size when overzooming for low pixel ratio, to avoid blurry tiles
    pixelRatio = Math.round(
      Math.max(pixelRatio, renderPixelRatio / pixelRatio)
    );
    const size = source.getTilePixelSize(z, pixelRatio, projection);
    context.canvas.width = size[0];
    context.canvas.height = size[1];
    const renderScale = pixelRatio / renderPixelRatio;
    if (renderScale !== 1) {
      const canvasTransform = resetTransform(this.tmpTransform_);
      scaleTransform(canvasTransform, renderScale, renderScale);
      context.setTransform.apply(context, canvasTransform);
    }
    const tileExtent = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent);
    const pixelScale = renderPixelRatio / resolution;
    const transform = resetTransform(this.tmpTransform_);
    scaleTransform(transform, pixelScale, -pixelScale);
    translateTransform(transform, -tileExtent[0], -tileExtent[3]);
    for (let i = 0, ii = executorGroups.length; i < ii; ++i) {
      const executorGroup = executorGroups[i];
      executorGroup.execute(
        context,
        renderScale,
        transform,
        0,
        true,
        IMAGE_REPLAYS[layer.getRenderMode()]
      );
    }
    replayState.renderedTileResolution = tile.wantedResolution;
  }
}

export default CanvasVectorTileLayerRenderer;
