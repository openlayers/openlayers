import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import Circle from '../../../../../src/ol/geom/Circle.js';
import GeometryCollection from '../../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import ImageState from '../../../../../src/ol/ImageState.js';
import RenderFeature from '../../../../../src/ol/render/Feature.js';
import {
  buildVectorBuffers,
  buildVectorRequest,
  decodeHitColor,
  encodeHitColor,
  ICON_STRIDE,
  resolveFeatureStyles,
  STYLE_STRIDE,
  SYMBOL_STRIDE,
} from '../../../../../src/ol/render/webgpu/buffers.js';
import CircleStyle from '../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import {shared as iconImageCache} from '../../../../../src/ol/style/IconImageCache.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';
import Style from '../../../../../src/ol/style/Style.js';

/**
 * @param {number} px X.
 * @param {number} py Y.
 * @param {number} ax Triangle A x.
 * @param {number} ay Triangle A y.
 * @param {number} bx Triangle B x.
 * @param {number} by Triangle B y.
 * @param {number} cx Triangle C x.
 * @param {number} cy Triangle C y.
 * @return {boolean} Point is inside the triangle.
 */
function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const v0x = cx - ax;
  const v0y = cy - ay;
  const v1x = bx - ax;
  const v1y = by - ay;
  const v2x = px - ax;
  const v2y = py - ay;
  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;
  const denom = dot00 * dot11 - dot01 * dot01;
  if (denom === 0) {
    return false;
  }
  const u = (dot11 * dot02 - dot01 * dot12) / denom;
  const v = (dot00 * dot12 - dot01 * dot02) / denom;
  return u >= -1e-9 && v >= -1e-9 && u + v <= 1 + 1e-9;
}

/**
 * Positions are stored in the batch's local grid, so tests that care about map
 * coordinates convert back.
 *
 * @param {Int16Array} positions Grid positions.
 * @param {import('../../../../../src/ol/render/webgpu/buffers.js').LocalGrid} grid Grid.
 * @param {number} vertex Vertex index.
 * @return {Array<number>} Map coordinate.
 */
function toMapCoordinate(positions, grid, vertex) {
  return [
    grid.originX + positions[vertex * 2] * grid.scaleX,
    grid.originY + positions[vertex * 2 + 1] * grid.scaleY,
  ];
}

