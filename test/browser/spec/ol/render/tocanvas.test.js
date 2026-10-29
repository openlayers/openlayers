import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import {fromExtent} from '../../../../../src/ol/geom/Polygon.js';
import LayerGroup from '../../../../../src/ol/layer/Group.js';
import Layer from '../../../../../src/ol/layer/Layer.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import {toCanvas} from '../../../../../src/ol/render.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Style from '../../../../../src/ol/style/Style.js';

describe('ol/render.toCanvas', function () {
  let map;

  beforeEach(function () {
    map = new Map({
      target: createMapDiv(20, 20),
      controls: [],
      interactions: [],
      pixelRatio: 2,
      view: new View({center: [0, 0], resolution: 1}),
    });
    map.renderSync();
  });

  afterEach(function () {
    disposeMap(map);
  });

  function addCanvas(color, width = 20, height = 20) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    if (color) {
      const context = canvas.getContext('2d');
      context.fillStyle = color;
      context.fillRect(0, 0, width, height);
    }
    const container = document.createElement('div');
    container.appendChild(canvas);
    map.addLayer(new Layer({render: () => container}));
    map.renderSync();
    return canvas;
  }

  function assertPixel(canvas, x, y, expected) {
    const pixel = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
    for (let i = 0; i < 4; ++i) {
      // Allow rounding from the two alpha compositing steps for CSS groups.
      assert.closeTo(pixel[i], expected[i], 2, `channel ${i} at ${x},${y}`);
    }
  }

  it('returns an independent transparent snapshot at CSS pixel size by default', function () {
    const source = addCanvas('red');
    const result = toCanvas(map);
    assert.equal(result.width, 20);
    assert.equal(result.height, 20);
    assert.notStrictEqual(result, source);
    source.getContext('2d').clearRect(0, 0, 20, 20);
    assertPixel(result, 5, 5, [255, 0, 0, 255]);
    assertPixel(toCanvas(map), 5, 5, [0, 0, 0, 0]);
  });

  it('supports an empty map and an optional output background', function () {
    assertPixel(toCanvas(map), 5, 5, [0, 0, 0, 0]);
    assertPixel(
      toCanvas(map, {backgroundColor: 'blue'}),
      5,
      5,
      [0, 0, 255, 255],
    );
  });

  [1, 2, 1.5].forEach((pixelRatio) => {
    it(`composes mixed canvas ratios with rotation and translation at output ratio ${pixelRatio}`, function () {
      const base = addCanvas('green', 10, 10);
      base.style.width = '20px';
      base.style.height = '20px';
      const top = addCanvas('red', 40, 20);
      const context = top.getContext('2d');
      context.fillStyle = 'blue';
      context.fillRect(20, 0, 20, 20);
      top.style.transform = 'matrix(0, 0.5, -0.5, 0, 20, 0)';
      const result = toCanvas(map, {pixelRatio});
      assert.equal(result.width, Math.round(20 * pixelRatio));
      assert.equal(result.height, Math.round(20 * pixelRatio));
      assertPixel(result, 5 * pixelRatio, 5 * pixelRatio, [0, 128, 0, 255]);
      assertPixel(result, 15 * pixelRatio, 5 * pixelRatio, [255, 0, 0, 255]);
      assertPixel(result, 15 * pixelRatio, 15 * pixelRatio, [0, 0, 255, 255]);
      assert.equal(result.getContext('2d').globalAlpha, 1);
      assert.isTrue(result.getContext('2d').getTransform().isIdentity);
      assert.equal(top.style.transform, 'matrix(0, 0.5, -0.5, 0, 20, 0)');
    });
  });

  it('applies container opacity to its background and canvas together', function () {
    addCanvas('blue');
    const top = addCanvas(undefined, 40, 40);
    const context = top.getContext('2d');
    context.fillStyle = 'white';
    context.fillRect(0, 0, 20, 40);
    top.style.transform = 'matrix(0.5, 0, 0, 0.5, 0, 0)';
    top.style.opacity = '0.5';
    top.parentElement.style.opacity = '0.5';
    top.parentElement.style.backgroundColor = 'yellow';
    const result = toCanvas(map);
    assertPixel(result, 5, 5, [128, 128, 192, 255]);
    assertPixel(result, 15, 5, [128, 128, 128, 255]);
    assert.equal(context.globalAlpha, 1);
  });

  it('paints viewport backgrounds independently of canvas transforms', function () {
    const top = addCanvas('red', 10, 10);
    top.style.transform = 'matrix(0, 1, -1, 0, 20, 0)';
    top.parentElement.style.backgroundColor = 'yellow';
    const result = toCanvas(map);
    assertPixel(result, 15, 5, [255, 0, 0, 255]);
    assertPixel(result, 5, 15, [255, 255, 0, 255]);
  });

  it('handles transparent groups and clears the group buffer between layers', function () {
    addCanvas('blue');
    const invisible = addCanvas('red');
    invisible.parentElement.style.opacity = '0';
    invisible.parentElement.style.backgroundColor = 'yellow';
    const top = addCanvas('white', 10, 10);
    top.parentElement.style.opacity = '0.5';
    const result = toCanvas(map);
    assertPixel(result, 5, 5, [128, 128, 255, 255]);
    assertPixel(result, 15, 15, [0, 0, 255, 255]);
  });

  it('handles a canvas as the layer element and skips zero-sized canvases', function () {
    const canvas = addCanvas('red');
    map.getLayers().item(0).render = () => canvas;
    canvas.style.opacity = '0.5';
    canvas.style.backgroundColor = 'blue';
    addCanvas('blue', 0, 20);
    addCanvas('blue', 20, 0);
    map.renderSync();
    assertPixel(toCanvas(map), 5, 5, [255, 0, 0, 128]);
  });

  it('transforms a direct canvas background with the canvas itself', function () {
    const canvas = addCanvas(undefined, 10, 10);
    map.getLayers().item(0).render = () => canvas;
    canvas.style.backgroundColor = 'blue';
    canvas.style.opacity = '0.5';
    canvas.style.transform = 'matrix(0, 1, -1, 0, 20, 0)';
    map.renderSync();
    const result = toCanvas(map);
    assertPixel(result, 15, 5, [0, 0, 255, 128]);
    assertPixel(result, 5, 15, [0, 0, 0, 0]);
  });

  [0, -1, NaN, Infinity].forEach((pixelRatio) => {
    it(`rejects invalid output pixel ratio ${pixelRatio}`, function () {
      assert.throws(() => toCanvas(map, {pixelRatio}), /positive finite/);
    });
  });

  it('requires a rendered map and a nonzero output size', function () {
    assert.throws(() => toCanvas(map, {pixelRatio: 0.001}), /export canvas/);
    const target = map.getTargetElement();
    map.setTarget(undefined);
    target.remove();
    assert.throws(() => toCanvas(map), /rendered map/);
    const unrendered = new Map({});
    assert.throws(() => toCanvas(unrendered), /rendered map/);
    unrendered.dispose();
  });

  it('rejects canvas targets', function () {
    const target = document.createElement('canvas');
    target.width = 20;
    target.height = 20;
    const oldTarget = map.getTargetElement();
    map.setTarget(target);
    oldTarget.remove();
    map.renderSync();
    assert.throws(() => toCanvas(map), /HTML container target/);
  });

  it('rejects custom DOM layers instead of silently omitting them', function () {
    map.addLayer(new Layer({render: () => document.createElement('div')}));
    map.renderSync();
    assert.throws(() => toCanvas(map), /Only Canvas 2D/);
  });

  it('rejects WebGL layer canvases', function () {
    const canvas = addCanvas();
    assert.isOk(canvas.getContext('webgl'));
    assert.throws(() => toCanvas(map), /Only Canvas 2D/);
  });

  it('rejects layer canvas transforms other than a single matrix()', function () {
    const canvas = addCanvas('red');
    for (const transform of [
      'none',
      'rotate(45deg)',
      'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 10, 0, 1)',
      'matrix(1, 0, 0, 1, 10, 10) rotate(45deg)',
    ]) {
      canvas.style.transform = transform;
      assert.throws(() => toCanvas(map), Error, /Only matrix\(\)/, transform);
    }
  });

  it('excludes controls, overlays and other maps', function () {
    addCanvas('red');
    const other = new Map({
      target: createMapDiv(20, 20),
      view: new View({center: [0, 0], resolution: 1}),
    });
    other.renderSync();
    const overlay = document.createElement('canvas');
    overlay.width = 20;
    overlay.height = 20;
    const context = overlay.getContext('2d');
    context.fillStyle = 'blue';
    context.fillRect(0, 0, 20, 20);
    map.getOverlayContainer().appendChild(overlay);
    assertPixel(toCanvas(map), 5, 5, [255, 0, 0, 255]);
    disposeMap(other);
  });

  it('preserves built-in shared canvases, z-order, group opacity and visibility', function () {
    const makeLayer = (color, options) =>
      new VectorLayer({
        source: new VectorSource({
          features: [new Feature(fromExtent([-20, -20, 20, 20]))],
        }),
        style: new Style({fill: new Fill({color})}),
        ...options,
      });
    map.addLayer(
      new LayerGroup({
        opacity: 0.5,
        layers: [makeLayer('red', {opacity: 0.5, zIndex: 2})],
      }),
    );
    map.addLayer(makeLayer('blue', {zIndex: 1}));
    map.addLayer(makeLayer('green', {visible: false}));
    map.addLayer(makeLayer('green', {extent: [100, 100, 120, 120]}));
    map.getView().setRotation(Math.PI / 4);
    map.renderSync();
    // These built-in layers share a physical canvas at map pixel ratio 2.
    assert.lengthOf(map.getViewport().querySelectorAll('.ol-layers canvas'), 1);
    const result = toCanvas(map, {pixelRatio: 2});
    assertPixel(result, 20, 20, [64, 0, 191, 255]);
    assertPixel(result, 3, 3, [64, 0, 191, 255]);
  });

  it('composes separate built-in canvases with backgrounds, custom classes and clipping', function () {
    map.addLayer(
      new VectorLayer({
        background: 'blue',
        source: new VectorSource(),
      }),
    );
    map.addLayer(
      new VectorLayer({
        className: 'export-feature',
        background: 'yellow',
        extent: [-3, -3, 3, 3],
        source: new VectorSource({
          features: [new Feature(fromExtent([-20, -20, 20, 20]))],
        }),
        style: new Style({fill: new Fill({color: 'red'})}),
      }),
    );
    map.getView().setRotation(Math.PI / 4);
    map.renderSync();
    assert.lengthOf(map.getViewport().querySelectorAll('.ol-layers canvas'), 2);
    const result = toCanvas(map);
    assertPixel(result, 10, 10, [255, 0, 0, 255]);
    assertPixel(result, 1, 1, [255, 255, 0, 255]);
  });
});
