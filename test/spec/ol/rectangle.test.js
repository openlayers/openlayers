goog.provide('ol.test.Rectangle');

describe('ol.Rectangle', function() {

  describe('getCenter', function() {
    it('returns the expected center', function() {
      var rectangle = new ol.Rectangle(1, 2, 3, 4);
      var center = rectangle.getCenter();
      expect(center.x).to.eql(2);
      expect(center.y).to.eql(3);
    });
  });

  describe('intersect', function() {

    var rectangle1;

    beforeEach(function() {
      rectangle1 = new ol.Rectangle(50, 50, 100, 100);
    });

    it('returns the expected value', function() {
      expect(rectangle1).to.intersect(rectangle1);
      expect(rectangle1).to.intersect(new ol.Rectangle(20, 20, 80, 80));
      expect(rectangle1).to.intersect(new ol.Rectangle(20, 50, 80, 100));
      expect(rectangle1).to.intersect(new ol.Rectangle(20, 80, 80, 120));
      expect(rectangle1).to.intersect(new ol.Rectangle(50, 20, 100, 80));
      expect(rectangle1).to.intersect(new ol.Rectangle(50, 80, 100, 120));
      expect(rectangle1).to.intersect(new ol.Rectangle(80, 20, 120, 80));
      expect(rectangle1).to.intersect(new ol.Rectangle(80, 50, 120, 100));
      expect(rectangle1).to.intersect(new ol.Rectangle(80, 80, 120, 120));
      expect(rectangle1).to.intersect(new ol.Rectangle(20, 20, 120, 120));
      expect(rectangle1).to.intersect(new ol.Rectangle(70, 70, 80, 80));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(10, 10, 30, 30));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(30, 10, 70, 30));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(50, 10, 100, 30));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(80, 10, 120, 30));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(120, 10, 140, 30));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(10, 30, 30, 70));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(120, 30, 140, 70));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(10, 50, 30, 100));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(120, 50, 140, 100));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(10, 80, 30, 120));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(120, 80, 140, 120));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(10, 120, 30, 140));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(30, 120, 70, 140));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(50, 120, 100, 140));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(80, 120, 120, 140));
      expect(rectangle1).to.not.intersect(
          new ol.Rectangle(120, 120, 140, 140));
    });
  });

  describe('getSize', function() {
    it('returns the expected size', function() {
      var rectangle = new ol.Rectangle(0, 1, 2, 4);
      var size = rectangle.getSize();
      expect(size.width).to.eql(2);
      expect(size.height).to.eql(3);
    });
  });

  describe('normalize', function() {
    it('returns the expected coordinate', function() {
      var rectangle = new ol.Rectangle(0, 1, 2, 3);
      var coordinate;

      coordinate = rectangle.normalize(new ol.Coordinate(1, 2));
      expect(coordinate.x).to.eql(0.5);
      expect(coordinate.y).to.eql(0.5);

      coordinate = rectangle.normalize(new ol.Coordinate(0, 3));
      expect(coordinate.x).to.eql(0);
      expect(coordinate.y).to.eql(1);

      coordinate = rectangle.normalize(new ol.Coordinate(2, 1));
      expect(coordinate.x).to.eql(1);
      expect(coordinate.y).to.eql(0);

      coordinate = rectangle.normalize(new ol.Coordinate(0, 0));
      expect(coordinate.x).to.eql(0);
      expect(coordinate.y).to.eql(-0.5);

      coordinate = rectangle.normalize(new ol.Coordinate(-1, 1));
      expect(coordinate.x).to.eql(-0.5);
      expect(coordinate.y).to.eql(0);
    });
  });

  describe('toString', function() {
    it('returns the expected string', function() {
      var rectangle = new ol.Rectangle(0, 1, 2, 3);
      expect(rectangle.toString()).to.eql('(0, 1, 2, 3)');
    });
  });

  describe('scaleFromCenter', function() {
    it('scales the extent from its center', function() {
      var rectangle = new ol.Rectangle(1, 1, 3, 3);
      rectangle.scaleFromCenter(2);
      expect(rectangle.minX).to.eql(0);
      expect(rectangle.minY).to.eql(0);
      expect(rectangle.maxX).to.eql(4);
      expect(rectangle.maxY).to.eql(4);
    });
  });

});

goog.require('ol.Coordinate');
goog.require('ol.Rectangle');
