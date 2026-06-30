import {assert} from 'chai';
import Feature from '../../../../../../src/ol/Feature.js';
import ImageWrapper from '../../../../../../src/ol/Image.js';
import ImageState from '../../../../../../src/ol/ImageState.js';
import Map from '../../../../../../src/ol/Map.js';
import View from '../../../../../../src/ol/View.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import ImageLayer from '../../../../../../src/ol/layer/Image.js';
import VectorImageLayer from '../../../../../../src/ol/layer/VectorImage.js';
import {get as getProj} from '../../../../../../src/ol/proj.js';
import Projection from '../../../../../../src/ol/proj/Projection.js';
import CanvasImageLayerRenderer from '../../../../../../src/ol/renderer/canvas/ImageLayer.js';
import Static from '../../../../../../src/ol/source/ImageStatic.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';

describe('ol/renderer/canvas/ImageLayer', function () {
  describe('#getData', function () {
    let map, target, source;
    /** @type {ImageLayer} */
    let layer;
    beforeEach(
      () =>
        new Promise((resolve) => {
          const projection = new Projection({
            code: 'custom-image',
            units: 'pixels',
            extent: [0, 0, 200, 200],
          });
          target = document.createElement('div');
          target.style.width = '100px';
          target.style.height = '100px';
          document.body.appendChild(target);
          source = new Static({
            url: 'spec/ol/data/dot.png',
            projection: projection,
            imageExtent: [0, 0, 20, 20],
          });
          layer = new ImageLayer({
            source: source,
          });
          map = new Map({
            pixelRatio: 1,
            target: target,
            layers: [layer],
            view: new View({
              projection: projection,
              center: [10, 10],
              zoom: 2,
              maxZoom: 8,
            }),
          });
          source.on('imageloadend', function () {
            resolve();
          });
        }),
    );

    afterEach(function () {
      disposeMap(map);
    });

    it('properly detects pixels', function () {
      map.renderSync();

      assert.notEqual(layer.getData([20, 80])[3], 0);
      assert.strictEqual(layer.getData([10, 90])[3], 0);
    });
  });

  describe('#getData Image CORS', function () {
    let map,
      target,
      imageExtent,
      projection,
      sourceCross,
      source,
      imageLayer,
      imageLayerCross;
    beforeEach(
      () =>
        new Promise((resolve, reject) => {
          projection = new Projection({
            code: 'custom-image',
            units: 'pixels',
            extent: [0, 0, 200, 200],
          });
          target = document.createElement('div');
          target.style.width = '100px';
          target.style.height = '100px';
          document.body.appendChild(target);
          imageExtent = [0, 0, 20, 20];
          source = new Static({
            url: `https://openlayers.org/assets/theme/img/logo70.png`,
            projection: projection,
            imageExtent: imageExtent,
          });
          imageLayer = new ImageLayer({
            source: source,
          });
          sourceCross = new Static({
            url: `https://openlayers.org/assets/theme/img/logo70.png`,
            projection: projection,
            imageExtent: imageExtent,
            crossOrigin: 'anonymous',
          });
          imageLayerCross = new ImageLayer({
            source: sourceCross,
          });
          map = new Map({
            pixelRatio: 1,
            target: target,
            layers: [imageLayer, imageLayerCross],
            view: new View({
              projection: projection,
              center: [10, 10],
              zoom: 1,
              maxZoom: 8,
            }),
          });
          let loadedCount = 0;
          [source, sourceCross].forEach(function (source) {
            source.once('imageloadend', function () {
              loadedCount++;
              if (loadedCount === 2) {
                resolve();
              }
            });
            source.once('imageloaderror', function () {
              reject(new Error('Image failed to load'));
              return;
            });
          });
        }),
    );

    afterEach(function () {
      disposeMap(map);
    });

    it('should not detect pixels when crossOrigin is not set', function () {
      imageLayerCross.setVisible(false);
      imageLayer.setVisible(true);
      map.renderSync();

      assert.strictEqual(imageLayer.getData([50, 50]), null);
      assert.strictEqual(imageLayer.getData([10, 10]), null);
    });

    it('should not detect pixels outside of the layer extent with crossOrigin set', function () {
      imageLayerCross.setVisible(true);
      imageLayer.setVisible(false);
      map.renderSync();

      assert.notEqual(imageLayerCross.getData([50, 50]), null);
      assert.strictEqual(imageLayerCross.getData([10, 10]), null);
    });

    it('should not detect pixels outside of the layer extent with extent set', function () {
      imageLayerCross.setVisible(true);
      imageLayerCross.setExtent(imageExtent);
      imageLayer.setVisible(false);
      map.renderSync();

      assert.notEqual(imageLayerCross.getData([50, 50]), null);
      assert.strictEqual(imageLayerCross.getData([10, 10]), null);
    });
  });

  describe('Image rendering', function () {
    let map, div, layer;

    beforeEach(
      () =>
        new Promise((resolve) => {
          const projection = getProj('EPSG:3857');
          layer = new ImageLayer({
            source: new Static({
              url: 'spec/ol/data/osm-0-0-0.png',
              imageExtent: projection.getExtent(),
              projection: projection,
            }),
          });

          div = document.createElement('div');
          div.style.width = '100px';
          div.style.height = '100px';
          document.body.appendChild(div);
          map = new Map({
            target: div,
            layers: [layer],
            view: new View({
              center: [0, 0],
              zoom: 2,
            }),
          });
          layer.getSource().on('imageloadend', function () {
            resolve();
          });
        }),
    );

    afterEach(function () {
      disposeMap(map);
    });

    it('dispatches prerender and postrender events on the image layer', () =>
      new Promise((resolve) => {
        let prerender = 0;
        let postrender = 0;
        layer.on('prerender', function () {
          ++prerender;
        });
        layer.on('postrender', function () {
          ++postrender;
        });
        map.on('postrender', function () {
          assert.strictEqual(prerender, 1);
          assert.strictEqual(postrender, 1);
          resolve();
        });
      }));

    it('image smoothing is re-enabled after rendering', () =>
      new Promise((resolve) => {
        let context;
        layer.on('postrender', function (e) {
          context = e.context;
          context.imageSmoothingEnabled = false;
        });
        map.on('postrender', function () {
          assert.strictEqual(context.imageSmoothingEnabled, true);
          resolve();
        });
      }));
  });

  describe('Vector image rendering', function () {
    let map, div, layer;

    beforeEach(function () {
      layer = new VectorImageLayer({
        source: new VectorSource({
          features: [new Feature(new Point([0, 0]))],
        }),
      });

      div = document.createElement('div');
      div.style.width = '100px';
      div.style.height = '100px';
      document.body.appendChild(div);
      map = new Map({
        target: div,
        layers: [layer],
        view: new View({
          center: [0, 0],
          zoom: 2,
        }),
      });
    });

    afterEach(function () {
      disposeMap(map);
    });

    it('dispatches prerender and postrender events on the vector layer', () =>
      new Promise((resolve) => {
        let prerender = 0;
        let postrender = 0;
        layer.on('prerender', function () {
          ++prerender;
        });
        layer.on('postrender', function () {
          ++postrender;
        });
        map.once('postrender', function () {
          assert.strictEqual(prerender, 1);
          assert.strictEqual(postrender, 1);
          resolve();
        });
      }));
  });
  describe('renderFrame', function () {
    const projection = new Projection({
      code: 'custom-image',
      units: 'pixels',
      extent: [0, 0, 256, 256],
    });
    let renderer, layer;
    function createLayerFrameState(extent) {
      layer = new ImageLayer({
        source: new Static({
          url: 'spec/ol/data/osm-0-0-0.png',
          imageExtent: projection.getExtent(),
          projection: projection,
        }),
        extent: extent,
      });
      layer.getSource().getImage([0, 0, 100, 100], 1, 1, projection).load();
      renderer = layer.getRenderer();
      renderer.renderWorlds = vi.fn();
      renderer.clipUnrotated = vi.fn();
      renderer.useContainer = function () {
        CanvasImageLayerRenderer.prototype.useContainer.apply(this, arguments);
        vi.spyOn(this.context, 'drawImage');
      };
      return {
        pixelRatio: 1,
        time: 1000000000000,
        viewState: {
          center: [0, 0],
          projection: projection,
          resolution: 1,
          rotation: 0,
        },
        animate: false,
        coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
        extent: [0, 0, 100, 100],
        index: 0,
        layerStatesArray: [layer.getLayerState()],
        layerIndex: 0,
        pixelToCoordinateTransform: [1, 0, 0, 1, 0, 0],
        size: [100, 100],
        viewHints: [],
      };
    }
    it('does not render if layer extent does not intersect view extent', () =>
      new Promise((resolve, reject) => {
        const frameState = createLayerFrameState([200, 200, 300, 300]);
        layer.getSource().on('imageloadend', function () {
          try {
            assert.strictEqual(renderer.prepareFrame(frameState), false);
            resolve();
          } catch (e) {
            reject(e);
            return;
          }
        });
      }));
    it('renders if layer extent partially intersects view extent', () =>
      new Promise((resolve, reject) => {
        const frameState = createLayerFrameState([50, 50, 150, 150]);
        layer.getSource().on('imageloadend', function () {
          if (renderer.prepareFrame(frameState)) {
            renderer.renderFrame(frameState, null);
          }
          try {
            assert.strictEqual(renderer.clipUnrotated.mock.calls.length, 1);
            assert.strictEqual(renderer.context.drawImage.mock.calls.length, 1);
            resolve();
          } catch (e) {
            reject(e);
            return;
          }
        });
      }));
    it('renders without clipping when layer extent covers view', () =>
      new Promise((resolve, reject) => {
        const frameState = createLayerFrameState([0, 0, 100, 100]);
        layer.getSource().on('imageloadend', function () {
          if (renderer.prepareFrame(frameState)) {
            renderer.renderFrame(frameState, null);
          }
          try {
            assert.strictEqual(renderer.clipUnrotated.mock.calls.length, 0);
            assert.strictEqual(renderer.context.drawImage.mock.calls.length, 1);
            resolve();
          } catch (e) {
            reject(e);
            return;
          }
        });
      }));
    it('resets image when empty', () =>
      new Promise((resolve, reject) => {
        const frameState = createLayerFrameState([0, 0, 100, 100]);
        layer.getSource().on('imageloadend', function () {
          if (renderer.prepareFrame(frameState)) {
            renderer.renderFrame(frameState, null);
          }
          try {
            const image = renderer.image;
            assert.instanceOf(image, ImageWrapper);
            image.state = ImageState.EMPTY;
            assert.strictEqual(renderer.prepareFrame(frameState), false);
            assert.strictEqual(renderer.image, null);
            resolve();
          } catch (e) {
            reject(e);
            return;
          }
        });
      }));
  });

  describe('cache invalidation on visibility change', function () {
    /** @type {Map} */
    let map;

    /** @type {ImageLayer} */
    let layer;

    /** @type {Static} */
    let source;

    /** @type {HTMLDivElement} */
    let target;

    const projection = new Projection({
      code: 'custom-image',
      units: 'pixels',
      extent: [0, 0, 256, 256],
    });

    beforeEach(
      () =>
        new Promise((resolve) => {
          target = document.createElement('div');
          target.style.width = '100px';
          target.style.height = '100px';
          document.body.appendChild(target);

          source = new Static({
            url: 'spec/ol/data/osm-0-0-0.png',
            projection: projection,
            imageExtent: [0, 0, 256, 256],
          });

          layer = new ImageLayer({
            source: source,
          });

          map = new Map({
            target: target,
            layers: [layer],
            view: new View({
              projection: projection,
              center: [128, 128],
              zoom: 0,
            }),
          });

          source.on('imageloadend', function () {
            resolve();
          });
        }),
    );

    afterEach(function () {
      disposeMap(map);
    });

    it('tracks source revision during rendering', function () {
      const renderer = layer.getRenderer();
      map.renderSync();

      const revision = source.getRevision();
      assert.strictEqual(renderer.renderedSourceRevision_, revision);

      source.changed();
      const newRevision = source.getRevision();
      assert.isAbove(newRevision, revision);

      map.renderSync();
      assert.strictEqual(renderer.renderedSourceRevision_, newRevision);
    });

    it('clears cached image when source changed while hidden', function () {
      const renderer = layer.getRenderer();
      map.renderSync();
      assert.notEqual(renderer.image, null);

      layer.setVisible(false);
      map.renderSync();

      source.changed();

      let imageWasCleared = false;
      const originalImage = renderer.image;
      Object.defineProperty(renderer, 'image', {
        get: function () {
          return this._image;
        },
        set: function (value) {
          if (value === null && this._image === originalImage) {
            imageWasCleared = true;
          }
          this._image = value;
        },
        configurable: true,
      });
      renderer._image = originalImage;

      layer.setVisible(true);
      map.renderSync();
      assert.strictEqual(imageWasCleared, true);
    });

    it('preserves cached image when source unchanged while hidden', function () {
      const renderer = layer.getRenderer();
      map.renderSync();

      const cachedImage = renderer.image;
      assert.notEqual(cachedImage, null);

      layer.setVisible(false);
      map.renderSync();

      layer.setVisible(true);
      map.renderSync();
      assert.strictEqual(renderer.image, cachedImage);
    });

    it('keeps cached image when source changes while visible', function () {
      const renderer = layer.getRenderer();
      map.renderSync();

      const cachedImage = renderer.image;
      assert.notEqual(cachedImage, null);

      source.changed();
      map.renderSync();

      assert.strictEqual(renderer.image, cachedImage);
    });
  });
});
