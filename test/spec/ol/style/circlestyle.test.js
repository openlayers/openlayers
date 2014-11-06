goog.provide('ol.test.style.Circle');


describe('ol.style.Circle', function() {

  describe('#getChecksum', function() {

    it('calculates the same hash code for default options', function() {
      var style1 = new ol.style.Circle();
      var style2 = new ol.style.Circle();
      expect(style1.getChecksum()).to.eql(style2.getChecksum());
    });

    it('calculates not the same hash code (radius)', function() {
      var style1 = new ol.style.Circle();
      var style2 = new ol.style.Circle({
        radius: 5
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('calculates the same hash code (radius)', function() {
      var style1 = new ol.style.Circle({
        radius: 5
      });
      var style2 = new ol.style.Circle({
        radius: 5
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());
    });

    it('calculates not the same hash code (color)', function() {
      var style1 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        })
      });
      var style2 = new ol.style.Circle({
        radius: 5,
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('calculates the same hash code (everything set)', function() {
      var style1 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 2
        })
      });
      var style2 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 2
        })
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());
    });

    it('calculates not the same hash code (stroke width differs)', function() {
      var style1 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 3
        })
      });
      var style2 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 2
        })
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('invalidates a cached checksum if values change (fill)', function() {
      var style1 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      var style2 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());

      style1.getFill().setColor('red');
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('invalidates a cached checksum if values change (stroke)', function() {
      var style1 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      var style2 = new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());

      style1.getStroke().setWidth(4);
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

  });
});

goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
