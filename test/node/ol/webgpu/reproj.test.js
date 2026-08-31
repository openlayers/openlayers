import {assert} from 'chai';
import proj4 from 'proj4';
import {getWidth} from '../../../../src/ol/extent.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import {fromLonLat, get as getProjection} from '../../../../src/ol/proj.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import OSM from '../../../../src/ol/source/OSM.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';
import {
  buildReprojMesh,
  clipExtentToProjection,
  estimateSourceExtent,
  needsReprojection,
  projectionMatrixFromFrame,
  reprojMeshCacheKey,
  reprojMeshSamples,
  sourceResolutionForView,
  viewCoordinateToSource,
} from '../../../../src/ol/webgpu/reproj.js';

proj4.defs(
  'EPSG:3413',
  '+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 ' +
    '+datum=WGS84 +units=m +no_defs',
);
proj4.defs(
  'ESRI:54009',
  '+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
);
register(proj4);
getProjection('ESRI:54009').setExtent([-18e6, -9e6, 18e6, 9e6]);

/**
 * @param {{indices: Uint32Array}|null} mesh Mesh.
 * @return {number} Index count.
 */
function meshIndexCount(mesh) {
  return mesh?.indices.length || 0;
}

/**
 * Every emitted triangle has to be small enough to draw, however much the
 * projection stretched the source tile.
 *
 * @param {{vertices: Float32Array, indices: Uint32Array}|null} mesh Mesh.
 * @param {number} maxEdge Longest allowed target edge.
 */
function assertEdgesWithin(mesh, maxEdge) {
  const vertices = mesh?.vertices || new Float32Array();
  const indices = mesh?.indices || new Uint32Array();
  for (let i = 0; i < indices.length; i += 3) {
    for (let e = 0; e < 3; ++e) {
      const from = indices[i + e] * 4;
      const to = indices[i + ((e + 1) % 3)] * 4;
      assert.isAtMost(
        Math.hypot(
          vertices[from] - vertices[to],
          vertices[from + 1] - vertices[to + 1],
        ),
        maxEdge,
      );
    }
  }
}

/**
 * @param {{vertices: Float32Array, indices: Uint32Array}|null} mesh Mesh.
 * @param {number} x Target x.
 * @param {number} y Target y.
 * @return {boolean} A triangle of the mesh contains the point.
 */
function meshCovers(mesh, x, y) {
  if (!mesh) {
    return false;
  }
  const vertices = mesh.vertices;
  const indices = mesh.indices;
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 4;
    const b = indices[i + 1] * 4;
    const c = indices[i + 2] * 4;
    const area =
      (vertices[b + 1] - vertices[c + 1]) * (vertices[a] - vertices[c]) +
      (vertices[c] - vertices[b]) * (vertices[a + 1] - vertices[c + 1]);
    if (area === 0) {
      continue;
    }
    const w0 =
      ((vertices[b + 1] - vertices[c + 1]) * (x - vertices[c]) +
        (vertices[c] - vertices[b]) * (y - vertices[c + 1])) /
      area;
    const w1 =
      ((vertices[c + 1] - vertices[a + 1]) * (x - vertices[c]) +
        (vertices[a] - vertices[c]) * (y - vertices[c + 1])) /
      area;
    if (w0 >= -1e-9 && w1 >= -1e-9 && w0 + w1 <= 1 + 1e-9) {
      return true;
    }
  }
  return false;
}

