/* Translators (2009 onwards):
 *  - Mormegil
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["cs-CZ"]
 * Dictionary for Česky.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["cs-CZ"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Nezpracovaná návratová hodnota ${statusText}",

    'permalink': "Trvalý odkaz",

    'overlays': "Překryvné vrstvy",

    'baseLayer': "Podkladové vrstvy",

    'sameProjection': "Přehledka pracuje správně pouze tehdy, pokud je ve stejné projekci jako hlavní mapa",

    'readNotImplemented': "Read není implementováno.",

    'writeNotImplemented': "Write není implementováno.",

    'noFID': "Nelze aktualizovat prvek, pro který neexistuje FID.",

    'errorLoadingGML': "Chyba při načítání souboru GML ${url}",

    'browserNotSupported': "Váš prohlížeč nepodporuje vykreslování vektorů. Momentálně podporované nástroje jsou::\n${renderers}",

    'componentShouldBe': "addFeatures : komponenta by měla být ${geomType}",

    'getFeatureError': "getFeatureFromEvent bylo zavoláno na vrstvě, která nemá vykreslovač. To obyčejně znamená, že jste odstranil vrstvu, ale ne rutinu s ní asociovanou.",

    'minZoomLevelError': "Vlastnost minZoomLevel by se měla používat pouze s potomky FixedZoomLevels vrstvami. To znamená, že vrstva wfs kontroluje, zda-li minZoomLevel není zbytek z minulosti.Nelze to ovšem vyjmout bez možnosti, že bychom rozbili aplikace postavené na OL, které by na tom mohly záviset. Proto tuto vlastnost nedoporučujeme používat --  kontrola minZoomLevel bude odstraněna ve verzi 3.0. Použijte prosím raději nastavení min/max podle příkaldu popsaného na: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS Transaction: ÚSPĚCH ${response}",

    'commitFailed': "WFS Transaction: CHYBA ${response}",

    'googleWarning': "Nepodařilo se správně načíst vrstvu Google.\x3cbr\x3e\x3cbr\x3eAbyste se zbavili této zprávy, zvolte jinou základní vrstvu v přepínači vrstev.\x3cbr\x3e\x3cbr\x3eTo se většinou stává, pokud nebyl načten skript, nebo neobsahuje správný klíč pro API pro tuto stránku.\x3cbr\x3e\x3cbr\x3eVývojáři: Pro pomoc, aby tohle fungovalo , \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3eklikněte sem\x3c/a\x3e",

    'getLayerWarning': "The ${layerType} Layer was unable to load correctly.\x3cbr\x3e\x3cbr\x3eTo get rid of this message, select a new BaseLayer in the layer switcher in the upper-right corner.\x3cbr\x3e\x3cbr\x3eMost likely, this is because the ${layerLib} library script was either not correctly included.\x3cbr\x3e\x3cbr\x3eDevelopers: For help getting this working correctly, \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eclick here\x3c/a\x3e",

    'scale': "Měřítko = 1 : ${scaleDenom}",

    'layerAlreadyAdded': "Pokusili jste se přidat vrstvu: ${layerName} do mapy, ale tato vrstva je již v mapě přítomna.",

    'reprojectDeprecated': "Použil jste volbu \'reproject\' ve vrstvě ${layerName}. Tato volba není doporučená: byla zde proto, aby bylo možno zobrazovat data z okomerčních serverů, ale tato funkce je nyní zajištěna pomocí podpory Spherical Mercator. Více informací naleznete na http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Tato metoda je zavržená a bude ve verzi 3.0 odstraněna. Prosím, použijte raději ${newMethod}.",

    'boundsAddError': "Pro přídavnou funkci musíte zadat obě souřadnice x a y.",

    'lonlatAddError': "Pro přídavnou funkci musíte zadat obě souřadnice lon a lat.",

    'pixelAddError': "Pro přídavnou funkci musíte zadat obě souřadnice x a y.",

    'unsupportedGeometryType': "Nepodporovaný typ geometrie: ${geomType}",

    'pagePositionFailed': "OpenLayers.Util.pagePosition selhalo: element s  id ${elemId} je asi umístěn chybně."

});
