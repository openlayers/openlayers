import {apply as applyTransform} from '../../../../../src/ol/transform.js';
import Map from '../../../../../src/ol/Map.js';
import ImageLayer from '../../../../../src/ol/layer/Image.js';
import ImageSource from '../../../../../src/ol/source/Image.js';
import WebGLImageLayerRenderer from '../../../../../src/ol/renderer/webgl/ImageLayer.js';


describe('ol.renderer.webgl.ImageLayer', function() {
  describe('updateProjectionMatrix_', function() {
    let map;
    let renderer;
    let canvasWidth;
    let canvasHeight;
    let pixelRatio;
    let viewResolution;
    let viewRotation;
    let viewCenter;
    let imageExtent;

    beforeEach(function() {
      map = new Map({
        target: document.createElement('div')
      });
      const layer = new ImageLayer({
        source: new ImageSource({
          extent: [0, 0, 1, 1]
        })
      });
      renderer = new WebGLImageLayerRenderer(map.renderer_, layer);

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
      const matrix = renderer.getProjectionMatrix();

      let output = applyTransform(matrix, [-1, -1]);
      expect(output[0]).to.eql(-6);
      expect(output[1]).to.eql(-6);

      output = applyTransform(matrix, [1, -1]);
      expect(output[0]).to.eql(2);
      expect(output[1]).to.eql(-6);

      output = applyTransform(matrix, [-1, 1]);
      expect(output[0]).to.eql(-6);
      expect(output[1]).to.eql(6);

      output = applyTransform(matrix, [1, 1]);
      expect(output[0]).to.eql(2);
      expect(output[1]).to.eql(6);

      output = applyTransform(matrix, [0, 0]);
      expect(output[0]).to.eql(-2);
      expect(output[1]).to.eql(0);
    });
  });
});
