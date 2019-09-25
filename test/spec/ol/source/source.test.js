import {get as getProjection} from '../../../../src/ol/proj.js';
import Source from '../../../../src/ol/source/Source.js';


describe('ol.source.Source', () => {

  describe('constructor', () => {
    test('returns a source', () => {
      const source = new Source({
        projection: getProjection('EPSG:4326')
      });
      expect(source).toBeInstanceOf(Source);
    });
  });

  describe('config option `attributions`', () => {
    test('accepts undefined', () => {
      const source = new Source({});
      const attributions = source.getAttributions();
      expect(attributions).toBe(null);
    });

    test('accepts a single string', () => {
      const source = new Source({
        attributions: 'Humpty'
      });
      const attributions = source.getAttributions();
      expect(attributions).not.toBe(null);
      expect(typeof attributions).toBe('function');
      expect(attributions()).toEqual(['Humpty']);
    });

    test('accepts an array of strings', () => {
      const source = new Source({
        attributions: ['Humpty', 'Dumpty']
      });
      const attributions = source.getAttributions();
      expect(attributions).not.toBe(null);
      expect(typeof attributions).toBe('function');
      expect(attributions()).toEqual(['Humpty', 'Dumpty']);
    });

    test('accepts a function that returns a string', () => {
      const source = new Source({
        attributions: function() {
          return 'Humpty';
        }
      });
      const attributions = source.getAttributions();
      expect(attributions).not.toBe(null);
      expect(typeof attributions).toBe('function');
      expect(attributions()).toBe('Humpty');
    });

    test('accepts a function that returns an array of strings', () => {
      const source = new Source({
        attributions: function() {
          return ['Humpty', 'Dumpty'];
        }
      });
      const attributions = source.getAttributions();
      expect(attributions).not.toBe(null);
      expect(typeof attributions).toBe('function');
      expect(attributions()).toEqual(['Humpty', 'Dumpty']);
    });
  });

  describe('#refresh()', () => {
    test('dispatches the change event', () => {
      const source = new Source({
        projection: getProjection('EPSG:4326')
      });
      const changedSpy = sinon.spy();
      source.on('change', changedSpy);
      source.refresh();
      expect(changedSpy.called).toBeTruthy();
    });
  });

  describe('#setAttributions()', () => {
    let source = null;

    beforeEach(() => {
      source = new Source({
        attributions: 'before'
      });
    });

    afterEach(() => {
      source = null;
    });

    test('accepts undefined', () => {
      source.setAttributions();
      const attributions = source.getAttributions();
      expect(attributions).toBe(null);
    });

    test('accepts a single string', () => {
      source.setAttributions('Humpty');
      const attributions = source.getAttributions();
      expect(attributions).not.toBe(null);
      expect(typeof attributions).toBe('function');
      expect(attributions()).toEqual(['Humpty']);
    });

    test('accepts an array of strings', () => {
      source.setAttributions(['Humpty', 'Dumpty']);
      const attributions = source.getAttributions();
      expect(attributions).not.toBe(null);
      expect(typeof attributions).toBe('function');
      expect(attributions()).toEqual(['Humpty', 'Dumpty']);
    });

    test('accepts a function that returns a string', () => {
      source.setAttributions(function() {
        return 'Humpty';
      });
      const attributions = source.getAttributions();
      expect(attributions).not.toBe(null);
      expect(typeof attributions).toBe('function');
      expect(attributions()).toEqual('Humpty');
    });

    test('accepts a function that returns an array of strings', () => {
      source.setAttributions(function() {
        return ['Humpty', 'Dumpty'];
      });
      const attributions = source.getAttributions();
      expect(attributions).not.toBe(null);
      expect(typeof attributions).toBe('function');
      expect(attributions()).toEqual(['Humpty', 'Dumpty']);
    });
  });

});
