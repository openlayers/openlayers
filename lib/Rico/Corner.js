/*
 * This file has been edited substantially from the Rico-released
 * version by the OpenLayers development team.
 *  
 *  Copyright 2005 Sabre Airline Solutions  
 *  
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the
 *  License. You may obtain a copy of the License at
 *  
 *         http://www.apache.org/licenses/LICENSE-2.0  
 *  
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the * License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, * either express or
 * implied. See the License for the specific language governing
 * permissions * and limitations under the License.
 *
 */  
OpenLayers.Rico = new Object();
OpenLayers.Rico.Corner = {

    round: function(e, options) {
        e = OpenLayers.Util.getElement(e);
        this._setOptions(options);

        var color = this.options.color;
        if ( this.options.color == "fromElement" ) {
            color = this._background(e);
        }
        var bgColor = this.options.bgColor;
        if ( this.options.bgColor == "fromParent" ) {
            bgColor = this._background(e.offsetParent);
        }
        this._roundCornersImpl(e, color, bgColor);
    },

    /**   This is a helper function to change the background
    *     color of <div> that has had Rico rounded corners added.
    *
    *     It seems we cannot just set the background color for the
    *     outer <div> so each <span> element used to create the
    *     corners must have its background color set individually.
    *
    * @param {DOM} theDiv - A child of the outer <div> that was
    *                        supplied to the `round` method.
    *
    * @param {String} newColor - The new background color to use.
    */
    changeColor: function(theDiv, newColor) {
   
        theDiv.style.backgroundColor = newColor;

        var spanElements = theDiv.parentNode.getElementsByTagName("span");
        
        for (var currIdx = 0; currIdx < spanElements.length; currIdx++) {
            spanElements[currIdx].style.backgroundColor = newColor;
        }
    }, 


    /**   This is a helper function to change the background
    *     opacity of <div> that has had Rico rounded corners added.
    *
    *     See changeColor (above) for algorithm explanation
    *
    * @param {DOM} theDiv A child of the outer <div> that was
    *                        supplied to the `round` method.
    *
    * @param {int} newOpacity The new opacity to use (0-1).
    */
    changeOpacity: function(theDiv, newOpacity) {
   
        var mozillaOpacity = newOpacity;
        var ieOpacity = 'alpha(opacity=' + newOpacity * 100 + ')';
        
        theDiv.style.opacity = mozillaOpacity;
        theDiv.style.filter = ieOpacity;

        var spanElements = theDiv.parentNode.getElementsByTagName("span");
        
        for (var currIdx = 0; currIdx < spanElements.length; currIdx++) {
            spanElements[currIdx].style.opacity = mozillaOpacity;
            spanElements[currIdx].style.filter = ieOpacity;
        }

    },

    /** this function takes care of redoing the rico cornering
    *    
    *    you can't just call updateRicoCorners() again and pass it a 
    *    new options string. you have to first remove the divs that 
    *    rico puts on top and below the content div.
    *
    * @param {DOM} theDiv - A child of the outer <div> that was
    *                        supplied to the `round` method.
    *
    * @param {Object} options - list of options
    */
    reRound: function(theDiv, options) {

        var topRico = theDiv.parentNode.childNodes[0];
        //theDiv would be theDiv.parentNode.childNodes[1]
        var bottomRico = theDiv.parentNode.childNodes[2];
       
        theDiv.parentNode.removeChild(topRico);
        theDiv.parentNode.removeChild(bottomRico); 

        this.round(theDiv.parentNode, options);
    }, 

   _roundCornersImpl: function(e, color, bgColor) {
      if(this.options.border) {
         this._renderBorder(e,bgColor);
      }
      if(this._isTopRounded()) {
         this._roundTopCorners(e,color,bgColor);
      }
      if(this._isBottomRounded()) {
         this._roundBottomCorners(e,color,bgColor);
      }
   },

   _renderBorder: function(el,bgColor) {
      var borderValue = "1px solid " + this._borderColor(bgColor);
      var borderL = "border-left: "  + borderValue;
      var borderR = "border-right: " + borderValue;
      var style   = "style='" + borderL + ";" + borderR +  "'";
      el.innerHTML = "<div " + style + ">" + el.innerHTML + "</div>";
   },

   _roundTopCorners: function(el, color, bgColor) {
      var corner = this._createCorner(bgColor);
      for(var i=0 ; i < this.options.numSlices ; i++ ) {
         corner.appendChild(this._createCornerSlice(color,bgColor,i,"top"));
      }
      el.style.paddingTop = 0;
      el.insertBefore(corner,el.firstChild);
   },

   _roundBottomCorners: function(el, color, bgColor) {
      var corner = this._createCorner(bgColor);
      for(var i=(this.options.numSlices-1) ; i >= 0 ; i-- ) {
         corner.appendChild(this._createCornerSlice(color,bgColor,i,"bottom"));
      }
      el.style.paddingBottom = 0;
      el.appendChild(corner);
   },

   _createCorner: function(bgColor) {
      var corner = document.createElement("div");
      corner.style.backgroundColor = (this._isTransparent() ? "transparent" : bgColor);
      return corner;
   },

   _createCornerSlice: function(color,bgColor, n, position) {
      var slice = document.createElement("span");

      var inStyle = slice.style;
      inStyle.backgroundColor = color;
      inStyle.display  = "block";
      inStyle.height   = "1px";
      inStyle.overflow = "hidden";
      inStyle.fontSize = "1px";

      var borderColor = this._borderColor(color,bgColor);
      if ( this.options.border && n == 0 ) {
         inStyle.borderTopStyle    = "solid";
         inStyle.borderTopWidth    = "1px";
         inStyle.borderLeftWidth   = "0px";
         inStyle.borderRightWidth  = "0px";
         inStyle.borderBottomWidth = "0px";
         inStyle.height            = "0px"; // assumes css compliant box model
         inStyle.borderColor       = borderColor;
      }
      else if(borderColor) {
         inStyle.borderColor = borderColor;
         inStyle.borderStyle = "solid";
         inStyle.borderWidth = "0px 1px";
      }

      if ( !this.options.compact && (n == (this.options.numSlices-1)) ) {
         inStyle.height = "2px";
      }
      this._setMargin(slice, n, position);
      this._setBorder(slice, n, position);
      return slice;
   },

   _setOptions: function(options) {
      this.options = {
         corners : "all",
         color   : "fromElement",
         bgColor : "fromParent",
         blend   : true,
         border  : false,
         compact : false
      };
      OpenLayers.Util.extend(this.options, options || {});

      this.options.numSlices = this.options.compact ? 2 : 4;
      if ( this._isTransparent() ) {
         this.options.blend = false;
      }
   },

   _whichSideTop: function() {
      if ( this._hasString(this.options.corners, "all", "top") ) {
         return "";
      }
      if ( this.options.corners.indexOf("tl") >= 0 && this.options.corners.indexOf("tr") >= 0 ) {
         return "";
      }
      if (this.options.corners.indexOf("tl") >= 0) {
         return "left";
      } else if (this.options.corners.indexOf("tr") >= 0) {
          return "right";
      }
      return "";
   },

   _whichSideBottom: function() {
      if ( this._hasString(this.options.corners, "all", "bottom") ) {
         return "";
      }
      if ( this.options.corners.indexOf("bl")>=0 && this.options.corners.indexOf("br")>=0 ) {
         return "";
      }

      if(this.options.corners.indexOf("bl") >=0) {
         return "left";
      } else if(this.options.corners.indexOf("br")>=0) {
         return "right";
      }
      return "";
   },

   _borderColor : function(color,bgColor) {
      if ( color == "transparent" ) {
         return bgColor;
      } else if ( this.options.border ) {
         return this.options.border;
      } else if ( this.options.blend ) {
         return this._blend( bgColor, color );
      } else {
         return "";
      }
   },


   _setMargin: function(el, n, corners) {
      var marginSize = this._marginSize(n);
      var whichSide = corners == "top" ? this._whichSideTop() : this._whichSideBottom();

      if ( whichSide == "left" ) {
         el.style.marginLeft = marginSize + "px"; el.style.marginRight = "0px";
      }
      else if ( whichSide == "right" ) {
         el.style.marginRight = marginSize + "px"; el.style.marginLeft  = "0px";
      }
      else {
         el.style.marginLeft = marginSize + "px"; el.style.marginRight = marginSize + "px";
      }
   },

   _setBorder: function(el,n,corners) {
      var borderSize = this._borderSize(n);
      var whichSide = corners == "top" ? this._whichSideTop() : this._whichSideBottom();
      if ( whichSide == "left" ) {
         el.style.borderLeftWidth = borderSize + "px"; el.style.borderRightWidth = "0px";
      }
      else if ( whichSide == "right" ) {
         el.style.borderRightWidth = borderSize + "px"; el.style.borderLeftWidth  = "0px";
      }
      else {
         el.style.borderLeftWidth = borderSize + "px"; el.style.borderRightWidth = borderSize + "px";
      }
      if (this.options.border != false) {
        el.style.borderLeftWidth = borderSize + "px"; el.style.borderRightWidth = borderSize + "px";
      }
   },

   _marginSize: function(n) {
      if ( this._isTransparent() ) {
         return 0;
      }
      var marginSizes          = [ 5, 3, 2, 1 ];
      var blendedMarginSizes   = [ 3, 2, 1, 0 ];
      var compactMarginSizes   = [ 2, 1 ];
      var smBlendedMarginSizes = [ 1, 0 ];

      if ( this.options.compact && this.options.blend ) {
         return smBlendedMarginSizes[n];
      } else if ( this.options.compact ) {
         return compactMarginSizes[n];
      } else if ( this.options.blend ) {
         return blendedMarginSizes[n];
      } else {
         return marginSizes[n];
      }
   },

   _borderSize: function(n) {
      var transparentBorderSizes = [ 5, 3, 2, 1 ];
      var blendedBorderSizes     = [ 2, 1, 1, 1 ];
      var compactBorderSizes     = [ 1, 0 ];
      var actualBorderSizes      = [ 0, 2, 0, 0 ];

      if ( this.options.compact && (this.options.blend || this._isTransparent()) ) {
         return 1;
      } else if ( this.options.compact ) {
         return compactBorderSizes[n];
      } else if ( this.options.blend ) {
         return blendedBorderSizes[n];
      } else if ( this.options.border ) {
         return actualBorderSizes[n];
      } else if ( this._isTransparent() ) {
         return transparentBorderSizes[n];
      }
      return 0;
   },

   _hasString: function(str) { for(var i=1 ; i<arguments.length ; i++) if (str.indexOf(arguments[i]) >= 0) { return true; } return false; },
   _blend: function(c1, c2) { var cc1 = OpenLayers.Rico.Color.createFromHex(c1); cc1.blend(OpenLayers.Rico.Color.createFromHex(c2)); return cc1; },
   _background: function(el) { try { return OpenLayers.Rico.Color.createColorFromBackground(el).asHex(); } catch(err) { return "#ffffff"; } },
   _isTransparent: function() { return this.options.color == "transparent"; },
   _isTopRounded: function() { return this._hasString(this.options.corners, "all", "top", "tl", "tr"); },
   _isBottomRounded: function() { return this._hasString(this.options.corners, "all", "bottom", "bl", "br"); },
   _hasSingleTextChild: function(el) { return el.childNodes.length == 1 && el.childNodes[0].nodeType == 3; }
};