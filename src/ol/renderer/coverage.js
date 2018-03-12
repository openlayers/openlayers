/**
 * @module ol/renderer/coverage
 */
import {getTolerance as getVectorTolerance} from './vector.js';
import {equivalent} from '../proj.js';
import CoverageType from '../coverage/CoverageType.js';
import LinkedList from '../structs/LinkedList.js';
import RBush from '../structs/RBush.js';
import {translate, rotate} from '../geom/flat/transform.js';
import {getTransformFromProjections} from '../proj.js';
import ReplayType from '../render/ReplayType.js';

/**
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @return {number} Pixel tolerance.
 */
export function getTolerance(resolution, pixelRatio) {
  return getVectorTolerance(resolution, pixelRatio);
}


/**
 * @param {ol.coverage.Band} band Input band.
 * @param {Array.<number>} shape Cell shape.
 * @param {ol.coverage.CoverageType} type Coverage type.
 * @param {ol.proj.Projection} inProj Coverage projection.
 * @param {ol.proj.Projection} outProj Map projection.
 * @param {number} maxAlpha Maximum alpha value.
 * @param {ol.CoveragePattern=} pattern Coverage pattern.
 * @return {ol.structs.RBush} R-tree filled with cells.
 */
export function createGrid(band, shape, type, inProj, outProj, maxAlpha, pattern) {
  const reproj = !equivalent(inProj, outProj);
  const transform = getTransformFromProjections(inProj, outProj);
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
      translation: [0, resolution[1]],
      rotation: 0,
      offset: 0
    });
    colTransforms.insertItem({
      translation: [resolution[0], 0],
      rotation: 0
    });
  } else if (type === CoverageType.HEXAGONAL) {
    const translateX = resolution[1] * (2 / 3);
    rowTransforms.insertItem({
      translation: [resolution[0] / 2, translateX],
      rotation: 0,
      offset: 0
    });
    rowTransforms.insertItem({
      translation: [-resolution[0] / 2, translateX],
      rotation: 0,
      offset: 0
    });
    colTransforms.insertItem({
      translation: [resolution[0], 0],
      rotation: 0
    });
  } else {
    const rows = pattern.rowPattern;
    for (let i = 0, ii = rows.length; i < ii; ++i) {
      const currTranslate = rows[i].translation;
      rowTransforms.insertItem({
        translation: [currTranslate[0] * resolution[0], currTranslate[1] * resolution[1]],
        rotation: rows[i].rotation,
        offset: rows[i].offset
      });
    }

    const cols = pattern.columnPattern;
    for (let i = 0, ii = cols.length; i < ii; ++i) {
      const currTranslate = cols[i].translation;
      colTransforms.insertItem({
        translation: [currTranslate[0] * resolution[0], currTranslate[1] * resolution[1]],
        rotation: cols[i].rotation
      });
    }
  }

  let colCursor = [origin[0], origin[1]];
  let rowCursor = [colCursor[0], colCursor[1]];
  let rotation = 0;
  const extents = [];
  const cells = [];
  for (let i = numRows - 1; i >= 0; --i) {
    const firstCell = i * colorStride;
    const lastCell = firstCell + colorStride;
    for (let j = firstCell; j < lastCell; j += 4) {
      if (matrix[j + 3] !== maxAlpha) {
        let extentCursor = [colCursor[0], colCursor[1]];
        let cell = shape;
        if (rotation) {
          cell = rotate(cell, 0, cell.length, 2, rotation, [0, 0]);
        }
        cell = translate(cell, 0, cell.length, 2, colCursor[0], colCursor[1]);
        if (reproj) {
          cell = transform(cell);
          extentCursor = transform(extentCursor);
        }
        cell[cell.length] = matrix[j];
        cell[cell.length] = matrix[j + 1];
        cell[cell.length] = matrix[j + 2];
        cell[cell.length] = matrix[j + 3];

        cells.push(cell);
        // Save cell centers as extents.
        extents.push([extentCursor[0], extentCursor[1], extentCursor[0],
          extentCursor[1]]);
      }
      const nextColTransform = colTransforms.nextItem();
      colCursor = [colCursor[0] + nextColTransform.translation[0],
        colCursor[1] + nextColTransform.translation[1]];
      rotation += nextColTransform.rotation;
    }
    const nextRowTransform = rowTransforms.nextItem();
    rowCursor = [rowCursor[0] + nextRowTransform.translation[0],
      rowCursor[1] + nextRowTransform.translation[1]];
    rotation = nextRowTransform.rotation;
    colTransforms.lastItem();
    for (let j = 0; j < nextRowTransform.offset; ++j) {
      colTransforms.nextItem();
    }
    colCursor = [rowCursor[0], rowCursor[1]];
  }
  const rtree = new RBush(cells.length);
  rtree.load(extents, cells);
  return rtree;
}


/**
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 * @param {Array.<number>} flatCoverage Coverage cell coordinates and colors.
 * @param {number} numVertices Number of vertex coordinates in a cell.
 * @param {ol.style.Stroke} stroke Stroke style for cosmetic stroke.
 * @param {Array.<number>=} indices Index numbers for WebGL renderer.
 */
export function renderCoverage(replayGroup, flatCoverage, numVertices, stroke, indices) {
  const coverageReplay = replayGroup.getReplay(undefined, ReplayType.COVERAGE);
  if (indices) {
    coverageReplay.cellIndices = indices;
  }
  coverageReplay.setFillStrokeStyle(undefined, stroke);
  coverageReplay.drawCoverage(flatCoverage, numVertices);
}
