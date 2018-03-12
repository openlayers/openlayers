/**
 * @module ol/renderer/webgl/CoverageLayer
 */
import {inherits} from '../../index.js';
import WebGLVectorLayerRenderer from '../webgl/VectorLayer.js';
import LayerType from '../../LayerType.js';
import RendererType from '../Type.js';
import ViewHint from '../../ViewHint.js';
import {containsExtent, buffer, containsCoordinate} from '../../extent.js';
import WebGLReplayGroup from '../../render/webgl/ReplayGroup.js';
import {getTolerance, createGrid, renderCoverage} from '../coverage.js';
import CoverageType from '../../coverage/CoverageType.js';
import _ol_geom_flat_deflate_ from '../../geom/flat/deflate.js';
import _ol_geom_flat_transform_ from '../../geom/flat/transform.js';
import Tessellator from '../../webgl/Tessellator.js';
import {equivalent, transformExtent} from '../../proj.js';
import State from '../../source/State.js';

/**
 * @constructor
 * @extends {ol.renderer.webgl.Vector}
 * @param {ol.renderer.webgl.Map} mapRenderer Map renderer.
 * @param {ol.layer.Coverage} coverageLayer Vector layer.
 * @api
 */
const WebGLCoverageLayerRenderer = function(mapRenderer, coverageLayer) {

  WebGLVectorLayerRenderer.call(this, mapRenderer, coverageLayer);

  /**
   * @private
   * @type {string|undefined}
   */
  this.renderedChecksum_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.renderedSourceRevision_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.buffer_ = undefined;

  /**
   * @private
   * @type {ol.structs.RBush}
   */
  this.coverageCache_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.numVertices_ = undefined;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.indices_ = [];

};

inherits(WebGLCoverageLayerRenderer, WebGLVectorLayerRenderer);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
WebGLCoverageLayerRenderer['handles'] = function(type, layer) {
  return type === RendererType.WEBGL && layer.getType() === LayerType.COVERAGE;
};


/**
 * Create a layer renderer.
 * @param {ol.renderer.Map} mapRenderer The map renderer.
 * @param {ol.layer.Layer} layer The layer to be rendererd.
 * @return {ol.renderer.webgl.CoverageLayer} The layer renderer.
 */
WebGLCoverageLayerRenderer['create'] = function(mapRenderer, layer) {
  return new WebGLCoverageLayerRenderer(
    /** @type {ol.renderer.webgl.Map} */ (mapRenderer),
    /** @type {ol.layer.Coverage} */ (layer)
  );
};


/**
 * @inheritDoc
 */
WebGLCoverageLayerRenderer.prototype.prepareFrame = function(frameState, layerState, context) {
  const coverageLayer = /** @type {ol.layer.Vector} */ (this.getLayer());
  const coverageSource = coverageLayer.getSource();

  const style = coverageLayer.getStyle();
  if (!style) {
    return false;
  } else if (this.renderedChecksum_ !== style.getChecksum()) {
    style.fillMissingValues(coverageSource.getBands());
  }

  const animating = frameState.viewHints[ViewHint.ANIMATING];
  const interacting = frameState.viewHints[ViewHint.INTERACTING];
  const updateWhileAnimating = coverageLayer.getUpdateWhileAnimating();
  const updateWhileInteracting = coverageLayer.getUpdateWhileInteracting();

  if ((!updateWhileAnimating && animating) ||
      (!updateWhileInteracting && interacting)) {
    return true;
  }

  const extent = frameState.extent;
  const viewState = frameState.viewState;
  const projection = viewState.projection;
  const resolution = viewState.resolution;
  const pixelRatio = frameState.pixelRatio;
  const coverageLayerRevision = coverageLayer.getRevision();

  if (this.renderedResolution == resolution &&
      this.renderedRevision == coverageLayerRevision &&
      containsExtent(this.renderedExtent, extent)) {
    this.replayGroupChanged = false;
    return true;
  }

  const type = coverageSource.getType() || CoverageType.RECTANGULAR;
  if (this.renderedChecksum_ != style.getChecksum() ||
    this.renderedSourceRevision_ != coverageSource.getRevision()) {

    const styledCoverage = coverageSource.getStyledBand(style, 1, 0);
    if (!styledCoverage) {
      return false;
    }
    const pattern = coverageSource.getPattern();
    const cell = this.getCellCoordinates_(type, styledCoverage.getResolution(), pattern);
    const vertices = cell.vertices.length;
    const rtree = createGrid(styledCoverage, cell.vertices, type,
      coverageSource.getProjection(), projection, 0, pattern);

    this.renderedChecksum_ = style.getChecksum();
    this.renderedSourceRevision_ = coverageSource.getRevision();
    this.buffer_ = Math.max.apply(null, styledCoverage.getResolution());
    this.coverageCache_ = rtree;
    this.numVertices_ = vertices;
    this.indices_ = cell.indices;
  }

  if (this.replayGroup) {
    frameState.postRenderFunctions.push(
      this.replayGroup.getDeleteResourcesFunction(context));
    this.replayGroup = null;
  }

  const flatCoverage = [];
  const bufferedExtent = buffer(extent, this.buffer_);
  _ol_geom_flat_deflate_.coordinates(flatCoverage, 0,
    this.coverageCache_.getInExtent(bufferedExtent), this.numVertices_ + 4);
  if (!flatCoverage.length) {
    return false;
  }

  const replayGroup = new WebGLReplayGroup(
    getTolerance(resolution, pixelRatio), extent, 0);

  renderCoverage(replayGroup, flatCoverage, this.numVertices_, undefined,
    this.indices_);
  replayGroup.finish(context);

  this.renderedResolution = resolution;
  this.renderedRevision = coverageLayerRevision;
  this.renderedExtent = extent;
  this.replayGroup = replayGroup;

  return true;
};


