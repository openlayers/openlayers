import {assert} from 'chai';

// The tessellation worker script reads `self` as it is imported. Node has no
// worker global, and this test never starts a worker.
globalThis.self = globalThis;

const {default: WebGPUVectorLayer} =
  await import('../../../../../src/ol/layer/WebGPUVector.js');
const {default: Feature} = await import('../../../../../src/ol/Feature.js');
const {default: Polygon} =
  await import('../../../../../src/ol/geom/Polygon.js');
const {default: Point} = await import('../../../../../src/ol/geom/Point.js');
const {encodeHitColor} =
  await import('../../../../../src/ol/render/webgpu/buffers.js');
const {get: getProjection} = await import('../../../../../src/ol/proj.js');

/**
 * Font atlas construction wants a canvas. Node has neither `document` nor
 * `OffscreenCanvas`, and this test never draws.
 */
function installDocument() {
  const context = {
    clearRect() {},
    fillStyle: '',
    strokeStyle: '',
  };
  globalThis.document = /** @type {Document} */ (
    /** @type {unknown} */ ({
      createElement(tag) {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext() {
              return context;
            },
          };
        }
        return {};
      },
    })
  );
}

/**
 * @param {number} count Label count.
 * @return {Object} Buffers the label view can read.
 */
function labelBuffers(count) {
  const labels = [];
  for (let i = 0; i < count; ++i) {
    labels.push({
      minX: 0,
      minY: 0,
      maxX: 10,
      maxY: 10,
      priority: i,
    });
  }
  return {labels, glyphs: []};
}

/**
 * A settled view: not animating, and not translated since the last pass.
 * @return {import('../../../../../src/ol/Map.js').FrameState} Frame.
 */
function settledFrame() {
  return /** @type {import('../../../../../src/ol/Map.js').FrameState} */ ({
    coordinateToPixelTransform: [0.001, 0, 0, -0.001, 400, 300],
    viewHints: [0, 0],
    time: 5000,
  });
}

describe('ol/renderer/webgpu/VectorLayer placement', () => {
  const previousDocument = globalThis.document;

  beforeEach(() => {
    installDocument();
  });

  afterEach(() => {
    if (previousDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = previousDocument;
    }
  });

  it('places again when a zoom rebuild installs new labels on a settled view', () => {
    const layer = new WebGPUVectorLayer({
      style: {'text-value': 'name'},
      declutter: true,
    });
    const renderer = layer.getRenderer();
    const frame = settledFrame();

    // The labels built at the previous zoom are already placed, and the view
    // has stopped on the final resolution.
    renderer.updateLabelView_(labelBuffers(2));
    const placed = renderer.labelPlacementKey_(frame);
    renderer.placement_.commit(placed, frame.time, 0, frame);
    assert.strictEqual(
      renderer.placement_.shouldRun(placed, frame.time + 1, frame),
      false,
    );

    // The rebuild is scheduled before the worker returns, so the generation
    // moves while the old labels are still installed. That must not count as
    // a new placement.
    renderer.buildGeneration_ += 1;
    assert.strictEqual(renderer.labelPlacementKey_(frame), placed);
    assert.strictEqual(
      renderer.placement_.shouldRun(
        renderer.labelPlacementKey_(frame),
        frame.time + 1,
        frame,
      ),
      false,
    );

    // A slow pass would defer the next one. The labels that then arrive still
    // have to be placed, or every one of them stays visible.
    renderer.placement_.commit(placed, frame.time + 1, 50, frame);
    renderer.updateLabelView_(labelBuffers(8));
    const installed = renderer.labelPlacementKey_(frame);
    assert.notStrictEqual(installed, placed);
    assert.strictEqual(
      renderer.placement_.shouldRun(installed, frame.time + 2, frame),
      true,
    );

    layer.dispose();
  });

  it('keeps replacement labels hidden until placement accepts them', () => {
    const layer = new WebGPUVectorLayer({
      style: {'text-value': 'name'},
      declutter: true,
    });
    const renderer = layer.getRenderer();
    renderer.updateLabelView_(labelBuffers(3));
    assert.deepEqual(renderer.visibility_, [false, false, false]);
    layer.dispose();
  });
});

