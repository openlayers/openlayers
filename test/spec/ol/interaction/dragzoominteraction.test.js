goog.provide('ol.test.interaction.DragZoom');

describe('ol.interaction.DragZoom', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.interaction.DragZoom();
      expect(instance).to.be.an(ol.interaction.DragZoom);
    });

  });

  describe('ol.interaction.DragZoom.calculateAnchor', function() {

    it('can calculate central x coordinate', function() {
      var x = ol.interaction.DragZoom.calculateAnchor(
          [0, NaN, 1000, NaN],
          [400, NaN, 600, NaN],
          0);
      expect(x).to.eql(500);
    });

    it('can calculate central y coordinate', function() {
      var x = ol.interaction.DragZoom.calculateAnchor(
          [NaN, 0, NaN, 1000],
          [NaN, 700, NaN, 900],
          1);
      expect(x).to.eql(875);
    });

    it('can handle equal lower extent', function() {
      var x = ol.interaction.DragZoom.calculateAnchor(
          [0, NaN, 1000, NaN],
          [0, NaN, 600, NaN],
          0);
      expect(x).to.eql(0);
    });

    it('can handle equal higher extent', function() {
      var x = ol.interaction.DragZoom.calculateAnchor(
          [0, NaN, 1000, NaN],
          [500, NaN, 1000, NaN],
          0);
      expect(x).to.eql(1000);
    });

    it('can calculate lower region coordinate', function() {
      var x = ol.interaction.DragZoom.calculateAnchor(
          [NaN, 0, NaN, 1200],
          [NaN, 100, NaN, 500],
          1);
      expect(x).to.eql(150);
    });

    it('can calculate lower region coordinate', function() {
      var x = ol.interaction.DragZoom.calculateAnchor(
          [NaN, 0, NaN, 1200],
          [NaN, 700, NaN, 1100],
          1);
      expect(x).to.eql(1050);
    });

  });

});

goog.require('ol.interaction.DragZoom');