describe('ol/webgpu/reproj', () => {
  it('detects when source and view projections differ', () => {
    const source = new OSM();
    assert.isFalse(
      needsReprojection(source, /** @type {*} */ (getProjection('EPSG:3857'))),
    );
    assert.isTrue(
      needsReprojection(source, /** @type {*} */ (getProjection('EPSG:4326'))),
    );
  });

  it('includes the target projection in the mesh cache key', () => {
    const source = /** @type {*} */ (getProjection('EPSG:4326'));
    const mercator = /** @type {*} */ (getProjection('EPSG:3857'));
    const geographic = /** @type {*} */ (getProjection('EPSG:4326'));
    const tileCoord = [2, 6, 2];
    assert.notStrictEqual(
      reprojMeshCacheKey(tileCoord, source, mercator),
      reprojMeshCacheKey(tileCoord, source, geographic),
    );
    assert.strictEqual(
      reprojMeshCacheKey(tileCoord, source, mercator),
      reprojMeshCacheKey(tileCoord, source, mercator),
    );
  });

  it('builds a CPU mesh with positions and UVs', () => {
    const sourceProj = getProjection('EPSG:3857');
    const targetProj = getProjection('EPSG:4326');
    const mesh = buildReprojMesh(
      [0, 5000000, 2000000, 7000000],
      /** @type {*} */ (sourceProj),
      /** @type {*} */ (targetProj),
      4,
    );
    assert.isNotNull(mesh);
    assert.strictEqual(mesh?.vertices.length, 5 * 5 * 4);
    assert.strictEqual(mesh?.indices.length, 4 * 4 * 6);
  });

  it('refines oversized quads instead of dropping them', () => {
    const sourceProj = getProjection('EPSG:4326');
    const targetProj = getProjection('EPSG:3857');
    // One quad for the whole world: every edge starts far too long, but this
    // is honest stretching, so it has to be refined rather than discarded.
    const coarse = buildReprojMesh(
      [-180, -80, 180, 80],
      /** @type {*} */ (sourceProj),
      /** @type {*} */ (targetProj),
      1,
    );
    assert.isNotNull(coarse);
    assert.isAbove(meshIndexCount(coarse), 0);
    assertEdgesWithin(coarse, getWidth(targetProj.getExtent()) * 0.25);

    // A grid that already fits is left alone.
    const local = buildReprojMesh(
      [10, 40, 20, 50],
      /** @type {*} */ (sourceProj),
      /** @type {*} */ (targetProj),
      2,
    );
    assert.isNotNull(local);
    assert.strictEqual(meshIndexCount(local), 2 * 2 * 6);
  });

  it('covers the outer ring of a polar view', () => {
    // Mid-latitude mercator tiles stretch enormously toward the rim of a
    // polar stereographic view. Dropping those quads leaves a blank annulus.
    const mercator = /** @type {*} */ (getProjection('EPSG:3857'));
    const polar = /** @type {*} */ (getProjection('EPSG:3413'));
    const previousExtent = polar.getExtent();
    polar.setExtent([-4194304, -4194304, 4194304, 4194304]);
    const grid = createXYZ({extent: mercator.getExtent()});
    const meshes = [
      buildReprojMesh(grid.getTileCoordExtent([1, 0, 0]), mercator, polar),
      buildReprojMesh(grid.getTileCoordExtent([1, 1, 0]), mercator, polar),
    ];

    for (const radius of [2e6, 3.8e6, 4.1e6]) {
      let covered = 0;
      const samples = 180;
      for (let i = 0; i < samples; ++i) {
        const angle = (i / samples) * Math.PI * 2;
        if (
          meshes.some((mesh) =>
            meshCovers(
              mesh,
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
            ),
          )
        ) {
          ++covered;
        }
      }
      assert.strictEqual(covered, samples, `ring at ${radius} m`);
    }
    polar.setExtent(previousExtent);
  });

  it('meets a finer neighbour along a shared edge', () => {
    // A tile covers twice the ground of one a level below it, so meshing every
    // tile with the same sample count leaves a tile standing in for finer ones
    // sampling its edge half as often. Its straight edges then cut inside the
    // neighbour's and the projection's curvature shows through as a sliver.
    const mercator = /** @type {*} */ (getProjection('EPSG:3857'));
    const polar = /** @type {*} */ (getProjection('EPSG:3413'));
    const previousExtent = polar.getExtent();
    polar.setExtent([-4194304, -4194304, 4194304, 4194304]);
    const grid = createXYZ({extent: mercator.getExtent()});

    /**
     * @param {import("../../../../src/ol/tilecoord.js").TileCoord} coord Coord.
     * @param {number} levelsCoarser Levels below the finest drawn.
     * @return {*} Mesh.
     */
    function mesh(coord, levelsCoarser) {
      return buildReprojMesh(
        grid.getTileCoordExtent(coord),
        mercator,
        polar,
        reprojMeshSamples(levelsCoarser),
      );
    }

    /**
     * The drawn boundary of a mesh along one side, sorted along the edge.
     * @param {*} built Mesh.
     * @param {number} u Side.
     * @return {Array<Array<number>>} Points as [alongEdge, x, y].
     */
    function edge(built, u) {
      const seen = new Set();
      const points = [];
      for (let i = 0; i < built.vertices.length; i += 4) {
        const v = built.vertices[i + 3];
        if (Math.abs(built.vertices[i + 2] - u) < 1e-12 && !seen.has(v)) {
          seen.add(v);
          points.push([v, built.vertices[i], built.vertices[i + 1]]);
        }
      }
      return points.sort((a, b) => a[0] - b[0]);
    }

    /**
     * @param {Array<Array<number>>} points Polyline.
     * @param {number} t Position along the edge.
     * @return {Array<number>} Point.
     */
    function pointAt(points, t) {
      for (let i = 0; i + 1 < points.length; ++i) {
        if (t >= points[i][0] - 1e-12 && t <= points[i + 1][0] + 1e-12) {
          const span = points[i + 1][0] - points[i][0] || 1;
          const f = (t - points[i][0]) / span;
          return [
            points[i][1] + (points[i + 1][1] - points[i][1]) * f,
            points[i][2] + (points[i + 1][2] - points[i][2]) * f,
          ];
        }
      }
      return [NaN, NaN];
    }

    const pairs = [
      // Neighbours at the same zoom.
      {left: [3, 2, 1], leftLevels: 0, right: [3, 3, 1], rightLevels: 0},
      // A tile standing in for the level below, beside one of that level.
      {left: [2, 1, 1], leftLevels: 1, right: [3, 4, 2], rightLevels: 0},
      {left: [1, 0, 0], leftLevels: 1, right: [2, 2, 0], rightLevels: 0},
      // Two levels apart.
      {left: [1, 0, 1], leftLevels: 2, right: [3, 4, 4], rightLevels: 0},
    ];

    for (const pair of pairs) {
      const left = mesh(pair.left, pair.leftLevels);
      const right = mesh(pair.right, pair.rightLevels);
      const leftExtent = grid.getTileCoordExtent(/** @type {*} */ (pair.left));
      const rightExtent = grid.getTileCoordExtent(
        /** @type {*} */ (pair.right),
      );
      assert.closeTo(leftExtent[2], rightExtent[0], 1e-6);
      const leftEdge = edge(left, 1);
      const rightEdge = edge(right, 0);
      const y0 = Math.max(leftExtent[1], rightExtent[1]);
      const y1 = Math.min(leftExtent[3], rightExtent[3]);
      let worst = 0;
      for (let i = 0; i <= 200; ++i) {
        const y = y0 + ((y1 - y0) * i) / 200;
        const a = pointAt(
          leftEdge,
          (leftExtent[3] - y) / (leftExtent[3] - leftExtent[1]),
        );
        const b = pointAt(
          rightEdge,
          (rightExtent[3] - y) / (rightExtent[3] - rightExtent[1]),
        );
        worst = Math.max(worst, Math.hypot(a[0] - b[0], a[1] - b[1]));
      }
      assert.isBelow(
        worst,
        1,
        `${pair.left.join('/')} beside ${pair.right.join('/')}`,
      );
    }

    polar.setExtent(previousExtent);
  });

  it('does not bridge a projection cut', () => {
    // Mollweide splits at the antimeridian, so a tile straddling it must lose
    // the quads that would otherwise stretch across the whole map.
    const geographic = /** @type {*} */ (getProjection('EPSG:4326'));
    const mollweide = /** @type {*} */ (getProjection('ESRI:54009'));
    const mesh = buildReprojMesh([170, -10, 190, 10], geographic, mollweide, 4);
    if (mesh) {
      assertEdgesWithin(mesh, getWidth(mollweide.getExtent()) * 0.25);
    }
  });

  it('keeps a world mercator tile meshed into 4326 without spanning the dateline', () => {
    const sourceProj = getProjection('EPSG:3857');
    const targetProj = getProjection('EPSG:4326');
    const mesh = buildReprojMesh(
      [-20037508, -20037508, 20037508, 20037508],
      /** @type {*} */ (sourceProj),
      /** @type {*} */ (targetProj),
      16,
    );
    assert.isNotNull(mesh);
    assert.isAbove(meshIndexCount(mesh), 0);
    const verts = mesh?.vertices || new Float32Array();
    const indices = mesh?.indices || new Uint32Array();
    const maxEdge = 360 * 0.25;
    for (let i = 0; i < indices.length; i += 3) {
      const ax = verts[indices[i] * 4];
      const ay = verts[indices[i] * 4 + 1];
      const bx = verts[indices[i + 1] * 4];
      const by = verts[indices[i + 1] * 4 + 1];
      const cx = verts[indices[i + 2] * 4];
      const cy = verts[indices[i + 2] * 4 + 1];
      assert.isBelow(Math.hypot(ax - bx, ay - by), maxEdge);
      assert.isBelow(Math.hypot(bx - cx, by - cy), maxEdge);
      assert.isBelow(Math.hypot(cx - ax, cy - ay), maxEdge);
    }
  });

  it('estimates a source extent from a view extent', () => {
    const extent = estimateSourceExtent(
      [-10, -10, 10, 10],
      /** @type {*} */ (getProjection('EPSG:3857')),
      /** @type {*} */ (getProjection('EPSG:4326')),
    );
    assert.isNotNull(extent);
    assert.isBelow(/** @type {number} */ (extent?.[0]), 0);
    assert.isAbove(/** @type {number} */ (extent?.[2]), 0);
  });

  it('clips polar 4326 samples to the mercator world so tile queries stay valid', () => {
    const mercator = /** @type {*} */ (getProjection('EPSG:3857'));
    const geographic = /** @type {*} */ (getProjection('EPSG:4326'));
    const estimated = estimateSourceExtent(
      [-180, -90, 180, 90],
      mercator,
      geographic,
    );
    assert.isNotNull(estimated);
    assert.isAbove(Math.abs(/** @type {number} */ (estimated?.[1])), 3e7);
    const clipped = clipExtentToProjection(
      /** @type {*} */ (estimated),
      mercator,
      true,
    );
    const world = mercator.getExtent();
    assert.isNotNull(clipped);
    assert.isAtLeast(/** @type {number} */ (clipped?.[1]), world[1]);
    assert.isAtMost(/** @type {number} */ (clipped?.[3]), world[3]);
    const mesh = buildReprojMesh(
      /** @type {*} */ (clipped),
      mercator,
      geographic,
      4,
    );
    assert.isNotNull(mesh);
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 1; i < (mesh?.vertices.length || 0); i += 4) {
      minY = Math.min(minY, mesh.vertices[i]);
      maxY = Math.max(maxY, mesh.vertices[i]);
    }
    assert.isBelow(minY, -80);
    assert.isAbove(maxY, 80);
    assert.isBelow(maxY - minY, 180);
  });

  it('reaches the pole for a polar view that contains it', () => {
    // Sampling alone tops out near 82 degrees: the pole is a single interior
    // point of the view, and every meridian converges on it.
    const geographic = /** @type {*} */ (getProjection('EPSG:4326'));
    const polar = /** @type {*} */ (getProjection('EPSG:3413'));
    const extent = estimateSourceExtent(
      [-4194304, -4194304, 4194304, 4194304],
      geographic,
      polar,
    );
    assert.isNotNull(extent);
    assert.strictEqual(/** @type {number} */ (extent?.[3]), 90);
    assert.strictEqual(/** @type {number} */ (extent?.[0]), -180);
    assert.strictEqual(/** @type {number} */ (extent?.[2]), 180);
    assert.isBelow(/** @type {number} */ (extent?.[1]), 45);
  });

  it('still reaches the pole when zoomed in around it', () => {
    const extent = estimateSourceExtent(
      [-200000, -200000, 200000, 200000],
      /** @type {*} */ (getProjection('EPSG:4326')),
      /** @type {*} */ (getProjection('EPSG:3413')),
    );
    assert.isNotNull(extent);
    assert.strictEqual(/** @type {number} */ (extent?.[3]), 90);
    assert.isAbove(/** @type {number} */ (extent?.[1]), 80);
  });

  it('stays tight when the view does not contain a pole', () => {
    const extent = estimateSourceExtent(
      [2000000, 2000000, 3000000, 3000000],
      /** @type {*} */ (getProjection('EPSG:4326')),
      /** @type {*} */ (getProjection('EPSG:3413')),
    );
    assert.isNotNull(extent);
    assert.isBelow(/** @type {number} */ (extent?.[3]), 89);
    assert.isAbove(/** @type {number} */ (extent?.[0]), 0);
  });

  it('reaches the antimeridian for a mercator source under a polar view', () => {
    // With the pole on screen every meridian is on screen. Samples need not
    // land near the antimeridian, and the longitudes they miss become a wedge
    // of tiles that are never asked for, running from the pole to the edge.
    const mercator = /** @type {*} */ (getProjection('EPSG:3857'));
    const polar = /** @type {*} */ (getProjection('EPSG:3413'));
    const previousExtent = polar.getExtent();
    polar.setExtent([-4194304, -4194304, 4194304, 4194304]);
    const world = getWidth(mercator.getExtent()) / 2;
    const extent = estimateSourceExtent(
      [-4096000, -1320000, 4096000, 1320000],
      mercator,
      polar,
    );
    assert.isNotNull(extent);
    assert.closeTo(/** @type {number} */ (extent?.[0]), -world, 1);
    assert.closeTo(/** @type {number} */ (extent?.[2]), world, 1);
    // Only the pole in view is reached: the far hemisphere stays out.
    assert.isAbove(/** @type {number} */ (extent?.[1]), 0);
    polar.setExtent(previousExtent);
  });

  it('keeps the source zoom steady while a polar view pans', () => {
    // Read at the view centre alone, the answer swings three zoom levels as
    // the centre crosses the pole, where a mercator source is stretched
    // without limit. Tiles a pan apart then sit three levels apart, further
    // than a coarse tile can be refined to meet a fine neighbour.
    const mercator = /** @type {*} */ (getProjection('EPSG:3857'));
    const polar = /** @type {*} */ (getProjection('EPSG:3413'));
    const previousExtent = polar.getExtent();
    polar.setExtent([-4194304, -4194304, 4194304, 4194304]);
    const grid = createXYZ({
      extent: mercator.getExtent(),
      tileSize: 512,
      maxZoom: 20,
    });
    const resolution = 4096;
    const halfWidth = (resolution * 1024) / 2;
    const halfHeight = (resolution * 330) / 2;

    let previous = null;
    let widestJump = 0;
    for (let x = -1200000; x <= 1200000; x += 60000) {
      const zoom = grid.getZForResolution(
        sourceResolutionForView(mercator, polar, [x, 0], resolution, [
          x - halfWidth,
          -halfHeight,
          x + halfWidth,
          halfHeight,
        ]),
        0,
      );
      if (previous !== null) {
        widestJump = Math.max(widestJump, Math.abs(zoom - previous));
      }
      previous = zoom;
    }
    assert.isAtMost(widestJump, 1);
    polar.setExtent(previousExtent);
  });

  it('ignores view samples the projection cannot place', () => {
    // A world projection at zoom 0 shows more than it covers. Coordinates out
    // beyond it fold onto its limb: they come back finite and in range, but
    // from a point the view never asked about, where the scale has collapsed
    // to nothing. Believing one asks for geometry densified to a step near
    // zero, which is more points than an array can hold.
    const geographic = /** @type {*} */ (getProjection('EPSG:4326'));
    const mollweide = /** @type {*} */ (getProjection('ESRI:54009'));
    const resolution = 140625;
    const halfWidth = (resolution * 1024) / 2;
    const halfHeight = (resolution * 330) / 2;
    const sampled = sourceResolutionForView(
      geographic,
      mollweide,
      [0, 0],
      resolution,
      [-halfWidth, -halfHeight, halfWidth, halfHeight],
    );
    const atCenter = sourceResolutionForView(
      geographic,
      mollweide,
      [0, 0],
      resolution,
    );
    assert.isAbove(sampled, atCenter / 4);
    assert.isBelow(sampled, atCenter * 4);
  });

  it('keeps a view without a pole tight in longitude', () => {
    const extent = estimateSourceExtent(
      [1e6, -3.5e6, 2e6, -3e6],
      /** @type {*} */ (getProjection('EPSG:3857')),
      /** @type {*} */ (getProjection('EPSG:3413')),
    );
    assert.isNotNull(extent);
    assert.isBelow(
      getWidth(/** @type {*} */ (extent)),
      getWidth(getProjection('EPSG:3857').getExtent()) / 4,
    );
  });

  it('maps a view coordinate into the feature CRS for hit tests', () => {
    const geographic = /** @type {*} */ (getProjection('EPSG:4326'));
    const mercator = /** @type {*} */ (getProjection('EPSG:3857'));
    const polygon = new Polygon([
      [
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
        [0, 0],
      ],
    ]);
    const viewCoord = fromLonLat([1, 1]);
    assert.isFalse(polygon.containsXY(viewCoord[0], viewCoord[1]));
    const sourceCoord = viewCoordinateToSource(viewCoord, geographic, mercator);
    assert.isNotNull(sourceCoord);
    assert.closeTo(/** @type {number} */ (sourceCoord?.[0]), 1, 1e-6);
    assert.closeTo(/** @type {number} */ (sourceCoord?.[1]), 1, 1e-6);
    assert.isTrue(
      polygon.containsXY(
        /** @type {number} */ (sourceCoord?.[0]),
        /** @type {number} */ (sourceCoord?.[1]),
      ),
    );
    const sameCrs = viewCoordinateToSource([1, 1], geographic, geographic);
    assert.deepEqual(sameCrs, [1, 1]);
  });

  it('maps a 4326 view resolution onto a mercator tile Z near the world scale', () => {
    const mercator = /** @type {*} */ (getProjection('EPSG:3857'));
    const geographic = /** @type {*} */ (getProjection('EPSG:4326'));
    const viewRes = 0.3;
    const sourceRes = sourceResolutionForView(
      mercator,
      geographic,
      [0, 0],
      viewRes,
    );
    const grid = createXYZ({
      extent: mercator.getExtent() || undefined,
      tileSize: 512,
      maxZoom: 20,
    });
    assert.isAbove(grid.getZForResolution(viewRes), 10);
    assert.isBelow(grid.getZForResolution(sourceRes), 5);
  });

  it('translates the projection matrix by a world offset', () => {
    const frameState = /** @type {any} */ ({size: [200, 100]});
    const identity = [1, 0, 0, 1, 0, 0];
    const base = projectionMatrixFromFrame(
      frameState,
      identity,
      new Float32Array(16),
    );
    const shifted = projectionMatrixFromFrame(
      frameState,
      identity,
      new Float32Array(16),
      50,
    );
    assert.strictEqual(base[12], -1);
    assert.strictEqual(shifted[12], 50 * (2 / 200) - 1);
    assert.strictEqual(shifted[13], base[13]);
  });

  it('applies world offset in world space before the view rotation', () => {
    const frameState = /** @type {any} */ ({size: [200, 100]});
    const rotated = [0, 1, -1, 0, 10, 20];
    const shifted = projectionMatrixFromFrame(
      frameState,
      rotated,
      new Float32Array(16),
      50,
    );
    const sx = 2 / 200;
    const sy = -2 / 100;
    assert.approximately(shifted[12], 10 * sx - 1, 1e-6);
    assert.approximately(shifted[13], 70 * sy + 1, 1e-6);
  });
});
