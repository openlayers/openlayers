import _ol_Attribution_ from '../../../../src/ol/Attribution.js';
import _ol_proj_ from '../../../../src/ol/proj.js';
import _ol_source_Source_ from '../../../../src/ol/source/Source.js';


describe('ol.source.Source', function() {

  describe('constructor', function() {
    it('returns a source', function() {
      var source = new _ol_source_Source_({
        projection: _ol_proj_.get('EPSG:4326')
      });
      expect(source).to.be.a(_ol_source_Source_);
    });
  });

  describe('config option `attributions`', function() {
    it('accepts undefined', function() {
      var source = new _ol_source_Source_({});
      var attributions = source.getAttributions2();
      expect(attributions).to.be(null);
    });

    it('accepts a single string', function() {
      var source = new _ol_source_Source_({
        attributions: 'Humpty'
      });
      var attributions = source.getAttributions2();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.eql(['Humpty']);
    });

    it('accepts an array of strings', function() {
      var source = new _ol_source_Source_({
        attributions: ['Humpty', 'Dumpty']
      });
      var attributions = source.getAttributions2();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.eql(['Humpty', 'Dumpty']);
    });

    it('accepts a function that returns a string', function() {
      var source = new _ol_source_Source_({
        attributions: function() {
          return 'Humpty';
        }
      });
      var attributions = source.getAttributions2();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.be('Humpty');
    });

    it('accepts a function that returns an array of strings', function() {
      var source = new _ol_source_Source_({
        attributions: function() {
          return ['Humpty', 'Dumpty'];
        }
      });
      var attributions = source.getAttributions2();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.eql(['Humpty', 'Dumpty']);
    });
  });

  describe('#refresh()', function() {
    it('dispatches the change event', function() {
      var source = new _ol_source_Source_({
        projection: _ol_proj_.get('EPSG:4326')
      });
      var changedSpy = sinon.spy();
      source.on('change', changedSpy);
      source.refresh();
      expect(changedSpy.called).to.be.ok();
    });
  });

  describe('#getAttributions()', function() {
    it('maintains backwards compatibility for string option', function() {
      var source = new _ol_source_Source_({
        attributions: 'foo'
      });
      var attributions = source.getAttributions();
      expect(attributions.length).to.be(1);
      expect(attributions[0]).to.be.an(_ol_Attribution_);
      expect(attributions[0].getHTML()).to.be('foo');
    });

    it('maintains backwards compatibility for array of strings option', function() {
      var source = new _ol_source_Source_({
        attributions: ['foo', 'bar']
      });
      var attributions = source.getAttributions();
      expect(attributions.length).to.be(2);
      expect(attributions[0]).to.be.an(_ol_Attribution_);
      expect(attributions[0].getHTML()).to.be('foo');
      expect(attributions[1]).to.be.an(_ol_Attribution_);
      expect(attributions[1].getHTML()).to.be('bar');
    });

    it('maintains backwards compatibility for ol.Attribution option', function() {
      var source = new _ol_source_Source_({
        attributions: new _ol_Attribution_({html: 'foo'})
      });
      var attributions = source.getAttributions();
      expect(attributions.length).to.be(1);
      expect(attributions[0]).to.be.an(_ol_Attribution_);
      expect(attributions[0].getHTML()).to.be('foo');
    });

    it('maintains backwards compatibility for array of strings option', function() {
      var source = new _ol_source_Source_({
        attributions: [
          new _ol_Attribution_({html: 'foo'}),
          new _ol_Attribution_({html: 'bar'})
        ]
      });
      var attributions = source.getAttributions();
      expect(attributions.length).to.be(2);
      expect(attributions[0]).to.be.an(_ol_Attribution_);
      expect(attributions[0].getHTML()).to.be('foo');
      expect(attributions[1]).to.be.an(_ol_Attribution_);
      expect(attributions[1].getHTML()).to.be('bar');
    });
  });

  describe('#setAttributions()', function() {
    var source = null;

    beforeEach(function() {
      source = new _ol_source_Source_({
        attributions: 'before'
      });
    });

    afterEach(function() {
      source = null;
    });

    it('accepts undefined', function() {
      source.setAttributions();
      var attributions = source.getAttributions2();
      expect(attributions).to.be(null);
    });

    it('accepts a single string', function() {
      source.setAttributions('Humpty');
      var attributions = source.getAttributions2();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.eql(['Humpty']);
    });

    it('accepts an array of strings', function() {
      source.setAttributions(['Humpty', 'Dumpty']);
      var attributions = source.getAttributions2();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.eql(['Humpty', 'Dumpty']);
    });

    it('accepts a function that returns a string', function() {
      source.setAttributions(function() {
        return 'Humpty';
      });
      var attributions = source.getAttributions2();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.eql('Humpty');
    });

    it('accepts a function that returns an array of strings', function() {
      source.setAttributions(function() {
        return ['Humpty', 'Dumpty'];
      });
      var attributions = source.getAttributions2();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      expect(attributions()).to.eql(['Humpty', 'Dumpty']);
    });
  });

});