describe('ol/render/webgpu/buffers', () => {
  it('round-trips hit colors', () => {
    const encoded = encodeHitColor(42);
    assert.strictEqual(decodeHitColor(encoded), 42);
  });

  it('builds fill buffers with target-space tessellation', () => {
    const feature = new Feature(
      new Polygon([
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ]),
    );
    const style = new Style({
      fill: new Fill({color: [255, 0, 0, 1]}),
    });
    const buffers = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
      {
        projectToTarget: (coord) => [coord[0] * 2, coord[1] * 2],
      },
    );
    assert.isAbove(buffers.fillIndices.length, 0);
    let maxX = -Infinity;
    for (let i = 0; i < buffers.fillPositions.length / 2; ++i) {
      maxX = Math.max(
        maxX,
        toMapCoordinate(buffers.fillPositions, buffers.grid, i)[0],
      );
    }
    assert.closeTo(maxX, 2, 1e-3);
  });

  it('builds symbol buffers from RenderFeature points used by MVT tiles', () => {
    const point = new RenderFeature('Point', [100, 200], [], 2, {}, undefined);
    const style = new Style({
      image: new CircleStyle({
        radius: 4,
        fill: new Fill({color: '#000'}),
      }),
    });
    const buffers = buildVectorBuffers(
      [point],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    assert.strictEqual(buffers.symbolInstances.length, SYMBOL_STRIDE);
    // Anchors are stored relative to the batch origin so float32 can hold them.
    assert.closeTo(
      buffers.symbolInstances[0] + buffers.grid.originX,
      100,
      1e-4,
    );
    assert.closeTo(
      buffers.symbolInstances[1] + buffers.grid.originY,
      200,
      1e-4,
    );
  });

  it('stores a mercator symbol anchor relative to the tile origin', () => {
    const x = -13617292.033;
    const y = 6041469.558;
    const point = new RenderFeature('Point', [x, y], [], 2, {}, undefined);
    const extent = [x - 1000, y - 800, x + 1000, y + 800];
    const style = new Style({
      image: new CircleStyle({
        radius: 4,
        fill: new Fill({color: '#000'}),
      }),
    });
    const buffers = buildVectorBuffers(
      [point],
      () => style,
      1,
      /** @type {any} */ ({}),
      {clipExtent: extent},
    );
    assert.closeTo(buffers.grid.originX, extent[0], 0);
    assert.closeTo(buffers.grid.originY, extent[1], 0);
    assert.closeTo(buffers.symbolInstances[0], 1000, 1e-3);
    assert.closeTo(buffers.symbolInstances[1], 800, 1e-3);
  });

  it('does not throw when MVT-like tiles mix polygons and points', () => {
    const polygon = new RenderFeature(
      'Polygon',
      [0, 0, 10, 0, 10, 10, 0, 10, 0, 0],
      [10],
      2,
      {},
      undefined,
    );
    const point = new RenderFeature('Point', [5, 5], [], 2, {name_en: 'x'}, 1);
    const style = new Style({
      fill: new Fill({color: '#eee'}),
      stroke: new Stroke({color: '#888', width: 1}),
      image: new CircleStyle({
        radius: 2,
        fill: new Fill({color: '#000'}),
      }),
    });
    const buffers = buildVectorBuffers(
      [polygon, point],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    assert.isAbove(buffers.fillIndices.length, 0);
    assert.isAbove(buffers.strokeIndices.length, 0);
    assert.isAbove(buffers.symbolInstances.length, 0);
  });

  it('fills every MVT outer ring, not only the first', () => {
    // Two CCW outers in one Polygon, as Mapbox MVT encodes MultiPolygon.
    const polygon = new RenderFeature(
      'Polygon',
      [0, 0, 10, 0, 10, 10, 0, 10, 0, 0, 20, 0, 30, 0, 30, 10, 20, 10, 20, 0],
      [10, 20],
      2,
      {},
      undefined,
    );
    const style = new Style({
      fill: new Fill({color: '#eee'}),
    });
    const buffers = buildVectorBuffers(
      [polygon],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    let hasLeft = false;
    let hasRight = false;
    for (let i = 0; i < buffers.fillIndices.length; ++i) {
      const x = toMapCoordinate(
        buffers.fillPositions,
        buffers.grid,
        buffers.fillIndices[i],
      )[0];
      if (x < 12) {
        hasLeft = true;
      }
      if (x > 18) {
        hasRight = true;
      }
    }
    assert.isTrue(hasLeft);
    assert.isTrue(hasRight);
  });

  it('still treats opposite-winding rings as holes', () => {
    const withHole = new RenderFeature(
      'Polygon',
      [0, 0, 10, 0, 10, 10, 0, 10, 0, 0, 3, 3, 3, 7, 7, 7, 7, 3, 3, 3],
      [10, 20],
      2,
      {},
      undefined,
    );
    const style = new Style({
      fill: new Fill({color: '#eee'}),
    });
    const buffers = buildVectorBuffers(
      [withHole],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    assert.isAbove(buffers.fillIndices.length, 0);
    let holeFilled = false;
    let rimFilled = false;
    for (let i = 0; i < buffers.fillIndices.length; i += 3) {
      const positions = buffers.fillPositions;
      const grid = buffers.grid;
      const [ax, ay] = toMapCoordinate(positions, grid, buffers.fillIndices[i]);
      const [bx, by] = toMapCoordinate(
        positions,
        grid,
        buffers.fillIndices[i + 1],
      );
      const [cx, cy] = toMapCoordinate(
        positions,
        grid,
        buffers.fillIndices[i + 2],
      );
      if (pointInTriangle(5, 5, ax, ay, bx, by, cx, cy)) {
        holeFilled = true;
      }
      if (pointInTriangle(1, 1, ax, ay, bx, by, cx, cy)) {
        rimFilled = true;
      }
    }
    assert.isTrue(rimFilled);
    assert.isFalse(holeFilled);
  });

  it('does not apply point symbolizers to polygons', () => {
    const polygon = new Feature(
      new Polygon([
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ]),
    );
    const style = new Style({
      fill: new Fill({color: '#eee'}),
      image: new CircleStyle({
        radius: 2,
        fill: new Fill({color: '#000'}),
      }),
    });
    const buffers = buildVectorBuffers(
      [polygon],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    assert.isAbove(buffers.fillIndices.length, 0);
    assert.strictEqual(buffers.symbolInstances.length, 0);
    assert.strictEqual(buffers.labels.length, 0);
  });

  it('does not stroke polygon edges that lie on the clip extent', () => {
    const feature = new Feature(
      new Polygon([
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ]),
    );
    const style = new Style({
      stroke: new Stroke({color: '#000', width: 1}),
    });
    const buffers = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
      {clipExtent: [0, 0, 10, 10]},
    );
    assert.strictEqual(buffers.strokeIndices.length, 0);
  });

  it('strokes interior polygon edges and skips only clip-extent sides', () => {
    const feature = new Feature(
      new Polygon([
        [
          [0, 0],
          [10, 0],
          [8, 5],
          [2, 5],
          [0, 0],
        ],
      ]),
    );
    const style = new Style({
      stroke: new Stroke({color: '#000', width: 1}),
    });
    const full = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    const clipped = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
      {clipExtent: [0, 0, 10, 10]},
    );
    assert.isAbove(full.strokeIndices.length, 0);
    assert.isAbove(clipped.strokeIndices.length, 0);
    assert.isBelow(clipped.strokeIndices.length, full.strokeIndices.length);
  });

  it('still strokes line strings that follow a tile edge', () => {
    const feature = new Feature(
      new LineString([
        [0, 0],
        [10, 0],
      ]),
    );
    const style = new Style({
      stroke: new Stroke({color: '#000', width: 1}),
    });
    const buffers = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
      {clipExtent: [0, 0, 10, 10]},
    );
    assert.isAbove(buffers.strokeIndices.length, 0);
  });

  it('clips stroke segments to the clip extent', () => {
    const feature = new Feature(
      new LineString([
        [-5, 5],
        [15, 5],
      ]),
    );
    const style = new Style({
      stroke: new Stroke({color: '#000', width: 1}),
    });
    const buffers = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
      {clipExtent: [0, 0, 10, 10]},
    );
    assert.isAbove(buffers.strokePositions.length, 0);
    for (let i = 0; i < buffers.strokePositions.length / 2; ++i) {
      const x = toMapCoordinate(buffers.strokePositions, buffers.grid, i)[0];
      assert.isAtLeast(x, -1e-9);
      assert.isAtMost(x, 10 + 1e-9);
    }
  });

  it('keeps polar geometry whole when the clip extent reaches the pole', () => {
    // A polar view sees up to latitude 90. Estimating the source extent by
    // sampling alone stops short of the pole and truncates arctic polygons,
    // which is what a clip extent that reaches 90 has to prevent.
    const arctic = new Feature(
      new Polygon([
        [
          [-120, 75],
          [-60, 75],
          [-60, 83],
          [-120, 83],
          [-120, 75],
        ],
      ]),
    );
    const style = new Style({fill: new Fill({color: '#eee'})});
    const build = (clipExtent) =>
      buildVectorBuffers([arctic], () => style, 1, /** @type {any} */ ({}), {
        clipExtent,
      });

    const whole = build([-180, 38, 180, 90]);
    let maxLatitude = -Infinity;
    for (let i = 0; i < whole.fillPositions.length / 2; ++i) {
      maxLatitude = Math.max(
        maxLatitude,
        toMapCoordinate(whole.fillPositions, whole.grid, i)[1],
      );
    }
    assert.closeTo(maxLatitude, 83, 0.05);

    // The extent a plain sampled estimate used to produce cuts it off.
    const truncated = build([-180, 38, 180, 72]);
    assert.strictEqual(truncated.fillIndices.length, 0);
  });

  it('shares one style entry among the vertices that use it', () => {
    const feature = new Feature(
      new Polygon([
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ]),
    );
    const style = new Style({
      fill: new Fill({color: [255, 0, 0, 1]}),
      stroke: new Stroke({color: [0, 0, 255, 1], width: 2}),
    });
    const buffers = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    assert.strictEqual(buffers.styles.length, 2 * STYLE_STRIDE);
    assert.strictEqual(
      buffers.fillStyles.length,
      buffers.fillPositions.length / 2,
    );
    for (const index of buffers.fillStyles) {
      assert.strictEqual(index, 0);
    }
    assert.deepEqual(Array.from(buffers.styles.slice(0, 4)), [1, 0, 0, 1]);
    for (const index of buffers.strokeStyles) {
      assert.strictEqual(index, 1);
    }
    assert.deepEqual(
      Array.from(buffers.styles.slice(STYLE_STRIDE, STYLE_STRIDE + 4)),
      [0, 0, 1, 1],
    );
  });

  it('makes a pattern fill transparent instead of throwing', () => {
    const feature = new Feature(
      new Polygon([
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 0],
        ],
      ]),
    );
    const pattern = /** @type {any} */ ({});
    const style = new Style({fill: new Fill({color: pattern})});
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const buffers = buildVectorBuffers(
      [feature, feature.clone()],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    const calls = consoleWarn.mock.calls.length;
    consoleWarn.mockRestore();
    assert.strictEqual(buffers.fillIndices.length, 0);
    assert.strictEqual(calls, 1);
  });

  it('skips a fill and stroke the framebuffer cannot store', () => {
    const feature = new Feature(
      new Polygon([
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 0],
        ],
      ]),
    );
    const style = new Style({
      fill: new Fill({color: 'rgba(246,243,238,4.966666659420582e-7)'}),
      stroke: new Stroke({
        color: 'rgba(0,0,0,1e-7)',
        width: 2,
      }),
    });
    const buffers = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    assert.strictEqual(buffers.fillIndices.length, 0);
    assert.strictEqual(buffers.strokeIndices.length, 0);
  });

  it('keeps a fill at one 8-bit alpha step', () => {
    const feature = new Feature(
      new Polygon([
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 0],
        ],
      ]),
    );
    const style = new Style({
      fill: new Fill({color: [246, 243, 238, 1 / 255]}),
    });
    const buffers = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    assert.isAbove(buffers.fillIndices.length, 0);
    assert.deepEqual(
      Array.from(buffers.styles.slice(0, 4)),
      [246 / 255, 243 / 255, 238 / 255, 1 / 255].map(Math.fround),
    );
  });

  it('packs a loaded pattern fill into the image atlas, and reports it as pending while loading', () => {
    const feature = new Feature(
      new Polygon([
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 0],
        ],
      ]),
    );
    const src = 'webgpu-buffers-pattern.png';
    // A real Fill would start loading the image, which Node cannot do.
    const fill = /** @type {any} */ ({
      getColor: () => ({src, scale: 0.5}),
      loading: () => true,
    });
    const style = new Style({fill});
    const imageAtlas = /** @type {any} */ ({
      add: () => ({texX0: 4, texY0: 8, texX1: 20, texY1: 40}),
    });
    const build = () =>
      buildVectorRequest(
        [feature],
        () => style,
        1,
        /** @type {any} */ ({}),
        undefined,
        1,
        NaN,
        undefined,
        imageAtlas,
      );

    const loading = build();
    assert.lengthOf(loading.request.jobs, 0);
    assert.deepEqual(loading.labelData.pendingImageStyles, [fill]);

    iconImageCache.set(
      src,
      null,
      /** @type {any} */ ({
        getImageState: () => ImageState.LOADED,
        getImage: () => ({width: 16, height: 32}),
      }),
    );
    const loaded = build();
    iconImageCache.clear();
    assert.lengthOf(loaded.request.jobs, 1);
    assert.deepEqual(
      Array.from(loaded.request.styles.slice(8, 13)),
      [4, 8, 16, 32, 0.5],
    );
  });

  it('draws a circle without a fill as its stroke alone', () => {
    const feature = new Feature(new Point([0, 0]));
    const style = new Style({
      image: new CircleStyle({
        radius: 5,
        fill: null,
        stroke: new Stroke({color: '#f00', width: 1}),
      }),
    });
    const buffers = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    const instance = Array.from(buffers.symbolInstances);
    assert.strictEqual(instance.length, SYMBOL_STRIDE);
    assert.deepEqual(instance.slice(6, 10), [0, 0, 0, 0]);
    assert.deepEqual(instance.slice(14, 20), [1, 0, 0, 1, 1, 5]);
  });

  it('packs a non-circle image style as a textured icon', () => {
    const source = {};
    const image = /** @type {any} */ ({
      getImageState: () => 2,
      getAnchor: () => [3, 4],
      getSize: () => [10, 8],
      getOrigin: () => [5, 6],
      getPixelRatio: () => 2,
      getImage: () => source,
      getHitDetectionImage: () => source,
      getScaleArray: () => [2, 0.5],
      getOpacity: () => 0.6,
      getRotation: () => 0.25,
      getRotateWithView: () => true,
      getDeclutterMode: () => 'declutter',
    });
    const atlasData = [];
    const imageAtlas = {
      add(data) {
        atlasData.push(data);
        return {texX0: 10, texY0: 20, texX1: 30, texY1: 36};
      },
    };
    const buffers = buildVectorBuffers(
      [new Feature(new Point([0, 0]))],
      () => new Style({image}),
      1,
      /** @type {any} */ ({}),
      undefined,
      1,
      NaN,
      undefined,
      /** @type {any} */ (imageAtlas),
    );
    assert.strictEqual(buffers.iconInstances.length, ICON_STRIDE);
    assert.deepEqual(
      Array.from(buffers.iconInstances.slice(2, 10)),
      [-6, -2, 20, 4, 10, 20, 30, 36],
    );
    assert.closeTo(buffers.iconInstances[10], 1 / 255, 1e-8);
    assert.deepEqual(
      Array.from(buffers.iconInstances.slice(11, 14)),
      [0, 0, 1],
    );
    assert.closeTo(buffers.iconInstances[14], 0.6, 1e-7);
    assert.strictEqual(buffers.iconInstances[15], 0.25);
    assert.strictEqual(buffers.iconInstances[16], 1);
    assert.strictEqual(atlasData.length, 1);
    assert.strictEqual(atlasData[0].sourceX, 10);
    assert.strictEqual(atlasData[0].sourceY, 12);
    assert.strictEqual(buffers.commands[0].pipeline, 'icon');
    assert.strictEqual(buffers.labels[0].iconIndex, 0);
  });

  it('starts idle image styles and reports them as pending', () => {
    let state = 0;
    let loads = 0;
    const image = /** @type {any} */ ({
      getImageState: () => state,
      load() {
        ++loads;
        state = 1;
      },
    });
    const {labelData} = buildVectorRequest(
      [new Feature(new Point([0, 0]))],
      () => new Style({image}),
      1,
      /** @type {any} */ ({}),
    );
    assert.strictEqual(loads, 1);
    assert.deepEqual(labelData.pendingImageStyles, [image]);
    assert.strictEqual(labelData.iconInstances.length, 0);
  });

  it('filters resolved style geometries instead of feature geometries', () => {
    const outsideFeature = new Feature(new Point([100, 100]));
    outsideFeature.set('draw', new Point([5, 5]));
    const insideFeature = new Feature(new Point([5, 5]));
    insideFeature.set('draw', new Point([100, 100]));
    const image = new CircleStyle({
      radius: 3,
      fill: new Fill({color: '#000'}),
    });
    const styleFunction = (feature) =>
      new Style({
        geometry: feature.get('draw'),
        image,
      });

    const {labelData} = buildVectorRequest(
      [outsideFeature, insideFeature],
      styleFunction,
      1,
      /** @type {any} */ ({}),
      {
        clipExtent: [0, 0, 10, 10],
        filterExtent: [-1, -1, 11, 11],
      },
    );

    assert.lengthOf(labelData.labels, 1);
    assert.deepEqual(labelData.labels[0]._anchor, [5, 5]);
  });

  it('reuses snapshots from a mutable function style cache', () => {
    const first = new Feature(new Point([100, 100]));
    first.set('draw', new Point([5, 5]));
    const second = new Feature(new Point([5, 5]));
    second.set('draw', new Point([100, 100]));
    const shared = new Style({
      image: new CircleStyle({
        radius: 3,
        fill: new Fill({color: '#000'}),
      }),
    });
    let calls = 0;
    const styleFunction = (feature) => {
      ++calls;
      shared.setGeometry(feature.get('draw'));
      return shared;
    };
    const cache = new WeakMap();
    for (const feature of [first, second]) {
      cache.set(
        feature,
        resolveFeatureStyles(feature, styleFunction, 1, 1, true),
      );
    }

    const {labelData} = buildVectorRequest(
      [first, second],
      styleFunction,
      1,
      /** @type {any} */ ({}),
      {filterExtent: [0, 0, 10, 10]},
      1,
      1,
      undefined,
      undefined,
      cache,
    );

    assert.strictEqual(calls, 2);
    assert.lengthOf(labelData.labels, 1);
    assert.deepEqual(labelData.labels[0]._anchor, [5, 5]);
  });

  it('stores the dash pattern of a stroke, repeating an odd one', () => {
    const feature = new Feature(
      new LineString([
        [0, 0],
        [10, 0],
      ]),
    );
    const style = new Style({
      stroke: new Stroke({
        color: '#000',
        width: 3,
        lineDash: [4],
        lineDashOffset: 2,
      }),
    });
    const buffers = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    assert.deepEqual(
      Array.from(buffers.styles.slice(8, STYLE_STRIDE)),
      [4, 4, 0, 0, 0, 0, 0, 0, 2, 8, 2, 0],
    );
  });

  it('passes explicit and default cap and join settings to stroke jobs', () => {
    const line = new Feature(
      new LineString([
        [0, 0],
        [10, 0],
      ]),
    );
    const explicit = new Style({
      stroke: new Stroke({
        color: '#000',
        lineCap: 'square',
        lineJoin: 'bevel',
        miterLimit: 3,
      }),
    });
    const explicitRequest = buildVectorRequest(
      [line],
      () => explicit,
      1,
      /** @type {any} */ ({}),
    ).request;
    assert.include(explicitRequest.jobs[0], {
      lineCap: 'square',
      lineJoin: 'bevel',
      miterLimit: 3,
      closed: false,
    });

    const polygon = new Feature(
      new Polygon([
        [
          [0, 0],
          [10, 0],
          [0, 10],
          [0, 0],
        ],
      ]),
    );
    const defaults = new Style({stroke: new Stroke({color: '#000'})});
    const defaultRequest = buildVectorRequest(
      [polygon],
      () => defaults,
      1,
      /** @type {any} */ ({}),
    ).request;
    assert.include(defaultRequest.jobs[0], {
      lineCap: 'round',
      lineJoin: 'round',
      miterLimit: 10,
      closed: true,
    });
  });

  it('builds butt, square, and round line caps', () => {
    const feature = new Feature(
      new LineString([
        [0, 0],
        [10, 0],
      ]),
    );
    const build = (lineCap) =>
      buildVectorBuffers(
        [feature],
        () =>
          new Style({
            stroke: new Stroke({color: '#000', lineCap, width: 4}),
          }),
        1,
        /** @type {any} */ ({}),
      );
    const butt = build('butt');
    const square = build('square');
    const round = build('round');
    const extrusions = (buffers) => {
      const values = [];
      for (let i = 0; i < buffers.strokeAttributes.length; i += 4) {
        values.push([
          buffers.strokeAttributes[i],
          buffers.strokeAttributes[i + 1],
        ]);
      }
      return values;
    };
    assert.isTrue(extrusions(butt).every(([x]) => x === 0));
    assert.includeDeepMembers(extrusions(square), [
      [-1, 1],
      [-1, -1],
      [1, 1],
      [1, -1],
    ]);
    assert.isAbove(round.strokeIndices.length, butt.strokeIndices.length);
  });

  it('builds bevel, round, and limited miter joins', () => {
    const feature = new Feature(
      new LineString([
        [-10, 0],
        [0, 0],
        [0, 10],
      ]),
    );
    const build = (lineJoin, miterLimit = 10) =>
      buildVectorBuffers(
        [feature],
        () =>
          new Style({
            stroke: new Stroke({
              color: '#000',
              lineCap: 'butt',
              lineJoin,
              miterLimit,
              width: 4,
            }),
          }),
        1,
        /** @type {any} */ ({}),
      );
    const miter = build('miter');
    const bevel = build('bevel');
    const round = build('round');
    const limited = build('miter', 1);
    assert.strictEqual(miter.strokeIndices.length, 12);
    assert.strictEqual(bevel.strokeIndices.length, 15);
    assert.isAbove(round.strokeIndices.length, bevel.strokeIndices.length);
    assert.strictEqual(
      limited.strokeIndices.length,
      bevel.strokeIndices.length,
    );
    let maxMiter = 0;
    for (let i = 0; i < miter.strokeAttributes.length; i += 4) {
      maxMiter = Math.max(
        maxMiter,
        Math.hypot(miter.strokeAttributes[i], miter.strokeAttributes[i + 1]),
      );
    }
    assert.closeTo(maxMiter, Math.SQRT2, 1e-6);
  });

  it('uses butt ends where clipping cuts a square-capped line', () => {
    const feature = new Feature(
      new LineString([
        [-5, 5],
        [15, 5],
      ]),
    );
    const style = new Style({
      stroke: new Stroke({
        color: '#000',
        lineCap: 'square',
        width: 4,
      }),
    });
    const buffers = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
      {clipExtent: [0, 0, 10, 10]},
    );
    for (let i = 0; i < buffers.strokeAttributes.length; i += 4) {
      assert.strictEqual(buffers.strokeAttributes[i], 0);
    }
  });

  it('handles duplicate and reversing line points without invalid values', () => {
    const feature = new Feature(
      new LineString([
        [0, 0],
        [0, 0],
        [10, 0],
        [0, 0],
      ]),
    );
    const style = new Style({
      stroke: new Stroke({color: '#000', lineJoin: 'round', width: 4}),
    });
    const buffers = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    assert.isAbove(buffers.strokeIndices.length, 0);
    assert.isTrue(
      Array.from(buffers.strokeAttributes).every((value) =>
        Number.isFinite(value),
      ),
    );
  });

  it('gives each stroke vertex its distance along the line', () => {
    const feature = new Feature(
      new LineString([
        [0, 0],
        [3, 4],
        [3, 10],
      ]),
    );
    const style = new Style({stroke: new Stroke({color: '#000', width: 1})});
    const buffers = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    const distances = [];
    for (let i = 3; i < buffers.strokeAttributes.length; i += 4) {
      distances.push(buffers.strokeAttributes[i]);
    }
    assert.deepEqual([...new Set(distances)], [0, 5, 11]);
  });

  it('draws each member of a geometry collection', () => {
    const feature = new Feature(
      new GeometryCollection([
        new LineString([
          [0, 0],
          [10, 0],
        ]),
        new Polygon([
          [
            [0, 0],
            [10, 0],
            [5, 10],
            [0, 0],
          ],
        ]),
        new Point([5, 5]),
      ]),
    );
    const style = new Style({
      fill: new Fill({color: '#f0f'}),
      stroke: new Stroke({color: '#f0f', width: 2}),
      image: new CircleStyle({
        radius: 10,
        stroke: new Stroke({color: '#f0f'}),
      }),
    });
    const buffers = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    assert.strictEqual(buffers.fillIndices.length, 3);
    assert.isAbove(buffers.strokeIndices.length, 0);
    assert.strictEqual(buffers.symbolInstances.length, SYMBOL_STRIDE);
  });

  it('fills and strokes a circle geometry', () => {
    const feature = new Feature(new Circle([5, 7], 2));
    const style = new Style({
      fill: new Fill({color: [255, 0, 0, 0.2]}),
      stroke: new Stroke({color: '#f00', width: 2}),
    });
    const buffers = buildVectorBuffers(
      [feature],
      () => style,
      1,
      /** @type {any} */ ({}),
    );
    assert.isAbove(buffers.fillIndices.length, 0);
    assert.isAbove(buffers.strokeIndices.length, 0);
    for (let i = 0; i < buffers.fillPositions.length / 2; ++i) {
      const [x, y] = toMapCoordinate(buffers.fillPositions, buffers.grid, i);
      assert.isAtMost(Math.hypot(x - 5, y - 7), 2 + 0.05);
    }
    for (let i = 0; i < buffers.strokePositions.length / 2; ++i) {
      const [x, y] = toMapCoordinate(buffers.strokePositions, buffers.grid, i);
      assert.closeTo(Math.hypot(x - 5, y - 7), 2, 0.05);
    }
  });

  it('orders mixed and negative z-index with fill then stroke before the next polygon', () => {
    const high = new Feature(square(4, 4, 10));
    const low = new Feature(square(0, 0, 10));
    const buffers = buildVectorBuffers(
      [high, low],
      (feature) =>
        new Style({
          fill: new Fill({color: '#f00'}),
          stroke: new Stroke({color: '#000', width: 1}),
          zIndex: feature === high ? 5 : -2,
        }),
      1,
      /** @type {any} */ ({}),
    );
    const lowRef = refOf(buffers, low);
    const highRef = refOf(buffers, high);
    assert.deepEqual(
      buffers.commands.map((command) => [
        command.featureRef,
        command.pipeline,
        command.zIndex,
      ]),
      [
        [lowRef, 'fill', -2],
        [lowRef, 'stroke', -2],
        [highRef, 'fill', 5],
        [highRef, 'stroke', 5],
      ],
    );
    const fills = buffers.commands.filter(
      (command) => command.pipeline === 'fill',
    );
    assert.strictEqual(fills[0].start, 0);
    assert.strictEqual(fills[1].start, fills[0].count);
  });

  it('draws every fill before any stroke when features share a z-index', () => {
    const early = new Feature(square(0, 0, 4));
    const late = new Feature(square(1, 1, 4));
    early.set('order', 1);
    late.set('order', 0);
    const style = new Style({
      fill: new Fill({color: '#00f'}),
      stroke: new Stroke({color: '#000', width: 1}),
    });
    const buffers = buildVectorBuffers(
      [early, late],
      () => style,
      1,
      /** @type {any} */ ({}),
      undefined,
      1,
      NaN,
      (a, b) => a.get('order') - b.get('order'),
    );
    assert.deepEqual(
      buffers.commands.map((command) => [
        buffers.featuresByRef[command.featureRef],
        command.pipeline,
      ]),
      [
        [late, 'fill'],
        [early, 'fill'],
        [late, 'stroke'],
        [early, 'stroke'],
      ],
    );
  });

  it('paints polygons, then circles, then lines at the same z-index', () => {
    const line = new Feature(
      new LineString([
        [0, 0],
        [8, 0],
      ]),
    );
    const circle = new Feature(new Circle([20, 20], 2));
    const polygon = new Feature(square(0, 0, 6));
    const buffers = buildVectorBuffers(
      [line, circle, polygon],
      (feature) => {
        const type = feature.getGeometry().getType();
        if (type === 'LineString') {
          return new Style({
            stroke: new Stroke({color: '#000', width: 1}),
          });
        }
        return new Style({fill: new Fill({color: '#0f0'})});
      },
      1,
      /** @type {any} */ ({}),
    );
    assert.deepEqual(
      buffers.commands.map((command) => command.classRank),
      [0, 1, 2],
    );
    assert.strictEqual(
      buffers.featuresByRef[buffers.commands[0].featureRef],
      polygon,
    );
    assert.strictEqual(
      buffers.featuresByRef[buffers.commands[1].featureRef],
      circle,
    );
    assert.strictEqual(
      buffers.featuresByRef[buffers.commands[2].featureRef],
      line,
    );
  });
});

/**
 * @param {number} minX Min x.
 * @param {number} minY Min y.
 * @param {number} size Size.
 * @return {Polygon} Square.
 */
function square(minX, minY, size) {
  return new Polygon([
    [
      [minX, minY],
      [minX + size, minY],
      [minX + size, minY + size],
      [minX, minY + size],
      [minX, minY],
    ],
  ]);
}

/**
 * @param {import('../../../../../src/ol/render/webgpu/buffers.js').VectorBuffers} buffers Buffers.
 * @param {Feature} feature Feature.
 * @return {number} Ref.
 */
function refOf(buffers, feature) {
  for (const ref of Object.keys(buffers.featuresByRef)) {
    if (buffers.featuresByRef[ref] === feature) {
      return Number(ref);
    }
  }
  return 0;
}
