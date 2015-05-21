goog.provide('ol.test.renderer.webgl.ImageLayer');

describe('ol.renderer.webgl.ImageLayer', function() {
  describe('updateProjectionMatrix_', function() {
    var map;
    var renderer;
    var canvasWidth;
    var canvasHeight;
    var viewResolution;
    var viewRotation;
    var viewCenter;
    var imageExtent;

    beforeEach(function() {
      ol.proj.common.add();

      map = new ol.Map({
        target: document.createElement('div')
      });
      var layer = new ol.layer.Image({
        source: new ol.source.Image({
          extent: [0, 0, 1, 1]
        })
      });
      renderer = new ol.renderer.webgl.ImageLayer(map.renderer_, layer);

      // input params
      canvasWidth = 512;
      canvasHeight = 256;
      viewResolution = 10;
      viewRotation = 0;
      viewCenter = [7680, 3840];
      // view extent is 512O, 2560, 10240, 5120

      // image size is 1024, 768
      // image resolution is 10
      imageExtent = [0, 0, 10240, 7680];
    });

    afterEach(function() {
      goog.dispose(map);
    });

    it('produces a correct matrix', function() {

      renderer.updateProjectionMatrix_(canvasWidth, canvasHeight,
          viewCenter, viewResolution, viewRotation, imageExtent);
      var matrix = renderer.getProjectionMatrix();

      var input;
      var output = goog.vec.Vec4.createNumber();

      input = goog.vec.Vec4.createFromValues(-1, -1, 0, 1);
      goog.vec.Mat4.multVec4(matrix, input, output);
      expect(output[0]).to.eql(-3);
      expect(output[1]).to.eql(-3);

      input = goog.vec.Vec4.createFromValues(1, -1, 0, 1);
      goog.vec.Mat4.multVec4(matrix, input, output);
      expect(output[0]).to.eql(1);
      expect(output[1]).to.eql(-3);

      input = goog.vec.Vec4.createFromValues(-1, 1, 0, 1);
      goog.vec.Mat4.multVec4(matrix, input, output);
      expect(output[0]).to.eql(-3);
      expect(output[1]).to.eql(3);

      input = goog.vec.Vec4.createFromValues(1, 1, 0, 1);
      goog.vec.Mat4.multVec4(matrix, input, output);
      expect(output[0]).to.eql(1);
      expect(output[1]).to.eql(3);

      input = goog.vec.Vec4.createFromValues(0, 0, 0, 1);
      goog.vec.Mat4.multVec4(matrix, input, output);
      expect(output[0]).to.eql(-1);
      expect(output[1]).to.eql(0);
    });
  });
});

goog.require('goog.dispose');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Vec4');
goog.require('ol.Map');
goog.require('ol.proj.common');
goog.require('ol.layer.Image');
goog.require('ol.source.Image');
goog.require('ol.renderer.webgl.ImageLayer');
