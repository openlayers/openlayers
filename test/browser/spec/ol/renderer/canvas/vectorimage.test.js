import {assert} from 'chai';
import Feature from '../../../../../../src/ol/Feature.js';
import ImageCanvas from '../../../../../../src/ol/ImageCanvas.js';
import {
  getForViewAndSize,
  scaleFromCenter,
} from '../../../../../../src/ol/extent.js';
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
      const spy = vi.spyOn(renderer.vectorRenderer_, 'dispose');
      renderer.dispose();
      assert.isAbove(spy.mock.calls.length, 0);
    });
  });

  describe('#prepareFrame', function () {
    /** @type {VectorImageLayer} */
    let layer;
    /** @type {CanvasVectorImageLayerRenderer} */
    let renderer;
    let frameState;
    beforeEach(function () {
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
      assert.instanceOf(renderer.image, ImageCanvas);

      layer.getSource().clear();
      renderer.prepareFrame(frameState);
      const canvas = renderer.image.getImage();
      const centerPixel = canvas
        .getContext('2d')
        .getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;
      assert.deepEqual(Array.from(centerPixel), [0, 0, 0, 0]);
    });
    it('sets correct extent with imageRatio = 2', function () {
      const extent = frameState.extent.slice();
      scaleFromCenter(extent, 2);

      renderer.prepareFrame(frameState);
      const imageExtent = renderer.image.getExtent();
      assert.deepEqual(imageExtent, extent);
    });
    it('keeps a north-up image on a rotated view', function () {
      frameState.viewState.rotation = Math.PI / 7;
      renderer.prepareFrame(frameState);
      assert.strictEqual(renderer.image.getRotation(), 0);
    });
  });

  describe('#prepareFrame with rotateContent', function () {
    /** @type {VectorImageLayer} */
    let layer;
    /** @type {CanvasVectorImageLayerRenderer} */
    let renderer;

    function createFrameState(rotation, size) {
      return {
        layerStatesArray: [layer.getLayerState()],
        layerIndex: 0,
        extent: getForViewAndSize([0, 0], 1, rotation, size),
        size: size,
        pixelRatio: 1,
        viewHints: [],
        pixelToCoordinateTransform: create(),
        viewState: {
          center: [0, 0],
          projection: getProjection('EPSG:3857'),
          resolution: 1,
          rotation: rotation,
        },
      };
    }

    beforeEach(function () {
      layer = new VectorImageLayer({
        imageRatio: 2,
        rotateContent: true,
        source: new VectorSource({
          features: [new Feature(new Point([0, 0]))],
        }),
      });
      renderer = new CanvasVectorImageLayerRenderer(layer);
    });

    it('creates a screen-aligned image with padded size, extent and rotation', function () {
      renderer.prepareFrame(createFrameState(Math.PI / 7, [100, 100]));
      const image = renderer.image;
      assert.strictEqual(image.getRotation(), Math.PI / 7);
      // imageRatio 2 pads the 100x100 viewport by 50 device pixels per side
      assert.deepEqual(image.getExtent(), [-100, -100, 100, 100]);
      assert.strictEqual(image.getImage().width, 200);
      assert.strictEqual(image.getImage().height, 200);
    });

    it('re-renders the image when only the rotation changes', function () {
      renderer.prepareFrame(createFrameState(Math.PI / 7, [100, 100]));
      const image = renderer.image;
      renderer.prepareFrame(createFrameState(Math.PI / 4, [100, 100]));
      assert.notStrictEqual(renderer.image, image);
      assert.strictEqual(renderer.image.getRotation(), Math.PI / 4);
    });
  });

  describe('#renderFrame with rotateContent', function () {
    /** @type {VectorImageLayer} */
    let layer;
    /** @type {CanvasVectorImageLayerRenderer} */
    let renderer;
    let frameState;

    beforeEach(function () {
      layer = new VectorImageLayer({
        imageRatio: 2,
        rotateContent: true,
        source: new VectorSource({
          features: [new Feature(new Point([0, 0]))],
        }),
      });
      renderer = new CanvasVectorImageLayerRenderer(layer);
      const size = [100, 100];
      const rotation = Math.PI / 7;
      frameState = {
        layerStatesArray: [layer.getLayerState()],
        layerIndex: 0,
        extent: getForViewAndSize([0, 0], 1, rotation, size),
        size: size,
        pixelRatio: 1,
        viewHints: [],
        declutter: null,
        pixelToCoordinateTransform: create(),
        viewState: {
          center: [0, 0],
          projection: getProjection('EPSG:3857'),
          resolution: 1,
          rotation: rotation,
        },
      };
      renderer.prepareFrame(frameState);
      renderer.renderFrame(frameState, null);
    });

    it('copies the settled image with a whole-pixel translation', function () {
      const context = renderer.getCanvasContext();
      const setTransformSpy = vi.spyOn(context, 'setTransform');
      const drawImageSpy = vi.spyOn(context, 'drawImage');
      renderer.renderFrame(frameState, null);
      assert.strictEqual(setTransformSpy.mock.calls.length, 1);
      const transformArgs = setTransformSpy.mock.calls[0];
      assert.strictEqual(transformArgs[0], 1);
      assert.strictEqual(transformArgs[1], 0);
      assert.strictEqual(transformArgs[2], 0);
      assert.strictEqual(transformArgs[3], 1);
      // imageRatio 2 padding: the 200x200 image lands 50 pixels up and left of
      // the 100x100 canvas
      assert.strictEqual(transformArgs[4], -50);
      assert.strictEqual(transformArgs[5], -50);
      assert.strictEqual(drawImageSpy.mock.calls.length, 1);
      const drawImageArgs = drawImageSpy.mock.calls[0];
      assert.strictEqual(drawImageArgs.length, 3);
      assert.strictEqual(drawImageArgs[1], 0);
      assert.strictEqual(drawImageArgs[2], 0);
    });

    it('rotates the stale image by the remaining delta during interaction', function () {
      const context = renderer.getCanvasContext();
      const setTransformSpy = vi.spyOn(context, 'setTransform');
      frameState.viewState = Object.assign({}, frameState.viewState, {
        rotation: Math.PI / 4,
      });
      renderer.renderFrame(frameState, null);
      const transformArgs = setTransformSpy.mock.calls[0];
      const delta = Math.atan2(transformArgs[1], transformArgs[0]);
      assert.closeTo(delta, Math.PI / 4 - Math.PI / 7, 1e-12);
    });
  });
});