/**
 * @inheritDoc
 */
WebGLCoverageLayerRenderer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg) {
  return undefined;
};


/**
 * @inheritDoc
 */
WebGLCoverageLayerRenderer.prototype.hasFeatureAtCoordinate = function(coordinate, frameState) {
  const coverageLayer = /** @type {ol.layer.Coverage} */ (this.getLayer());
  const coverageSource = coverageLayer.getSource();

  if (coverageSource.getState() === State.READY) {
    const projection = frameState.viewState.projection;
    const sourceProjection = coverageSource.getProjection();

    const coverageExtent = equivalent(projection, sourceProjection) ?
      coverageSource.getExtent() : transformExtent(coverageSource.getExtent(),
        sourceProjection, projection);

    if (containsCoordinate(coverageExtent, coordinate)) {
      return true;
    }
  }

  return false;
};


/**
 * @private
 * @param {ol.coverage.CoverageType} type Coverage type.
 * @param {ol.Size} resolution Cell resolution.
 * @param {ol.CoveragePattern} pattern Coverage pattern.
 * @return {{vertices: Array.<number>,
             indices: Array.<number>}} Cell coordinates relative to centroid and indices.
 */
WebGLCoverageLayerRenderer.prototype.getCellCoordinates_ = function(type, resolution, pattern) {
  const shape = {
    vertices: [],
    indices: []
  };
  const halfX = resolution[0] / 2;
  const halfY = resolution[1] / 2;
  switch (type) {
    case CoverageType.HEXAGONAL:
      const fourthY = halfY / 2;
      shape.vertices = [-halfX, -fourthY, 0, -halfY, halfX, -fourthY, halfX, fourthY,
        0, halfY, -halfX, fourthY];
      shape.indices = [0, 1, 2, 2, 3, 0, 0, 3, 5, 5, 3, 4];
      break;
    case CoverageType.CUSTOM:
      let cellShape = [];
      _ol_geom_flat_deflate_.coordinates(cellShape, 0, pattern.shape, 2);
      cellShape = _ol_geom_flat_transform_.scale(cellShape, 0, cellShape.length, 2,
        resolution[0], resolution[1], [0, 0]);
      const tessellator = new Tessellator(cellShape, [], 2);
      shape.vertices = tessellator.vertices;
      shape.indices = tessellator.indices;
      break;
    // Default type is CoverageType.RECTANGULAR.
    default:
      shape.vertices = [-halfX, -halfY, halfX, -halfY, halfX, halfY, -halfX, halfY];
      shape.indices = [0, 1, 2, 2, 3, 0];
      break;
  }
  return shape;
};


export default WebGLCoverageLayerRenderer;
