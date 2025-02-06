import {spy as sinonSpy} from 'sinon';
import Feature from '../../../../../../src/ol/Feature.js';
import ImageCanvas from '../../../../../../src/ol/ImageCanvas.js';
import {scaleFromCenter} from '../../../../../../src/ol/extent.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import VectorImageLayer from '../../../../../../src/ol/layer/VectorImage.js';
import {get as getProjection} from '../../../../../../src/ol/proj.js';
import CanvasVectorImageLayerRenderer from '../../../../../../src/ol/renderer/canvas/VectorImageLayer.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import {create} from '../../../../../../src/ol/transform.js';

describe('ol/renderer/canvas/VectorImageLayer', function () {
  describe('#dispose()', function () {
    it('cleans up CanvasVectorRenderer', function () {
      const layer = new VectorImageLayer({
        source: new VectorSource(),
      });
      const renderer = new CanvasVectorImageLayerRenderer(layer);
      const spy = sinonSpy(renderer.vectorRenderer_, 'dispose');
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
      const extent = [projExtent[0] - 25, -25, projExtent[0] + 25, 25];
      frameState = {
        layerStatesArray: [layer.getLayerState()],
        layerIndex: 0,
        extent: extent,
        size: [100, 100],
        pixelRatio: 1,
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
    it('creates a new image, also when no features are rendered', function () {
      renderer.prepareFrame(frameState);
      expect(renderer.image).to.be.a(ImageCanvas);

      layer.getSource().clear();
      renderer.prepareFrame(frameState);
      const canvas = renderer.image.getImage();
      const centerPixel = canvas
        .getContext('2d')
        .getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;
      expect(Array.from(centerPixel)).to.eql([0, 0, 0, 0]);
    });
    it('sets correct extent with imageRatio = 2', function () {
      const extent = frameState.extent.slice();
      scaleFromCenter(extent, 2);

      renderer.prepareFrame(frameState);
      const imageExtent = renderer.image.getExtent();
      expect(imageExtent).to.eql(extent);
    });
  });
});
