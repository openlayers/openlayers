import VectorImageLayer from '../../../../../src/ol/layer/VectorImage.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import CanvasVectorImageLayerRenderer from '../../../../../src/ol/renderer/canvas/VectorImageLayer.js';

describe('ol/renderer/canvas/VectorImageLayer', function() {

  describe('#dispose()', function() {

    it('cleans up CanvasVectorRenderer', function() {
      const layer = new VectorImageLayer({
        source: new VectorSource()
      });
      const renderer = new CanvasVectorImageLayerRenderer(layer);
      const spy = sinon.spy(renderer.vectorRenderer_, 'dispose');
      renderer.dispose();
      expect(spy.called).to.be(true);
    });

  });

});
