import VectorImageLayer from '../../../../../src/ol/layer/VectorImage.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import CanvasVectorImageLayerRenderer from '../../../../../src/ol/renderer/canvas/VectorImageLayer.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import {scaleFromCenter} from '../../../../../src/ol/extent.js';
import {create} from '../../../../../src/ol/transform.js';


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

  describe('#prepareFrame', function() {

    it('sets correct extent with imageRatio = 2', function() {
      const layer = new VectorImageLayer({
        imageRatio: 2,
        source: new VectorSource()
      });
      const renderer = new CanvasVectorImageLayerRenderer(layer);
      const projection = getProjection('EPSG:3857');
      const projExtent = projection.getExtent();
      const extent = [
        projExtent[0] - 10000, -10000, projExtent[0] + 10000, 10000
      ];
      const frameState = {
        layerStatesArray: [layer.getLayerState()],
        layerIndex: 0,
        extent: extent,
        viewHints: [],
        pixelToCoordinateTransform: create(),
        viewState: {
          center: [0, 0],
          projection: projection,
          resolution: 1,
          rotation: 0
        }
      };
      renderer.prepareFrame(frameState);
      const expected = renderer.image_.getExtent();

      scaleFromCenter(extent, 2);

      expect(expected).to.eql(extent);
    });
  });

});
