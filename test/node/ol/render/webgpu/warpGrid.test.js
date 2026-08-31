import {assert} from 'chai';
import proj4 from 'proj4';
import {
  get as getProjection,
  getTransform,
} from '../../../../../src/ol/proj.js';
import {register} from '../../../../../src/ol/proj/proj4.js';
import {LOCAL_EXTENT} from '../../../../../src/ol/render/webgpu/localGrid.js';
import {
  WARP_NODE_STRIDE,
  buildWarpGrid,
  sampleWarpGrid,
  warpGridKey,
} from '../../../../../src/ol/render/webgpu/warpGrid.js';

proj4.defs(
  'ESRI:54009',
  '+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
);
register(proj4);

/**
 * The same bilinear lookup the warp compute shader performs, so the test
 * measures what the GPU will actually produce.
 *
 * @param {import('../../../../../src/ol/render/webgpu/warpGrid.js').WarpGrid} grid Grid.
 * @param {number} localX Local grid x.
 * @param {number} localY Local grid y.
 * @return {{x: number, y: number, valid: boolean}} Interpolated target position.
 */
function sample(grid, localX, localY) {
  const cells = grid.cells;
  const gx = Math.min(Math.max(localX / grid.cellSize, 0), cells - 1e-4);
  const gy = Math.min(Math.max(localY / grid.cellSize, 0), cells - 1e-4);
  const ix = Math.floor(gx);
  const iy = Math.floor(gy);
  const fx = gx - ix;
  const fy = gy - iy;
  const at = (i, j) => {
    const offset = (j * (cells + 1) + i) * WARP_NODE_STRIDE;
    return {
      x: grid.nodes[offset],
      y: grid.nodes[offset + 1],
      valid: grid.nodes[offset + 2] > 0.5,
    };
  };
  const n00 = at(ix, iy);
  const n10 = at(ix + 1, iy);
  const n01 = at(ix, iy + 1);
  const n11 = at(ix + 1, iy + 1);
  const bottomX = n00.x + (n10.x - n00.x) * fx;
  const bottomY = n00.y + (n10.y - n00.y) * fx;
  const topX = n01.x + (n11.x - n01.x) * fx;
  const topY = n01.y + (n11.y - n01.y) * fx;
  const spread = Math.max(
    Math.hypot(n10.x - n00.x, n10.y - n00.y),
    Math.hypot(n11.x - n01.x, n11.y - n01.y),
    Math.hypot(n01.x - n00.x, n01.y - n00.y),
    Math.hypot(n11.x - n10.x, n11.y - n10.y),
  );
  return {
    x: grid.origin[0] + bottomX + (topX - bottomX) * fy,
    y: grid.origin[1] + bottomY + (topY - bottomY) * fy,
    valid:
      n00.valid &&
      n10.valid &&
      n01.valid &&
      n11.valid &&
      (!(grid.maxEdge > 0) || spread <= grid.maxEdge),
  };
}

/**
 * @param {string} code Projection code.
 * @return {function(Array<number>): Array<number>} Transform from EPSG:4326.
 */
function transformFrom4326(code) {
  const fn = getTransform(getProjection('EPSG:4326'), getProjection(code));
  return (coord) => {
    const out = fn(coord);
    return out && isFinite(out[0]) && isFinite(out[1])
      ? [out[0], out[1]]
      : null;
  };
}

