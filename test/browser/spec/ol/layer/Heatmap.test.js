import {spy as sinonSpy} from 'sinon';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import Point from '../../../../../src/ol/geom/Point.js';
import HeatmapLayer from '../../../../../src/ol/layer/Heatmap.js';
import * as ol_renderer_webgl_vectorlayer from '../../../../../src/ol/renderer/webgl/VectorLayer.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';

describe('ol/layer/Heatmap', function () {
  /** @type {HTMLDivElement} */
  let target;
  /** @type {Map} */
  let map;
  /** @type {HeatmapLayer} */
  let layer;
  beforeEach(() => {
    target = document.createElement('div');
    target.style.width = '300px';
    target.style.height = '300px';
    document.body.appendChild(target);

    map = new Map({
      view: new View({
        center: [0, 0],
        resolution: 0.1,
      }),
      target: target,
    });
  });

  afterEach(() => {
    disposeMap(map);
    layer.dispose();
  });

  let rendererSpy;
  beforeEach(() => {
    rendererSpy = sinonSpy(ol_renderer_webgl_vectorlayer, 'default');
  });
  afterEach(() => {
    rendererSpy.restore();
  });

  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      layer = new HeatmapLayer();
      expect(layer).to.be.an(HeatmapLayer);
    });

    it('has a default className', function () {
      layer = new HeatmapLayer({
        source: new VectorSource(),
      });
      map.addLayer(layer);
      map.renderSync();

      const canvas = layer.getRenderer().helper.getCanvas();
      expect(canvas.className).to.eql('ol-layer');
    });

    it('accepts a custom className', function () {
      layer = new HeatmapLayer({
        source: new VectorSource(),
        className: 'a-class-name',
      });
      map.addLayer(layer);
      map.renderSync();

      const canvas = layer.getRenderer().helper.getCanvas();
      expect(canvas.className).to.eql('a-class-name');
    });
  });

  describe('setBlur', () => {
    beforeEach(() => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
      });
    });
    it('default value', () => {
      expect(layer.getBlur()).to.eql(15);
    });
    it('updates blur value', () => {
      layer.setBlur(['get', 'weight']);
      expect(layer.getBlur()).to.eql(['get', 'weight']);
    });
    it('recreates the renderer', () => {
      sinonSpy(layer, 'createRenderer');
      layer.setBlur(['get', 'weight']);
      layer.getRenderer();
      expect(layer.createRenderer.calledOnce).to.be(true);
    });

    describe('numerical value', () => {
      it('adds a uniform which reads the numerical value', () => {
        layer.setBlur(12);
        layer.getRenderer();
        const rendererOpts = rendererSpy.getCall(0).args[1];
        const uniforms = rendererOpts.style.uniforms;
        expect(uniforms).to.have.key('a_blur');
        expect(uniforms.a_blur()).to.eql(12);
      });
      it('does not recreate the renderer if called several times with a numerical value', () => {
        sinonSpy(layer, 'createRenderer');
        layer.setBlur(12);
        layer.setBlur(17);
        layer.setBlur(20);
        layer.getRenderer();
        expect(layer.createRenderer.callCount).to.be(1);
      });
    });
  });

  describe('setRadius', () => {
    beforeEach(() => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
      });
    });
    it('default value', () => {
      expect(layer.getRadius()).to.eql(8);
    });
    it('updates blur value', () => {
      layer.setRadius(['get', 'size']);
      expect(layer.getRadius()).to.eql(['get', 'size']);
    });
    it('recreates the renderer', () => {
      sinonSpy(layer, 'createRenderer');
      layer.setRadius(['get', 'size']);
      layer.getRenderer();
      expect(layer.createRenderer.calledOnce).to.be(true);
    });

    describe('numerical value', () => {
      it('adds a uniform which reads the numerical value', () => {
        layer.setRadius(12);
        layer.getRenderer();
        const rendererOpts = rendererSpy.getCall(0).args[1];
        const uniforms = rendererOpts.style.uniforms;
        expect(uniforms).to.have.key('a_radius');
        expect(uniforms.a_radius()).to.eql(12);
      });
      it('does not recreate the renderer if called several times with a numerical value', () => {
        sinonSpy(layer, 'createRenderer');
        layer.setRadius(12);
        layer.setRadius(17);
        layer.setRadius(20);
        layer.getRenderer();
        expect(layer.createRenderer.callCount).to.be(1);
      });
    });
  });

  describe('weight', () => {
    it('default value', () => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
      });
      expect(layer.weight_).to.eql('weight');
    });
    it('supports an attribute name as weight', () => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
        weight: 'foo',
      });
      layer.getRenderer();

      const rendererOpts = rendererSpy.getCall(0).args[1];
      const attrs = rendererOpts.style.attributes;
      expect(attrs).to.have.key('prop_weight');

      const attrCallback = attrs['prop_weight'].callback;
      const feature = new Feature({foo: 0.5});
      expect(attrCallback(feature)).to.eql(0.5);

      const builder = rendererOpts.style.builder;
      // weight expression is clamped between 0 and 1
      expect(builder.getSymbolColorExpression()).to.eql(
        'vec4(smoothstep(0., 1., (1. - length(coordsPx * 2. / v_quadSizePx)) * getBlurSlope()) * a_prop_weight)',
      );
    });
    it('supports a function as weight', () => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
        weight: (feature) => feature.get('size') - 3,
      });
      layer.getRenderer();

      const rendererOpts = rendererSpy.getCall(0).args[1];
      const attrs = rendererOpts.style.attributes;
      expect(attrs).to.have.key('prop_weight');

      const attrCallback = attrs['prop_weight'].callback;
      const feature = new Feature({size: 3.75});
      expect(attrCallback(feature)).to.eql(0.75);

      const builder = rendererOpts.style.builder;
      expect(builder.getSymbolColorExpression()).to.eql(
        'vec4(smoothstep(0., 1., (1. - length(coordsPx * 2. / v_quadSizePx)) * getBlurSlope()) * a_prop_weight)',
      );
    });
    it('supports an expression as weight', () => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
        weight: ['/', ['get', 'sizeAttr'], 10],
      });
      layer.getRenderer();

      const rendererOpts = rendererSpy.getCall(0).args[1];
      const attrs = rendererOpts.style.attributes;
      expect(attrs).to.have.key('prop_sizeAttr');

      const attrCallback = attrs['prop_sizeAttr'].callback;
      const feature = new Feature({sizeAttr: 34});
      expect(attrCallback(feature)).to.eql(34);

      const builder = rendererOpts.style.builder;
      // weight expression is clamped between 0 and 1
      expect(builder.getSymbolColorExpression()).to.eql(
        'vec4(smoothstep(0., 1., (1. - length(coordsPx * 2. / v_quadSizePx)) * getBlurSlope()) * clamp((a_prop_sizeAttr / 10.0), 0.0, 1.0))',
      );
    });
    describe('setWeight', () => {
      beforeEach(() => {
        layer = new HeatmapLayer({
          source: new VectorSource(),
          weight: ['get', 'prop'],
        });
      });
      it('updates weight value', () => {
        layer.setWeight('bla');
        expect(layer.weight_).to.eql('bla');
      });
      it('recreates the renderer', () => {
        sinonSpy(layer, 'createRenderer');
        layer.setWeight('bla');
        layer.getRenderer();
        expect(layer.createRenderer.calledOnce).to.be(true);
      });
    });
  });

  describe('filter', () => {
    beforeEach(() => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
      });
    });
    it('is applied as a fragment filter if provided', () => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
        filter: ['>', ['get', 'sizeAttr'], 10],
      });
      layer.getRenderer();

      const rendererOpts = rendererSpy.getCall(0).args[1];
      const attrs = rendererOpts.style.attributes;
      expect(attrs).to.have.key('prop_sizeAttr');

      const builder = rendererOpts.style.builder;
      expect(builder.getFragmentDiscardExpression()).to.eql(
        '!(a_prop_sizeAttr > 10.0)',
      );
    });
    describe('setFilter', () => {
      it('updates filter value', () => {
        const filter = ['==', ['get', 'type'], 'foo'];
        layer.setFilter(filter);
        expect(layer.filter_).to.eql(filter);
      });
      it('recreates the renderer', () => {
        sinonSpy(layer, 'createRenderer');
        layer.setFilter(true);
        layer.getRenderer();
        expect(layer.createRenderer.calledOnce).to.be(true);
      });
    });
  });

  describe('hit detection', function () {
    it('hit detects two distinct features', function (done) {
      const feature = new Feature({
        geometry: new Point([0, 0]),
        id: 1,
        weight: 10,
      });
      const feature2 = new Feature({
        geometry: new Point([14, 14]),
        id: 2,
        weight: 10,
      });
      const feature3 = new Feature({
        geometry: new LineString([
          [-5, 10],
          [5, 10],
        ]),
        id: 3,
        weight: 10,
      });

      const source = new VectorSource({
        features: [feature, feature2, feature3],
      });
      layer = new HeatmapLayer({
        source: source,
        blur: 10,
        radius: 10,
      });
      map.addLayer(layer);
      map.render();

      function hitTest(coordinate) {
        const features = map.getFeaturesAtPixel(
          map.getPixelFromCoordinate(coordinate),
        );
        return features.length ? features[0] : null;
      }

      layer.once('change', () => {
        map.renderSync();
        let res;
        res = hitTest([0, 0]);
        expect(res).to.be(feature);
        res = hitTest([20, 0]);
        expect(res).to.be(null);
        res = hitTest([14, 14]);
        expect(res).to.be(feature2);
        res = hitTest([0, 14]);
        expect(res).to.be(null);
        res = hitTest([-3, 10]);
        expect(res).to.be(feature3);
        res = hitTest([3, 7]);
        expect(res).to.be(null);
        done();
      });
    });
  });

  describe('updateStyleVariables()', function () {
    it('updates style variables', function () {
      layer = new HeatmapLayer({
        source: new VectorSource(),
        variables: {
          foo: 'bar',
        },
      });

      layer.updateStyleVariables({foo: 'bam'});
      expect(layer.styleVariables_.foo).to.be('bam');
    });
    it('can be called even if no initial variables are provided', function () {
      const layer = new HeatmapLayer({
        source: new VectorSource(),
      });

      layer.updateStyleVariables({foo: 'bam'});
      expect(layer.styleVariables_.foo).to.be('bam');
    });
  });
});
