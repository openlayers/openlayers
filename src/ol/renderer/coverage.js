/**
 * @module ol/renderer/coverage
 */
import _ol_renderer_vector_ from './vector.js';
import {equivalent} from '../proj.js';
import CoverageType from '../coverage/CoverageType.js';
import LinkedList from '../structs/LinkedList.js';
import _ol_geom_flat_transform_ from '../geom/flat/transform.js';
import {extend} from '../array.js';
import {getTransformFromProjections} from '../proj.js';
import ReplayType from '../render/ReplayType.js';

/**
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @return {number} Pixel tolerance.
 */
export function getTolerance(resolution, pixelRatio) {
  return _ol_renderer_vector_.getTolerance(resolution, pixelRatio);
}


/**
 * @param {ol.coverage.Band} band Input band.
 * @param {Array.<number>} shape Cell shape.
 * @param {ol.coverage.CoverageType} type Coverage type.
 * @param {ol.proj.Projection} inProj Coverage projection.
 * @param {ol.proj.Projection} outProj Map projection.
 * @param {number} maxAlpha Maximum alpha value.
 * @return {Array.<number>} Flat coverage.
 */
export function createGrid(band, shape, type, inProj, outProj, maxAlpha) {
  const reproj = !equivalent(inProj, outProj);
  const transform = getTransformFromProjections(inProj, outProj);
  const flatCoverage = [];
  const matrix = band.getCoverageData();
  const numRows = (matrix.length / 4) / band.getStride();
  const origin = band.getOrigin();
  const resolution = band.getResolution();
  const colorStride = band.getStride() * 4;
  const rowTransforms = new LinkedList();
  const colTransforms = new LinkedList();
  // TODO: It might be beneficial to use affine transforms with transform2D here.
  if (type === CoverageType.RECTANGULAR) {
    rowTransforms.insertItem({
      translate: [0, resolution[1]],
      rotate: 0,
      offset: 0
    });
    colTransforms.insertItem({
      translate: [resolution[0], 0],
      rotate: 0
    });
  } else if (type === CoverageType.HEXAGONAL) {
    const translateX = resolution[1] * (2 / 3);
    rowTransforms.insertItem({
      translate: [resolution[0] / 2, translateX],
      rotate: 0,
      offset: 0
    });
    rowTransforms.insertItem({
      translate: [-resolution[0] / 2, translateX],
      rotate: 0,
      offset: 0
    });
    colTransforms.insertItem({
      translate: [resolution[0], 0],
      rotate: 0
    });
  }

  let colCursor = [origin[0], origin[1]];
  let rowCursor = [colCursor[0], colCursor[1]];
  let rotation = 0;
  for (let i = numRows - 1; i >= 0; --i) {
    const firstCell = i * colorStride;
    const lastCell = firstCell + colorStride;
    for (let j = firstCell; j < lastCell; j += 4) {
      if (matrix[j + 3] !== maxAlpha) {
        let cell = _ol_geom_flat_transform_.translate(shape, 0, shape.length,
          2, colCursor[0], colCursor[1]);
        if (rotation) {
          cell = _ol_geom_flat_transform_.rotate(cell, 0, cell.length, 2,
            rotation, colCursor);
        }
        if (reproj) {
          cell = transform(cell);
        }
        extend(flatCoverage, cell);
        flatCoverage[flatCoverage.length] = matrix[j];
        flatCoverage[flatCoverage.length] = matrix[j + 1];
        flatCoverage[flatCoverage.length] = matrix[j + 2];
        flatCoverage[flatCoverage.length] = matrix[j + 3];
      }
      const nextColTransform = colTransforms.nextItem();
      colCursor = [colCursor[0] + nextColTransform.translate[0],
        colCursor[1] + nextColTransform.translate[1]];
      rotation += nextColTransform.rotate;
    }
    const nextRowTransform = rowTransforms.nextItem();
    rowCursor = [rowCursor[0] + nextRowTransform.translate[0],
      rowCursor[1] + nextRowTransform.translate[1]];
    rotation = nextRowTransform.rotate;
    colTransforms.lastItem();
    for (let j = 0; j < nextRowTransform.offset; ++j) {
      colTransforms.nextItem();
    }
    colCursor = [rowCursor[0], rowCursor[1]];
  }
  return flatCoverage;
}


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {Array.<number>} flatCoverage Coverage cell coordinates and colors.
 * @param {number} numVertices Number of vertex coordinates in a cell.
 * @param {ol.style.Stroke} stroke Stroke style for cosmetic stroke.
 */
export function renderCoverage(replayGroup, flatCoverage, numVertices, stroke) {
  const coverageReplay = replayGroup.getReplay(undefined, ReplayType.COVERAGE);
  coverageReplay.setFillStrokeStyle(undefined, stroke);
  coverageReplay.drawCoverage(flatCoverage, numVertices);
}
