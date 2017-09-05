

import _ol_style_Fill_ from '../../../../src/ol/style/fill';
import _ol_style_Stroke_ from '../../../../src/ol/style/stroke';
import _ol_style_Text_ from '../../../../src/ol/style/text';


describe('ol.style.Text', function() {

  describe('#constructor', function() {

    it('uses a default fill style if none passed', function() {
      var style = new _ol_style_Text_();
      expect(style.getFill().getColor()).to.be('#333');
    });

    it('uses a provided fill style if one passed', function() {
      var style = new _ol_style_Text_({
        fill: new _ol_style_Fill_({color: '#123456'})
      });
      expect(style.getFill().getColor()).to.be('#123456');
    });

    it('can always be resetted to no color', function() {
      var style = new _ol_style_Text_();
      style.getFill().setColor();
      expect(style.getFill().getColor()).to.be(undefined);
    });

  });

  describe('#clone', function() {

    it('creates a new ol.style.Text', function() {
      var original = new _ol_style_Text_();
      var clone = original.clone();
      expect(clone).to.be.an(_ol_style_Text_);
      expect(clone).to.not.be(original);
    });

    it('copies all values', function() {
      var original = new _ol_style_Text_({
        font: '12px serif',
        offsetX: 4,
        offsetY: 10,
        scale: 2,
        rotateWithView: true,
        rotation: 1.5,
        text: 'test',
        textAlign: 'center',
        textBaseline: 'top',
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        }),
        stroke: new _ol_style_Stroke_({
          color: '#319FD3'
        })
      });
      var clone = original.clone();
      expect(original.getFont()).to.eql(clone.getFont());
      expect(original.getOffsetX()).to.eql(clone.getOffsetX());
      expect(original.getOffsetY()).to.eql(clone.getOffsetY());
      expect(original.getScale()).to.eql(clone.getScale());
      expect(original.getRotateWithView()).to.eql(clone.getRotateWithView());
      expect(original.getRotation()).to.eql(clone.getRotation());
      expect(original.getText()).to.eql(clone.getText());
      expect(original.getTextAlign()).to.eql(clone.getTextAlign());
      expect(original.getTextBaseline()).to.eql(clone.getTextBaseline());
      expect(original.getStroke().getColor()).to.eql(clone.getStroke().getColor());
      expect(original.getFill().getColor()).to.eql(clone.getFill().getColor());
    });

    it('the clone does not reference the same objects as the original', function() {
      var original = new _ol_style_Text_({
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        }),
        stroke: new _ol_style_Stroke_({
          color: '#319FD3'
        })
      });
      var clone = original.clone();
      expect(original.getFill()).to.not.be(clone.getFill());
      expect(original.getStroke()).to.not.be(clone.getStroke());

      clone.getFill().setColor('#012345');
      clone.getStroke().setColor('#012345');
      expect(original.getFill().getColor()).to.not.eql(clone.getFill().getColor());
      expect(original.getStroke().getColor()).to.not.eql(clone.getStroke().getColor());
    });

  });

});
