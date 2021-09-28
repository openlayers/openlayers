import CanvasVectorImageLayerRenderer from '../../../../../../src/ol/renderer/canvas/VectorImageLayer.js';
import Feature from '../../../../../../src/ol/Feature.js';
import ImageCanvas from '../../../../../../src/ol/ImageCanvas.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import VectorImageLayer from '../../../../../../src/ol/layer/VectorImage.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import {create} from '../../../../../../src/ol/transform.js';
import {get as getProjection} from '../../../../../../src/ol/proj.js';
import {scaleFromCenter} from '../../../../../../src/ol/extent.js';

describe('ol/renderer/canvas/VectorImageLayer', function () {
  describe('#dispose()', function () {
    it('cleans up CanvasVectorRenderer', function () {
      const layer = new VectorImageLayer({
        source: new VectorSource(),
      });
      const renderer = new CanvasVectorImageLayerRenderer(layer);
      const spy = sinon.spy(renderer.vectorRenderer_, 'dispose');
      renderer.dispose();
      expect(spy.called).to.be(true);
    });
  });

  describe('#prepareFrame', function () {
    /** @type {VectorImageLayer} */
    let layer;
    /** @type {CanvasVectorImageLayerRenderer} */
    let renderer;
    let frameState;
    this.beforeEach(function () {
      layer = new VectorImageLayer({
        imageRatio: 2,
        source: new VectorSource({
          features: [new Feature(new Point([0, 0]))],
        }),
      });
      renderer = new CanvasVectorImageLayerRenderer(layer);
      const projection = getProjection('EPSG:3857');
      const projExtent = projection.getExtent();
      const extent = [
        projExtent[0] - 10000,
        -10000,
        projExtent[0] + 10000,
        10000,
      ];
      frameState = {
        layerStatesArray: [layer.getLayerState()],
        layerIndex: 0,
        extent: extent,
        viewHints: [],
        pixelToCoordinateTransform: create(),
        viewState: {
          center: [0, 0],
          projection: projection,
          resolution: 1,
          rotation: 0,
        },
      };
    });
    it('sets image to null if no features are rendered', function () {
      renderer.prepareFrame(frameState);
      expect(renderer.image_).to.be.a(ImageCanvas);

      layer.getSource().clear();
      renderer.prepareFrame(frameState);
      expect(renderer.image_).to.be(null);
    });
    it('sets correct extent with imageRatio = 2', function () {
      const extent = frameState.extent.slice();
      scaleFromCenter(extent, 2);

      renderer.prepareFrame(frameState);
      const imageExtent = renderer.image_.getExtent();
      expect(imageExtent).to.eql(extent);
    });
  });
});
