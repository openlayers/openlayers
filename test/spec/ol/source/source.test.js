goog.provide('ol.test.source.Source');

goog.require('ol.Attribution');
goog.require('ol.proj');
goog.require('ol.source.Source');


describe('ol.source.Source', function() {

  describe('constructor', function() {
    it('returns a source', function() {
      var source = new ol.source.Source({
        projection: ol.proj.get('EPSG:4326')
      });
      expect(source).to.be.a(ol.source.Source);
    });
  });

  describe('config option `attributions`', function() {
    it('accepts undefined', function() {
      var source = new ol.source.Source({});
      var attributions = source.getAttributions();
      expect(attributions).to.be(null);
    });
    it('accepts a single string', function() {
      var source = new ol.source.Source({
        attributions: 'Humpty'
      });
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(1);
      expect(attributions[0]).to.be.an(ol.Attribution);
      expect(attributions[0].getHTML()).to.be('Humpty');
    });
    it('accepts an array of strings', function() {
      var source = new ol.source.Source({
        attributions: ['Humpty', 'Dumpty']
      });
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(2);
      expect(attributions[0]).to.be.an(ol.Attribution);
      expect(attributions[0].getHTML()).to.be('Humpty');
      expect(attributions[1]).to.be.an(ol.Attribution);
      expect(attributions[1].getHTML()).to.be('Dumpty');
    });
    it('accepts a single ol.Attribution', function() {
      var passedAttribution = new ol.Attribution({html: 'Humpty'});
      var source = new ol.source.Source({
        attributions: passedAttribution
      });
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(1);
      expect(attributions[0]).to.be.an(ol.Attribution);
      expect(attributions[0]).to.be(passedAttribution);
    });
    it('accepts an array of ol.Attribution', function() {
      var firstAttribution = new ol.Attribution({html: 'Humpty'});
      var secondAttribution = new ol.Attribution({html: 'Dumpty'});
      var source = new ol.source.Source({
        attributions: [firstAttribution, secondAttribution]
      });
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(2);
      expect(attributions[0]).to.be.an(ol.Attribution);
      expect(attributions[0]).to.be(firstAttribution);
      expect(attributions[1]).to.be.an(ol.Attribution);
      expect(attributions[1]).to.be(secondAttribution);
    });
    it('accepts an array with a string and an ol.Attribution', function() {
      var attribution = new ol.Attribution({html: 'Dumpty'});
      var source = new ol.source.Source({
        attributions: ['Humpty', attribution]
      });
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(2);
      expect(attributions[0]).to.be.an(ol.Attribution);
      expect(attributions[0].getHTML()).to.be('Humpty');
      expect(attributions[1]).to.be.an(ol.Attribution);
      expect(attributions[1]).to.be(attribution);
    });
  });

  describe('#refresh()', function() {
    it('dispatches the change event', function() {
      var source = new ol.source.Source({
        projection: ol.proj.get('EPSG:4326')
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
      source = new ol.source.Source({
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
      expect(attributions[0]).to.be.an(ol.Attribution);
      expect(attributions[0].getHTML()).to.be('Humpty');
    });
    it('accepts an array of strings', function() {
      source.setAttributions(['Humpty', 'Dumpty']);
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(2);
      expect(attributions[0]).to.be.an(ol.Attribution);
      expect(attributions[0].getHTML()).to.be('Humpty');
      expect(attributions[1]).to.be.an(ol.Attribution);
      expect(attributions[1].getHTML()).to.be('Dumpty');
    });
    it('accepts a single ol.Attribution', function() {
      var passedAttribution = new ol.Attribution({html: 'Humpty'});
      source.setAttributions(passedAttribution);
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(1);
      expect(attributions[0]).to.be.an(ol.Attribution);
      expect(attributions[0]).to.be(passedAttribution);
    });
    it('accepts an array of ol.Attribution', function() {
      var firstAttribution = new ol.Attribution({html: 'Humpty'});
      var secondAttribution = new ol.Attribution({html: 'Dumpty'});
      source.setAttributions([firstAttribution, secondAttribution]);
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(2);
      expect(attributions[0]).to.be.an(ol.Attribution);
      expect(attributions[0]).to.be(firstAttribution);
      expect(attributions[1]).to.be.an(ol.Attribution);
      expect(attributions[1]).to.be(secondAttribution);
    });
    it('accepts an array with a string and an ol.Attribution', function() {
      var attribution = new ol.Attribution({html: 'Dumpty'});
      source.setAttributions(['Humpty', attribution]);
      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(2);
      expect(attributions[0]).to.be.an(ol.Attribution);
      expect(attributions[0].getHTML()).to.be('Humpty');
      expect(attributions[1]).to.be.an(ol.Attribution);
      expect(attributions[1]).to.be(attribution);
    });
  });

});
