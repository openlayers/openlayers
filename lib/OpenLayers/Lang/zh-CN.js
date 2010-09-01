/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["zh-CN"]
 * Dictionary for Simplified Chinese.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["zh-CN"] = {

    'unhandledRequest': "未处理的请求，返回值为 ${statusText}",

    'permalink': "永久链接",

    'overlays': "叠加层",

    'baseLayer': "基础图层",

    'sameProjection':
        "鹰眼地图只有在和主地图使用相同的投影的时候才能正常共工作",

    'readNotImplemented': "读取功能没有实现。",

    'writeNotImplemented': "写入功能没有实现。",

    'noFID': "无法更新feature，缺少FID。",

    'errorLoadingGML': "加载GML文件 ${url} 出现错误。",

    'browserNotSupported':
        "你使用的浏览器不支持矢量渲染。当前支持的渲染方式包括：\n${renderers}",

    'componentShouldBe': "addFeatures : 组件类型应该是 ${geomType}",

    // console message
    'getFeatureError':
        "getFeatureFromEvent方法在一个没有渲染器的图层上被调用。 这通常意味着您" +
        "销毁了一个图层，但并未销毁其关联的handler。",

    // console message
    'minZoomLevelError':
        "minZoomLevel属性仅适合用于" +
        "使用了固定缩放级别的图层。这个 " +
        "wfs 图层检查 minZoomLevel 是过去遗留下来的。" +
        "然而，我们不能移除它，" +
        "而破坏依赖于它的基于OL的应用程序。" +
        "因此，我们废除了它 -- minZoomLevel " +
        "将会在3.0中被移除。请改用 " +
        "min/max resolution 设置，参考：" +
        "http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS Transaction: 成功。 ${response}",

    'commitFailed': "WFS Transaction: 失败。 ${response}",

    'googleWarning':
        "Google图层不能正确加载。<br><br>" +
        "要消除这个信息，请在右上角的" +
        "图层控制面板中选择其他的基础图层。<br><br>" +
        "这种情况很可能是没有正确的包含Google地图脚本库，" +
        "或者是没有包含在你的站点上" +
        "使用的正确的Google Maps API密匙。<br><br>" +
        "开发者：获取使其正确工作的帮助信息，" +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>点击这里</a>",

    'getLayerWarning':
        "${layerType} 图层不能正确加载。<br><br>" +
        "要消除这个信息，请在右上角的" +
        "图层控制面板中选择其他的基础图层。<br><br>" +
        "这种情况很可能是没有正确的包含" +
        "${layerLib} 脚本库。<br><br>" +
        "开发者：获取使其正确工作的帮助信息，" +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>点击这里</a>",

    'scale': "比例尺 = 1 : ${scaleDenom}",

    // console message
    'layerAlreadyAdded':
        "你尝试添加图层： ${layerName} 到地图中，但是它之前就已经被添加。",

    // console message
    'reprojectDeprecated':
        "你正在使用 ${layerName} 图层上的'reproject'选项。" +
        "这个选项已经不再使用：" +
        "它是被设计用来支持显示商业的地图数据，" + 
        "不过现在该功能可以通过使用Spherical Mercator来实现。" +
        "更多信息可以参阅" +
        "http://trac.openlayers.org/wiki/SphericalMercator.",

    // console message
    'methodDeprecated':
        "该方法已经不再被支持，并且将在3.0中被移除。" +
        "请使用 ${newMethod} 方法来替代。",

    // console message
    'boundsAddError': "您必须传递 x 和 y 两个参数值到 add 方法。",

    // console message
    'lonlatAddError': "您必须传递 lon 和 lat 两个参数值到 add 方法。",

    // console message
    'pixelAddError': "您必须传递 x and y 两个参数值到 add 方法。",

    // console message
    'unsupportedGeometryType': "不支持的几何体类型： ${geomType}",

    // console message
    'pagePositionFailed':
        "OpenLayers.Util.pagePosition 失败：id 为 ${elemId} 的元素可能被错置。",
                    
    'end': ''
};
