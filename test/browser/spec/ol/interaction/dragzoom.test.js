import DragZoom from '../../../../../src/ol/interaction/DragZoom.js';
import Map from '../../../../../src/ol/Map.js';
import Polygon, {
  fromExtent as polygonFromExtent,
} from '../../../../../src/ol/geom/Polygon.js';
import RenderBox from '../../../../../src/ol/render/Box.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import View from '../../../../../src/ol/View.js';
import {getCenter, scaleFromCenter} from '../../../../../src/ol/extent.js';

describe('ol.interaction.DragZoom', function () {
  /** @type {HTMLElement} */
  let target;
  /** @type {Map} */
  let map;
  /** @type {VectorSource} */
  let source;

  const width = 360;
  const height = 180;

  beforeEach(function (done) {
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
      done();
    });
  });

  afterEach(function () {
    map.dispose();
    document.body.removeChild(target);
  });

  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const instance = new DragZoom();
      expect(instance).to.be.an(DragZoom);
    });
    it('sets "ol-dragzoom" as box className', function () {
      const instance = new DragZoom();
      expect(instance.box_.element_.className).to.be('ol-box ol-dragzoom');
    });
    it('sets a custom box className', function () {
      const instance = new DragZoom({className: 'test-dragzoom'});
      expect(instance.box_.element_.className).to.be('ol-box test-dragzoom');
    });
  });

  describe('#onBoxEnd()', function () {
    it('uses the configured duration', function () {
      const interaction = new DragZoom({
        duration: 1,
      });
      map.addInteraction(interaction);
      const view = map.getView();
      view.fitInternal = sinon.spy();

      const box = new RenderBox();
      const extent = [-110, 40, -90, 60];
      box.geometry_ = polygonFromExtent(extent);
      interaction.box_ = box;

      interaction.onBoxEnd();

      expect(view.fitInternal.calledOnce).to.be(true);
      expect(view.fitInternal.args[0][1].duration).to.be(1);
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
      expect(center).to.eql(getCenter(extent));
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
      expect(newExtent[0]).to.roughlyEqual(extentBefore[0], 1e-9);
      expect(newExtent[1]).to.roughlyEqual(extentBefore[1], 1e-9);
      expect(newExtent[2]).to.roughlyEqual(extentBefore[2], 1e-9);
      expect(newExtent[3]).to.roughlyEqual(extentBefore[3], 1e-9);
      expect(view.getResolution()).to.roughlyEqual(1, 1e-9);
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
      expect(view.getResolution()).to.be(1);
      expect(view.calculateExtentInternal()).to.eql(extent);
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
      expect(resolution).to.eql(view.getConstrainedResolution(0.5));
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
      expect(view.getResolution()).to.roughlyEqual(1, 1e-9);
      expect(newExtent[0]).to.roughlyEqual(expected[0], 1e-9);
      expect(newExtent[1]).to.roughlyEqual(expected[1], 1e-9);
      expect(newExtent[2]).to.roughlyEqual(expected[2], 1e-9);
      expect(newExtent[3]).to.roughlyEqual(expected[3], 1e-9);
    });
  });
});
