import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import TileState from '../../../../../src/ol/TileState.js';
import View from '../../../../../src/ol/View.js';
import Point from '../../../../../src/ol/geom/Point.js';
import ImageLayer from '../../../../../src/ol/layer/Image.js';
import VectorImageLayer from '../../../../../src/ol/layer/VectorImage.js';
import Projection from '../../../../../src/ol/proj/Projection.js';
import Static from '../../../../../src/ol/source/ImageStatic.js';
import RasterSource, {Processor} from '../../../../../src/ol/source/Raster.js';
import Source from '../../../../../src/ol/source/Source.js';
import TileSource from '../../../../../src/ol/source/Tile.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import XYZ from '../../../../../src/ol/source/XYZ.js';
import Circle from '../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Style from '../../../../../src/ol/style/Style.js';

const red =
  'data:image/gif;base64,R0lGODlhAQABAPAAAP8AAP///yH5BAAAAAAALAAAAAA' +
  'BAAEAAAICRAEAOw==';

const green =
  'data:image/gif;base64,R0lGODlhAQABAPAAAAD/AP///yH5BAAAAAAALAAAA' +
  'AABAAEAAAICRAEAOw==';

where('Uint8ClampedArray').describe('ol.source.Raster', function () {
  let map, target, redSource, greenSource, blueSource, layer, raster;

  beforeEach(function () {
    target = document.createElement('div');

    const style = target.style;
    style.position = 'absolute';
    style.left = '-1000px';
    style.top = '-1000px';
    style.width = '2px';
    style.height = '2px';
    document.body.appendChild(target);

    const extent = [-1, -1, 1, 1];

    redSource = new Static({
      url: red,
      imageExtent: extent,
      attributions: ['red raster source'],
    });

    greenSource = new Static({
      url: green,
      imageExtent: extent,
      attributions: (frameState) => 'green raster source',
    });

    blueSource = new VectorImageLayer({
      source: new VectorSource({
        features: [new Feature(new Point([0, 0]))],
      }),
      style: new Style({
        image: new Circle({
          radius: 3,
          fill: new Fill({color: 'blue'}),
        }),
      }),
    });

    raster = new RasterSource({
      threads: 0,
      sources: [redSource, greenSource, blueSource],
      operation: function (inputs) {
        return inputs[0];
      },
    });

    layer = new ImageLayer({
      source: raster,
    });

    map = new Map({
      target: target,
      view: new View({
        resolutions: [1],
        projection: new Projection({
          code: 'image',
          units: 'pixels',
          extent: extent,
        }),
      }),
      layers: [layer],
    });
  });

  afterEach(function () {
    if (map) {
      disposeMap(map);
    }
    map = null;
    raster.dispose();
    greenSource.dispose();
    redSource.dispose();
    blueSource.dispose();
  });

  describe('constructor', function () {
    it('returns a raster source', function () {
      const source = new RasterSource({
        threads: 0,
        sources: [new TileSource({})],
      });
      assert.instanceOf(source, Source);
      assert.instanceOf(source, RasterSource);
    });

    it('defaults to "pixel" operation', function (done) {
      const log = [];

      const source = new RasterSource({
        threads: 0,
        sources: [redSource, greenSource, blueSource],
        operation: function (inputs) {
          log.push(inputs);
          return inputs[0];
        },
      });

      source.once('afteroperations', function () {
        assert.equal(log.length, 4);
        const inputs = log[0];
        const pixel = inputs[0];
        assert.isArray(pixel);
        done();
      });

      map.getLayers().item(0).setSource(source);
      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);
    });

    it('uses resolutions from the first source where available', function () {
      greenSource.setResolutions([100, 10, 1]);
      const source = new RasterSource({
        threads: 0,
        sources: [redSource, greenSource, blueSource],
        operation: function (inputs) {
          return inputs[0];
        },
      });

      assert.deepEqual(source.getResolutions(), [100, 10, 1]);
    });

    it('accepts a "resolutions" option', function (done) {
      const source = new RasterSource({
        threads: 0,
        sources: [redSource],
        resolutions: [1],
        operation: function (inputs) {
          return inputs[0];
        },
      });

      source.on('afteroperations', function (event) {
        assert.equal(event.resolution, 1);
        done();
      });

      map.getLayers().item(0).setSource(source);
      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);
    });

    it('uses the view resolution when "resolutions" are set to null', function () {
      redSource.setResolutions([100, 10, 1]);
      const source = new RasterSource({
        threads: 0,
        sources: [redSource],
        resolutions: null,
        operation: function (inputs) {
          return inputs[0];
        },
      });

      assert.strictEqual(source.getResolutions(), null);
    });

    it('disposes the processor when disposed', function () {
      const source = new RasterSource({
        threads: 0,
        sources: [redSource, greenSource, blueSource],
        operation: function (inputs) {
          return inputs[0];
        },
      });

      source.dispose();

      assert.strictEqual(source.processor_.disposed, true);
    });

    it('allows operation type to be set to "image"', function (done) {
      const log = [];

      const source = new RasterSource({
        operationType: 'image',
        threads: 0,
        sources: [redSource, greenSource, blueSource],
        operation: function (inputs) {
          log.push(inputs);
          return inputs[0];
        },
      });

      source.once('afteroperations', function () {
        assert.equal(log.length, 1);
        const inputs = log[0];
        const imageData = inputs[0];
        assert.instanceOf(imageData.data, Uint8ClampedArray);
        assert.strictEqual(imageData.width, 2);
        assert.strictEqual(imageData.height, 2);
        done();
      });

      map.getLayers().item(0).setSource(source);
      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);
    });

    it('passes the interpolate option to the parent source', function () {
      const source = new RasterSource({
        threads: 0,
        interpolate: false,
        sources: [redSource],
        operation: function (inputs) {
          return inputs[0];
        },
      });

      assert.strictEqual(source.getInterpolate(), false);
      source.dispose();
    });
  });

  describe('config option `attributions`', function () {
    it('handles empty attributions', function () {
      const blue = new RasterSource({
        operationType: 'image',
        threads: 0,
        sources: [blueSource],
        operation: function (inputs) {
          return inputs[0];
        },
      });
      const blueAttributions = blue.getAttributions();
      assert.deepEqual(blueAttributions(), []);
    });

    it('shows single attributions', function () {
      const red = new RasterSource({
        operationType: 'image',
        threads: 0,
        sources: [redSource],
        operation: function (inputs) {
          return inputs[0];
        },
      });
      const redAttribtuions = red.getAttributions();

      assert.notEqual(redAttribtuions(), null);
      assert.strictEqual(typeof redAttribtuions, 'function');
      assert.deepEqual(redAttribtuions(), ['red raster source']);
    });

    it('concatinates multiple attributions', function () {
      const redGreen = new RasterSource({
        operationType: 'image',
        threads: 0,
        sources: [redSource, greenSource],
        operation: function (inputs) {
          return inputs[0];
        },
      });
      const redGreenAttributions = redGreen.getAttributions();

      assert.notEqual(redGreenAttributions(), null);
      assert.strictEqual(typeof redGreenAttributions, 'function');
      assert.deepEqual(redGreenAttributions(), [
        'red raster source',
        'green raster source',
      ]);
    });
  });

  describe('#setOperation()', function () {
    it('allows operation to be set', function (done) {
      let count = 0;
      raster.setOperation(function (pixels) {
        ++count;
        const redPixel = pixels[0];
        const greenPixel = pixels[1];
        const bluePixel = pixels[2];
        assert.deepEqual(redPixel, [255, 0, 0, 255]);
        assert.deepEqual(greenPixel, [0, 255, 0, 255]);
        assert.deepEqual(bluePixel, [0, 0, 255, 255]);
        return pixels[0];
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

      raster.once('afteroperations', function (event) {
        assert.equal(count, 4);
        done();
      });
    });

    it('updates and re-runs the operation', function (done) {
      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

      let count = 0;
      raster.on('afteroperations', function (event) {
        ++count;
        if (count === 1) {
          raster.setOperation(function (inputs) {
            return inputs[0];
          });
        } else {
          done();
        }
      });
    });

    it('disposes the previous processor', function () {
      const previousProcessor = raster.processor_;

      raster.setOperation(function (pixels) {
        return pixels[0];
      });

      assert.strictEqual(previousProcessor.disposed, true);
      assert.strictEqual(raster.processor_.disposed, false);
    });
  });

  describe('beforeoperations', function () {
    it('gets called before operations are run', function (done) {
      let count = 0;
      raster.setOperation(function (inputs) {
        ++count;
        return inputs[0];
      });

      raster.once('beforeoperations', function (event) {
        assert.equal(count, 0);
        assert.strictEqual(!!event, true);
        assert.isArray(event.extent);
        assert.isNumber(event.resolution);
        assert.isObject(event.data);
        done();
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);
    });

    it('allows data to be set for the operation', function (done) {
      raster.setOperation(function (inputs, data) {
        ++data.count;
        return inputs[0];
      });

      raster.on('beforeoperations', function (event) {
        event.data.count = 0;
      });

      raster.once('afteroperations', function (event) {
        assert.equal(event.data.count, 4);
        done();
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);
    });
  });

  describe('afteroperations', function () {
    it('gets called after operations are run', function (done) {
      let count = 0;
      raster.setOperation(function (inputs) {
        ++count;
        return inputs[0];
      });

      raster.once('afteroperations', function (event) {
        assert.equal(count, 4);
        assert.strictEqual(!!event, true);
        assert.isArray(event.extent);
        assert.isNumber(event.resolution);
        assert.isObject(event.data);
        done();
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);
    });

    it('receives data set by the operation', function (done) {
      raster.setOperation(function (inputs, data) {
        data.message = 'hello world';
        return inputs[0];
      });

      raster.once('afteroperations', function (event) {
        assert.equal(event.data.message, 'hello world');
        done();
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);
    });

    it('is passed an array of data if more than one thread', function (done) {
      const threads = 3;

      raster = new RasterSource({
        threads: threads,
        sources: [redSource, greenSource, blueSource],
        operation: function (inputs, data) {
          data.prop = 'value';
          return inputs[0];
        },
      });

      layer.setSource(raster);

      raster.once('afteroperations', function (event) {
        assert.instanceOf(event.data, Array);
        assert.lengthOf(event.data, threads);
        assert.equal(event.data[0].prop, 'value');
        done();
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);
    });

    it('discards stale worker results when a source changes mid-pass', function (done) {
      const vectorSource = new VectorSource();
      const source = new RasterSource({
        threads: 0,
        sources: [
          new VectorImageLayer({
            source: vectorSource,
            style: new Style({
              image: new Circle({
                radius: 3,
                fill: new Fill({color: 'blue'}),
              }),
            }),
          }),
        ],
        operation: function (inputs) {
          return inputs[0];
        },
      });

      layer.setSource(source);

      const worker = source.processor_.workers_[0];
      const postMessage = worker.postMessage;
      let workerCompleteCount = 0;
      worker.postMessage = function () {
        const args = arguments;
        setTimeout(function () {
          ++workerCompleteCount;
          postMessage.apply(worker, args);
        }, 32);
      };

      let afterCount = 0;
      source.on('afteroperations', function () {
        ++afterCount;
      });

      setTimeout(function () {
        vectorSource.addFeature(new Feature(new Point([0, 0])));
      }, 16);

      source.once('afteroperations', function () {
        setTimeout(function () {
          assert.strictEqual(workerCompleteCount, 2);
          assert.strictEqual(afterCount, 1);
          const image = source.renderedImageCanvas_.getImage();
          const context = image.getContext('2d');
          assert.deepEqual(
            Array.from(context.getImageData(1, 1, 1, 1).data),
            [0, 0, 255, 255],
          );
          done();
        }, 80);
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);
    });
  });

  describe('tile loading', function () {
    let map2;
    afterEach(function () {
      disposeMap(map2);
      map2 = null;
    });

    it('is initiated on the underlying source', function (done) {
      const source = new XYZ({
        url: 'spec/ol/data/osm-{z}-{x}-{y}.png',
      });

      raster = new RasterSource({
        threads: 0,
        sources: [source],
        operation: function (inputs) {
          return inputs[0];
        },
      });

      map2 = new Map({
        target: target,
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
        layers: [
          new ImageLayer({
            source: raster,
          }),
        ],
      });

      const tileCache = raster.layers_[0].getRenderer().tileCache_;

      assert.equal(tileCache.getCount(), 0);

      map2.once('moveend', function () {
        assert.equal(tileCache.getCount(), 1);
        const state = tileCache.peekLast().getState();
        assert.strictEqual(
          state === TileState.LOADING || state === TileState.LOADED,
          true,
        );
        done();
      });
    });
  });
});

where('Uint8ClampedArray').describe('Processor', function () {
  const identity = function (inputs) {
    return inputs[0];
  };

  describe('constructor', function () {
    it('creates a new processor', function () {
      const processor = new Processor({
        operation: identity,
      });

      assert.instanceOf(processor, Processor);
    });
  });

  describe('#process()', function () {
    it('calls operation with input pixels', function (done) {
      const processor = new Processor({
        operation: function (inputs, meta) {
          ++meta.count;
          const pixel = inputs[0];
          for (let i = 0, ii = pixel.length; i < ii; ++i) {
            meta.sum += pixel[i];
          }
          return pixel;
        },
      });

      const array = new Uint8ClampedArray([1, 2, 3, 4, 5, 6, 7, 8]);
      const input = new ImageData(array, 1, 2);

      processor.process([input], {count: 0, sum: 0}, function (err, output, m) {
        if (err) {
          done(err);
          return;
        }
        assert.equal(m.count, 2);
        assert.equal(m.sum, 36);
        done();
      });
    });

    it('calls callback with processed image data', function (done) {
      const processor = new Processor({
        operation: function (inputs) {
          const pixel = inputs[0];
          pixel[0] *= 2;
          pixel[1] *= 2;
          pixel[2] *= 2;
          pixel[3] *= 2;
          return pixel;
        },
      });

      const array = new Uint8ClampedArray([1, 2, 3, 4, 5, 6, 7, 8]);
      const input = new ImageData(array, 1, 2);

      processor.process([input], {}, function (err, output, m) {
        if (err) {
          done(err);
          return;
        }
        assert.instanceOf(output, ImageData);
        assert.deepEqual(
          output.data,
          new Uint8ClampedArray([2, 4, 6, 8, 10, 12, 14, 16]),
        );
        done();
      });
    });

    it('allows library functions to be called', function (done) {
      const lib = {
        sum: function (a, b) {
          return a + b;
        },
        diff: function (a, b) {
          return a - b;
        },
      };

      const normalizedDiff = function (pixels) {
        const pixel = pixels[0];
        const r = pixel[0];
        const g = pixel[1];
        // eslint-disable-next-line no-undef
        const nd = diff(r, g) / sum(r, g);
        const index = Math.round((255 * (nd + 1)) / 2);
        return [index, index, index, pixel[3]];
      };

      const processor = new Processor({
        operation: normalizedDiff,
        lib: lib,
      });

      const array = new Uint8ClampedArray([10, 2, 0, 0, 5, 8, 0, 1]);
      const input = new ImageData(array, 1, 2);

      processor.process([input], {}, function (err, output, m) {
        if (err) {
          done(err);
          return;
        }
        assert.instanceOf(output, ImageData);
        const v0 = Math.round((255 * (1 + 8 / 12)) / 2);
        const v1 = Math.round((255 * (1 + -3 / 13)) / 2);
        assert.deepEqual(
          output.data,
          new Uint8ClampedArray([v0, v0, v0, 0, v1, v1, v1, 1]),
        );

        done();
      });
    });

    it('calls callbacks for each call', function (done) {
      const processor = new Processor({
        operation: identity,
      });

      let calls = 0;

      function createCallback(index) {
        return function (err, output, meta) {
          if (err) {
            done(err);
            return;
          }
          assert.instanceOf(output, ImageData);
          ++calls;
        };
      }

      for (let i = 0; i < 5; ++i) {
        const input = new ImageData(new Uint8ClampedArray([1, 2, 3, 4]), 1, 1);
        processor.process([input], {}, createCallback(i));
      }

      setTimeout(function () {
        assert.strictEqual(calls, 5);
        done();
      }, 1000);
    });

    it('respects max queue length', function (done) {
      const processor = new Processor({
        queue: 1,
        operation: identity,
      });

      const log = [];

      function createCallback(index) {
        return function (err, output, meta) {
          if (err) {
            done(err);
            return;
          }
          log.push(output);
        };
      }

      for (let i = 0; i < 5; ++i) {
        const input = new ImageData(new Uint8ClampedArray([1, 2, 3, 4]), 1, 1);
        processor.process([input], {}, createCallback(i));
      }

      setTimeout(function () {
        assert.lengthOf(log, 5);
        assert.strictEqual(log[0], null);
        assert.strictEqual(log[1], null);
        assert.strictEqual(log[2], null);
        assert.instanceOf(log[3], ImageData);
        assert.instanceOf(log[4], ImageData);
        done();
      }, 1000);
    });

    it('can run on multiple threads', function (done) {
      const processor = new Processor({
        threads: 2,
        operation: identity,
      });

      const input = new ImageData(new Uint8ClampedArray([1, 2, 3, 4]), 1, 1);
      processor.process([input], {}, function (err) {
        if (err) {
          done(err);
        }
      });

      processor.dispose();
      setTimeout(done, 20);
    });
  });

  describe('#process() - faux worker', function () {
    let identitySpy;
    beforeEach(function () {
      identitySpy = sinonSpy(identity);
    });

    it('calls operation with input pixels', function (done) {
      const processor = new Processor({
        threads: 0,
        operation: identitySpy,
      });

      const array = new Uint8ClampedArray([1, 2, 3, 4, 5, 6, 7, 8]);
      const input = new ImageData(array, 1, 2);

      processor.process([input], {}, function (err, output, m) {
        if (err) {
          done(err);
          return;
        }
        assert.strictEqual(identitySpy.callCount, 2);
        const first = identitySpy.getCall(0);
        assert.lengthOf(first.args, 2);
        done();
      });
    });

    it('passes meta object to operations', function (done) {
      const processor = new Processor({
        threads: 0,
        operation: identitySpy,
      });

      const array = new Uint8ClampedArray([1, 2, 3, 4]);
      const input = new ImageData(array, 1, 1);
      const meta = {foo: 'bar'};

      processor.process([input], meta, function (err, output, m) {
        if (err) {
          done(err);
          return;
        }
        assert.deepEqual(m, meta);
        assert.strictEqual(identitySpy.callCount, 1);
        done();
      });
    });
  });

  describe('#dispose()', function () {
    it('stops callbacks from being called', function (done) {
      const processor = new Processor({
        operation: identity,
      });

      const array = new Uint8ClampedArray([1, 2, 3, 4, 5, 6, 7, 8]);
      const input = new ImageData(array, 1, 2);

      processor.process([input], {}, function () {
        done(new Error('Expected abort to stop callback from being called'));
      });

      processor.dispose();
      setTimeout(done, 500);
    });
  });

  describe('#dispose() - faux worker', function () {
    it('stops callbacks from being called', function (done) {
      const processor = new Processor({
        threads: 0,
        operation: identity,
      });

      const array = new Uint8ClampedArray([1, 2, 3, 4, 5, 6, 7, 8]);
      const input = new ImageData(array, 1, 2);

      processor.process([input], {}, function () {
        done(new Error('Expected abort to stop callback from being called'));
      });

      processor.dispose();
      setTimeout(done, 20);
    });
  });
});
