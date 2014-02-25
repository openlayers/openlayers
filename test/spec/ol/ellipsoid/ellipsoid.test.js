goog.provide('ol.test.Ellipsoid');


describe('ol.Ellipsoid', function() {

  var expected = [
    {
      c1: [0, 0],
      c2: [0, 0],
      vincentyFinalBearing: 0,
      vincentyInitialBearing: 0,
      vincentyDistance: 0
    },
    {
      c1: [0, 0],
      c2: [45, 45],
      vincentyFinalBearing: 54.890773827979565,
      vincentyInitialBearing: 35.41005890511814,
      vincentyDistance: 6662472.718217184
    },
    {
      c1: [0, 0],
      c2: [45, -45],
      vincentyFinalBearing: 125.10922617202044,
      vincentyInitialBearing: 144.58994109488185,
      vincentyDistance: 6662472.718217184
    },
    {
      c1: [0, 0],
      c2: [-45, -45],
      vincentyFinalBearing: -125.10922617202044,
      vincentyInitialBearing: -144.58994109488185,
      vincentyDistance: 6662472.718217184
    },
    {
      c1: [0, 0],
      c2: [-45, 45],
      vincentyFinalBearing: -54.890773827979565,
      vincentyInitialBearing: -35.41005890511814,
      vincentyDistance: 6662472.718217184
    },
    {
      c1: [0, 0],
      c2: [180, 90],
      vincentyFinalBearing: 180,
      vincentyInitialBearing: 4.296211503097554e-31,
      vincentyDistance: 10001965.729311794
    },
    {
      c1: [0, 0],
      c2: [180, -90],
      vincentyFinalBearing: 7.0164775638926606e-15,
      vincentyInitialBearing: 180,
      vincentyDistance: 10001965.729311794
    },
    {
      c1: [0, 0],
      c2: [-180, 90],
      vincentyFinalBearing: -180,
      vincentyInitialBearing: -4.296211503097554e-31,
      vincentyDistance: 10001965.729311794
    },
    {
      c1: [0, 0],
      c2: [-180, 90],
      vincentyFinalBearing: -180,
      vincentyInitialBearing: -4.296211503097554e-31,
      vincentyDistance: 10001965.729311794
    },
    {
      c1: [45, 45],
      c2: [45, 45],
      vincentyFinalBearing: 0,
      vincentyInitialBearing: 0,
      vincentyDistance: 0
    },
    {
      c1: [45, 45],
      c2: [45, -45],
      vincentyFinalBearing: 180,
      vincentyInitialBearing: 180,
      vincentyDistance: 9969888.755957305
    },
    {
      c1: [45, 45],
      c2: [-45, -45],
      vincentyFinalBearing: -125.10922617202044,
      vincentyInitialBearing: -125.10922617202044,
      vincentyDistance: 13324945.436434371
    },
    {
      c1: [45, 45],
      c2: [-45, 45],
      vincentyFinalBearing: -125.27390277185786,
      vincentyInitialBearing: -54.726097228142166,
      vincentyDistance: 6690232.932559058
    },
    {
      c1: [45, 45],
      c2: [180, 90],
      vincentyFinalBearing: 135,
      vincentyInitialBearing: 3.5023624896823797e-15,
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [45, 45],
      c2: [180, -90],
      vincentyFinalBearing: 45.00000000000001,
      vincentyInitialBearing: 180,
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [45, 45],
      c2: [-180, 90],
      vincentyFinalBearing: 135.00000000000003,
      vincentyInitialBearing: 3.5023624896823793e-15,
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [45, 45],
      c2: [-180, 90],
      vincentyFinalBearing: 135.00000000000003,
      vincentyInitialBearing: 3.5023624896823793e-15,
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [45, -45],
      c2: [45, -45],
      vincentyFinalBearing: 0,
      vincentyInitialBearing: 0,
      vincentyDistance: 0
    },
    {
      c1: [45, -45],
      c2: [-45, -45],
      vincentyFinalBearing: -54.726097228142166,
      vincentyInitialBearing: -125.27390277185786,
      vincentyDistance: 6690232.932559058
    },
    {
      c1: [45, -45],
      c2: [-45, 45],
      vincentyFinalBearing: -54.890773827979565,
      vincentyInitialBearing: -54.890773827979565,
      vincentyDistance: 13324945.436434371
    },
    {
      c1: [45, -45],
      c2: [180, 90],
      vincentyFinalBearing: 135,
      vincentyInitialBearing: 3.5023624896823797e-15,
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [45, -45],
      c2: [180, -90],
      vincentyFinalBearing: 45.00000000000001,
      vincentyInitialBearing: 180,
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [45, -45],
      c2: [-180, 90],
      vincentyFinalBearing: 135.00000000000003,
      vincentyInitialBearing: 3.5023624896823793e-15,
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [45, -45],
      c2: [-180, 90],
      vincentyFinalBearing: 135.00000000000003,
      vincentyInitialBearing: 3.5023624896823793e-15,
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [-45, -45],
      c2: [-45, -45],
      vincentyFinalBearing: 0,
      vincentyInitialBearing: 0,
      vincentyDistance: 0
    },
    {
      c1: [-45, -45],
      c2: [-45, 45],
      vincentyFinalBearing: 0,
      vincentyInitialBearing: 0,
      vincentyDistance: 9969888.755957305
    },
    {
      c1: [-45, -45],
      c2: [180, 90],
      vincentyFinalBearing: -135.00000000000003,
      vincentyInitialBearing: -3.5023624896823793e-15,
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [-45, -45],
      c2: [180, -90],
      vincentyFinalBearing: -44.999999999999986,
      vincentyInitialBearing: -180,
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [-45, -45],
      c2: [-180, 90],
      vincentyFinalBearing: -135,
      vincentyInitialBearing: -3.5023624896823797e-15,
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [-45, -45],
      c2: [-180, 90],
      vincentyFinalBearing: -135,
      vincentyInitialBearing: -3.5023624896823797e-15,
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [-45, 45],
      c2: [-45, 45],
      vincentyFinalBearing: 0,
      vincentyInitialBearing: 0,
      vincentyDistance: 0
    },
    {
      c1: [-45, 45],
      c2: [180, 90],
      vincentyFinalBearing: -135.00000000000003,
      vincentyInitialBearing: -3.5023624896823793e-15,
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [-45, 45],
      c2: [180, -90],
      vincentyFinalBearing: -44.999999999999986,
      vincentyInitialBearing: -180,
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [-45, 45],
      c2: [-180, 90],
      vincentyFinalBearing: -135,
      vincentyInitialBearing: -3.5023624896823797e-15,
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [-45, 45],
      c2: [-180, 90],
      vincentyFinalBearing: -135,
      vincentyInitialBearing: -3.5023624896823797e-15,
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [180, 90],
      c2: [180, 90],
      vincentyFinalBearing: 0,
      vincentyInitialBearing: 0,
      vincentyDistance: 0
    },
    {
      c1: [180, -90],
      c2: [180, -90],
      vincentyFinalBearing: 0,
      vincentyInitialBearing: 0,
      vincentyDistance: 0
    },
    {
      c1: [-180, 90],
      c2: [-180, 90],
      vincentyFinalBearing: 0,
      vincentyInitialBearing: 0,
      vincentyDistance: 0
    },
    {
      c1: [-180, 90],
      c2: [-180, 90],
      vincentyFinalBearing: 0,
      vincentyInitialBearing: 0,
      vincentyDistance: 0
    },
    {
      c1: [-180, 90],
      c2: [-180, 90],
      vincentyFinalBearing: 0,
      vincentyInitialBearing: 0,
      vincentyDistance: 0
    }
  ];

  describe('vincenty', function() {

    it('returns the same distances as Chris Veness\'s reference implementation',
        function() {
          var e, i, v;
          for (i = 0; i < expected.length; ++i) {
            e = expected[i];
            v = ol.ellipsoid.WGS84.vincenty(e.c1, e.c2, 1e-12, 100);
            expect(v.distance).to.roughlyEqual(e.vincentyDistance, 1e-8);
            expect(v.finalBearing).to.roughlyEqual(
                e.vincentyFinalBearing, 1e-9);
            expect(v.initialBearing).to.roughlyEqual(
                e.vincentyInitialBearing, 1e-9);
          }
        });

  });

  describe('vincentyDistance', function() {

    it('returns the same distances as Chris Veness\'s reference implementation',
        function() {
          var e, i, vincentyDistance;
          for (i = 0; i < expected.length; ++i) {
            e = expected[i];
            vincentyDistance =
                ol.ellipsoid.WGS84.vincentyDistance(e.c1, e.c2, 1e-12, 100);
            expect(vincentyDistance).to.roughlyEqual(e.vincentyDistance, 1e-8);
          }
        });

  });

  describe('vincentyFinalBearing', function() {

    it('returns the same distances as Chris Veness\'s reference implementation',
        function() {
          var e, i, vincentyFinalBearing;
          for (i = 0; i < expected.length; ++i) {
            e = expected[i];
            vincentyFinalBearing =
                ol.ellipsoid.WGS84.vincentyFinalBearing(e.c1, e.c2, 1e-12, 100);
            expect(vincentyFinalBearing).to.roughlyEqual(
                e.vincentyFinalBearing, 1e-9);
          }
        });

  });

  describe('vincentyInitialBearing', function() {

    it('returns the same distances as Chris Veness\'s reference implementation',
        function() {
          var e, i, vincentyInitialBearing;
          for (i = 0; i < expected.length; ++i) {
            e = expected[i];
            vincentyInitialBearing = ol.ellipsoid.WGS84.vincentyInitialBearing(
                e.c1, e.c2, 1e-12, 100);
            expect(vincentyInitialBearing).to.roughlyEqual(
                e.vincentyInitialBearing, 1e-9);
          }
        });

  });

});


goog.require('ol.Ellipsoid');
goog.require('ol.ellipsoid.WGS84');
