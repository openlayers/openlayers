/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["zh-TW"]
 * Dictionary for Traditional Chinese. (Used Mainly in Taiwan) 
 * Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["zh-TW"] = {

    'unhandledRequest': "未處理的請求，傳回值為 ${statusText}。",

    'permalink': "永久連結",

    'overlays': "額外圖層",

    'baseLayer': "基礎圖層",

    'sameProjection':
        "地圖縮覽(OverviewMap)只能在跟主地圖相同投影時起作用。",

    'readNotImplemented': "沒有實作讀取的功能。",

    'writeNotImplemented': "沒有實作寫入的功能。",

    'noFID': "因為沒有 FID 所以無法更新 feature。",

    'errorLoadingGML': "讀取GML檔案 ${url} 錯誤。",

    'browserNotSupported':
        "您的瀏覽器未支援向量渲染. 目前支援的渲染方式是:\n${renderers}",

    'componentShouldBe': "addFeatures : 元件應該為 ${geomType}",

    // console message
    'getFeatureError':
        "getFeatureFromEvent 在一個沒有被渲染的圖層裡被呼叫。這通常意味著您 " +
        "摧毀了一個圖層，但並未摧毀相關的handler。",

    // console message
    'minZoomLevelError':
        "minZoomLevel 屬性僅適合用在 " +
        "FixedZoomLevels-descendent 類型的圖層. 這個" +
        "wfs layer 的 minZoomLevel 是過去所遺留下來的，" +
        "然而我們不能移除它而不讓它將" +
        "過去的程式相容性給破壞掉。" +
        "因此我們將會迴避使用它 -- minZoomLevel " +
        "會在3.0被移除，請改" +
        "用在這邊描述的 min/max resolution 設定: " +
        "http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS Transaction: 成功 ${response}",

    'commitFailed': "WFS Transaction: 失敗 ${response}",

    'googleWarning':
        "The Google Layer 圖層無法被正確的載入。<br><br>" +
        "要迴避這個訊息, 請在右上角的圖層改變器裡，" +
        "選一個新的基礎圖層。<br><br>" +
        "很有可能是因為 Google Maps 的函式庫" +
        "腳本沒有被正確的置入，或沒有包含 " +
        "您網站上正確的 API key <br><br>" +
        "開發者: 要幫助這個行為正確完成，" +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>請按這裡</a>",

    'getLayerWarning':
        "${layerType} 圖層無法被正確的載入。<br><br>" +
        "要迴避這個訊息, 請在右上角的圖層改變器裡，" +
        "選一個新的基礎圖層。<br><br>" +
        "很有可能是因為 ${layerLib} 的函式庫" +
        "腳本沒有被正確的置入。<br><br>" +
        "開發者: 要幫助這個行為正確完成，" +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>請按這裡</a>",

    'scale': "Scale = 1 : ${scaleDenom}",

    // console message
    'layerAlreadyAdded':
        "你試著新增圖層: ${layerName} 到地圖上，但圖層之前就已經被新增了。",

    // console message
    'reprojectDeprecated':
        "你正使用 'reproject' 這個選項 " +
        "在 ${layerName} 層。這個選項已經不再使用:" +
        "它的使用原本是設計用來支援在商業地圖上秀出資料，" + 
        "但這個功能已經被" +
        "Spherical Mercator所取代。更多的資訊可以在 " +
        "http://trac.openlayers.org/wiki/SphericalMercator 找到。",

    // console message
    'methodDeprecated':
        "這個方法已經不再使用且在3.0將會被移除，" +
        "請使用 ${newMethod} 來代替。",

    // console message
    'boundsAddError': "您必須傳入 x 跟 y 兩者的值進 add 函數。",

    // console message
    'lonlatAddError': "您必須傳入 lon 跟 lat 兩者的值進 add 函數。",

    // console message
    'pixelAddError': "您必須傳入 x 跟 y 兩者的值進 add 函數。",

    // console message
    'unsupportedGeometryType': "未支援的幾何型別: ${geomType}。",

    // console message
    'pagePositionFailed':
        "OpenLayers.Util.pagePosition 失敗: id ${elemId} 的 element 可能被錯置。",
                    
    'end': ''
};
