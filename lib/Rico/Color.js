/** 
 * @requires OpenLayers/BaseTypes/Class.js
 * @requires OpenLayers/BaseTypes/Element.js
 */


/*
 * This file has been edited substantially from the Rico-released version by
 * the OpenLayers development team.
 *
 * This file is licensed under the Apache License, Version 2.0.
 */
OpenLayers.Rico = OpenLayers.Rico || {};
OpenLayers.Rico.Color = OpenLayers.Class({

   initialize: function(red, green, blue) {
      this.rgb = { r: red, g : green, b : blue };
   },

   setRed: function(r) {
      this.rgb.r = r;
   },

   setGreen: function(g) {
      this.rgb.g = g;
   },

   setBlue: function(b) {
      this.rgb.b = b;
   },

   setHue: function(h) {

      // get an HSB model, and set the new hue...
      var hsb = this.asHSB();
      hsb.h = h;

      // convert back to RGB...
      this.rgb = OpenLayers.Rico.Color.HSBtoRGB(hsb.h, hsb.s, hsb.b);
   },

   setSaturation: function(s) {
      // get an HSB model, and set the new hue...
      var hsb = this.asHSB();
      hsb.s = s;

      // convert back to RGB and set values...
      this.rgb = OpenLayers.Rico.Color.HSBtoRGB(hsb.h, hsb.s, hsb.b);
   },

   setBrightness: function(b) {
      // get an HSB model, and set the new hue...
      var hsb = this.asHSB();
      hsb.b = b;

      // convert back to RGB and set values...
      this.rgb = OpenLayers.Rico.Color.HSBtoRGB( hsb.h, hsb.s, hsb.b );
   },

   darken: function(percent) {
      var hsb  = this.asHSB();
      this.rgb = OpenLayers.Rico.Color.HSBtoRGB(hsb.h, hsb.s, Math.max(hsb.b - percent,0));
   },

   brighten: function(percent) {
      var hsb  = this.asHSB();
      this.rgb = OpenLayers.Rico.Color.HSBtoRGB(hsb.h, hsb.s, Math.min(hsb.b + percent,1));
   },

   blend: function(other) {
      this.rgb.r = Math.floor((this.rgb.r + other.rgb.r)/2);
      this.rgb.g = Math.floor((this.rgb.g + other.rgb.g)/2);
      this.rgb.b = Math.floor((this.rgb.b + other.rgb.b)/2);
   },

   isBright: function() {
      var hsb = this.asHSB();
      return this.asHSB().b > 0.5;
   },

   isDark: function() {
      return ! this.isBright();
   },

   asRGB: function() {
      return "rgb(" + this.rgb.r + "," + this.rgb.g + "," + this.rgb.b + ")";
   },

   asHex: function() {
      return "#" + this.rgb.r.toColorPart() + this.rgb.g.toColorPart() + this.rgb.b.toColorPart();
   },

   asHSB: function() {
      return OpenLayers.Rico.Color.RGBtoHSB(this.rgb.r, this.rgb.g, this.rgb.b);
   },

   toString: function() {
      return this.asHex();
   }

});

OpenLayers.Rico.Color.createFromHex = function(hexCode) {
  if(hexCode.length==4) {
    var shortHexCode = hexCode; 
    var hexCode = '#';
    for(var i=1;i<4;i++) { 
        hexCode += (shortHexCode.charAt(i) + 
shortHexCode.charAt(i)); 
    }
  }
   if ( hexCode.indexOf('#') == 0 ) {
       hexCode = hexCode.substring(1);
   }
   var red   = hexCode.substring(0,2);
   var green = hexCode.substring(2,4);
   var blue  = hexCode.substring(4,6);
   return new OpenLayers.Rico.Color( parseInt(red,16), parseInt(green,16), parseInt(blue,16) );
};

/**
 * Factory method for creating a color from the background of
 * an HTML element.
 */
