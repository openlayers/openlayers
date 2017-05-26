(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ol3Esri = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global ol */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var LayerGenerator = (function () {
  function LayerGenerator(props) {
    _classCallCheck(this, LayerGenerator);

    this._config = props.config;
    this._url = props.url;
    this._resolutions = this._getResolutions();
    this._projection = this._getProjection();
    this._attribution = this._getAttribution();
    this._fullExtent = this._getFullExtent();
  }

  _createClass(LayerGenerator, [{
    key: 'getFullExtent',
    value: function getFullExtent() {
      return this._fullExtent;
    }
  }, {
    key: '_getFullExtent',
    value: function _getFullExtent() {
      return [this._config.fullExtent.xmin, this._config.fullExtent.ymin, this._config.fullExtent.xmax, this._config.fullExtent.ymax];
    }
  }, {
    key: 'getResolutions',
    value: function getResolutions() {
      return this._resolutions;
    }
  }, {
    key: '_getResolutions',
    value: function _getResolutions() {
      var tileInfo = this._config.tileInfo;
      if (tileInfo) {
        var resolutions = [];
        for (var i = 0, ii = tileInfo.lods.length; i < ii; ++i) {
          resolutions.push(tileInfo.lods[i].resolution);
        }
        return resolutions;
      }
    }
  }, {
    key: '_getProjection',
    value: function _getProjection() {
      var epsg = 'EPSG:' + this._config.spatialReference.wkid;
      var units = this._config.units === 'esriMeters' ? 'm' : 'degrees';
      var projection = ol.proj.get(epsg) ? ol.proj.get(epsg) : new ol.proj.Projection({ code: epsg, units: units });
      return projection;
    }
  }, {
    key: 'getProjection',
    value: function getProjection() {
      return this._projection;
    }
  }, {
    key: '_getAttribution',
    value: function _getAttribution() {
      return new ol.Attribution({
        html: this._config.copyrightText
      });
    }
  }, {
    key: 'createArcGISRestSource',
    value: function createArcGISRestSource() {
      return new ol.source.TileArcGISRest({
        url: this._url,
        attributions: [this._attribution]
      });
    }
  }, {
    key: 'createXYZSource',
    value: function createXYZSource() {
      var tileInfo = this._config.tileInfo;
      var tileSize = [tileInfo.width || tileInfo.cols, tileInfo.height || tileInfo.rows];
      var tileOrigin = [tileInfo.origin.x, tileInfo.origin.y];
      var urls;
      var suffix = '/tile/{z}/{y}/{x}';
      if (this._config.tileServers) {
        urls = this._config.tileServers;
        for (var i = 0, ii = urls.length; i < ii; ++i) {
          urls[i] += suffix;
        }
      } else {
        urls = [this._url += suffix];
      }
      var width = tileSize[0] * this._resolutions[0];
      var height = tileSize[1] * this._resolutions[0];
      var tileUrlFunction, extent, tileGrid;
      if (this._projection.getCode() === 'EPSG:4326') {
        tileUrlFunction = function (tileCoord) {
          var url = urls.length === 1 ? urls[0] : urls[Math.floor(Math.random() * (urls.length - 0 + 1)) + 0];
          return url.replace('{z}', (tileCoord[0] - 1).toString()).replace('{x}', tileCoord[1].toString()).replace('{y}', (-tileCoord[2] - 1).toString());
        };
      } else {
        extent = [tileOrigin[0], tileOrigin[1] - height, tileOrigin[0] + width, tileOrigin[1]];
        tileGrid = new ol.tilegrid.TileGrid({
          origin: tileOrigin,
          extent: extent,
          resolutions: this._resolutions
        });
      }
      return new ol.source.XYZ({
        attributions: [this._attribution],
        projection: this._projection,
        tileSize: tileSize,
        tileGrid: tileGrid,
        tileUrlFunction: tileUrlFunction,
        urls: urls
      });
    }
  }, {
    key: 'createLayer',
    value: function createLayer() {
      var layer = new ol.layer.Tile();
      if (this._config.tileInfo) {
        layer.setSource(this.createXYZSource());
      } else {
        layer.setSource(this.createArcGISRestSource());
      }
      return layer;
    }
  }]);

  return LayerGenerator;
})();

exports['default'] = LayerGenerator;
module.exports = exports['default'];

},{}],2:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _LayerGeneratorJs = require('./LayerGenerator.js');

var _LayerGeneratorJs2 = _interopRequireDefault(_LayerGeneratorJs);

module.exports = {
  LayerGenerator: _LayerGeneratorJs2['default']
};

},{"./LayerGenerator.js":1}]},{},[2])(2)
});