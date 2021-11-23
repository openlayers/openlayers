import DataTileSource from '../../../../../src/ol/source/DataTile.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import WebGLHelper from '../../../../../src/ol/webgl/Helper.js';
import WebGLTileLayer from '../../../../../src/ol/layer/WebGLTile.js';
import {createCanvasContext2D} from '../../../../../src/ol/dom.js';
import {getForViewAndSize} from '../../../../../src/ol/extent.js';
import {getRenderPixel} from '../../../../../src/ol/render.js';

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
            resolve(new ImageData(256, 256));
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
  });

  describe('dispose()', () => {
    it('calls dispose on the renderer', () => {
      const renderer = layer.getRenderer();
      const spy = sinon.spy(renderer, 'dispose');
      layer.dispose();
      expect(spy.called).to.be(true);
    });
  });

  it('creates fragment and vertex shaders', function () {
    const compileShaderSpy = sinon.spy(WebGLHelper.prototype, 'compileShader');
    const renderer = layer.createRenderer();
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
      uniform float u_transitionAlpha;
      uniform float u_texturePixelWidth;
      uniform float u_texturePixelHeight;
      uniform float u_resolution;
      uniform float u_zoom;
      uniform float u_var_r;
      uniform float u_var_g;
      uniform float u_var_b;
      uniform sampler2D u_tileTexture0;
      void main() {
        vec4 color0 = texture2D(u_tileTexture0, v_textureCoord);
        vec4 color = color0;
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
      uniform float u_depth;

      varying vec2 v_textureCoord;
      void main() {
        v_textureCoord = a_textureCoord;
        gl_Position = u_tileTransform * vec4(a_textureCoord, u_depth, 1.0);
      }
      `.replace(/[ \n]+/g, ' ')
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
      const layer = new WebGLTileLayer({
        style: {
          variables: {
            foo: 'bar',
          },
        },
        source: new DataTileSource({
          loader(z, x, y) {
            return new Promise((resolve) => {
              resolve(new ImageData(256, 256));
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
              resolve(new ImageData(256, 256));
            });
          },
        }),
      });

      layer.updateStyleVariables({foo: 'bam'});
      expect(layer.styleVariables_.foo).to.be('bam');
    });
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
});
