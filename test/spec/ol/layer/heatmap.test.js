import HeatmapLayer from '../../../../src/ol/layer/Heatmap.js';


describe('ol.layer.Heatmap', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      const instance = new HeatmapLayer();
      expect(instance).to.be.an(HeatmapLayer);
    });

  });

});
