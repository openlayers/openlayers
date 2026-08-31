import {assert} from 'chai';
import {getTransform} from '../../../../../src/ol/proj.js';
import {
  filterTrianglesByTargetEdge,
  refineTriangles,
  tessellatePolygon,
} from '../../../../../src/ol/render/webgpu/tessellate.js';

describe('ol/render/webgpu/tessellate', () => {
  it('earcuts without reprojection options (same as the old fill path)', () => {
    const mesh = tessellatePolygon([0, 0, 2, 0, 2, 2, 0, 2], []);
    assert.strictEqual(mesh.indices.length, 6);
    assert.strictEqual(mesh.vertices.length, 8);
  });

  it('clips triangles that extend outside the target extent', () => {
    const mesh = tessellatePolygon([0, 0, 10, 0, 5, 20], [], {
      clipExtent: [0, 0, 10, 10],
    });
    assert.isAbove(mesh.indices.length, 0);
    for (let i = 0; i < mesh.vertices.length; i += 2) {
      assert.isAtMost(mesh.vertices[i + 1], 10);
    }
  });

  it('projects vertices into the target CRS before earcut', () => {
    const transformFn = getTransform('EPSG:4326', 'EPSG:3857');
    const mesh = tessellatePolygon([0, 0, 1, 0, 1, 1, 0, 1], [], {
      projectToTarget: (coord) => {
        const projected = transformFn(coord);
        return [projected[0], projected[1]];
      },
    });
    assert.strictEqual(mesh.indices.length, 6);
    assert.closeTo(mesh.vertices[0], 0, 1e-6);
    assert.closeTo(mesh.vertices[1], 0, 1e-6);
    assert.isAbove(mesh.vertices[2], 100000);
  });

  it('drops a folding triangle whose midpoint does not follow the warp', () => {
    const sourceXY = [0, 0, 1, 0, 0.5, 1];
    const indices = [0, 1, 2];
    const projectToTarget = (coord) => {
      if (coord[0] === 0.5 && coord[1] === 0) {
        return [1000, 0];
      }
      return [coord[0], coord[1]];
    };
    const filtered = filterTrianglesByTargetEdge(
      sourceXY,
      indices,
      projectToTarget,
      0.5,
    );
    assert.deepEqual(filtered, []);
  });

  it('keeps long but smooth earcut diagonals (hole → outer ring)', () => {
    const filtered = filterTrianglesByTargetEdge(
      [0, 0, 10, 0, 0, 10],
      [0, 1, 2],
      (coord) => [coord[0] * 100, coord[1] * 100],
      50,
    );
    assert.deepEqual(filtered, [0, 1, 2]);
  });

  it('keeps long needle slivers (no source-space splits)', () => {
    const filtered = filterTrianglesByTargetEdge(
      [0, 0, 100, 0, 50, 0.1],
      [0, 1, 2],
      (coord) => [coord[0], coord[1]],
      10,
    );
    assert.deepEqual(filtered, [0, 1, 2]);
  });

  it('leaves a ring that circles the world with no triangle spanning it', () => {
    // A ring around a pole runs through every longitude, so triangulating it
    // whole gives triangles joining one side of the world to the other. Those
    // are wedges across the map in a projection with a cut, and dropping them
    // leaves the fill with a bite out of it.
    const ring = [];
    for (let lon = -180; lon <= 180; lon += 5) {
      ring.push(lon, -70);
    }
    for (let lon = 180; lon >= -180; lon -= 5) {
      ring.push(lon, -80);
    }
    const mesh = tessellatePolygon(ring, [], {
      clipExtent: [150, -78, 180, -72],
      maxSpanX: 180,
    });
    assert.isAbove(mesh.indices.length, 0);
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const xs = [0, 1, 2].map((k) => mesh.vertices[mesh.indices[i + k] * 2]);
      assert.isAtMost(Math.max(...xs) - Math.min(...xs), 30);
    }
    // The clipped band is covered rather than partly dropped.
    let area = 0;
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const p = [0, 1, 2].map((k) => [
        mesh.vertices[mesh.indices[i + k] * 2],
        mesh.vertices[mesh.indices[i + k] * 2 + 1],
      ]);
      area +=
        Math.abs(
          (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) -
            (p[2][0] - p[0][0]) * (p[1][1] - p[0][1]),
        ) / 2;
    }
    assert.closeTo(area, 30 * 6, 1);
  });

  it('keeps a hole that the extent cuts through', () => {
    const outer = [0, 0, 10, 0, 10, 10, 0, 10];
    const hole = [3, 3, 7, 3, 7, 12, 3, 12];
    const xy = outer.concat(hole);
    const mesh = tessellatePolygon(xy, [outer.length / 2], {
      clipExtent: [0, 0, 10, 10],
    });
    assert.isAbove(mesh.indices.length, 0);
    let area = 0;
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const p = [0, 1, 2].map((k) => [
        mesh.vertices[mesh.indices[i + k] * 2],
        mesh.vertices[mesh.indices[i + k] * 2 + 1],
      ]);
      area +=
        Math.abs(
          (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) -
            (p[2][0] - p[0][0]) * (p[1][1] - p[0][1]),
        ) / 2;
    }
    // 100 for the square, less the 4 by 7 of the hole that lies within it.
    assert.closeTo(area, 100 - 28, 0.5);
  });

  it('drops a hole that falls outside the extent', () => {
    const outer = [0, 0, 10, 0, 10, 10, 0, 10];
    const hole = [20, 20, 24, 20, 24, 24, 20, 24];
    const mesh = tessellatePolygon(outer.concat(hole), [outer.length / 2], {
      clipExtent: [0, 0, 10, 10],
    });
    assert.strictEqual(mesh.indices.length, 6);
    for (let i = 0; i < mesh.vertices.length; i += 2) {
      assert.isAtMost(mesh.vertices[i], 10);
      assert.isAtMost(mesh.vertices[i + 1], 10);
    }
  });

  it('emits nothing for a polygon the extent misses', () => {
    const mesh = tessellatePolygon([20, 20, 24, 20, 24, 24], [], {
      clipExtent: [0, 0, 10, 10],
    });
    assert.deepEqual(mesh.indices, []);
  });

  it('survives a concave ring clipped along its notch', () => {
    // Sutherland-Hodgman walks a concave ring back along the clip edge, which
    // leaves zero-area connections in the result.
    const mesh = tessellatePolygon(
      [0, 0, 10, 0, 10, 10, 6, 4, 4, 4, 0, 10],
      [],
      {clipExtent: [0, 0, 10, 5]},
    );
    assert.isAbove(mesh.indices.length, 0);
    for (let i = 0; i < mesh.vertices.length; ++i) {
      assert.isTrue(isFinite(mesh.vertices[i]));
    }
  });

  describe('refineTriangles()', () => {
    /**
     * A projection that bends: x is squared, so a straight line between two
     * points is nowhere near the curve between them.
     * @param {number} x X.
     * @param {number} y Y.
     * @param {Array<number>} out Target.
     * @return {boolean} Always placeable.
     */
    function bend(x, y, out) {
      out[0] = x;
      out[1] = y + x * x;
      return true;
    }

    it('splits an edge whose middle strays from it', () => {
      const refined = refineTriangles(
        [0, 0, 10, 0, 0, 10],
        [0, 1, 2],
        bend,
        1,
        0,
      );
      assert.isAbove(refined.indices.length / 3, 1);
      // Every edge that is left follows the curve within the budget.
      const point = [0, 0];
      for (let i = 0; i < refined.indices.length; i += 3) {
        for (let k = 0; k < 3; ++k) {
          const p = refined.indices[i + k];
          const q = refined.indices[i + ((k + 1) % 3)];
          const px = refined.flatCoordinates[p * 2];
          const py = refined.flatCoordinates[p * 2 + 1];
          const qx = refined.flatCoordinates[q * 2];
          const qy = refined.flatCoordinates[q * 2 + 1];
          bend((px + qx) / 2, (py + qy) / 2, point);
          const chordY = (py + px * px + (qy + qx * qx)) / 2;
          assert.isAtMost(Math.abs(point[1] - chordY), 1.001);
        }
      }
    });

    it('leaves a triangle alone where the projection is straight', () => {
      const refined = refineTriangles(
        [0, 0, 10, 0, 0, 10],
        [0, 1, 2],
        (x, y, out) => {
          out[0] = x;
          out[1] = y;
          return true;
        },
        1,
        0,
      );
      assert.deepEqual(Array.from(refined.indices), [0, 1, 2]);
    });

    it('keeps the near side of a cut and drops what reaches across', () => {
      const cut = (x, y, out) => {
        // Beyond the cut the same line lands a world away.
        out[0] = x > 0.5 ? x + 1000 : x;
        out[1] = y;
        return true;
      };
      const refined = refineTriangles(
        [0, 0, 1, 0, 0, 1],
        [0, 1, 2],
        cut,
        0.01,
        100,
      );
      assert.isAbove(refined.indices.length, 0);
      const point = [0, 0];
      for (let i = 0; i < refined.indices.length; i += 3) {
        for (let k = 0; k < 3; ++k) {
          const p = refined.indices[i + k];
          const q = refined.indices[i + ((k + 1) % 3)];
          cut(
            refined.flatCoordinates[p * 2],
            refined.flatCoordinates[p * 2 + 1],
            point,
          );
          const px = point[0];
          const py = point[1];
          cut(
            refined.flatCoordinates[q * 2],
            refined.flatCoordinates[q * 2 + 1],
            point,
          );
          assert.isAtMost(Math.hypot(point[0] - px, point[1] - py), 100);
        }
      }
    });

    it('drops a triangle the projection cannot place', () => {
      const refined = refineTriangles(
        [0, 0, 1, 0, 0, 1],
        [0, 1, 2],
        (x, y, out) => {
          out[0] = x;
          out[1] = y;
          return x < 0.5;
        },
        1,
        0,
      );
      assert.deepEqual(Array.from(refined.indices), []);
    });

    it('splits a shared edge the same way for both triangles', () => {
      // Two triangles either side of the diagonal from (0,0) to (10,10).
      const refined = refineTriangles(
        [0, 0, 10, 10, 10, 0, 0, 10],
        [0, 1, 2, 0, 3, 1],
        bend,
        1,
        0,
      );
      const used = new Map();
      for (let i = 0; i < refined.indices.length; i += 3) {
        for (let k = 0; k < 3; ++k) {
          const p = refined.indices[i + k];
          const q = refined.indices[i + ((k + 1) % 3)];
          const key = p < q ? `${p},${q}` : `${q},${p}`;
          used.set(key, (used.get(key) || 0) + 1);
        }
      }
      // An edge along the shared diagonal belongs to two triangles, never one
      // on one side and two on the other.
      assert.isAbove(used.size, 3);
    });
  });

  it('skips antimeridian-spanning source triangles', () => {
    const mesh = tessellatePolygon([0, 0, 200, 0, 200, 1, 0, 1], [], {
      maxSpanX: 100,
    });
    assert.deepEqual(mesh.indices, []);
  });

  it('drops folding triangles during tessellation', () => {
    const mesh = tessellatePolygon([0, 0, 1, 0, 0.5, 1], [], {
      projectToTarget: (coord) => {
        if (coord[0] === 0.5 && coord[1] === 0) {
          return [1000, 0];
        }
        return [coord[0], coord[1]];
      },
      maxTargetEdge: 0.5,
    });
    assert.deepEqual(mesh.indices, []);
  });
});
