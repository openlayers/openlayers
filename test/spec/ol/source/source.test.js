

import _ol_Attribution_ from '../../../../src/ol/attribution';
import _ol_proj_ from '../../../../src/ol/proj';
import _ol_source_Source_ from '../../../../src/ol/source/source';


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
      var attributions = source.getAttributions();
      expect(attributions).to.be(null);
    });
    it('accepts a single string', function() {
      var source = new _ol_source_Source_({
        attributions: 'Humpty'
      });
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(1);
      expect(attributions[0]).to.be.an(_ol_Attribution_);
      expect(attributions[0].getHTML()).to.be('Humpty');
    });
    it('accepts an array of strings', function() {
      var source = new _ol_source_Source_({
        attributions: ['Humpty', 'Dumpty']
      });
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(2);
      expect(attributions[0]).to.be.an(_ol_Attribution_);
      expect(attributions[0].getHTML()).to.be('Humpty');
      expect(attributions[1]).to.be.an(_ol_Attribution_);
      expect(attributions[1].getHTML()).to.be('Dumpty');
    });
    it('accepts a single ol.Attribution', function() {
      var passedAttribution = new _ol_Attribution_({html: 'Humpty'});
      var source = new _ol_source_Source_({
        attributions: passedAttribution
      });
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(1);
      expect(attributions[0]).to.be.an(_ol_Attribution_);
      expect(attributions[0]).to.be(passedAttribution);
    });
    it('accepts an array of ol.Attribution', function() {
      var firstAttribution = new _ol_Attribution_({html: 'Humpty'});
      var secondAttribution = new _ol_Attribution_({html: 'Dumpty'});
      var source = new _ol_source_Source_({
        attributions: [firstAttribution, secondAttribution]
      });
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(2);
      expect(attributions[0]).to.be.an(_ol_Attribution_);
      expect(attributions[0]).to.be(firstAttribution);
      expect(attributions[1]).to.be.an(_ol_Attribution_);
      expect(attributions[1]).to.be(secondAttribution);
    });
    it('accepts an array with a string and an ol.Attribution', function() {
      var attribution = new _ol_Attribution_({html: 'Dumpty'});
      var source = new _ol_source_Source_({
        attributions: ['Humpty', attribution]
      });
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(2);
      expect(attributions[0]).to.be.an(_ol_Attribution_);
      expect(attributions[0].getHTML()).to.be('Humpty');
      expect(attributions[1]).to.be.an(_ol_Attribution_);
      expect(attributions[1]).to.be(attribution);
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

  describe('#setAttributions`', function() {
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
      var attributions = source.getAttributions();
      expect(attributions).to.be(null);
    });
    it('accepts a single string', function() {
      source.setAttributions('Humpty');
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(1);
      expect(attributions[0]).to.be.an(_ol_Attribution_);
      expect(attributions[0].getHTML()).to.be('Humpty');
    });
    it('accepts an array of strings', function() {
      source.setAttributions(['Humpty', 'Dumpty']);
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(2);
      expect(attributions[0]).to.be.an(_ol_Attribution_);
      expect(attributions[0].getHTML()).to.be('Humpty');
      expect(attributions[1]).to.be.an(_ol_Attribution_);
      expect(attributions[1].getHTML()).to.be('Dumpty');
    });
    it('accepts a single ol.Attribution', function() {
      var passedAttribution = new _ol_Attribution_({html: 'Humpty'});
      source.setAttributions(passedAttribution);
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(1);
      expect(attributions[0]).to.be.an(_ol_Attribution_);
      expect(attributions[0]).to.be(passedAttribution);
    });
    it('accepts an array of ol.Attribution', function() {
      var firstAttribution = new _ol_Attribution_({html: 'Humpty'});
      var secondAttribution = new _ol_Attribution_({html: 'Dumpty'});
      source.setAttributions([firstAttribution, secondAttribution]);
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(2);
      expect(attributions[0]).to.be.an(_ol_Attribution_);
      expect(attributions[0]).to.be(firstAttribution);
      expect(attributions[1]).to.be.an(_ol_Attribution_);
      expect(attributions[1]).to.be(secondAttribution);
    });
    it('accepts an array with a string and an ol.Attribution', function() {
      var attribution = new _ol_Attribution_({html: 'Dumpty'});
      source.setAttributions(['Humpty', attribution]);
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(2);
      expect(attributions[0]).to.be.an(_ol_Attribution_);
      expect(attributions[0].getHTML()).to.be('Humpty');
      expect(attributions[1]).to.be.an(_ol_Attribution_);
      expect(attributions[1]).to.be(attribution);
    });
  });

});
