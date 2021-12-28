import Source from '../../../../../src/ol/source/Source.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';

describe('ol/source/Source', function () {
  describe('constructor', function () {
    it('returns a source', function () {
      const source = new Source({
        projection: getProjection('EPSG:4326'),
      });
      expect(source).to.be.a(Source);
    });
  });

  describe('config option `attributions`', function () {
    it('accepts undefined', function () {
      const source = new Source({});
      const attributions = source.getAttributions();
      expect(attributions).to.be(null);
    });

    it('accepts a single string', function () {
      const source = new Source({
        attributions: 'Humpty',
      });
      const attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.eql(['Humpty']);
    });

    it('accepts an array of strings', function () {
      const source = new Source({
        attributions: ['Humpty', 'Dumpty'],
      });
      const attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.eql(['Humpty', 'Dumpty']);
    });

    it('accepts a function that returns a string', function () {
      const source = new Source({
        attributions: function () {
          return 'Humpty';
        },
      });
      const attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.be('Humpty');
    });

    it('accepts a function that returns an array of strings', function () {
      const source = new Source({
        attributions: function () {
          return ['Humpty', 'Dumpty'];
        },
      });
      const attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.eql(['Humpty', 'Dumpty']);
    });
  });

  describe('#refresh()', function () {
    it('dispatches the change event', function () {
      const source = new Source({
        projection: getProjection('EPSG:4326'),
      });
      const changedSpy = sinon.spy();
      source.on('change', changedSpy);
      source.refresh();
      expect(changedSpy.called).to.be.ok();
    });
  });

  describe('#getInterpolate()', function () {
    it('returns false by default', function () {
      const source = new Source({});
      expect(source.getInterpolate()).to.be(false);
    });

    it('returns true if constructed with interpolate: true', function () {
      const source = new Source({interpolate: true});
      expect(source.getInterpolate()).to.be(true);
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
      expect(attributions).to.be(null);
    });

    it('accepts a single string', function () {
      source.setAttributions('Humpty');
      const attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.eql(['Humpty']);
    });

    it('accepts an array of strings', function () {
      source.setAttributions(['Humpty', 'Dumpty']);
      const attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.eql(['Humpty', 'Dumpty']);
    });

    it('accepts a function that returns a string', function () {
      source.setAttributions(function () {
        return 'Humpty';
      });
      const attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.eql('Humpty');
    });

    it('accepts a function that returns an array of strings', function () {
      source.setAttributions(function () {
        return ['Humpty', 'Dumpty'];
      });
      const attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.eql(['Humpty', 'Dumpty']);
    });
  });
});
