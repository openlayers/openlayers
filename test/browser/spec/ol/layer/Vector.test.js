import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import Layer from '../../../../../src/ol/layer/Layer.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import {
  clearUserProjection,
  getUserProjection,
  useGeographic,
} from '../../../../../src/ol/proj.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Icon from '../../../../../src/ol/style/Icon.js';
import ImageStyle from '../../../../../src/ol/style/Image.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';
import Style, {createDefaultStyle} from '../../../../../src/ol/style/Style.js';

describe('ol.layer.Vector', function () {
  describe('constructor', function () {
    const source = new VectorSource();
    const style = new Style();

    it('creates a new layer', function () {
      const layer = new VectorLayer({source: source});
      assert.instanceOf(layer, VectorLayer);
      assert.instanceOf(layer, Layer);
    });

    it('accepts a style option with a single style', function () {
      const layer = new VectorLayer({
        source: source,
        style: style,
      });

      const styleFunction = layer.getStyleFunction();
      assert.deepEqual(styleFunction(), [style]);
    });

    it('accepts a style option with an array of styles', function () {
      const layer = new VectorLayer({
        source: source,
        style: [style],
      });

      const styleFunction = layer.getStyleFunction();
      assert.deepEqual(styleFunction(), [style]);
    });

    it('accepts a style option with a style function', function () {
      const layer = new VectorLayer({
        source: source,
        style: function (feature, resolution) {
          return [style];
        },
      });

      const styleFunction = layer.getStyleFunction();
      assert.deepEqual(styleFunction(), [style]);
    });
  });

  describe('#setStyle()', function () {
    let layer, style;

    beforeEach(function () {
      layer = new VectorLayer({
        source: new VectorSource(),
      });
      style = new Style();
    });

    it('allows the style to be set after construction', function () {
      layer.setStyle(style);
      assert.strictEqual(layer.getStyle(), style);
    });

    it('dispatches the change event', () =>
      new Promise((resolve) => {
        layer.on('change', function () {
          resolve();
        });
        layer.setStyle(style);
      }));

    it('updates the internal style function', function () {
      assert.strictEqual(layer.getStyleFunction(), createDefaultStyle);
      layer.setStyle(style);
      assert.notEqual(layer.getStyleFunction(), createDefaultStyle);
    });

    it('allows setting an null style', function () {
      layer.setStyle(null);
      assert.strictEqual(layer.getStyle(), null);
      assert.strictEqual(layer.getStyleFunction(), undefined);
    });

    it('sets the default style when passing undefined', function () {
      layer.setStyle(style);
      layer.setStyle(undefined);
      assert.strictEqual(layer.getStyle(), createDefaultStyle);
      assert.strictEqual(layer.getStyleFunction(), createDefaultStyle);
    });
  });

  describe('#getStyle()', function () {
    const source = new VectorSource();
    const style = new Style();

    it('returns what is provided to setStyle', function () {
      const layer = new VectorLayer({
        source: source,
      });

      assert.strictEqual(layer.getStyle(), createDefaultStyle);

      layer.setStyle(style);
      assert.strictEqual(layer.getStyle(), style);

      layer.setStyle([style]);
      assert.deepEqual(layer.getStyle(), [style]);

      const styleFunction = function (feature, resolution) {
        return [style];
      };
      layer.setStyle(styleFunction);
      assert.strictEqual(layer.getStyle(), styleFunction);
    });

    it('returns a flat style if a flat style was set', () => {
      const layer = new VectorLayer();
      const style = [
        {
          'stroke-color': 'red',
          'stroke-width': 10,
        },
        {
          'stroke-color': 'yellow',
          'stroke-width': 5,
        },
      ];
      layer.setStyle(style);
      assert.strictEqual(layer.getStyle(), style);
    });
  });

  describe('#setStyle()', () => {
    it('accepts a flat style', () => {
      const layer = new VectorLayer();
      layer.setStyle({
        'fill-color': 'red',
      });

      const styleFunction = layer.getStyleFunction();
      assert.instanceOf(styleFunction, Function);

      const styles = styleFunction(new Feature(), 1);
      assert.instanceOf(styles, Array);
      assert.lengthOf(styles, 1);

      const style = styles[0];
      const fill = style.getFill();
      assert.instanceOf(fill, Fill);
      assert.deepEqual(fill.getColor(), [255, 0, 0, 1]);
    });

    it('accepts an array of flat styles', () => {
      const layer = new VectorLayer();
      layer.setStyle([
        {
          'stroke-color': 'red',
          'stroke-width': 10,
        },
        {
          'stroke-color': 'yellow',
          'stroke-width': 5,
        },
      ]);

      const styleFunction = layer.getStyleFunction();
      assert.instanceOf(styleFunction, Function);

      const styles = styleFunction(new Feature(), 1);
      assert.instanceOf(styles, Array);
      assert.lengthOf(styles, 2);

      const first = styles[0];
      assert.instanceOf(first, Style);

      const firstStroke = first.getStroke();
      assert.instanceOf(firstStroke, Stroke);
      assert.deepEqual(firstStroke.getColor(), [255, 0, 0, 1]);
      assert.strictEqual(firstStroke.getWidth(), 10);

      const second = styles[1];
      assert.instanceOf(second, Style);

      const secondStroke = second.getStroke();
      assert.instanceOf(secondStroke, Stroke);
      assert.deepEqual(secondStroke.getColor(), [255, 255, 0, 1]);
      assert.strictEqual(secondStroke.getWidth(), 5);
    });

    it('accepts an array of flat style rules', () => {
      const layer = new VectorLayer();
      layer.setStyle([
        {
          style: {
            'stroke-color': 'red',
            'stroke-width': 10,
          },
        },
        {
          style: {
            'stroke-color': 'yellow',
            'stroke-width': 5,
          },
        },
      ]);

      const styleFunction = layer.getStyleFunction();
      assert.instanceOf(styleFunction, Function);

      const styles = styleFunction(new Feature(), 1);
      assert.instanceOf(styles, Array);
      assert.lengthOf(styles, 2);

      const first = styles[0];
      assert.instanceOf(first, Style);

      const firstStroke = first.getStroke();
      assert.instanceOf(firstStroke, Stroke);
      assert.deepEqual(firstStroke.getColor(), [255, 0, 0, 1]);
      assert.strictEqual(firstStroke.getWidth(), 10);

      const second = styles[1];
      assert.instanceOf(second, Style);

      const secondStroke = second.getStroke();
      assert.instanceOf(secondStroke, Stroke);
      assert.deepEqual(secondStroke.getColor(), [255, 255, 0, 1]);
      assert.strictEqual(secondStroke.getWidth(), 5);
    });
  });

  describe('#getFeatures()', function () {
    let map;
    beforeEach(function () {
      const container = document.createElement('div');
      container.style.width = '256px';
      container.style.height = '256px';
      document.body.appendChild(container);
      map = new Map({
        target: container,
        view: new View({
          zoom: 2,
          center: [0, 0],
        }),
      });
    });

    afterEach(function () {
      disposeMap(map);
      if (getUserProjection()) {
        clearUserProjection();
      }
    });

    it('detects features properly', () =>
      new Promise((resolve) => {
        const source = new VectorSource({
          features: [
            new Feature({
              geometry: new Point([-1000000, 0]),
              name: 'feature1',
            }),
            new Feature({
              geometry: new Point([1000000, 0]),
              name: 'feature2',
            }),
          ],
        });

        const feature = new Feature({
          geometry: new Point([-1000000, 0]),
          name: 'feature with no size',
        });

        const testImage = new ImageStyle({
          opacity: 1,
          displacement: [],
        });

        testImage.getImageState = () => {};
        testImage.listenImageChange = () => {};
        testImage.getImageSize = () => {};

        feature.setStyle([
          new Style({
            image: testImage,
          }),
        ]);

        source.addFeature(feature);

        const layer = new VectorLayer({
          source,
        });
        map.addLayer(layer);
        map.renderSync();

        const pixel = map.getPixelFromCoordinate([-1000000, 0]);

        layer.getFeatures(pixel).then(function (features) {
          assert.equal(features.length, 1);
          assert.strictEqual(features[0].get('name'), 'feature1');
          resolve();
        });
      }));

    it('detects features properly on rotated view', () =>
      new Promise((resolve) => {
        map.getView().setRotation(Math.PI / 4);
        map.renderSync();
        const source = new VectorSource({
          features: [
            new Feature({
              geometry: new Point([-1000000, 0]),
              name: 'feature1',
            }),
            new Feature({
              geometry: new Point([1000000, 0]),
              name: 'feature2',
            }),
          ],
        });

        const feature = new Feature({
          geometry: new Point([-1000000, 0]),
          name: 'feature with no size',
        });

        const testImage = new ImageStyle({
          opacity: 1,
          displacement: [],
        });

        testImage.getImageState = () => {};
        testImage.listenImageChange = () => {};
        testImage.getImageSize = () => {};

        feature.setStyle([
          new Style({
            image: testImage,
          }),
        ]);

        source.addFeature(feature);

        const layer = new VectorLayer({
          source,
        });
        map.addLayer(layer);
        map.renderSync();

        const pixel = map.getPixelFromCoordinate([-1000000, 0]);

        layer.getFeatures(pixel).then(function (features) {
          assert.equal(features.length, 1);
          assert.strictEqual(features[0].get('name'), 'feature1');
          resolve();
        });
      }));

    it('detects zero opacity images', () =>
      new Promise((resolve) => {
        const source = new VectorSource({
          features: [
            new Feature({
              geometry: new Point([-1000000, 0]),
              name: 'feature1',
            }),
            new Feature({
              geometry: new Point([1000000, 0]),
              name: 'feature2',
            }),
          ],
        });

        const style = new Style({
          image: new Icon({
            src: 'spec/ol/data/dot.png',
            opacity: 0,
          }),
        });

        const layer = new VectorLayer({
          source,
          style,
        });
        map.addLayer(layer);

        map.once('rendercomplete', () => {
          const pixel = map.getPixelFromCoordinate([-1000000, 0]);

          layer.getFeatures(pixel).then(function (features) {
            assert.equal(features.length, 1);
            assert.strictEqual(features[0].get('name'), 'feature1');
            resolve();
          });
        });
      }));

    it('detects feature styles when layer style is null', () =>
      new Promise((resolve) => {
        const source = new VectorSource({
          features: [
            new Feature({
              geometry: new Point([-1000000, 0]),
              name: 'feature1',
            }),
            new Feature({
              geometry: new Point([1000000, 0]),
              name: 'feature2',
            }),
          ],
        });

        const style = new Style({
          image: new Icon({
            src: 'spec/ol/data/dot.png',
            opacity: 0,
          }),
        });

        source.forEachFeature((feature) => {
          feature.setStyle(style);
        });

        const layer = new VectorLayer({
          source,
          style: null,
        });
        map.addLayer(layer);

        map.once('rendercomplete', () => {
          const pixel = map.getPixelFromCoordinate([-1000000, 0]);

          layer.getFeatures(pixel).then(function (features) {
            assert.equal(features.length, 1);
            assert.strictEqual(features[0].get('name'), 'feature1');
            resolve();
          });
        });
      }));

    it('hits lines even if they are dashed', () =>
      new Promise((resolve, reject) => {
        const done = (err) => (err ? reject(err) : resolve());
        const geometry = new LineString([
          [-1e6, 0],
          [1e6, 0],
        ]);
        const feature = new Feature(geometry);
        const layer = new VectorLayer({
          source: new VectorSource({
            features: [feature],
          }),
          style: new Style({
            stroke: new Stroke({
              color: 'black',
              width: 8,
              lineDash: [10, 20],
            }),
          }),
        });
        map.addLayer(layer);
        map.renderSync();

        const pixel = map.getPixelFromCoordinate([0, 0]);

        layer
          .getFeatures(pixel)
          .then(function (features) {
            assert.equal(features.length, 1);
            assert.strictEqual(features[0], feature);
            done();
          }, done)
          .catch(done);
      }));

    it('detects features with user projection', () => {
      useGeographic();
      const source = new VectorSource({
        features: [
          new Feature({
            geometry: new Point([16, 48]),
            name: 'feature1',
          }),
          new Feature({
            geometry: new Polygon([
              [
                [16.1, 48.1],
                [16.1, 48.2],
                [16.2, 48.2],
                [16.2, 48.1],
                [16.1, 48.1],
              ],
            ]),
            name: 'feature2',
          }),
        ],
      });

      const layer = new VectorLayer({
        source,
      });
      map.addLayer(layer);
      map.getView().fit(source.getExtent(), {padding: [10, 10, 10, 10]});
      map.renderSync();

      const pixel1 = map.getPixelFromCoordinate([16, 48]);
      const pixel2 = map.getPixelFromCoordinate([16.15, 48.15]);

      return Promise.all([
        layer.getFeatures(pixel1).then(function (features) {
          assert.equal(features.length, 1);
          assert.strictEqual(features[0].get('name'), 'feature1');
        }),
        layer.getFeatures(pixel2).then(function (features) {
          assert.equal(features.length, 1);
          assert.strictEqual(features[0].get('name'), 'feature2');
        }),
      ]);
    });
  });
});
