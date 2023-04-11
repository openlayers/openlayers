import DataTileSource from '../../../../../src/ol/source/DataTile.js';
import Map from '../../../../../src/ol/Map.js';
import OSM from '../../../../../src/ol/source/OSM.js';
import TileWMS from '../../../../../src/ol/source/TileWMS.js';
import View from '../../../../../src/ol/View.js';
import WebGLHelper from '../../../../../src/ol/webgl/Helper.js';
import WebGLTileLayer from '../../../../../src/ol/layer/WebGLTile.js';
import {createCanvasContext2D} from '../../../../../src/ol/dom.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';
import {getForViewAndSize} from '../../../../../src/ol/extent.js';
import {getRenderPixel} from '../../../../../src/ol/render.js';
import {sourcesFromTileGrid} from '../../../../../src/ol/source.js';

describe('ol/layer/WebGLTile', function () {
  /** @type {WebGLTileLayer} */
  let layer;
  /** @type {Map} */
  let map, target;

  beforeEach(function (done) {
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
    map.once('rendercomplete', () => done());
  });

  afterEach(function () {
    map.setTarget(null);
    document.body.removeChild(target);
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
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('retrieves pixel data', (done) => {
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
        expect(data).to.be.a(Uint8Array);
        expect(data.length).to.be(5);
        expect(data[0]).to.be(5);
        expect(data[1]).to.be(4);
        expect(data[2]).to.be(3);
        expect(data[3]).to.be(2);
        expect(data[4]).to.be(1);
        done();
      });
    });

    it('retrieves pixel data from pyramid', (done) => {
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
            })
        ),
      });

      map.addLayer(layer);

      map.once('rendercomplete', () => {
        let data;
        data = layer.getData([25, 25]);
        expect(data).to.be.a(Uint8Array);
        expect(data.length).to.be(4);
        expect(data[0]).to.be(0);
        expect(data[1]).to.be(0);
        expect(data[2]).to.be(1);
        expect(data[3]).to.be(1);
        data = layer.getData([75, 25]);
        expect(data).to.be.a(Uint8Array);
        expect(data.length).to.be(4);
        expect(data[0]).to.be(1);
        expect(data[1]).to.be(0);
        expect(data[2]).to.be(0);
        expect(data[3]).to.be(1);
        data = layer.getData([25, 75]);
        expect(data).to.be.a(Uint8Array);
        expect(data.length).to.be(4);
        expect(data[0]).to.be(0);
        expect(data[1]).to.be(1);
        expect(data[2]).to.be(1);
        expect(data[3]).to.be(0);
        data = layer.getData([75, 75]);
        expect(data).to.be.a(Uint8Array);
        expect(data.length).to.be(4);
        expect(data[0]).to.be(1);
        expect(data[1]).to.be(1);
        expect(data[2]).to.be(0);
        expect(data[3]).to.be(0);
        done();
      });
    });

    it('preserves the original data type', (done) => {
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
        expect(data).to.be.a(Float32Array);
        expect(data.length).to.be(5);
        expect(data[0]).to.roughlyEqual(1.11, 1e-5);
        expect(data[1]).to.roughlyEqual(2.22, 1e-5);
        expect(data[2]).to.roughlyEqual(3.33, 1e-5);
        expect(data[3]).to.roughlyEqual(4.44, 1e-5);
        expect(data[4]).to.roughlyEqual(5.55, 1e-5);
        done();
      });
    });
  });

  describe('gutter', () => {
    let map, target, layer, data;
    beforeEach((done) => {
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

      map.once('rendercomplete', () => done());
    });

    afterEach(() => {
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('gets pixel data', () => {
      data = layer.getData([76, 114]);
      expect(data).to.be.a(Uint8ClampedArray);
      expect(data.length).to.be(4);
      expect(data[0]).to.be(77);
      expect(data[1]).to.be(255);
      expect(data[2]).to.be(77);
      expect(data[3]).to.be(179);

      data = layer.getData([76, 118]);
      expect(data).to.be.a(Uint8ClampedArray);
      expect(data.length).to.be(4);
      expect(data[0]).to.be(255);
      expect(data[1]).to.be(77);
      expect(data[2]).to.be(77);
      expect(data[3]).to.be(179);

      data = layer.getData([80, 114]);
      expect(data).to.be.a(Uint8ClampedArray);
      expect(data.length).to.be(4);
      expect(data[0]).to.be(255);
      expect(data[1]).to.be(77);
      expect(data[2]).to.be(77);
      expect(data[3]).to.be(179);

      data = layer.getData([80, 118]);
      expect(data).to.be.a(Uint8ClampedArray);
      expect(data.length).to.be(4);
      expect(data[0]).to.be(77);
      expect(data[1]).to.be(255);
      expect(data[2]).to.be(77);
      expect(data[3]).to.be(179);
    });
  });

  describe('dispose()', () => {
    it('calls dispose on the renderer', () => {
      const renderer = layer.getRenderer();
      const spy = sinon.spy(renderer, 'dispose');
      layer.dispose();
      expect(spy.called).to.be(true);
    });
  });

  describe('caching', () => {
    it('updates the size of the tile cache on the source ', (done) => {
      const source = new OSM();
      const spy = sinon.spy(source, 'updateCacheSize');
      const layer = new WebGLTileLayer({source: source});
      map.addLayer(layer);
      map.once('rendercomplete', () => {
        expect(spy.called).to.be(true);
        done();
      });
    });
  });

  it('creates fragment and vertex shaders', function () {
    const compileShaderSpy = sinon.spy(WebGLHelper.prototype, 'compileShader');
    const renderer = layer.getRenderer();
    const viewState = map.getView().getState();
    const size = map.getSize();
    const frameState = {
      viewState: viewState,
      extent: getForViewAndSize(
        viewState.center,
        viewState.resolution,
        viewState.rotation,
        size
      ),
      layerStatesArray: map.getLayerGroup().getLayerStatesArray(),
      layerIndex: 0,
    };
    renderer.prepareFrame(frameState);
    compileShaderSpy.restore();
    expect(compileShaderSpy.callCount).to.be(2);
    expect(compileShaderSpy.getCall(0).args[0].replace(/[ \n]+/g, ' ')).to.be(
      `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif

      varying vec2 v_textureCoord;
      varying vec2 v_mapCoord;

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
          v_mapCoord[0] < u_renderExtent[0] ||
          v_mapCoord[1] < u_renderExtent[1] ||
          v_mapCoord[0] > u_renderExtent[2] ||
          v_mapCoord[1] > u_renderExtent[3]
        ) {
          discard;
        }
        vec4 color = texture2D(u_tileTextures[0], v_textureCoord);
        color = vec4(u_var_r / 255.0, u_var_g / 255.0, u_var_b / 255.0, 1.0);
        if (color.a == 0.0) {
          discard;
        }
        gl_FragColor = color;
        gl_FragColor.rgb *= gl_FragColor.a;
        gl_FragColor *= u_transitionAlpha;
      }`.replace(/[ \n]+/g, ' ')
    );

    expect(compileShaderSpy.getCall(1).args[0].replace(/[ \n]+/g, ' ')).to.be(
      `
      attribute vec2 a_textureCoord;

      uniform mat4 u_tileTransform;
      uniform float u_texturePixelWidth;
      uniform float u_texturePixelHeight;
      uniform float u_textureResolution;
      uniform float u_textureOriginX;
      uniform float u_textureOriginY;
      uniform float u_depth;

      varying vec2 v_textureCoord;
      varying vec2 v_mapCoord;

      void main() {
        v_textureCoord = a_textureCoord;
        v_mapCoord = vec2(
          u_textureOriginX + u_textureResolution * u_texturePixelWidth * v_textureCoord[0],
          u_textureOriginY - u_textureResolution * u_texturePixelHeight * v_textureCoord[1]
        );
        gl_Position = u_tileTransform * vec4(a_textureCoord, u_depth, 1.0);
      }
      `.replace(/[ \n]+/g, ' ')
    );
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

    const compileShaderSpy = sinon.spy(WebGLHelper.prototype, 'compileShader');
    const renderer = layer.getRenderer();
    const viewState = map.getView().getState();
    const size = map.getSize();
    const frameState = {
      viewState: viewState,
      extent: getForViewAndSize(
        viewState.center,
        viewState.resolution,
        viewState.rotation,
        size
      ),
      layerStatesArray: map.getLayerGroup().getLayerStatesArray(),
      layerIndex: 0,
    };
    renderer.prepareFrame(frameState);
    compileShaderSpy.restore();
    expect(compileShaderSpy.callCount).to.be(2);
    expect(compileShaderSpy.getCall(0).args[0].replace(/[ \n]+/g, ' ')).to.be(
      `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif varying vec2 v_textureCoord;

      varying vec2 v_mapCoord;

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
          v_mapCoord[0] < u_renderExtent[0] ||
          v_mapCoord[1] < u_renderExtent[1] ||
          v_mapCoord[0] > u_renderExtent[2] ||
          v_mapCoord[1] > u_renderExtent[3]
        ) {
          discard;
        }
        vec4 color = texture2D(u_tileTextures[0], v_textureCoord);
        color = vec4((getBandValue(4.0, 0.0, 0.0) / 3000.0), (getBandValue(1.0, 0.0, 0.0) / 3000.0), (getBandValue(2.0, 0.0, 0.0) / 3000.0), 1.0);
        if (color.a == 0.0) {
          discard;
        }
        gl_FragColor = color;
        gl_FragColor.rgb *= gl_FragColor.a;
        gl_FragColor *= u_transitionAlpha;
      }`.replace(/[ \n]+/g, ' ')
    );
  });

  describe('updateStyleVariables()', function () {
    it('updates style variables', function (done) {
      layer.updateStyleVariables({
        r: 255,
        g: 0,
        b: 255,
      });
      expect(layer.styleVariables_['r']).to.be(255);
      const targetContext = createCanvasContext2D(100, 100);
      layer.on('postrender', () => {
        targetContext.clearRect(0, 0, 100, 100);
        targetContext.drawImage(target.querySelector('.testlayer'), 0, 0);
      });
      map.once('rendercomplete', () => {
        expect(Array.from(targetContext.getImageData(0, 0, 1, 1).data)).to.eql([
          255, 0, 255, 255,
        ]);
        done();
      });
    });

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
      expect(layer.styleVariables_.foo).to.be('bam');
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
      expect(layer.styleVariables_.foo).to.be('bam');
    });

    it('also works after setStyle()', function (done) {
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

      expect(layer.styleVariables_['r']).to.be(255);
      const targetContext = createCanvasContext2D(100, 100);
      layer.on('postrender', () => {
        targetContext.clearRect(0, 0, 100, 100);
        targetContext.drawImage(target.querySelector('.testlayer2'), 0, 0);
      });
      map.once('rendercomplete', () => {
        expect(Array.from(targetContext.getImageData(0, 0, 1, 1).data)).to.eql([
          255, 0, 255, 255,
        ]);
        done();
      });
    });
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
      expect(layer.getSourceBandCount_()).to.be(7);
    });
    it('can determine the correct band count for sources function', () => {
      const layer = new WebGLTileLayer({
        sources: sourcesFromTileGrid(
          createXYZ(),
          ([z, x, y]) =>
            new DataTileSource({
              bandCount: 7,
            })
        ),
      });
      expect(layer.getSourceBandCount_()).to.be(7);
    });
  });

  it('dispatches a precompose event with WebGL context', (done) => {
    let called = false;
    layer.on('precompose', (event) => {
      expect(event.context).to.be.a(WebGLRenderingContext);
      called = true;
    });

    map.once('rendercomplete', () => {
      expect(called).to.be(true);
      done();
    });

    map.render();
  });

  it('dispatches a prerender event with WebGL context and inverse pixel transform', (done) => {
    let called = false;
    layer.on('prerender', (event) => {
      expect(event.context).to.be.a(WebGLRenderingContext);
      const mapSize = event.frameState.size;
      const bottomLeft = getRenderPixel(event, [0, mapSize[1]]);
      expect(bottomLeft).to.eql([0, 0]);
      called = true;
    });

    map.once('rendercomplete', () => {
      expect(called).to.be(true);
      done();
    });

    map.render();
  });

  it('dispatches a postrender event with WebGL context and inverse pixel transform', (done) => {
    let called = false;
    layer.on('postrender', (event) => {
      expect(event.context).to.be.a(WebGLRenderingContext);
      const mapSize = event.frameState.size;
      const topRight = getRenderPixel(event, [mapSize[1], 0]);
      const pixelRatio = event.frameState.pixelRatio;
      expect(topRight).to.eql([
        mapSize[0] * pixelRatio,
        mapSize[1] * pixelRatio,
      ]);
      called = true;
    });

    map.once('rendercomplete', () => {
      expect(called).to.be(true);
      done();
    });

    map.render();
  });

  it('tries to expire the source tile cache', (done) => {
    const source = layer.getSource();
    const expire = sinon.spy(source, 'expireCache');

    layer.updateStyleVariables({r: 1, g: 2, b: 3});
    map.once('rendercomplete', () => {
      expect(expire.called).to.be(true);
      done();
    });
  });

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
    expect(incorrectStyle).to.throwException(); // missing 'blue' in styleVariables
  });

  it('works if the layer is constructed without a source', (done) => {
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
      })
    );

    let called = false;
    layer.on('postrender', (event) => {
      called = true;
    });

    map.once('rendercomplete', () => {
      expect(called).to.be(true);
      done();
    });
  });

  it('handles multiple sources correctly', () => {
    const source = layer.getSource();
    expect(layer.getRenderSource()).to.be(source);
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
      expect(renderedSource.extent).to.eql([0, 0, 100, 100]);
      expect(renderedSource.resolution).to.be(1);
      sourceIds.push(renderedSource.id);
    };
    layer.render({
      extent: [0, 0, 100, 100],
      viewState: {resolution: 1},
    });
    expect(sourceIds).to.eql(['source1', 'source2']);
  });
});
