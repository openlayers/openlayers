goog.provide('ol.test.render.webgl.Replay');

goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.render.webgl.ImageReplay');
goog.require('ol.render.webgl.LineStringReplay');
goog.require('ol.render.webgl.PolygonReplay');
goog.require('ol.style.Fill');
goog.require('ol.style.Image');
goog.require('ol.style.Stroke');


describe('ol.render.webgl.ImageReplay', function() {
  var replay;

  var createImageStyle = function(image) {
    var imageStyle = new ol.style.Image({
      opacity: 0.1,
      rotateWithView: true,
      rotation: 1.5,
      scale: 2.0
    });
    imageStyle.getAnchor = function() {
      return [0.5, 1];
    };
    imageStyle.getImage = function() {
      return image;
    };
    imageStyle.getHitDetectionImage = function() {
      return image;
    };
    imageStyle.getImageSize = function() {
      return [512, 512];
    };
    imageStyle.getHitDetectionImageSize = function() {
      return [512, 512];
    };
    imageStyle.getOrigin = function() {
      return [200, 200];
    };
    imageStyle.getSize = function() {
      return [256, 256];
    };
    return imageStyle;
  };

  beforeEach(function() {
    var tolerance = 0.1;
    var maxExtent = [-10000, -20000, 10000, 20000];
    replay = new ol.render.webgl.ImageReplay(tolerance, maxExtent);
  });

  describe('#setImageStyle', function() {

    var imageStyle1, imageStyle2;

    beforeEach(function() {
      imageStyle1 = createImageStyle(new Image());
      imageStyle2 = createImageStyle(new Image());
    });

    it('set expected states', function() {
      replay.setImageStyle(imageStyle1);
      expect(replay.anchorX_).to.be(0.5);
      expect(replay.anchorY_).to.be(1);
      expect(replay.height_).to.be(256);
      expect(replay.imageHeight_).to.be(512);
      expect(replay.imageWidth_).to.be(512);
      expect(replay.opacity_).to.be(0.1);
      expect(replay.originX_).to.be(200);
      expect(replay.originY_).to.be(200);
      expect(replay.rotation_).to.be(1.5);
      expect(replay.rotateWithView_).to.be(true);
      expect(replay.scale_).to.be(2.0);
      expect(replay.width_).to.be(256);
      expect(replay.images_).to.have.length(1);
      expect(replay.groupIndices_).to.have.length(0);
      expect(replay.hitDetectionImages_).to.have.length(1);
      expect(replay.hitDetectionGroupIndices_).to.have.length(0);

      replay.setImageStyle(imageStyle1);
      expect(replay.images_).to.have.length(1);
      expect(replay.groupIndices_).to.have.length(0);
      expect(replay.hitDetectionImages_).to.have.length(1);
      expect(replay.hitDetectionGroupIndices_).to.have.length(0);

      replay.setImageStyle(imageStyle2);
      expect(replay.images_).to.have.length(2);
      expect(replay.groupIndices_).to.have.length(1);
      expect(replay.hitDetectionImages_).to.have.length(2);
      expect(replay.hitDetectionGroupIndices_).to.have.length(1);
    });
  });

  describe('#drawPoint', function() {
    beforeEach(function() {
      var imageStyle = createImageStyle(new Image());
      replay.setImageStyle(imageStyle);
    });

    it('sets the buffer data', function() {
      var point;

      point = new ol.geom.Point([1000, 2000]);
      replay.drawPoint(point, null);
      expect(replay.vertices).to.have.length(32);
      expect(replay.indices).to.have.length(6);
      expect(replay.indices[0]).to.be(0);
      expect(replay.indices[1]).to.be(1);
      expect(replay.indices[2]).to.be(2);
      expect(replay.indices[3]).to.be(0);
      expect(replay.indices[4]).to.be(2);
      expect(replay.indices[5]).to.be(3);

      point = new ol.geom.Point([2000, 3000]);
      replay.drawPoint(point, null);
      expect(replay.vertices).to.have.length(64);
      expect(replay.indices).to.have.length(12);
      expect(replay.indices[6]).to.be(4);
      expect(replay.indices[7]).to.be(5);
      expect(replay.indices[8]).to.be(6);
      expect(replay.indices[9]).to.be(4);
      expect(replay.indices[10]).to.be(6);
      expect(replay.indices[11]).to.be(7);
    });
  });

  describe('#drawMultiPoint', function() {
    beforeEach(function() {
      var imageStyle = createImageStyle(new Image());
      replay.setImageStyle(imageStyle);
    });

    it('sets the buffer data', function() {
      var multiPoint;

      multiPoint = new ol.geom.MultiPoint(
          [[1000, 2000], [2000, 3000]]);
      replay.drawMultiPoint(multiPoint, null);
      expect(replay.vertices).to.have.length(64);
      expect(replay.indices).to.have.length(12);
      expect(replay.indices[0]).to.be(0);
      expect(replay.indices[1]).to.be(1);
      expect(replay.indices[2]).to.be(2);
      expect(replay.indices[3]).to.be(0);
      expect(replay.indices[4]).to.be(2);
      expect(replay.indices[5]).to.be(3);
      expect(replay.indices[6]).to.be(4);
      expect(replay.indices[7]).to.be(5);
      expect(replay.indices[8]).to.be(6);
      expect(replay.indices[9]).to.be(4);
      expect(replay.indices[10]).to.be(6);
      expect(replay.indices[11]).to.be(7);

      multiPoint = new ol.geom.MultiPoint(
          [[3000, 4000], [4000, 5000]]);
      replay.drawMultiPoint(multiPoint, null);
      expect(replay.vertices).to.have.length(128);
      expect(replay.indices).to.have.length(24);
      expect(replay.indices[12]).to.be(8);
      expect(replay.indices[13]).to.be(9);
      expect(replay.indices[14]).to.be(10);
      expect(replay.indices[15]).to.be(8);
      expect(replay.indices[16]).to.be(10);
      expect(replay.indices[17]).to.be(11);
      expect(replay.indices[18]).to.be(12);
      expect(replay.indices[19]).to.be(13);
      expect(replay.indices[20]).to.be(14);
      expect(replay.indices[21]).to.be(12);
      expect(replay.indices[22]).to.be(14);
      expect(replay.indices[23]).to.be(15);
    });
  });
});

