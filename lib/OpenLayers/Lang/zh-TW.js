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

    'Permalink': "永久連結",

    'Overlays': "額外圖層",

    'Base Layer': "基礎圖層",

    'noFID': "因為沒有 FID 所以無法更新 feature。",

    'browserNotSupported':
        "您的瀏覽器未支援向量渲染. 目前支援的渲染方式是:\n${renderers}",

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

    'Scale = 1 : ${scaleDenom}': "Scale = 1 : ${scaleDenom}",

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

    'end': ''
};