describe('ol/render/webgpu/warpGrid', () => {
  it('interpolates within a fraction of a pixel of the real projection', () => {
    // A view-sized extent in EPSG:4326, reprojected to Web Mercator.
    const extent = [-20, 30, 20, 70];
    const project = transformFrom4326('EPSG:3857');
    const grid = buildWarpGrid(extent, project, 0);
    assert.isTrue(grid.usable);

    // Screen scale for a 40 degree extent drawn 1024 pixels wide.
    const span = Math.abs(project([20, 30])[0] - project([-20, 30])[0]);
    const pixelsPerUnit = 1024 / span;

    let worst = 0;
    for (let i = 0; i < 2000; ++i) {
      const localX = Math.random() * LOCAL_EXTENT;
      const localY = Math.random() * LOCAL_EXTENT;
      const sourceX = extent[0] + (localX / LOCAL_EXTENT) * 40;
      const sourceY = extent[1] + (localY / LOCAL_EXTENT) * 40;
      const exact = project([sourceX, sourceY]);
      const approx = sample(grid, localX, localY);
      assert.isTrue(approx.valid);
      worst = Math.max(
        worst,
        Math.hypot(approx.x - exact[0], approx.y - exact[1]) * pixelsPerUnit,
      );
    }
    assert.isBelow(worst, 0.25);
  });

  it('gets four times more accurate for each grid refinement', () => {
    const extent = [-20, 30, 20, 70];
    const project = transformFrom4326('EPSG:3857');
    const errorFor = (cells) => {
      const grid = sampleWarpGrid(extent, project, cells, 0);
      let worst = 0;
      for (let i = 0; i < 500; ++i) {
        const localX = Math.random() * LOCAL_EXTENT;
        const localY = Math.random() * LOCAL_EXTENT;
        const exact = project([
          extent[0] + (localX / LOCAL_EXTENT) * 40,
          extent[1] + (localY / LOCAL_EXTENT) * 40,
        ]);
        const approx = sample(grid, localX, localY);
        worst = Math.max(
          worst,
          Math.hypot(approx.x - exact[0], approx.y - exact[1]),
        );
      }
      return worst;
    };
    const coarse = errorFor(8);
    const fine = errorFor(16);
    assert.isAbove(coarse / fine, 3);
  });

  it('flags nodes the projection cannot place', () => {
    // Half the extent is outside the transform's domain, so those rows have to
    // be marked unusable rather than interpolated through.
    const grid = sampleWarpGrid(
      [0, 0, 8, 8],
      (coord) => (coord[1] > 4 ? null : [coord[0], coord[1]]),
      8,
      0,
    );
    assert.isTrue(grid.usable);
    let invalid = 0;
    for (let i = 0; i < grid.nodes.length; i += WARP_NODE_STRIDE) {
      if (grid.nodes[i + 2] < 0.5) {
        ++invalid;
      }
    }
    // Rows at y = 5 through 8, nine nodes each.
    assert.strictEqual(invalid, 36);
    assert.isFalse(sample(grid, 0, LOCAL_EXTENT).valid);
    assert.isTrue(sample(grid, 0, 0).valid);
  });

  it('keeps precision on both axes for a wide, short extent', () => {
    // A polar view sees every meridian but a narrow band of latitude. A square
    // grid would quantize that latitude to the longitude step.
    const extent = [-180, 80, 180, 90];
    const grid = sampleWarpGrid(extent, (coord) => coord, 8, 0);
    assert.closeTo(grid.unitsPerCell[0], 45, 1e-9);
    assert.closeTo(grid.unitsPerCell[1], 1.25, 1e-9);
  });

  it('flags cells that straddle a projection cut', () => {
    // Mollweide splits at the antimeridian, so this cell spans the whole map.
    const grid = sampleWarpGrid(
      [170, 0, 190, 20],
      transformFrom4326('ESRI:54009'),
      8,
      5e6,
    );
    assert.isTrue(grid.usable);
    assert.isFalse(sample(grid, LOCAL_EXTENT / 2, LOCAL_EXTENT / 2).valid);
  });

  it('stores node offsets relative to an origin so float32 is precise', () => {
    const extent = [-1, 50, 1, 52];
    const grid = sampleWarpGrid(extent, transformFrom4326('EPSG:3857'), 8, 0);
    assert.isAbove(Math.abs(grid.origin[1]), 6e6);
    for (let i = 0; i < grid.nodes.length; i += WARP_NODE_STRIDE) {
      assert.isBelow(Math.abs(grid.nodes[i]), 2e5);
      assert.isBelow(Math.abs(grid.nodes[i + 1]), 2e5);
    }
  });

  it('refines the grid until interpolation is accurate enough', () => {
    const project = transformFrom4326('EPSG:3857');
    // A small, nearly linear extent needs no refinement; a tall one that runs
    // into Mercator's stretch does.
    const flat = buildWarpGrid([-1, 0, 1, 2], project, 0);
    const curved = buildWarpGrid([-60, 20, 60, 80], project, 0);
    assert.strictEqual(flat.cells, 16);
    assert.isAbove(curved.cells, flat.cells);
  });

  it('keeps the camera out of the cache key', () => {
    const source = getProjection('EPSG:4326');
    const target = getProjection('EPSG:3857');
    assert.strictEqual(
      warpGridKey([2, 1, 1], [0, 0, 1, 1], source, target),
      warpGridKey([2, 1, 1], [0, 0, 1, 1], source, target),
    );
    assert.notStrictEqual(
      warpGridKey([2, 1, 1], [0, 0, 1, 1], source, target),
      warpGridKey([2, 2, 1], [0, 0, 1, 1], source, target),
    );
  });
});
