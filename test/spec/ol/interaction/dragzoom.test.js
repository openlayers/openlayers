import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import {getCenter} from '../../../../src/ol/extent.js';
import {fromExtent as polygonFromExtent} from '../../../../src/ol/geom/Polygon.js';
import DragZoom from '../../../../src/ol/interaction/DragZoom.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import RenderBox from '../../../../src/ol/render/Box.js';
import VectorSource from '../../../../src/ol/source/Vector.js';


describe('ol.interaction.DragZoom', () => {

  let target, map, source;

  const width = 360;
  const height = 180;

  beforeEach(done => {
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
        resolution: 1
      })
    });
    map.once('postrender', function() {
      done();
    });
  });

  afterEach(() => {
    map.dispose();
    document.body.removeChild(target);
  });

  describe('constructor', () => {

    test('can be constructed without arguments', () => {
      const instance = new DragZoom();
      expect(instance).toBeInstanceOf(DragZoom);
    });
    test('sets "ol-dragzoom" as box className', () => {
      const instance = new DragZoom();
      expect(instance.box_.element_.className).toBe('ol-box ol-dragzoom');
    });
    test('sets a custom box className', () => {
      const instance = new DragZoom({className: 'test-dragzoom'});
      expect(instance.box_.element_.className).toBe('ol-box test-dragzoom');
    });

  });

  describe('#onBoxEnd()', () => {

    test('centers the view on the box geometry', done => {
      const interaction = new DragZoom({
        duration: 10
      });
      map.addInteraction(interaction);

      const box = new RenderBox();
      const extent = [-110, 40, -90, 60];
      box.geometry_ = polygonFromExtent(extent);
      interaction.box_ = box;

      interaction.onBoxEnd_();
      setTimeout(function() {
        const view = map.getView();
        const center = view.getCenterInternal();
        expect(center).toEqual(getCenter(extent));
        done();
      }, 50);

    });

    test('sets new resolution while zooming out', done => {
      const interaction = new DragZoom({
        duration: 10,
        out: true
      });
      map.addInteraction(interaction);

      const box = new RenderBox();
      const extent = [-11.25, -11.25, 11.25, 11.25];
      box.geometry_ = polygonFromExtent(extent);
      interaction.box_ = box;

      map.getView().setResolution(0.25);
      setTimeout(function() {
        interaction.onBoxEnd_();
        setTimeout(function() {
          const view = map.getView();
          const resolution = view.getResolution();
          expect(resolution).toEqual(view.getConstrainedResolution(0.5));
          done();
        }, 50);
      }, 50);

    });

  });


});
