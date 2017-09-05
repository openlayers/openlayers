

import _ol_Map_ from '../../../../src/ol/map';
import _ol_View_ from '../../../../src/ol/view';
import _ol_control_Control_ from '../../../../src/ol/control/control';
import _ol_control_OverviewMap_ from '../../../../src/ol/control/overviewmap';

describe('ol.control.OverviewMap', function() {
  var map, target;

  beforeEach(function() {
    target = document.createElement('div');
    document.body.appendChild(target);
    map = new _ol_Map_({
      target: target
    });
  });

  afterEach(function() {
    map.dispose();
    document.body.removeChild(target);
    map = null;
    target = null;
  });

  describe('constructor', function() {
    it('creates an overview map with the default options', function() {
      var control = new _ol_control_OverviewMap_();
      expect(control).to.be.a(_ol_control_OverviewMap_);
      expect(control).to.be.a(_ol_control_Control_);
    });
  });

  describe('setMap()', function() {

    it('keeps ovmap view rotation in sync with map view rotation', function() {
      var view = new _ol_View_({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });
      map.setView(view);

      var control = new _ol_control_OverviewMap_();
      map.addControl(control);
      var ovView = control.ovmap_.getView();
      expect(ovView.getRotation()).to.be(0);

      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).to.be(Math.PI / 4);
    });

    it('maintains rotation in sync if view added later', function() {
      var control = new _ol_control_OverviewMap_();
      map.addControl(control);
      var ovView = control.ovmap_.getView();
      expect(ovView.getRotation()).to.be(0);

      var view = new _ol_View_({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });
      map.setView(view);
      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).to.be(Math.PI / 4);
    });

    it('stops listening to old maps', function() {
      var control = new _ol_control_OverviewMap_();
      var ovView = control.ovmap_.getView();

      var view = new _ol_View_({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });
      map.setView(view);
      map.addControl(control);

      view.setRotation(Math.PI / 8);
      expect(ovView.getRotation()).to.be(Math.PI / 8);

      map.removeControl(control);

      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).to.be(Math.PI / 8);
    });

    it('set target to null', function() {
      var control = new _ol_control_OverviewMap_();

      map.addControl(control);

      expect(control.ovmap_.getTarget()).not.to.be(null);

      map.removeControl(control);

      expect(control.ovmap_.getTarget()).to.be(null);
    });

  });

});
