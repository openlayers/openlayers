goog.provide('ol.test.Ellipsoid');


describe('ol.Ellipsoid', function() {

  var expected = [
    {
      c1: [0, 0],
      c2: [0, 0],
      vincentyDistance: 0
    },
    {
      c1: [0, 0],
      c2: [45, 45],
      vincentyDistance: 6662472.718217184
    },
    {
      c1: [0, 0],
      c2: [45, -45],
      vincentyDistance: 6662472.718217184
    },
    {
      c1: [0, 0],
      c2: [-45, -45],
      vincentyDistance: 6662472.718217184
    },
    {
      c1: [0, 0],
      c2: [-45, 45],
      vincentyDistance: 6662472.718217184
    },
    {
      c1: [0, 0],
      c2: [180, 90],
      vincentyDistance: 10001965.729311794
    },
    {
      c1: [0, 0],
      c2: [180, -90],
      vincentyDistance: 10001965.729311794
    },
    {
      c1: [0, 0],
      c2: [-180, 90],
      vincentyDistance: 10001965.729311794
    },
    {
      c1: [0, 0],
      c2: [-180, 90],
      vincentyDistance: 10001965.729311794
    },
    {
      c1: [45, 45],
      c2: [45, 45],
      vincentyDistance: 0
    },
    {
      c1: [45, 45],
      c2: [45, -45],
      vincentyDistance: 9969888.755957305
    },
    {
      c1: [45, 45],
      c2: [-45, -45],
      vincentyDistance: 13324945.436434371
    },
    {
      c1: [45, 45],
      c2: [-45, 45],
      vincentyDistance: 6690232.932559058
    },
    {
      c1: [45, 45],
      c2: [180, 90],
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [45, 45],
      c2: [180, -90],
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [45, 45],
      c2: [-180, 90],
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [45, 45],
      c2: [-180, 90],
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [45, -45],
      c2: [45, -45],
      vincentyDistance: 0
    },
    {
      c1: [45, -45],
      c2: [-45, -45],
      vincentyDistance: 6690232.932559058
    },
    {
      c1: [45, -45],
      c2: [-45, 45],
      vincentyDistance: 13324945.436434371
    },
    {
      c1: [45, -45],
      c2: [180, 90],
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [45, -45],
      c2: [180, -90],
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [45, -45],
      c2: [-180, 90],
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [45, -45],
      c2: [-180, 90],
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [-45, -45],
      c2: [-45, -45],
      vincentyDistance: 0
    },
    {
      c1: [-45, -45],
      c2: [-45, 45],
      vincentyDistance: 9969888.755957305
    },
    {
      c1: [-45, -45],
      c2: [180, 90],
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [-45, -45],
      c2: [180, -90],
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [-45, -45],
      c2: [-180, 90],
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [-45, -45],
      c2: [-180, 90],
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [-45, 45],
      c2: [-45, 45],
      vincentyDistance: 0
    },
    {
      c1: [-45, 45],
      c2: [180, 90],
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [-45, 45],
      c2: [180, -90],
      vincentyDistance: 14986910.107290443
    },
    {
      c1: [-45, 45],
      c2: [-180, 90],
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [-45, 45],
      c2: [-180, 90],
      vincentyDistance: 5017021.35133314
    },
    {
      c1: [180, 90],
      c2: [180, 90],
      vincentyDistance: 0
    },
    {
      c1: [180, -90],
      c2: [180, -90],
      vincentyDistance: 0
    },
    {
      c1: [-180, 90],
      c2: [-180, 90],
      vincentyDistance: 0
    },
    {
      c1: [-180, 90],
      c2: [-180, 90],
      vincentyDistance: 0
    },
    {
      c1: [-180, 90],
      c2: [-180, 90],
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

});


goog.require('ol.Ellipsoid');
goog.require('ol.ellipsoid.WGS84');
