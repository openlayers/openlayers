goog.provide('ol.test.render.canvas.Immediate');

describe('ol.render.canvas.Immediate', function() {
  describe('#drawMultiPolygonGeometry', function() {
    it('creates the correct canvas instructions for 3D geometries', function() {
      var log = {
        lineTo: [],
        moveTo: []
      };
      // FIXME move the canvas/context mocks outside of here for reuse
      var context = {
        setLineDash: function() {},
        beginPath: function() {},
        closePath: function() {},
        stroke: function() {},
        lineTo: function(x, y) {
          log.lineTo.push([x, y]);
        },
        moveTo: function(x, y) {
          log.moveTo.push([x, y]);
        }
      };
      var transform = [0.0004088332670837288, 0, 0, 0, 0,
        -0.0004088332670837288, 0, 0, 0, 0, 1, 0, 4480.991370439071,
        1529.5752568707105, 0, 1];
      var extent = [-10960437.252092224, 2762924.0275091752,
        -7572748.158493212, 3741317.9895594316];
      var canvas = new ol.render.canvas.Immediate(context, 1, extent,
          transform);
      canvas.strokeState_ = {
        lineCap: 'round',
        lineDash: [],
        lineJoin: 'round',
        lineWidth: 3,
        miterLimit: 10,
        strokeStyle: '#00FFFF'
      };
      var multiPolygonGeometry = new ol.geom.MultiPolygon([
        [[[-80.736061, 28.788576000000006, 0],
           [-80.763557, 28.821799999999996, 0],
           [-80.817406, 28.895123999999996, 0],
           [-80.891304, 29.013130000000004, 0],
           [-80.916512, 29.071560000000005, 0],
           [-80.899323, 29.061249000000004, 0],
           [-80.862663, 28.991361999999995, 0],
           [-80.736061, 28.788576000000006, 0]]], [[
          [-82.102127, 26.585724, 0],
          [-82.067139, 26.497208, 0],
          [-82.097641, 26.493585999999993, 0],
          [-82.135895, 26.642279000000002, 0],
          [-82.183495, 26.683082999999996, 0],
          [-82.128838, 26.693342, 0],
          [-82.102127, 26.585724, 0]]]
      ]).transform('EPSG:4326', 'EPSG:3857');
      canvas.drawMultiPolygonGeometry(multiPolygonGeometry, null);
      expect(log.lineTo.length).to.be(15);
      expect(log.lineTo[0][0]).to.roughlyEqual(805.3521540835154, 1e-9);
      expect(log.lineTo[0][1]).to.roughlyEqual(158.76358389011807, 1e-9);
      expect(log.lineTo[1][0]).to.roughlyEqual(802.9014262612932, 1e-9);
      expect(log.lineTo[1][1]).to.roughlyEqual(154.95335187132082, 1e-9);
      expect(log.lineTo[2][0]).to.roughlyEqual(799.5382461724039, 1e-9);
      expect(log.lineTo[2][1]).to.roughlyEqual(148.815592819916, 1e-9);
      expect(log.lineTo[3][0]).to.roughlyEqual(798.3910020835165, 1e-9);
      expect(log.lineTo[3][1]).to.roughlyEqual(145.77392230456553, 1e-9);
      expect(log.lineTo[4][0]).to.roughlyEqual(799.1732925724045, 1e-9);
      expect(log.lineTo[4][1]).to.roughlyEqual(146.31080369865776, 1e-9);
      expect(log.lineTo[5][0]).to.roughlyEqual(800.8417299057378, 1e-9);
      expect(log.lineTo[5][1]).to.roughlyEqual(149.94832216046188, 1e-9);
      expect(log.lineTo[6][0]).to.roughlyEqual(806.6035275946265, 1e-9);
      expect(log.lineTo[6][1]).to.roughlyEqual(160.48916296287916, 1e-9);
      expect(log.lineTo[7][0]).to.roughlyEqual(806.6035275946265, 1e-9);
      expect(log.lineTo[7][1]).to.roughlyEqual(160.48916296287916, 1e-9);
      expect(log.lineTo[8][0]).to.roughlyEqual(746.0246888390716, 1e-9);
      expect(log.lineTo[8][1]).to.roughlyEqual(278.22094795365365, 1e-9);
      expect(log.lineTo[9][0]).to.roughlyEqual(744.6365089279602, 1e-9);
      expect(log.lineTo[9][1]).to.roughlyEqual(278.40513424671826, 1e-9);
      expect(log.lineTo[10][0]).to.roughlyEqual(742.8955268835157, 1e-9);
      expect(log.lineTo[10][1]).to.roughlyEqual(270.83899948444764, 1e-9);
      expect(log.lineTo[11][0]).to.roughlyEqual(740.7291979946272, 1e-9);
      expect(log.lineTo[11][1]).to.roughlyEqual(268.76099731369345, 1e-9);
      expect(log.lineTo[12][0]).to.roughlyEqual(743.2166987946266, 1e-9);
      expect(log.lineTo[12][1]).to.roughlyEqual(268.23842607400616, 1e-9);
      expect(log.lineTo[13][0]).to.roughlyEqual(744.4323460835158, 1e-9);
      expect(log.lineTo[13][1]).to.roughlyEqual(273.7179168205373, 1e-9);
      expect(log.lineTo[14][0]).to.roughlyEqual(744.4323460835158, 1e-9);
      expect(log.lineTo[14][1]).to.roughlyEqual(273.7179168205373, 1e-9);
      expect(log.moveTo.length).to.be(2);
      expect(log.moveTo[0][0]).to.roughlyEqual(806.6035275946265, 1e-9);
      expect(log.moveTo[0][1]).to.roughlyEqual(160.48916296287916, 1e-9);
      expect(log.moveTo[1][0]).to.roughlyEqual(744.4323460835158, 1e-9);
      expect(log.moveTo[1][1]).to.roughlyEqual(273.7179168205373, 1e-9);
    });
  });
});

goog.require('ol.geom.MultiPolygon');
goog.require('ol.render.canvas.Immediate');