OpenLayers.Rico.Color.createColorFromBackground = function(elem) {

   var actualColor = 
      OpenLayers.Element.getStyle(OpenLayers.Util.getElement(elem), 
                                        "backgroundColor");

   if ( actualColor == "transparent" && elem.parentNode ) {
      return OpenLayers.Rico.Color.createColorFromBackground(elem.parentNode);
   }
   if ( actualColor == null ) {
      return new OpenLayers.Rico.Color(255,255,255);
   }
   if ( actualColor.indexOf("rgb(") == 0 ) {
      var colors = actualColor.substring(4, actualColor.length - 1 );
      var colorArray = colors.split(",");
      return new OpenLayers.Rico.Color( parseInt( colorArray[0] ),
                            parseInt( colorArray[1] ),
                            parseInt( colorArray[2] )  );

   }
   else if ( actualColor.indexOf("#") == 0 ) {
      return OpenLayers.Rico.Color.createFromHex(actualColor);
   }
   else {
      return new OpenLayers.Rico.Color(255,255,255);
   }
};

OpenLayers.Rico.Color.HSBtoRGB = function(hue, saturation, brightness) {

   var red   = 0;
    var green = 0;
    var blue  = 0;

   if (saturation == 0) {
      red = parseInt(brightness * 255.0 + 0.5);
       green = red;
       blue = red;
    }
    else {
      var h = (hue - Math.floor(hue)) * 6.0;
      var f = h - Math.floor(h);
      var p = brightness * (1.0 - saturation);
      var q = brightness * (1.0 - saturation * f);
      var t = brightness * (1.0 - (saturation * (1.0 - f)));

      switch (parseInt(h)) {
         case 0:
            red   = (brightness * 255.0 + 0.5);
            green = (t * 255.0 + 0.5);
            blue  = (p * 255.0 + 0.5);
            break;
         case 1:
            red   = (q * 255.0 + 0.5);
            green = (brightness * 255.0 + 0.5);
            blue  = (p * 255.0 + 0.5);
            break;
         case 2:
            red   = (p * 255.0 + 0.5);
            green = (brightness * 255.0 + 0.5);
            blue  = (t * 255.0 + 0.5);
            break;
         case 3:
            red   = (p * 255.0 + 0.5);
            green = (q * 255.0 + 0.5);
            blue  = (brightness * 255.0 + 0.5);
            break;
         case 4:
            red   = (t * 255.0 + 0.5);
            green = (p * 255.0 + 0.5);
            blue  = (brightness * 255.0 + 0.5);
            break;
          case 5:
            red   = (brightness * 255.0 + 0.5);
            green = (p * 255.0 + 0.5);
            blue  = (q * 255.0 + 0.5);
            break;
        }
    }

   return { r : parseInt(red), g : parseInt(green) , b : parseInt(blue) };
};

OpenLayers.Rico.Color.RGBtoHSB = function(r, g, b) {

   var hue;
   var saturation;
   var brightness;

   var cmax = (r > g) ? r : g;
   if (b > cmax) {
      cmax = b;
   }
   var cmin = (r < g) ? r : g;
   if (b < cmin) {
      cmin = b;
   }
   brightness = cmax / 255.0;
   if (cmax != 0) {
      saturation = (cmax - cmin)/cmax;
   } else {
      saturation = 0;
   }
   if (saturation == 0) {
      hue = 0;
   } else {
      var redc   = (cmax - r)/(cmax - cmin);
        var greenc = (cmax - g)/(cmax - cmin);
        var bluec  = (cmax - b)/(cmax - cmin);

        if (r == cmax) {
           hue = bluec - greenc;
        } else if (g == cmax) {
           hue = 2.0 + redc - bluec;
      } else {
           hue = 4.0 + greenc - redc;
      }
        hue = hue / 6.0;
        if (hue < 0) {
           hue = hue + 1.0;
        }
   }

   return { h : hue, s : saturation, b : brightness };
};

