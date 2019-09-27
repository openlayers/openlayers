import {assert} from 'chai';
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
      assert.instanceOf(layer, HeatmapLayer);
    });

    it('has a default className', function () {
      layer = new HeatmapLayer({
        source: new VectorSource(),
      });
      map.addLayer(layer);
      map.renderSync();

      const canvas = layer.getRenderer().helper.getCanvas();
      assert.deepEqual(canvas.className, 'ol-layer');
    });

    it('accepts a custom className', function () {
      layer = new HeatmapLayer({
        source: new VectorSource(),
        className: 'a-class-name',
      });
      map.addLayer(layer);
      map.renderSync();

      const canvas = layer.getRenderer().helper.getCanvas();
      assert.deepEqual(canvas.className, 'a-class-name');
    });
  });

  describe('setBlur', () => {
    beforeEach(() => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
      });
    });
    it('default value', () => {
      assert.deepEqual(layer.getBlur(), 15);
    });
    it('updates blur value', () => {
      layer.setBlur(['get', 'weight']);
      assert.deepEqual(layer.getBlur(), ['get', 'weight']);
    });
    it('recreates the renderer', () => {
      sinonSpy(layer, 'createRenderer');
      layer.setBlur(['get', 'weight']);
      layer.getRenderer();
      assert.strictEqual(layer.createRenderer.calledOnce, true);
    });

    describe('numerical value', () => {
      it('adds a uniform which reads the numerical value', () => {
        layer.setBlur(12);
        layer.getRenderer();
        const rendererOpts = rendererSpy.getCall(0).args[1];
        const uniforms = rendererOpts.style.uniforms;
        assert.property(uniforms, 'a_blur');
        assert.deepEqual(uniforms.a_blur(), 12);
      });
      it('does not recreate the renderer if called several times with a numerical value', () => {
        sinonSpy(layer, 'createRenderer');
        layer.setBlur(12);
        layer.setBlur(17);
        layer.setBlur(20);
        layer.getRenderer();
        assert.strictEqual(layer.createRenderer.callCount, 1);
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
      assert.deepEqual(layer.getRadius(), 8);
    });
    it('updates blur value', () => {
      layer.setRadius(['get', 'size']);
      assert.deepEqual(layer.getRadius(), ['get', 'size']);
    });
    it('recreates the renderer', () => {
      sinonSpy(layer, 'createRenderer');
      layer.setRadius(['get', 'size']);
      layer.getRenderer();
      assert.strictEqual(layer.createRenderer.calledOnce, true);
    });

    describe('numerical value', () => {
      it('adds a uniform which reads the numerical value', () => {
        layer.setRadius(12);
        layer.getRenderer();
        const rendererOpts = rendererSpy.getCall(0).args[1];
        const uniforms = rendererOpts.style.uniforms;
        assert.property(uniforms, 'a_radius');
        assert.deepEqual(uniforms.a_radius(), 12);
      });
      it('does not recreate the renderer if called several times with a numerical value', () => {
        sinonSpy(layer, 'createRenderer');
        layer.setRadius(12);
        layer.setRadius(17);
        layer.setRadius(20);
        layer.getRenderer();
        assert.strictEqual(layer.createRenderer.callCount, 1);
      });
    });
  });

  describe('weight', () => {
    it('default value', () => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
      });
      assert.deepEqual(layer.weight_, 'weight');
    });
    it('supports an attribute name as weight', () => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
        weight: 'foo',
      });
      layer.getRenderer();

      const rendererOpts = rendererSpy.getCall(0).args[1];
      const attrs = rendererOpts.style.attributes;
      assert.property(attrs, 'prop_weight');

      const attrCallback = attrs['prop_weight'].callback;
      const feature = new Feature({foo: 0.5});
      assert.deepEqual(attrCallback(feature), 0.5);

      const builder = rendererOpts.style.builder;
      assert.deepEqual(
        builder.getSymbolColorExpression(),
        'vec4(smoothstep(0., 1., (1. - length(coordsPx * 2. / v_quadSizePx)) * (a_radius / max(1., a_blur))) * a_prop_weight)',
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
      assert.property(attrs, 'prop_weight');

      const attrCallback = attrs['prop_weight'].callback;
      const feature = new Feature({size: 3.75});
      assert.deepEqual(attrCallback(feature), 0.75);

      const builder = rendererOpts.style.builder;
      assert.deepEqual(
        builder.getSymbolColorExpression(),
        'vec4(smoothstep(0., 1., (1. - length(coordsPx * 2. / v_quadSizePx)) * (a_radius / max(1., a_blur))) * a_prop_weight)',
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
      assert.property(attrs, 'prop_sizeAttr');

      const attrCallback = attrs['prop_sizeAttr'].callback;
      const feature = new Feature({sizeAttr: 34});
      assert.deepEqual(attrCallback(feature), 34);

      const builder = rendererOpts.style.builder;
      assert.deepEqual(
        builder.getSymbolColorExpression(),
        'vec4(smoothstep(0., 1., (1. - length(coordsPx * 2. / v_quadSizePx)) * (a_radius / max(1., a_blur))) * clamp((a_prop_sizeAttr / 10.0), 0.0, 1.0))',
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
        assert.deepEqual(layer.weight_, 'bla');
      });
      it('recreates the renderer', () => {
        sinonSpy(layer, 'createRenderer');
        layer.setWeight('bla');
        layer.getRenderer();
        assert.strictEqual(layer.createRenderer.calledOnce, true);
      });
    });
  });

  describe('filter', () => {
    beforeEach(() => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
      });
    });
    it('is applied as a shape filter if provided', () => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
        filter: ['>', ['get', 'sizeAttr'], 10],
      });
      layer.getRenderer();

      const rendererOpts = rendererSpy.getCall(0).args[1];
      const attrs = rendererOpts.style.attributes;
      assert.property(attrs, 'prop_sizeAttr');

      const builder = rendererOpts.style.builder;
      assert.deepEqual(
        builder.getShapeDiscardExpression(),
        '!(a_prop_sizeAttr > 10.0)',
      );
    });
    it('is applied as a fragment filter if provided and depends on the line-metric operator', () => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
        filter: ['>', ['get', 'sizeAttr'], ['line-metric']],
      });
      layer.getRenderer();

      const rendererOpts = rendererSpy.getCall(0).args[1];
      const attrs = rendererOpts.style.attributes;
      assert.property(attrs, 'prop_sizeAttr');

      const builder = rendererOpts.style.builder;
      assert.deepEqual(
        builder.getFragmentDiscardExpression(),
        '!(a_prop_sizeAttr > currentLineMetric)',
      );
    });
    describe('setFilter', () => {
      it('updates filter value', () => {
        const filter = ['==', ['get', 'type'], 'foo'];
        layer.setFilter(filter);
        assert.deepEqual(layer.filter_, filter);
      });
      it('recreates the renderer', () => {
        sinonSpy(layer, 'createRenderer');
        layer.setFilter(true);
        layer.getRenderer();
        assert.strictEqual(layer.createRenderer.calledOnce, true);
      });
    });
  });

  describe('expression-based blur and radius', () => {
    it('compiles correctly when blur and radius use get expressions', () => {
      layer = new HeatmapLayer({
        source: new VectorSource(),
        blur: ['get', 'myBlur'],
        radius: ['get', 'myRadius'],
      });
      layer.getRenderer();

      const rendererOpts = rendererSpy.getCall(0).args[1];
      const attrs = rendererOpts.style.attributes;
      assert.property(attrs, 'prop_myBlur');
      assert.property(attrs, 'prop_myRadius');

      const builder = rendererOpts.style.builder;
      assert.deepEqual(
        builder.getSymbolColorExpression(),
        'vec4(smoothstep(0., 1., (1. - length(coordsPx * 2. / v_quadSizePx)) * (a_prop_myRadius / max(1., a_prop_myBlur))) * a_prop_weight)',
      );
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
        assert.strictEqual(res, feature);
        res = hitTest([20, 0]);
        assert.strictEqual(res, null);
        res = hitTest([14, 14]);
        assert.strictEqual(res, feature2);
        res = hitTest([0, 14]);
        assert.strictEqual(res, null);
        res = hitTest([-3, 10]);
        assert.strictEqual(res, feature3);
        res = hitTest([3, 7]);
        assert.strictEqual(res, null);
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
      assert.strictEqual(layer.styleVariables_.foo, 'bam');
    });
    it('can be called even if no initial variables are provided', function () {
      const layer = new HeatmapLayer({
        source: new VectorSource(),
      });

      layer.updateStyleVariables({foo: 'bam'});
      assert.strictEqual(layer.styleVariables_.foo, 'bam');
    });
  });
});
