/**
 * echarts OpenLayers 3地图扩展，必须在echarts初始化前使用
 *
 * @desc echarts基于Canvas，纯Javascript图表库，提供直观，生动，可交互，可个性化定制的数据统计图表。
 * @author Neil (杨骥, 511415343@qq.com)
 * @modify FreeGIS
 */
    /**
     * 构造函数
     *
     * @param {String|HTMLElement|ol.Map} obj
     * @param {echarts} ec
     * @constructor
     */
    function OpenLayer3Ext(map,ec) {
        this._map=map;
        var size = map.getSize();
        var div = this._echartsContainer = document.createElement('div');
        div.style.position = 'absolute';
        div.style.height = size[1] + 'px';
        div.style.width = size[0] + 'px';
        div.style.top = 0;
        div.style.left = 0;
        map.getViewport().appendChild(div);
        this._init(map,ec);
    };

    /**
     * echarts 容器元素
     *
     * @type {HTMLElement}
     * @private
     */
    OpenLayer3Ext.prototype._echartsContainer = null;

    /**
     * ol地图实例
     *
     * @type {BMap.Map}
     * @private
     */
    OpenLayer3Ext.prototype._map = null;

    /**
     * 使用的echarts实例
     *
     * @type {ECharts}
     * @private
     */
    OpenLayer3Ext.prototype._ec = null;

    /**
     * geoCoord
     *
     * @type {Object}
     * @private
     */
    OpenLayer3Ext.prototype._geoCoord = [];

    /**
     * 记录地图的便宜量
     *
     * @type {Array.<number>}
     * @private
     */
    OpenLayer3Ext.prototype._mapOffset = [0, 0];


    /**
     * 初始化方法
     *
     * @param {String|HTMLElement|ol.Map} obj
     * @param {BMap} BMap
     * @param {echarts} ec
     * @private
     */
    OpenLayer3Ext.prototype._init = function (map,ec) {
        var self = this;
        self._map = map;

        /**
         * 获取echarts容器
         *
         * @return {HTMLElement}
         * @public
         */
        self.getEchartsContainer = function () {
            return self._echartsContainer;
        };

        /**
         * 获取map实例
         *
         * @return {BMap.Map}
         * @public
         */
        self.getMap = function () {
            return self._map;
        }



        /**
         * 经纬度转换为屏幕像素
         *
         * @param {Array.<number>} geoCoord  经纬度
         * @return {Array.<number>}
         * @public
         */
        self.geoCoord2Pixel = function (geoCoord) {
            return self._map.getPixelFromCoordinate(ol.proj.fromLonLat(geoCoord));
        };

        /**
         * 屏幕像素转换为经纬度
         *
         * @param {Array.<number>} pixel  像素坐标
         * @return {Array.<number>}
         * @public
         */
        self.pixel2GeoCoord = function (pixel) {
            return self._map.getCoordinateFromPixel(pixel);

        };

        /**
         * 初始化echarts实例
         *
         * @return {ECharts}
         * @public
         */
        self.initECharts = function () {
            self._ec = ec.init.apply(self, arguments);
            self._bindEvent();
            self._addMarkWrap();
            return self._ec;
        };

        // addMark wrap for get position from baidu map by geo location
        // by kener at 2015.01.08
        self._addMarkWrap = function () {
            function _addMark(seriesIdx, markData, markType) {
                var data;
                if (markType == 'markPoint') {
                    var data = markData.data;
                    if (data && data.length) {
                        for (var k = 0, len = data.length; k < len; k++) {
                            self._AddPos(data[k]);
                        }
                    }
                }
                else {
                    data = markData.data;
                    if (data && data.length) {
                        for (var k = 0, len = data.length; k < len; k++) {
                            self._AddPos(data[k][0]);
                            self._AddPos(data[k][1]);
                        }
                    }
                }
                self._ec._addMarkOri(seriesIdx, markData, markType);
            }

            self._ec._addMarkOri = self._ec._addMark;
            self._ec._addMark = _addMark;
        };

        /**
         * 获取ECharts实例
         *
         * @return {ECharts}
         * @public
         */
        self.getECharts = function () {
            return self._ec;
        };

        /**
         * 获取地图的偏移量
         *
         * @return {Array.<number>}
         * @public
         */
        self.getMapOffset = function () {
            return self._mapOffset;
        };

        /**
         * 对echarts的setOption加一次处理
         * 用来为markPoint、markLine中添加x、y坐标，需要name与geoCoord对应
         *
         * @param {Object}
         * @public
         */
        self.setOption = function (option, notMerge) {
            var series = option.series || {};

            // 记录所有的geoCoord
            for (var i = 0, item; item = series[i++];) {
                var geoCoord = item.geoCoord;
                if (geoCoord) {
                    for (var k in geoCoord) {
                        self._geoCoord[k] = geoCoord[k];
                    }
                }
            }

            // 添加x、y
            for (var i = 0, item; item = series[i++];) {
                var markPoint = item.markPoint || {};
                var markLine = item.markLine || {};

                var data = markPoint.data;
                if (data && data.length) {
                    for (var k = 0, len = data.length; k < len; k++) {
                        self._AddPos(data[k]);
                    }
                }

                data = markLine.data;
                if (data && data.length) {
                    for (var k = 0, len = data.length; k < len; k++) {
                        self._AddPos(data[k][0]);
                        self._AddPos(data[k][1]);
                    }
                }
            }

            self._ec.setOption(option, notMerge);
        }

        /**
         * 增加x、y坐标
         *
         * @param {Object} obj  markPoint、markLine data中的项，必须有name
         * @param {Object} geoCoord
         */
        self._AddPos = function (obj) {
            var coord = this._geoCoord[obj.name]
            var pos = this.geoCoord2Pixel(coord);
            obj.x = pos[0] ;//- self._mapOffset[0];
            obj.y = pos[1] ;//- self._mapOffset[1];
        };

        /**
         * 绑定地图事件的处理方法
         *
         * @private
         */
        self._bindEvent = function () {
            //self._map.getView().on('change:resolution', _zoomChangeHandler('zoom'));
            self._map.getView().on('change:center', _moveHandler('moving'));
            self._map.on('moveend', _moveHandler('moveend'));
            self._ec.getZrender().on('dragstart', _dragZrenderHandler(true));
            self._ec.getZrender().on('dragend', _dragZrenderHandler(false));
        }

        /**
         * 地图缩放触发事件
         *
         * @private
         */
        function _zoomChangeHandler(type) {
            _fireEvent(type);
        }

        /**
         * 地图移动、如拖拽触发事件
         *
         * @param {string} type moving | moveend  移动中|移动结束
         * @return {Function}
         * @private
         */
        function _moveHandler(type) {
            return function (e) {
                // 记录偏移量
                var offsetEle =
                    self._echartsContainer.parentNode.parentNode.parentNode;
                self._mapOffset = [
                    -parseInt(offsetEle.style.left) || 0,
                    -parseInt(offsetEle.style.top) || 0
                ];
                self._echartsContainer.style.left = self._mapOffset[0] + 'px';
                self._echartsContainer.style.top = self._mapOffset[1] + 'px';
                _fireEvent(type);
            }
        }

        /**
         * Zrender拖拽触发事件
         *
         * @param {boolean} isStart
         * @return {Function}
         * @private
         */
        function _dragZrenderHandler(isStart) {
            return function () {
                self._map.dragging = isStart;
            }
        }

        /**
         * 触发事件
         *
         * @param {stirng}  type 事件类型
         * @private
         */
        function _fireEvent(type) {
            var func = self['on' + type];
            if (func) {
                func();
            } else {
                self.refresh();
            }
        }

        /**
         * 刷新页面
         *
         * @public
         */
        self.refresh = function () {
            if (self._ec) {
                var option = self._ec.getOption();
                var component = self._ec.component || {};
                var legend = component.legend;
                var dataRange = component.dataRange;

                if (legend) {
                    option.legend.selected = legend.getSelectedMap();
                }

                if (dataRange) {
                    option.dataRange.range = dataRange._range;
                }
                self._ec.clear();
                self.setOption(option);
            }
        };
        return OpenLayer3Ext;
    }
