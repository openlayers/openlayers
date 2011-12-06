// ********************************************
// This source file serves *ONLY* to avoid some compilation errors when the 
//      compiler uses the flag:
//          --jscomp_error undefinedVars
//
// In this source are declared all variables from other programs that use 
//      OpenLayers. This avoids the error of undefined variable for these names.
//
// NOTE: The compiler does not include externs files like this in the 
//      compilation result.
// ********************************************

// Used in lib/Firebug/firebug.js when gecko_dom
    var frames;

// Check the console when using Firebug Lite
    var console;

// Proj4js
    var Proj4js = {Proj: function(){}};

// Check JSON in lib/OpenLayers/Format/JSON.js
    var JSON = {};

// Google Maps
    var GMap2;
    var G_NORMAL_MAP;
    var GEvent;
    var GLatLngBounds = function(){};
    var GSize = function(x, y){};
    var GPoint = function(x, y){};
    var GLatLng = function(lat, lon){};
    
// Multimap
    var MultimapViewer = function(div){};
    var MMLatLon = function(lat, lon){};
    var MMPoint = function(x, y){};

//VirtualEarth
    var VEMap = function(name){};
    var VEPixel = function(x, y){};
    var VELatLong = function(lat, lon){};
    var Msn = {VE:{}};

// Yahoo
    var YMap = function(div, type, size){};
    var YGeoPoint = function(lat, lon){};
    var YCoordPoint = function(x, y){};
    var YSize = function(w, h){};

