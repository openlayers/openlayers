

import _ol_transform_ from '../../../../../src/ol/transform';
import _ol_Map_ from '../../../../../src/ol/map';
import _ol_layer_Image_ from '../../../../../src/ol/layer/image';
import _ol_source_Image_ from '../../../../../src/ol/source/image';
import _ol_renderer_webgl_ImageLayer_ from '../../../../../src/ol/renderer/webgl/imagelayer';


describe('ol.renderer.webgl.ImageLayer', function() {
  describe('updateProjectionMatrix_', function() {
    var map;
    var renderer;
    var canvasWidth;
    var canvasHeight;
    var pixelRatio;
    var viewResolution;
    var viewRotation;
    var viewCenter;
    var imageExtent;

    beforeEach(function() {
      map = new _ol_Map_({
        target: document.createElement('div')
      });
      var layer = new _ol_layer_Image_({
        source: new _ol_source_Image_({
          extent: [0, 0, 1, 1]
        })
      });
      renderer = new _ol_renderer_webgl_ImageLayer_(map.renderer_, layer);

      // input params
      canvasWidth = 512;
      canvasHeight = 256;
      pixelRatio = 2;
      viewResolution = 10;
      viewRotation = 0;
      viewCenter = [7680, 3840];
      // view extent is 512O, 2560, 10240, 5120

      // image size is 1024, 768
      // image resolution is 10
      imageExtent = [0, 0, 10240, 7680];
    });

    afterEach(function() {
      map.dispose();
    });

    it('produces a correct matrix', function() {

      renderer.updateProjectionMatrix_(canvasWidth, canvasHeight,
          pixelRatio, viewCenter, viewResolution, viewRotation, imageExtent);
      var matrix = renderer.getProjectionMatrix();

      var output = _ol_transform_.apply(matrix, [-1, -1]);
      expect(output[0]).to.eql(-6);
      expect(output[1]).to.eql(-6);

      output = _ol_transform_.apply(matrix, [1, -1]);
      expect(output[0]).to.eql(2);
      expect(output[1]).to.eql(-6);

      output = _ol_transform_.apply(matrix, [-1, 1]);
      expect(output[0]).to.eql(-6);
      expect(output[1]).to.eql(6);

      output = _ol_transform_.apply(matrix, [1, 1]);
      expect(output[0]).to.eql(2);
      expect(output[1]).to.eql(6);

      output = _ol_transform_.apply(matrix, [0, 0]);
      expect(output[0]).to.eql(-2);
      expect(output[1]).to.eql(0);
    });
  });
});