describe('ol.render.webgl.LineStringReplay', function() {
  var replay;

  var strokeStyle1 = new ol.style.Stroke({
    color: [0, 255, 0, 0.4]
  });

  var strokeStyle2 = new ol.style.Stroke({
    color: [255, 0, 0, 1],
    lineCap: 'square',
    lineJoin: 'miter'
  });

  beforeEach(function() {
    var tolerance = 0.1;
    var maxExtent = [-10000, -20000, 10000, 20000];
    replay = new ol.render.webgl.LineStringReplay(tolerance, maxExtent);
  });

  describe('#setFillStrokeStyle', function() {

    it('set expected states', function() {
      replay.setFillStrokeStyle(null, strokeStyle1);
      expect(replay.state_).not.be(null);
      expect(replay.state_.lineCap).to.be('round');
      expect(replay.state_.lineJoin).to.be('round');
      expect(replay.state_.strokeColor).to.eql([0, 1, 0, 0.4]);
      expect(replay.state_.lineWidth).to.be(1);
      expect(replay.state_.miterLimit).to.be(10);
      expect(replay.state_.changed).to.be(true);
      expect(replay.styles_).to.have.length(1);

      replay.setFillStrokeStyle(null, strokeStyle2);
      expect(replay.state_.lineCap).to.be('square');
      expect(replay.state_.lineJoin).to.be('miter');
      expect(replay.state_.strokeColor).to.eql([1, 0, 0, 1]);
      expect(replay.state_.lineWidth).to.be(1);
      expect(replay.state_.miterLimit).to.be(10);
      expect(replay.state_.changed).to.be(true);
      expect(replay.styles_).to.have.length(2);

    });
  });

  describe('#drawLineString', function() {

    it('sets the buffer data', function() {
      var linestring;

      linestring = new ol.geom.LineString(
          [[1000, 2000], [2000, 3000]]);
      replay.setFillStrokeStyle(null, strokeStyle1);
      replay.drawLineString(linestring, null);
      expect(replay.vertices).to.have.length(56);
      expect(replay.indices).to.have.length(18);
      expect(replay.state_.changed).to.be(false);
      expect(replay.startIndices).to.have.length(1);
      expect(replay.startIndicesFeature).to.have.length(1);

      linestring = new ol.geom.LineString(
          [[1000, 3000], [2000, 4000], [3000, 3000]]);
      replay.drawLineString(linestring, null);
      expect(replay.vertices).to.have.length(140);
      expect(replay.indices).to.have.length(48);
      expect(replay.state_.changed).to.be(false);
      expect(replay.startIndices).to.have.length(2);
      expect(replay.startIndicesFeature).to.have.length(2);
    });
  });

  describe('#drawMultiLineString', function() {

    it('sets the buffer data', function() {
      var multilinestring;

      multilinestring = new ol.geom.MultiLineString(
          [[[1000, 2000], [2000, 3000]],
          [[1000, 3000], [2000, 4000], [3000, 3000]]]);
      replay.setFillStrokeStyle(null, strokeStyle1);
      replay.drawMultiLineString(multilinestring, null);
      expect(replay.vertices).to.have.length(140);
      expect(replay.indices).to.have.length(48);
      expect(replay.state_.changed).to.be(false);
      expect(replay.startIndices).to.have.length(1);
      expect(replay.startIndicesFeature).to.have.length(1);
    });
  });

  describe('#drawCoordinates_', function() {

    it('triangulates linestrings', function() {
      var linestring;

      var stroke = new ol.style.Stroke({
        color: [0, 255, 0, 1],
        lineCap: 'butt',
        lineJoin: 'bevel'
      });

      linestring = new ol.geom.LineString(
          [[1000, 3000], [2000, 4000], [3000, 3000]]);
      var flatCoordinates = linestring.getFlatCoordinates();
      replay.setFillStrokeStyle(null, stroke);
      replay.drawCoordinates_(flatCoordinates, 0,
          flatCoordinates.length, 2);
      expect(replay.indices).to.eql(
          [2, 0, 1, 4, 2, 1,
          2, 4, 3,
          5, 3, 4, 4, 6, 5]);
    });

    it('optionally creates miters', function() {
      var linestring;

      var stroke = new ol.style.Stroke({
        color: [0, 255, 0, 1],
        lineCap: 'butt'
      });

      linestring = new ol.geom.LineString(
          [[1000, 3000], [2000, 4000], [3000, 3000]]);
      var flatCoordinates = linestring.getFlatCoordinates();
      replay.setFillStrokeStyle(null, stroke);
      replay.drawCoordinates_(flatCoordinates, 0,
          flatCoordinates.length, 2);
      expect(replay.indices).to.eql(
          [2, 0, 1, 4, 2, 1,
          2, 4, 3, 3, 5, 2,
          6, 3, 4, 4, 7, 6]);
    });

    it('optionally creates caps', function() {
      var linestring;

      var stroke = new ol.style.Stroke({
        color: [0, 255, 0, 1]
      });

      linestring = new ol.geom.LineString(
          [[1000, 3000], [2000, 4000], [3000, 3000]]);
      var flatCoordinates = linestring.getFlatCoordinates();
      replay.setFillStrokeStyle(null, stroke);
      replay.drawCoordinates_(flatCoordinates, 0,
          flatCoordinates.length, 2);
      expect(replay.indices).to.eql(
          [2, 0, 1, 1, 3, 2,
          4, 2, 3, 6, 4, 3,
          4, 6, 5, 5, 7, 4,
          8, 5, 6, 6, 9, 8,
          10, 8, 9, 9, 11, 10]);
    });

    it('respects segment orientation', function() {
      var linestring;

      var stroke = new ol.style.Stroke({
        color: [0, 255, 0, 1],
        lineCap: 'butt',
        lineJoin: 'bevel'
      });

      linestring = new ol.geom.LineString(
          [[1000, 3000], [2000, 2000], [3000, 3000]]);
      var flatCoordinates = linestring.getFlatCoordinates();
      replay.setFillStrokeStyle(null, stroke);
      replay.drawCoordinates_(flatCoordinates, 0,
          flatCoordinates.length, 2);
      expect(replay.indices).to.eql(
          [2, 0, 1, 4, 2, 0,
          2, 4, 3,
          5, 3, 4, 4, 6, 5]);
    });

    it('closes boundaries', function() {
      var linestring;

      var stroke = new ol.style.Stroke({
        color: [0, 255, 0, 1],
        lineCap: 'butt',
        lineJoin: 'bevel'
      });

      linestring = new ol.geom.LineString(
          [[1000, 3000], [2000, 4000], [3000, 3000], [1000, 3000]]);
      var flatCoordinates = linestring.getFlatCoordinates();
      replay.setFillStrokeStyle(null, stroke);
      replay.drawCoordinates_(flatCoordinates, 0,
          flatCoordinates.length, 2);
      expect(replay.indices).to.eql(
          [0, 2, 1, 3, 1, 2,
          5, 3, 2,
          3, 5, 4, 6, 4, 5,
          8, 6, 5,
          6, 8, 7, 9, 7, 8,
          10, 9, 8]);
      expect(replay.vertices.slice(0, 7)).to.eql(
          replay.vertices.slice(-14, -7));
      expect(replay.vertices.slice(14, 21)).to.eql(
          replay.vertices.slice(-7));
    });
  });
});


