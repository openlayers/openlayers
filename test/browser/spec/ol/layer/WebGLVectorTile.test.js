import {spy as sinonSpy} from 'sinon';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import WebGLVectorTileLayer from '../../../../../src/ol/layer/WebGLVectorTile.js';
import {getRenderPixel} from '../../../../../src/ol/render.js';
import WebGLVectorTileLayerRenderer from '../../../../../src/ol/renderer/webgl/VectorTileLayer.js';
import VectorTileSource from '../../../../../src/ol/source/VectorTile.js';

describe('ol/layer/WebGLVectorTile', function () {
  /** @type {WebGLVectorTileLayer} */
  let layer;
  /** @type {Map} */
  let map, target;

  beforeEach(function (done) {
    layer = new WebGLVectorTileLayer({
      className: 'testlayer',
      source: new VectorTileSource({}),
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
      cacheSize: 150,
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
    disposeMap(map);
    map.getLayers().forEach((layer) => layer.dispose());
  });

  describe('dispose()', () => {
    it('calls dispose on the renderer', () => {
      const renderer = layer.getRenderer();
      const spy = sinonSpy(renderer, 'dispose');
      layer.dispose();
      expect(spy.called).to.be(true);
    });
  });

  it('creates a renderer with the given parameters', function () {
    const renderer = layer.getRenderer();
    expect(renderer).to.be.a(WebGLVectorTileLayerRenderer);
    expect(renderer.style_).to.eql([
      {
        'circle-radius': 4,
        'circle-fill-color': ['var', 'fillColor'],
      },
      {
        'fill-color': ['var', 'fillColor'],
      },
    ]);
    expect(renderer.styleVariables_).to.eql({
      fillColor: 'rgba(255, 0, 0, 0.5)',
    });
    expect(renderer.hitDetectionEnabled_).to.be(true);
    expect(renderer.tileRepresentationCache.highWaterMark).to.be(150);
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
      expect(layer.style_).to.eql(newStyle);
    });

    it('disposes of the previous renderer', function () {
      const renderer = layer.getRenderer();
      const spy = sinonSpy(renderer, 'dispose');
      layer.setStyle({});
      expect(spy.called).to.be(true);
    });
  });

  describe('updateStyleVariables()', function () {
    it('updates style variables', function () {
      layer.updateStyleVariables({
        fillColor: 'yellow',
      });
      expect(layer.styleVariables_['fillColor']).to.be('yellow');
      const renderer = layer.getRenderer();
      const uniforms = renderer.styleRenderer_.uniforms_;
      expect(uniforms.u_var_fillColor()).to.eql([1, 1, 0, 1]);
    });

    it('can be called before the layer is rendered', function () {
      layer = new WebGLVectorTileLayer({
        style: {
          'fill-color': ['var', 'fillColor'],
        },
        source: new VectorTileSource({}),
      });

      layer.updateStyleVariables({foo: 'bam'});
      expect(layer.styleVariables_.foo).to.be('bam');
    });

    it('can be called even if no initial variables are provided', function () {
      const layer = new WebGLVectorTileLayer({
        source: new VectorTileSource({}),
      });

      layer.updateStyleVariables({foo: 'bam'});
      expect(layer.styleVariables_.foo).to.be('bam');
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

  it('works if the layer is constructed without a source', (done) => {
    const sourceless = new WebGLVectorTileLayer({
      className: 'testlayer',
      style: {
        'fill-color': 'red',
      },
    });

    map.addLayer(sourceless);

    sourceless.setSource(new VectorTileSource({}));

    let called = false;
    layer.on('postrender', (event) => {
      called = true;
    });

    map.once('rendercomplete', () => {
      expect(called).to.be(true);
      done();
    });
  });
});
