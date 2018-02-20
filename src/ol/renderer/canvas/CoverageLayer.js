/**
 * @module ol/renderer/canvas/CoverageLayer
 */
import {inherits} from '../../index.js';
import CanvasVectorLayerRenderer from './VectorLayer.js';
import LayerType from '../../LayerType.js';
import RendererType from '../Type.js';
import ViewHint from '../../ViewHint.js';
import {containsExtent, getWidth} from '../../extent.js';
import CanvasReplayGroup from '../../render/canvas/ReplayGroup.js';
import {getTolerance, createGrid, renderCoverage} from '../coverage.js';
import CoverageType from '../../coverage/CoverageType.js';
import {equivalent} from '../../proj.js';
import Stroke from '../../style/Stroke.js';

/**
 * @constructor
 * @extends {ol.renderer.canvas.Vector}
 * @param {ol.layer.Coverage} coverageLayer Coverage layer.
 * @api
 */
const CanvasCoverageLayerRenderer = function(coverageLayer) {

  CanvasVectorLayerRenderer.call(this, coverageLayer);

  /**
   * @private
   * @type {string|undefined}
   */
  this.renderedStyleChecksum_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.renderedSourceRevision_ = undefined;

  /**
   * @private
   * @type {ol.coverage.Band}
   */
  this.coverageCache_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.numVertices_ = undefined;

};

inherits(CanvasCoverageLayerRenderer, CanvasVectorLayerRenderer);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
CanvasCoverageLayerRenderer['handles'] = function(type, layer) {
  return type === RendererType.CANVAS && layer.getType() === LayerType.COVERAGE;
};


/**
 * Create a layer renderer.
 * @param {ol.renderer.Map} mapRenderer The map renderer.
 * @param {ol.layer.Layer} layer The layer to be rendererd.
 * @return {ol.renderer.canvas.CoverageLayer} The layer renderer.
 */
CanvasCoverageLayerRenderer['create'] = function(mapRenderer, layer) {
  return new CanvasCoverageLayerRenderer(/** @type {ol.layer.Coverage} */ (layer));
};


/**
 * @inheritDoc
 */
CanvasCoverageLayerRenderer.prototype.prepareFrame = function(frameState,
  layerState) {

  const coverageLayer = /** @type {ol.layer.Coverage} */ (this.getLayer());
  const coverageSource = coverageLayer.getSource();

  const style = coverageLayer.getStyle();
  if (!style) {
    return false;
  } else if (this.renderedStyleChecksum_ !== style.getChecksum()) {
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
  const projectionExtent = viewState.projection.getExtent();

  if (coverageSource.getWrapX() && viewState.projection.canWrapX() &&
      !containsExtent(projectionExtent, frameState.extent)) {
    // For the replay group, we need an extent that intersects the real world
    // (-180° to +180°). To support geometries in a coordinate range from -540°
    // to +540°, we add at least 1 world width on each side of the projection
    // extent. If the viewport is wider than the world, we need to add half of
    // the viewport width to make sure we cover the whole viewport.
    const worldWidth = getWidth(projectionExtent);
    const gutter = Math.max(getWidth(extent) / 2, worldWidth);
    extent[0] = projectionExtent[0] - gutter;
    extent[2] = projectionExtent[2] + gutter;
  }

  if (this.renderedResolution == resolution &&
      this.renderedRevision == coverageLayerRevision &&
      containsExtent(this.renderedExtent, extent)) {
    this.replayGroupChanged = false;
    return true;
  }

  this.replayGroup = null;

  const replayGroup = new CanvasReplayGroup(getTolerance(resolution, pixelRatio),
    extent, resolution, pixelRatio, false, undefined, 0);

  let grid, vertices;
  const type = coverageSource.getType() || CoverageType.RECTANGULAR;
  if (this.renderedStyleChecksum_ == style.getChecksum() &&
    this.renderedSourceRevision_ == coverageSource.getRevision()) {

    grid = this.coverageCache_;
    vertices = this.numVertices_;
  } else {
    const styledCoverage = coverageSource.getStyledBand(style, 1, 0);
    if (!styledCoverage) {
      return false;
    }
    const cellCoords = this.getCellCoordinates_(type, styledCoverage.getResolution());
    vertices = cellCoords.length;
    grid = createGrid(styledCoverage, cellCoords, type,
      coverageSource.getProjection(), projection, 0);
    if (!grid.length) {
      return false;
    }
  }

  const strokeWidth = coverageLayer.getStroke() !== undefined ? coverageLayer.getStroke() :
    type !== CoverageType.RECTANGULAR || !equivalent(
      coverageSource.getProjection(), projection) ? 2 : 0;
  const stroke = strokeWidth !== 0 ? new Stroke({
    width: strokeWidth
  }) : undefined;
  renderCoverage(replayGroup, grid, vertices, stroke);
  replayGroup.finish();

  this.renderedResolution = resolution;
  this.renderedRevision = coverageLayerRevision;
  this.renderedExtent = extent;
  this.replayGroup = replayGroup;
  this.renderedStyleChecksum_ = style.getChecksum();
  this.renderedSourceRevision_ = coverageSource.getRevision();
  this.coverageCache_ = grid;
  this.numVertices_ = vertices;

  this.replayGroupChanged = true;
  return true;
};


/**
 * @private
 * @param {ol.coverage.CoverageType} type Coverage type.
 * @param {ol.Size} resolution Cell resolution.
 * @return {Array.<number>} Cell coordinates relative to centroid.
 */
CanvasCoverageLayerRenderer.prototype.getCellCoordinates_ = function(type, resolution) {
  const halfX = resolution[0] / 2;
  const halfY = resolution[1] / 2;
  switch (type) {
    case CoverageType.HEXAGONAL:
      const fourthY = halfY / 2;
      return [-halfX, -fourthY, 0, -halfY, halfX, -fourthY, halfX, fourthY,
        0, halfY, -halfX, fourthY];
    case CoverageType.CUSTOM:
      // TODO: Implement custom pattern expansion.
      break;
    // Default type is CoverageType.RECTANGULAR.
    default:
      return [-halfX, -halfY, halfX, -halfY, halfX, halfY, -halfX, halfY];
  }
};


export default CanvasCoverageLayerRenderer;