describe('ol.render.webgl.PolygonReplay', function() {
  var replay;

  var fillStyle = new ol.style.Fill({
    color: [0, 0, 255, 0.5]
  });
  var strokeStyle = new ol.style.Stroke({
    color: [0, 255, 0, 0.4]
  });

  beforeEach(function() {
    var tolerance = 0.1;
    var maxExtent = [-10000, -20000, 10000, 20000];
    replay = new ol.render.webgl.PolygonReplay(tolerance, maxExtent);
  });

  describe('#drawPolygonGeometry', function() {
    beforeEach(function() {
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
    });

    it('sets the buffer data', function() {
      var polygon1 = new ol.geom.Polygon(
          [[[1000, 2000], [1200, 2000], [1200, 3000]]]
          );
      replay.drawPolygonGeometry(polygon1, null);
      expect(replay.vertices_).to.have.length(18);
      expect(replay.indices_).to.have.length(3);

      expect(replay.vertices_).to.eql([
        1200, 2000, 0, 0, 1, 0.5,
        1200, 3000, 0, 0, 1, 0.5,
        1000, 2000, 0, 0, 1, 0.5]);
      expect(replay.indices_).to.eql([0, 1, 2]);

      expect(replay.lineStringReplay_.vertices_).to.have.length(24);
      expect(replay.lineStringReplay_.vertices_).to.eql([
        1000, 2000, 0, 1, 0, 0.4,
        1200, 2000, 0, 1, 0, 0.4,
        1200, 2000, 0, 1, 0, 0.4,
        1200, 3000, 0, 1, 0, 0.4
      ]);

      var polygon2 = new ol.geom.Polygon(
          [[[4000, 2000], [4200, 2000], [4200, 3000]]]
          );
      replay.drawPolygonGeometry(polygon2, null);
      expect(replay.vertices_).to.have.length(36);
      expect(replay.indices_).to.have.length(6);

      expect(replay.vertices_).to.eql([
        1200, 2000, 0, 0, 1, 0.5,
        1200, 3000, 0, 0, 1, 0.5,
        1000, 2000, 0, 0, 1, 0.5,
        4200, 2000, 0, 0, 1, 0.5,
        4200, 3000, 0, 0, 1, 0.5,
        4000, 2000, 0, 0, 1, 0.5
      ]);
      expect(replay.indices_).to.eql([0, 1, 2, 3, 4, 5]);
    });
  });

  describe('#drawMultiPolygonGeometry', function() {
    beforeEach(function() {
      replay.setFillStrokeStyle(fillStyle, strokeStyle);
    });

    it('sets the buffer data', function() {
      var multiPolygon = new ol.geom.MultiPolygon([
        [[[1000, 2000], [1200, 2000], [1200, 3000]]],
        [[[4000, 2000], [4200, 2000], [4200, 3000]]]
      ]);
      replay.drawMultiPolygonGeometry(multiPolygon, null);
      expect(replay.vertices_).to.have.length(36);
      expect(replay.indices_).to.have.length(6);

      expect(replay.vertices_).to.eql([
        1200, 2000, 0, 0, 1, 0.5,
        1200, 3000, 0, 0, 1, 0.5,
        1000, 2000, 0, 0, 1, 0.5,
        4200, 2000, 0, 0, 1, 0.5,
        4200, 3000, 0, 0, 1, 0.5,
        4000, 2000, 0, 0, 1, 0.5
      ]);
      expect(replay.indices_).to.eql([0, 1, 2, 3, 4, 5]);
    });
  });
});