describe('ol/renderer/webgpu/VectorLayer hit detection', () => {
  const previousDocument = globalThis.document;

  beforeEach(() => {
    installDocument();
  });

  afterEach(() => {
    if (previousDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = previousDocument;
    }
  });

  it('hits text, geometry, and symbols from the top of the paint order', () => {
    const layer = new WebGPUVectorLayer({
      style: {'fill-color': '#eee'},
    });
    const renderer = layer.getRenderer();
    const labeled = new Feature(
      new Polygon([
        [
          [100, 100],
          [110, 100],
          [110, 110],
          [100, 110],
          [100, 100],
        ],
      ]),
    );
    const symbolized = new Feature(new Point([50, 50]));
    const labelHit = encodeHitColor(1);
    const symbolHit = encodeHitColor(2);
    renderer.buffers_ = {
      labels: [
        {
          minX: -20,
          minY: -10,
          maxX: 20,
          maxY: 10,
          glyphStart: 0,
          glyphCount: 1,
          _anchor: [0, 0],
        },
        {
          minX: -8,
          minY: -8,
          maxX: 8,
          maxY: 8,
          glyphCount: 0,
          symbolIndex: 0,
          _anchor: [50, 50],
        },
      ],
      glyphs: [
        {
          x: 0,
          y: 0,
          offsetX: -20,
          offsetY: -10,
          width: 40,
          height: 20,
          hitR: labelHit[0],
          hitG: labelHit[1],
          hitB: labelHit[2],
        },
      ],
      commands: [
        {
          pipeline: 'fill',
          zIndex: 0,
          classRank: 0,
          sequence: 0,
          start: 0,
          count: 3,
          featureRef: 1,
        },
        {
          pipeline: 'symbol',
          zIndex: 0,
          classRank: 3,
          sequence: 1,
          start: 0,
          count: 1,
          featureRef: 2,
          labelIndex: 1,
        },
        {
          pipeline: 'glyph',
          zIndex: 0,
          classRank: 4,
          sequence: 0,
          start: 0,
          count: 1,
          featureRef: 1,
          labelIndex: 0,
        },
      ],
      symbolInstances: [
        50,
        50,
        0,
        0,
        16,
        16,
        1,
        1,
        1,
        1,
        symbolHit[0],
        symbolHit[1],
        symbolHit[2],
        symbolHit[3],
      ],
      featuresByRef: {
        1: labeled,
        2: symbolized,
      },
    };
    const frame =
      /** @type {import('../../../../../src/ol/Map.js').FrameState} */ ({
        coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
        viewState: {
          projection: getProjection('EPSG:3857'),
        },
      });

    const at = (x, y) =>
      renderer.forEachFeatureAtCoordinate(
        [x, y],
        frame,
        0,
        (feature) => feature,
        [],
      );

    assert.strictEqual(at(0, 0), labeled);
    assert.strictEqual(at(105, 105), labeled);
    assert.strictEqual(at(54, 50), symbolized);

    layer.dispose();
  });

  it('returns the higher z-index feature when it covers text', () => {
    const layer = new WebGPUVectorLayer({
      style: {'fill-color': '#eee'},
    });
    const renderer = layer.getRenderer();
    const under = new Feature(
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
    const over = new Feature(
      new Polygon([
        [
          [6, 6],
          [12, 6],
          [12, 12],
          [6, 12],
          [6, 6],
        ],
      ]),
    );
    const labeled = new Feature(new Point([8, 8]));
    renderer.buffers_ = {
      labels: [
        {
          glyphStart: 0,
          glyphCount: 1,
          minX: -2,
          minY: -2,
          maxX: 2,
          maxY: 2,
        },
      ],
      glyphs: [
        {
          x: 8,
          y: 8,
          offsetX: -2,
          offsetY: -2,
          width: 4,
          height: 4,
        },
      ],
      featuresByRef: {
        1: under,
        2: over,
        3: labeled,
      },
      commands: [
        {
          pipeline: 'fill',
          zIndex: 0,
          classRank: 0,
          sequence: 0,
          start: 0,
          count: 3,
          featureRef: 1,
        },
        {
          pipeline: 'glyph',
          zIndex: 1,
          classRank: 4,
          sequence: 1,
          start: 0,
          count: 1,
          featureRef: 3,
          labelIndex: 0,
        },
        {
          pipeline: 'fill',
          zIndex: 5,
          classRank: 0,
          sequence: 2,
          start: 3,
          count: 3,
          featureRef: 2,
        },
      ],
    };
    const frame =
      /** @type {import('../../../../../src/ol/Map.js').FrameState} */ ({
        coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
        viewState: {
          projection: getProjection('EPSG:3857'),
        },
      });
    const at = (x, y) =>
      renderer.forEachFeatureAtCoordinate(
        [x, y],
        frame,
        0,
        (feature) => feature,
        [],
      );

    assert.strictEqual(at(2, 2), under);
    assert.strictEqual(at(8, 8), over);

    layer.dispose();
  });
});
