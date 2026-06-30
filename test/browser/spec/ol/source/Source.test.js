import {assert} from 'chai';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import Source from '../../../../../src/ol/source/Source.js';

describe('ol/source/Source', function () {
  describe('constructor', function () {
    it('returns a source', function () {
      const source = new Source({
        projection: getProjection('EPSG:4326'),
      });
      assert.instanceOf(source, Source);
    });
  });

  describe('config option `attributions`', function () {
    it('accepts undefined', function () {
      const source = new Source({});
      const attributions = source.getAttributions();
      assert.strictEqual(attributions, null);
    });

    it('accepts a single string', function () {
      const source = new Source({
        attributions: 'Humpty',
      });
      const attributions = source.getAttributions();
      assert.notEqual(attributions, null);
      assert.strictEqual(typeof attributions, 'function');
      assert.deepEqual(attributions(), ['Humpty']);
    });

    it('accepts an array of strings', function () {
      const source = new Source({
        attributions: ['Humpty', 'Dumpty'],
      });
      const attributions = source.getAttributions();
      assert.notEqual(attributions, null);
      assert.strictEqual(typeof attributions, 'function');
      assert.deepEqual(attributions(), ['Humpty', 'Dumpty']);
    });

    it('accepts a function that returns a string', function () {
      const source = new Source({
        attributions: function () {
          return 'Humpty';
        },
      });
      const attributions = source.getAttributions();
      assert.notEqual(attributions, null);
      assert.strictEqual(typeof attributions, 'function');
      assert.strictEqual(attributions(), 'Humpty');
    });

    it('accepts a function that returns an array of strings', function () {
      const source = new Source({
        attributions: function () {
          return ['Humpty', 'Dumpty'];
        },
      });
      const attributions = source.getAttributions();
      assert.notEqual(attributions, null);
      assert.strictEqual(typeof attributions, 'function');
      assert.deepEqual(attributions(), ['Humpty', 'Dumpty']);
    });
  });

  describe('#refresh()', function () {
    it('dispatches the change event', function () {
      const source = new Source({
        projection: getProjection('EPSG:4326'),
      });
      const changedSpy = vi.fn();
      source.on('change', changedSpy);
      source.refresh();
      assert.isAbove(changedSpy.mock.calls.length, 0);
    });
  });

  describe('#getInterpolate()', function () {
    it('returns false by default', function () {
      const source = new Source({});
      assert.strictEqual(source.getInterpolate(), false);
    });

    it('returns true if constructed with interpolate: true', function () {
      const source = new Source({interpolate: true});
      assert.strictEqual(source.getInterpolate(), true);
    });
  });

  describe('#setAttributions()', function () {
    let source = null;

    beforeEach(function () {
      source = new Source({
        attributions: 'before',
      });
    });

    afterEach(function () {
      source = null;
    });

    it('accepts undefined', function () {
      source.setAttributions();
      const attributions = source.getAttributions();
      assert.strictEqual(attributions, null);
    });

    it('accepts a single string', function () {
      source.setAttributions('Humpty');
      const attributions = source.getAttributions();
      assert.notEqual(attributions, null);
      assert.strictEqual(typeof attributions, 'function');
      assert.deepEqual(attributions(), ['Humpty']);
    });

    it('accepts an array of strings', function () {
      source.setAttributions(['Humpty', 'Dumpty']);
      const attributions = source.getAttributions();
      assert.notEqual(attributions, null);
      assert.strictEqual(typeof attributions, 'function');
      assert.deepEqual(attributions(), ['Humpty', 'Dumpty']);
    });

    it('accepts a function that returns a string', function () {
      source.setAttributions(function () {
        return 'Humpty';
      });
      const attributions = source.getAttributions();
      assert.notEqual(attributions, null);
      assert.strictEqual(typeof attributions, 'function');
      assert.deepEqual(attributions(), 'Humpty');
    });

    it('accepts a function that returns an array of strings', function () {
      source.setAttributions(function () {
        return ['Humpty', 'Dumpty'];
      });
      const attributions = source.getAttributions();
      assert.notEqual(attributions, null);
      assert.strictEqual(typeof attributions, 'function');
      assert.deepEqual(attributions(), ['Humpty', 'Dumpty']);
    });
  });
});
