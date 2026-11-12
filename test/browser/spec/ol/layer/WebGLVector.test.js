import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import WebGLVectorLayer from '../../../../../src/ol/layer/WebGLVector.js';
import {getRenderPixel} from '../../../../../src/ol/render.js';
import WebGLVectorLayerRenderer from '../../../../../src/ol/renderer/webgl/VectorLayer.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';

describe('ol/layer/WebGLVector', function () {
  /** @type {WebGLVectorLayer} */
  let layer;
  /** @type {Map} */
  let map, target;

  beforeEach(
    () =>
      new Promise((resolve) => {
        layer = new WebGLVectorLayer({
          className: 'testlayer',
          source: new VectorSource(),
          style: [
            {
              'circle-radius': 4,
              'circle-fill-color': ['var', 'fillColor'],
            },
            {
              'fill-color': ['var', 'fillColor'],
            },
          ],
          variables: {
            fillColor: 'rgba(255, 0, 0, 0.5)',
          },
          disableHitDetection: false,
        });
        target = document.createElement('div');
        target.style.width = '100px';
        target.style.height = '100px';
        document.body.appendChild(target);
        map = new Map({
          target: target,
          layers: [layer],
          view: new View({
            center: [0, 0],
            zoom: 2,
          }),
        });
        map.once('rendercomplete', () => resolve());
      }),
  );

  afterEach(function () {
    disposeMap(map);
    map.getLayers().forEach((layer) => layer.dispose());
  });

  describe('dispose()', () => {
    it('calls dispose on the renderer', () => {
      const renderer = layer.getRenderer();
      const spy = vi.spyOn(renderer, 'dispose');
      layer.dispose();
      assert.isAbove(spy.mock.calls.length, 0);
    });
  });

  it('creates a renderer with the given parameters', function () {
    const renderer = layer.getRenderer();
    assert.instanceOf(renderer, WebGLVectorLayerRenderer);
    assert.deepEqual(renderer.style_, [
      {
        'circle-radius': 4,
        'circle-fill-color': ['var', 'fillColor'],
      },
      {
        'fill-color': ['var', 'fillColor'],
      },
    ]);
    assert.deepEqual(renderer.styleVariables_, {
      fillColor: 'rgba(255, 0, 0, 0.5)',
    });
    assert.strictEqual(renderer.hitDetectionEnabled_, true);
  });

  describe('updateStyleVariables()', function () {
    it('updates style variables', function () {
      layer.updateStyleVariables({
        fillColor: 'yellow',
      });
      assert.strictEqual(layer.styleVariables_['fillColor'], 'yellow');
      const renderer = layer.getRenderer();
      const uniforms = renderer.styleRenderer_.uniforms_;
      assert.deepEqual(uniforms.u_var_fillColor(), [1, 1, 0, 1]);
    });

    it('can be called before the layer is rendered', function () {
      layer = new WebGLVectorLayer({
        style: {
          'fill-color': ['var', 'fillColor'],
        },
        source: new VectorSource(),
      });

      layer.updateStyleVariables({foo: 'bam'});
      assert.strictEqual(layer.styleVariables_.foo, 'bam');
    });

    it('can be called even if no initial variables are provided', function () {
      const layer = new WebGLVectorLayer({
        source: new VectorSource(),
      });

      layer.updateStyleVariables({foo: 'bam'});
      assert.strictEqual(layer.styleVariables_.foo, 'bam');
    });
  });

  describe('setStyle()', function () {
    it('saves the new style on the layer', function () {
      const newStyle = [
        {
          else: true,
          style: {
            'fill-color': 'blue',
          },
        },
      ];
      layer.setStyle(newStyle);
      assert.deepEqual(layer.style_, newStyle);
    });

    it('disposes of the previous renderer', function () {
      const renderer = layer.getRenderer();
      const spy = vi.spyOn(renderer, 'dispose');
      layer.setStyle({});
      assert.isAbove(spy.mock.calls.length, 0);
    });
  });

  it('dispatches a precompose event with WebGL context', () =>
    new Promise((resolve) => {
      let called = false;
      layer.on('precompose', (event) => {
        assert.instanceOf(event.context, WebGLRenderingContext);
        called = true;
      });

      map.once('rendercomplete', () => {
        assert.strictEqual(called, true);
        resolve();
      });

      map.render();
    }));

  it('dispatches a prerender event with WebGL context and inverse pixel transform', () =>
    new Promise((resolve) => {
      let called = false;
      layer.on('prerender', (event) => {
        assert.instanceOf(event.context, WebGLRenderingContext);
        const mapSize = event.frameState.size;
        const bottomLeft = getRenderPixel(event, [0, mapSize[1]]);
        assert.deepEqual(bottomLeft, [0, 0]);
        called = true;
      });

      map.once('rendercomplete', () => {
        assert.strictEqual(called, true);
        resolve();
      });

      map.render();
    }));

  it('dispatches a postrender event with WebGL context and inverse pixel transform', () =>
    new Promise((resolve) => {
      let called = false;
      layer.on('postrender', (event) => {
        assert.instanceOf(event.context, WebGLRenderingContext);
        const mapSize = event.frameState.size;
        const topRight = getRenderPixel(event, [mapSize[1], 0]);
        const pixelRatio = event.frameState.pixelRatio;
        assert.deepEqual(topRight, [
          mapSize[0] * pixelRatio,
          mapSize[1] * pixelRatio,
        ]);
        called = true;
      });

      map.once('rendercomplete', () => {
        assert.strictEqual(called, true);
        resolve();
      });

      map.render();
    }));

  it('works if the layer is constructed without a source', () =>
    new Promise((resolve) => {
      const sourceless = new WebGLVectorLayer({
        className: 'testlayer',
        style: {
          'fill-color': 'red',
        },
      });

      map.addLayer(sourceless);

      sourceless.setSource(new VectorSource());

      let called = false;
      layer.on('postrender', (event) => {
        called = true;
      });

      map.once('rendercomplete', () => {
        assert.strictEqual(called, true);
        resolve();
      });
    }));

  describe('rotation expression', () => {
    /** @type {Map} */
    let rotationMap;
    /** @type {HTMLElement} */
    let rotationTarget;

    beforeEach(() => {
      const rotationLayer = new WebGLVectorLayer({
        source: new VectorSource({
          features: [
            new Feature(
              new Polygon([
                [
                  [-1000, -1000],
                  [1000, -1000],
                  [1000, 1000],
                  [-1000, 1000],
                  [-1000, -1000],
                ],
              ]),
            ),
          ],
        }),
        style: {
          'fill-color': ['color', ['*', ['rotation'], 50], 0, 0, 1],
        },
        disableHitDetection: true,
      });
      rotationTarget = document.createElement('div');
      rotationTarget.style.width = '100px';
      rotationTarget.style.height = '100px';
      document.body.appendChild(rotationTarget);
      rotationMap = new Map({
        target: rotationTarget,
        layers: [rotationLayer],
        view: new View({
          center: [0, 0],
          resolution: 100,
        }),
      });
    });

    afterEach(() => {
      disposeMap(rotationMap);
      rotationMap.getLayers().forEach((layer) => layer.dispose());
    });

    /**
     * Renders the map and reads the red channel of the center pixel.
     * @return {Promise<number>} Red channel value.
     */
    function renderAndReadRed() {
      return new Promise((resolve) => {
        const layer = rotationMap.getLayers().item(0);
        let red;
        layer.once('postrender', (event) => {
          const gl = event.context;
          const pixel = new Uint8Array(4);
          const size = event.frameState.size;
          const pixelRatio = event.frameState.pixelRatio;
          gl.readPixels(
            Math.round((size[0] * pixelRatio) / 2),
            Math.round((size[1] * pixelRatio) / 2),
            1,
            1,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixel,
          );
          red = pixel[0];
        });
        rotationMap.once('rendercomplete', () => resolve(red));
        rotationMap.render();
      });
    }

    it('exposes the view rotation in radians to the shader', async () => {
      const view = rotationMap.getView();
      for (const rotation of [0, 1, 2, 3]) {
        view.setRotation(rotation);
        const red = await renderAndReadRed();
        assert.approximately(red, rotation * 50, 2);
      }
    });

    it('picks up rotation changes after the first render', async () => {
      const view = rotationMap.getView();
      assert.approximately(await renderAndReadRed(), 0, 2);
      view.setRotation(2);
      assert.approximately(await renderAndReadRed(), 100, 2);
    });
  });
});
