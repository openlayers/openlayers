import {assert} from 'chai';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import {createCanvasContext2D} from '../../../../../src/ol/dom.js';
import {getForViewAndSize} from '../../../../../src/ol/extent.js';
import WebGLTileLayer from '../../../../../src/ol/layer/WebGLTile.js';
import {getRenderPixel} from '../../../../../src/ol/render.js';
import {sourcesFromTileGrid} from '../../../../../src/ol/source.js';
import DataTileSource from '../../../../../src/ol/source/DataTile.js';
import TileWMS from '../../../../../src/ol/source/TileWMS.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';
import WebGLHelper from '../../../../../src/ol/webgl/Helper.js';

describe('ol/layer/WebGLTile', function () {
  /** @type {WebGLTileLayer} */
  let layer;
  /** @type {Map} */
  let map, target;

  beforeEach(
    () =>
      new Promise((resolve) => {
        layer = new WebGLTileLayer({
          className: 'testlayer',
          source: new DataTileSource({
            loader(z, x, y) {
              return new Promise((resolve) => {
                resolve(new ImageData(256, 256).data);
              });
            },
          }),
          style: {
            variables: {
              r: 0,
              g: 255,
              b: 0,
            },
            color: ['color', ['var', 'r'], ['var', 'g'], ['var', 'b']],
          },
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

  describe('getData()', () => {
    /** @type {Map} */
    let map;
    let target;

    beforeEach(() => {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });
    });

    afterEach(() => {
      disposeMap(map);
    });

    it('retrieves pixel data', () =>
      new Promise((resolve) => {
        const layer = new WebGLTileLayer({
          source: new DataTileSource({
            tileSize: 1,
            tileGrid: createXYZ(),
            loader(z, x, y) {
              return new Uint8Array([5, 4, 3, 2, 1]);
            },
          }),
        });

        map.addLayer(layer);

        map.once('rendercomplete', () => {
          const data = layer.getData([50, 25]);
          assert.instanceOf(data, Uint8Array);
          assert.strictEqual(data.length, 5);
          assert.strictEqual(data[0], 5);
          assert.strictEqual(data[1], 4);
          assert.strictEqual(data[2], 3);
          assert.strictEqual(data[3], 2);
          assert.strictEqual(data[4], 1);
          resolve();
        });
      }));

    it('retrieves pixel data from pyramid', () =>
      new Promise((resolve) => {
        const pyramidGrid = createXYZ({minZoom: 1, maxZoom: 1});
        const layer = new WebGLTileLayer({
          sources: sourcesFromTileGrid(
            pyramidGrid,
            ([z1, x1, y1]) =>
              new DataTileSource({
                tileSize: 1,
                tileGrid: createXYZ({
                  extent: pyramidGrid.getTileCoordExtent([z1, x1, y1]),
                  minZoom: 1,
                  maxZoom: 1,
                }),
                loader(z2, x2, y2) {
                  return new Uint8Array([x1, y1, x2, y2]);
                },
              }),
          ),
        });

        map.addLayer(layer);

        map.once('rendercomplete', () => {
          let data;
          data = layer.getData([25, 25]);
          assert.instanceOf(data, Uint8Array);
          assert.strictEqual(data.length, 4);
          assert.strictEqual(data[0], 0);
          assert.strictEqual(data[1], 0);
          assert.strictEqual(data[2], 1);
          assert.strictEqual(data[3], 1);
          data = layer.getData([75, 25]);
          assert.instanceOf(data, Uint8Array);
          assert.strictEqual(data.length, 4);
          assert.strictEqual(data[0], 1);
          assert.strictEqual(data[1], 0);
          assert.strictEqual(data[2], 0);
          assert.strictEqual(data[3], 1);
          data = layer.getData([25, 75]);
          assert.instanceOf(data, Uint8Array);
          assert.strictEqual(data.length, 4);
          assert.strictEqual(data[0], 0);
          assert.strictEqual(data[1], 1);
          assert.strictEqual(data[2], 1);
          assert.strictEqual(data[3], 0);
          data = layer.getData([75, 75]);
          assert.instanceOf(data, Uint8Array);
          assert.strictEqual(data.length, 4);
          assert.strictEqual(data[0], 1);
          assert.strictEqual(data[1], 1);
          assert.strictEqual(data[2], 0);
          assert.strictEqual(data[3], 0);
          resolve();
        });
      }));

    it('preserves the original data type', () =>
      new Promise((resolve) => {
        const layer = new WebGLTileLayer({
          source: new DataTileSource({
            tileSize: 1,
            tileGrid: createXYZ(),
            loader(z, x, y) {
              return new Float32Array([1.11, 2.22, 3.33, 4.44, 5.55]);
            },
          }),
        });

        map.addLayer(layer);

        map.once('rendercomplete', () => {
          const data = layer.getData([50, 25]);
          assert.instanceOf(data, Float32Array);
          assert.strictEqual(data.length, 5);
          assert.approximately(data[0], 1.11, 1e-5);
          assert.approximately(data[1], 2.22, 1e-5);
          assert.approximately(data[2], 3.33, 1e-5);
          assert.approximately(data[3], 4.44, 1e-5);
          assert.approximately(data[4], 5.55, 1e-5);
          resolve();
        });
      }));
  });

  describe('gutter', () => {
    let map, target, layer, data;
    beforeEach(
      () =>
        new Promise((resolve) => {
          target = document.createElement('div');
          target.style.width = '256px';
          target.style.height = '256px';
          document.body.appendChild(target);

          layer = new WebGLTileLayer({
            source: new TileWMS({
              params: {
                LAYERS: 'layer',
              },
              gutter: 20,
              url: 'spec/ol/data/wms20.png',
            }),
          });

          map = new Map({
            target: target,
            pixelRatio: 1,
            layers: [layer],
            view: new View({
              center: [0, 0],
              zoom: 0,
            }),
          });

          map.once('rendercomplete', () => resolve());
        }),
    );

    afterEach(() => {
      disposeMap(map);
    });

    it('gets pixel data', () => {
      data = layer.getData([76, 114]);
      assert.instanceOf(data, Uint8ClampedArray);
      assert.strictEqual(data.length, 4);
      assert.strictEqual(data[0], 77);
      assert.strictEqual(data[1], 255);
      assert.strictEqual(data[2], 77);
      assert.strictEqual(data[3], 179);

      data = layer.getData([76, 118]);
      assert.instanceOf(data, Uint8ClampedArray);
      assert.strictEqual(data.length, 4);
      assert.strictEqual(data[0], 255);
      assert.strictEqual(data[1], 77);
      assert.strictEqual(data[2], 77);
      assert.strictEqual(data[3], 179);

      data = layer.getData([80, 114]);
      assert.instanceOf(data, Uint8ClampedArray);
      assert.strictEqual(data.length, 4);
      assert.strictEqual(data[0], 255);
      assert.strictEqual(data[1], 77);
      assert.strictEqual(data[2], 77);
      assert.strictEqual(data[3], 179);

      data = layer.getData([80, 118]);
      assert.instanceOf(data, Uint8ClampedArray);
      assert.strictEqual(data.length, 4);
      assert.strictEqual(data[0], 77);
      assert.strictEqual(data[1], 255);
      assert.strictEqual(data[2], 77);
      assert.strictEqual(data[3], 179);
    });
  });

  describe('dispose()', () => {
    it('calls dispose on the renderer', () => {
      const renderer = layer.getRenderer();
      const spy = vi.spyOn(renderer, 'dispose');
      layer.dispose();
      assert.isAbove(spy.mock.calls.length, 0);
    });
  });

  it('creates fragment and vertex shaders', function () {
    const compileShaderSpy = vi.spyOn(WebGLHelper.prototype, 'compileShader');
    const renderer = layer.getRenderer();
    const viewState = map.getView().getState();
    const size = map.getSize();
    const frameState = {
      viewState: viewState,
      extent: getForViewAndSize(
        viewState.center,
        viewState.resolution,
        viewState.rotation,
        size,
      ),
      layerStatesArray: map.getLayerGroup().getLayerStatesArray(),
      layerIndex: 0,
    };
    renderer.prepareFrame(frameState);
    assert.strictEqual(compileShaderSpy.mock.calls.length, 2);
    assert.strictEqual(
      compileShaderSpy.mock.calls[0][0].replace(/[ \n]+/g, ' '),
      `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    varying vec2 v_textureCoord;
    varying vec2 v_localMapCoord;

    uniform vec4 u_renderExtent;
    uniform float u_transitionAlpha;
    uniform float u_texturePixelWidth;
    uniform float u_texturePixelHeight;
    uniform float u_resolution;
    uniform float u_zoom;
    uniform float u_var_r;
    uniform float u_var_g;
    uniform float u_var_b;
    uniform sampler2D u_tileTextures[1];

    void main() {
      if (
        v_localMapCoord[0] < u_renderExtent[0] ||
        v_localMapCoord[1] < u_renderExtent[1] ||
        v_localMapCoord[0] > u_renderExtent[2] ||
        v_localMapCoord[1] > u_renderExtent[3]
      ) {
        discard;
      }
      vec4 color = texture2D(u_tileTextures[0], v_textureCoord);
      color = vec4(u_var_r / 255.0, u_var_g / 255.0, u_var_b / 255.0, 1.0);
      gl_FragColor = color;
      gl_FragColor.rgb *= gl_FragColor.a;
      gl_FragColor *= u_transitionAlpha;
    }`.replace(/[ \n]+/g, ' '),
    );

    assert.strictEqual(
      compileShaderSpy.mock.calls[1][0].replace(/[ \n]+/g, ' '),
      `
    attribute vec2 a_textureCoord;
    uniform mat4 u_tileTransform;
    uniform float u_texturePixelWidth;
    uniform float u_texturePixelHeight;
    uniform float u_textureResolution;
    uniform float u_depth;

    varying vec2 v_textureCoord;
    varying vec2 v_localMapCoord;

    void main() {
      v_textureCoord = a_textureCoord;
      v_localMapCoord = vec2(
        u_texturePixelWidth * u_textureResolution * v_textureCoord[0],
        -1. * u_texturePixelHeight * u_textureResolution * v_textureCoord[1]
      );
      gl_Position = u_tileTransform * vec4(a_textureCoord, u_depth, 1.0);
    }
    `.replace(/[ \n]+/g, ' '),
    );
    compileShaderSpy.mockRestore();
  });

  it('adds a getBandValue function to the fragment shaders', function () {
    const max = 3000;
    function normalize(value) {
      return ['/', value, max];
    }

    const red = normalize(['band', 1]);
    const green = normalize(['band', 2]);
    const nir = normalize(['band', 4]);

    layer.setStyle({
      color: ['array', nir, red, green, 1],
    });

    const compileShaderSpy = vi.spyOn(WebGLHelper.prototype, 'compileShader');
    const renderer = layer.getRenderer();
    const viewState = map.getView().getState();
    const size = map.getSize();
    const frameState = {
      viewState: viewState,
      extent: getForViewAndSize(
        viewState.center,
        viewState.resolution,
        viewState.rotation,
        size,
      ),
      layerStatesArray: map.getLayerGroup().getLayerStatesArray(),
      layerIndex: 0,
    };
    renderer.prepareFrame(frameState);
    assert.strictEqual(compileShaderSpy.mock.calls.length, 2);
    assert.strictEqual(
      compileShaderSpy.mock.calls[0][0].replace(/[ \n]+/g, ' '),
      `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif varying vec2 v_textureCoord;

    varying vec2 v_localMapCoord;

    uniform vec4 u_renderExtent;
    uniform float u_transitionAlpha;
    uniform float u_texturePixelWidth;
    uniform float u_texturePixelHeight;
    uniform float u_resolution;
    uniform float u_zoom;
    uniform sampler2D u_tileTextures[1];

    float getBandValue(float band, float xOffset, float yOffset) {
      float dx = xOffset / u_texturePixelWidth;
      float dy = yOffset / u_texturePixelHeight;
      if (band == 1.0) {
        return texture2D(u_tileTextures[0], v_textureCoord + vec2(dx, dy))[0];
      }
      if (band == 2.0) {
        return texture2D(u_tileTextures[0], v_textureCoord + vec2(dx, dy))[1];
      }
      if (band == 3.0) {
        return texture2D(u_tileTextures[0], v_textureCoord + vec2(dx, dy))[2];
      }
      if (band == 4.0) {
        return texture2D(u_tileTextures[0], v_textureCoord + vec2(dx, dy))[3];
      }
    }

    void main() {
      if (
        v_localMapCoord[0] < u_renderExtent[0] ||
        v_localMapCoord[1] < u_renderExtent[1] ||
        v_localMapCoord[0] > u_renderExtent[2] ||
        v_localMapCoord[1] > u_renderExtent[3]
      ) {
        discard;
      }
      vec4 color = texture2D(u_tileTextures[0], v_textureCoord);
      color = vec4((getBandValue(4.0, 0.0, 0.0) / 3000.0), (getBandValue(1.0, 0.0, 0.0) / 3000.0), (getBandValue(2.0, 0.0, 0.0) / 3000.0), 1.0);
      gl_FragColor = color;
      gl_FragColor.rgb *= gl_FragColor.a;
      gl_FragColor *= u_transitionAlpha;
    }`.replace(/[ \n]+/g, ' '),
    );
    compileShaderSpy.mockRestore();
  });

  describe('updateStyleVariables()', function () {
    it('updates style variables', () =>
      new Promise((resolve) => {
        layer.updateStyleVariables({
          r: 255,
          g: 0,
          b: 255,
        });
        assert.strictEqual(layer.styleVariables_['r'], 255);
        const targetContext = createCanvasContext2D(100, 100);
        layer.on('postrender', () => {
          targetContext.clearRect(0, 0, 100, 100);
          targetContext.drawImage(target.querySelector('.testlayer'), 0, 0);
        });
        map.once('rendercomplete', () => {
          assert.deepEqual(
            Array.from(targetContext.getImageData(0, 0, 1, 1).data),
            [255, 0, 255, 255],
          );
          resolve();
        });
      }));

    it('can be called before the layer is rendered', function () {
      layer = new WebGLTileLayer({
        style: {
          variables: {
            foo: 'bar',
          },
        },
        source: new DataTileSource({
          loader(z, x, y) {
            return new Promise((resolve) => {
              resolve(new ImageData(256, 256).data);
            });
          },
        }),
      });

      layer.updateStyleVariables({foo: 'bam'});
      assert.strictEqual(layer.styleVariables_.foo, 'bam');
    });

    it('can be called even if no initial variables are provided', function () {
      const layer = new WebGLTileLayer({
        source: new DataTileSource({
          loader(z, x, y) {
            return new Promise((resolve) => {
              resolve(new ImageData(256, 256).data);
            });
          },
        }),
      });

      layer.updateStyleVariables({foo: 'bam'});
      assert.strictEqual(layer.styleVariables_.foo, 'bam');
    });

    it('also works after setStyle()', () =>
      new Promise((resolve) => {
        const layer = new WebGLTileLayer({
          className: 'testlayer2',
          source: new DataTileSource({
            loader(z, x, y) {
              return new Promise((resolve) => {
                resolve(new ImageData(256, 256).data);
              });
            },
          }),
        });

        map.addLayer(layer);
        layer.setStyle({
          variables: {
            r: 0,
            g: 255,
            b: 0,
          },
          color: ['color', ['var', 'r'], ['var', 'g'], ['var', 'b']],
        });
        map.renderSync();

        layer.updateStyleVariables({
          r: 255,
          g: 0,
          b: 255,
        });

        assert.strictEqual(layer.styleVariables_['r'], 255);
        const targetContext = createCanvasContext2D(100, 100);
        layer.on('postrender', () => {
          targetContext.clearRect(0, 0, 100, 100);
          targetContext.drawImage(target.querySelector('.testlayer2'), 0, 0);
        });
        map.once('rendercomplete', () => {
          assert.deepEqual(
            Array.from(targetContext.getImageData(0, 0, 1, 1).data),
            [255, 0, 255, 255],
          );
          resolve();
        });
      }));
  });

  describe('multiple sources', () => {
    it('can determine the correct band count for static sources array', () => {
      const layer = new WebGLTileLayer({
        sources: [
          new DataTileSource({
            bandCount: 7,
          }),
        ],
      });
      assert.strictEqual(layer.getSourceBandCount_(), 7);
    });
    it('can determine the correct band count for sources function', () => {
      const layer = new WebGLTileLayer({
        sources: sourcesFromTileGrid(
          createXYZ(),
          ([z, x, y]) =>
            new DataTileSource({
              bandCount: 7,
            }),
        ),
      });
      assert.strictEqual(layer.getSourceBandCount_(), 7);
    });
  });

  describe('nodata band index', () => {
    it('generates getBandValue and discard for source with nodataBandIndex', function () {
      const source = new DataTileSource({
        bandCount: 4,
        loader(z, x, y) {
          return new Float32Array(256 * 256 * 4);
        },
      });
      source.nodataBandIndex = 4;

      const nodataLayer = new WebGLTileLayer({
        source: source,
        style: {
          color: ['color', 128, 128, 128],
        },
      });

      map.addLayer(nodataLayer);

      const compileShaderSpy = vi.spyOn(WebGLHelper.prototype, 'compileShader');
      const renderer = nodataLayer.getRenderer();
      const viewState = map.getView().getState();
      const size = map.getSize();
      const frameState = {
        viewState: viewState,
        extent: getForViewAndSize(
          viewState.center,
          viewState.resolution,
          viewState.rotation,
          size,
        ),
        layerStatesArray: map.getLayerGroup().getLayerStatesArray(),
        layerIndex: 0,
      };
      renderer.prepareFrame(frameState);

      const fragmentShader = compileShaderSpy.mock.calls[0][0];
      assert.include(fragmentShader, 'getBandValue');
      assert.include(
        fragmentShader,
        'if (getBandValue(4.0, 0.0, 0.0) == 0.0) { discard; }',
      );
      compileShaderSpy.mockRestore();

      nodataLayer.dispose();
    });

    it('uses the nodata band for default alpha when it is outside the first texture', function () {
      const source = new DataTileSource({
        bandCount: 5,
        loader(z, x, y) {
          return new Float32Array(256 * 256 * 5);
        },
      });
      source.nodataBandIndex = 5;

      const nodataLayer = new WebGLTileLayer({
        source: source,
      });

      map.addLayer(nodataLayer);

      const compileShaderSpy = vi.spyOn(WebGLHelper.prototype, 'compileShader');
      const renderer = nodataLayer.getRenderer();
      const viewState = map.getView().getState();
      const size = map.getSize();
      const frameState = {
        viewState: viewState,
        extent: getForViewAndSize(
          viewState.center,
          viewState.resolution,
          viewState.rotation,
          size,
        ),
        layerStatesArray: map.getLayerGroup().getLayerStatesArray(),
        layerIndex: 0,
      };
      renderer.prepareFrame(frameState);

      const fragmentShader = compileShaderSpy.mock.calls[0][0];
      assert.include(fragmentShader, 'color.a = getBandValue(5.0, 0.0, 0.0);');
      assert.include(
        fragmentShader,
        'if (getBandValue(5.0, 0.0, 0.0) == 0.0) { discard; }',
      );
      compileShaderSpy.mockRestore();

      nodataLayer.dispose();
    });

    it('does not add discard when source has no nodataBandIndex', function () {
      const source = new DataTileSource({
        bandCount: 3,
        loader(z, x, y) {
          return new Float32Array(256 * 256 * 3);
        },
      });

      const normalLayer = new WebGLTileLayer({
        source: source,
        style: {
          color: ['color', 128, 128, 128],
        },
      });

      map.addLayer(normalLayer);

      const compileShaderSpy = vi.spyOn(WebGLHelper.prototype, 'compileShader');
      const renderer = normalLayer.getRenderer();
      const viewState = map.getView().getState();
      const size = map.getSize();
      const frameState = {
        viewState: viewState,
        extent: getForViewAndSize(
          viewState.center,
          viewState.resolution,
          viewState.rotation,
          size,
        ),
        layerStatesArray: map.getLayerGroup().getLayerStatesArray(),
        layerIndex: 0,
      };
      renderer.prepareFrame(frameState);

      const fragmentShader = compileShaderSpy.mock.calls[0][0];
      assert.notInclude(fragmentShader, 'getBandValue(4.0, 0.0, 0.0) == 0.0');
      compileShaderSpy.mockRestore();

      normalLayer.dispose();
    });

    it('uses existing getBandValue when style has band expressions', function () {
      const source = new DataTileSource({
        bandCount: 4,
        loader(z, x, y) {
          return new Float32Array(256 * 256 * 4);
        },
      });
      source.nodataBandIndex = 4;

      const nodataLayer = new WebGLTileLayer({
        source: source,
        style: {
          color: [
            'array',
            ['/', ['band', 1], 3000],
            ['/', ['band', 2], 3000],
            ['/', ['band', 3], 3000],
            1,
          ],
        },
      });

      map.addLayer(nodataLayer);

      const compileShaderSpy = vi.spyOn(WebGLHelper.prototype, 'compileShader');
      const renderer = nodataLayer.getRenderer();
      const viewState = map.getView().getState();
      const size = map.getSize();
      const frameState = {
        viewState: viewState,
        extent: getForViewAndSize(
          viewState.center,
          viewState.resolution,
          viewState.rotation,
          size,
        ),
        layerStatesArray: map.getLayerGroup().getLayerStatesArray(),
        layerIndex: 0,
      };
      renderer.prepareFrame(frameState);

      const fragmentShader = compileShaderSpy.mock.calls[0][0];
      assert.include(fragmentShader, 'getBandValue');
      assert.include(
        fragmentShader,
        'if (getBandValue(4.0, 0.0, 0.0) == 0.0) { discard; }',
      );
      // getBandValue should only be defined once
      const matches = fragmentShader.match(/float getBandValue\(float band/g);
      assert.strictEqual(matches.length, 1);
      compileShaderSpy.mockRestore();

      nodataLayer.dispose();
    });

    it('returns nodataBandIndex from the source', () => {
      const source = new DataTileSource({
        bandCount: 4,
      });
      source.nodataBandIndex = 4;

      const testLayer = new WebGLTileLayer({source: source});
      assert.strictEqual(testLayer.getSourceNodataBandIndex_(), 4);
      testLayer.dispose();
    });

    it('returns undefined when source has no nodataBandIndex', () => {
      const testLayer = new WebGLTileLayer({
        source: new DataTileSource({bandCount: 3}),
      });
      assert.strictEqual(testLayer.getSourceNodataBandIndex_(), undefined);
      testLayer.dispose();
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

  it('throws on incorrect style configs', function () {
    function incorrectStyle() {
      layer.style_ = {
        variables: {
          'red': 25,
          'green': 200,
        },
        exposure: 0,
        contrast: 0,
        saturation: 0,
        color: ['color', ['var', 'red'], ['var', 'green'], ['var', 'blue']],
      };
      layer.createRenderer();
    }
    assert.throws(incorrectStyle);
  });

  it('works if the layer is constructed without a source', () =>
    new Promise((resolve) => {
      const sourceless = new WebGLTileLayer({
        className: 'testlayer',
        style: {
          variables: {
            r: 0,
            g: 255,
            b: 0,
          },
          color: ['color', ['var', 'r'], ['var', 'g'], ['var', 'b']],
        },
      });

      map.addLayer(sourceless);

      sourceless.setSource(
        new DataTileSource({
          loader(z, x, y) {
            return new ImageData(256, 256).data;
          },
        }),
      );

      let called = false;
      layer.on('postrender', (event) => {
        called = true;
      });

      map.once('rendercomplete', () => {
        assert.strictEqual(called, true);
        resolve();
      });
    }));

  it('handles multiple sources correctly', () => {
    const source = layer.getSource();
    assert.strictEqual(layer.getRenderSource(), source);
    layer.sources_ = (extent, resolution) => {
      return [
        {
          getState: () => 'ready',
          extent,
          resolution,
          id: 'source1',
        },
        {
          getState: () => 'ready',
          extent,
          resolution,
          id: 'source2',
        },
      ];
    };
    const sourceIds = [];
    layer.getRenderer().prepareFrame = (frameState) => {
      const renderedSource = layer.getRenderSource();
      assert.deepEqual(renderedSource.extent, [0, 0, 100, 100]);
      assert.strictEqual(renderedSource.resolution, 1);
      sourceIds.push(renderedSource.id);
    };
    layer.render({
      extent: [0, 0, 100, 100],
      viewState: {resolution: 1},
    });
    assert.deepEqual(sourceIds, ['source1', 'source2']);
  });
});
