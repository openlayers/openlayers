import {assert} from 'chai';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import {getCenter, scaleFromCenter} from '../../../../../src/ol/extent.js';
import Polygon, {
  fromExtent as polygonFromExtent,
} from '../../../../../src/ol/geom/Polygon.js';
import DragZoom from '../../../../../src/ol/interaction/DragZoom.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import RenderBox from '../../../../../src/ol/render/Box.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';

describe('ol.interaction.DragZoom', function () {
  /** @type {HTMLElement} */
  let target;
  /** @type {Map} */
  let map;
  /** @type {VectorSource} */
  let source;

  const width = 360;
  const height = 180;

  beforeEach(
    () =>
      new Promise((resolve) => {
        target = document.createElement('div');
        const style = target.style;
        style.position = 'absolute';
        style.left = '-1000px';
        style.top = '-1000px';
        style.width = width + 'px';
        style.height = height + 'px';
        document.body.appendChild(target);
        source = new VectorSource();
        const layer = new VectorLayer({source: source});
        map = new Map({
          target: target,
          layers: [layer],
          view: new View({
            projection: 'EPSG:4326',
            center: [0, 0],
            resolution: 1,
            multiWorld: true,
          }),
        });
        map.once('postrender', function () {
          resolve();
        });
      }),
  );

  afterEach(function () {
    disposeMap(map);
  });

  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const instance = new DragZoom();
      assert.instanceOf(instance, DragZoom);
    });
    it('sets "ol-dragzoom" as box className', function () {
      const instance = new DragZoom();
      assert.strictEqual(
        instance.box_.element_.className,
        'ol-box ol-dragzoom',
      );
    });
    it('sets a custom box className', function () {
      const instance = new DragZoom({className: 'test-dragzoom'});
      assert.strictEqual(
        instance.box_.element_.className,
        'ol-box test-dragzoom',
      );
    });
  });

  describe('#onBoxEnd()', function () {
    it('uses the configured duration', function () {
      const interaction = new DragZoom({
        duration: 1,
      });
      map.addInteraction(interaction);
      const view = map.getView();
      view.fitInternal = vi.fn();

      const box = new RenderBox();
      const extent = [-110, 40, -90, 60];
      box.geometry_ = polygonFromExtent(extent);
      interaction.box_ = box;

      interaction.onBoxEnd();

      assert.strictEqual(view.fitInternal.mock.calls.length, 1);
      assert.strictEqual(view.fitInternal.mock.calls[0][1].duration, 1);
    });
    it('centers the view on the box geometry', function () {
      const interaction = new DragZoom({
        duration: 0,
      });
      map.addInteraction(interaction);

      const box = new RenderBox();
      const extent = [-110, 40, -90, 60];
      box.geometry_ = polygonFromExtent(extent);
      interaction.box_ = box;

      interaction.onBoxEnd();
      const view = map.getView();
      const center = view.getCenterInternal();
      assert.deepEqual(center, getCenter(extent));
    });

    it('centers the rotated view on the box geometry', function () {
      const view = map.getView();
      view.setRotation(Math.PI / 4);

      const interaction = new DragZoom({
        duration: 0,
      });
      map.addInteraction(interaction);

      const box = new RenderBox();
      map.renderSync();
      box.geometry_ = new Polygon([
        [
          map.getCoordinateFromPixel([0, 0]),
          map.getCoordinateFromPixel([360, 0]),
          map.getCoordinateFromPixel([360, 180]),
          map.getCoordinateFromPixel([0, 180]),
          map.getCoordinateFromPixel([0, 0]),
        ],
      ]);
      interaction.box_ = box;

      const extentBefore = view.calculateExtentInternal();
      interaction.onBoxEnd();
      const newExtent = view.calculateExtentInternal();
      assert.approximately(newExtent[0], extentBefore[0], 1e-9);
      assert.approximately(newExtent[1], extentBefore[1], 1e-9);
      assert.approximately(newExtent[2], extentBefore[2], 1e-9);
      assert.approximately(newExtent[3], extentBefore[3], 1e-9);
      assert.approximately(view.getResolution(), 1, 1e-9);
    });
    it('centers the padded view on the box geometry', function () {
      map.getView().padding = [0, 180, 0, 0];

      const interaction = new DragZoom({
        duration: 0,
      });
      map.addInteraction(interaction);

      const box = new RenderBox();
      const extent = [-180, -90, 0, 90];
      box.geometry_ = polygonFromExtent(extent);
      interaction.box_ = box;

      interaction.onBoxEnd();
      const view = map.getView();
      assert.strictEqual(view.getResolution(), 1);
      assert.deepEqual(view.calculateExtentInternal(), extent);
    });
    it('sets new resolution while zooming out', function () {
      const interaction = new DragZoom({
        duration: 0,
        out: true,
      });
      map.addInteraction(interaction);

      const box = new RenderBox();
      const extent = [-11.25, -11.25, 11.25, 11.25];
      box.geometry_ = polygonFromExtent(extent);
      interaction.box_ = box;

      map.getView().setResolution(0.25);
      interaction.onBoxEnd();
      const view = map.getView();
      const resolution = view.getResolution();
      assert.deepEqual(resolution, view.getConstrainedResolution(0.5));
    });
    it('sets new resolution while zooming out with view padding and rotation', function () {
      const view = map.getView();
      view.setResolution(0.5);
      view.setRotation(Math.PI / 4);
      view.padding = [90, 0, 0, 0];

      const interaction = new DragZoom({
        duration: 0,
        out: true,
      });
      map.addInteraction(interaction);

      const box = new RenderBox();
      map.renderSync();
      box.geometry_ = new Polygon([
        [
          map.getCoordinateFromPixel([90, 117.5]),
          map.getCoordinateFromPixel([90, 152.5]),
          map.getCoordinateFromPixel([270, 152.5]),
          map.getCoordinateFromPixel([270, 117.5]),
          map.getCoordinateFromPixel([90, 117.5]),
        ],
      ]);
      interaction.box_ = box;

      const expected = view.calculateExtentInternal();
      scaleFromCenter(expected, 2);
      interaction.onBoxEnd();
      const newExtent = view.calculateExtentInternal();
      assert.approximately(view.getResolution(), 1, 1e-9);
      assert.approximately(newExtent[0], expected[0], 1e-9);
      assert.approximately(newExtent[1], expected[1], 1e-9);
      assert.approximately(newExtent[2], expected[2], 1e-9);
      assert.approximately(newExtent[3], expected[3], 1e-9);
    });
  });
});
