/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["cs-CZ"]
 * Dictionary for Czech.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["cs-CZ"] = {

    'unhandledRequest': "Nezpracovaná návratová hodnota ${statusText}",

    'permalink': "Odkaz na aktuální mapu",

    'overlays': "Překryvné vrstvy",

    'baseLayer': "Podkladové vrstvy",

    'sameProjection':
        "Přehledka pracuje správně pouze pokud je ve stejné projekci, jako hlavní mapa",

    'readNotImplemented': "Read není implementováno.",

    'writeNotImplemented': "Write není implementováno.",

    'noFID': "Nelze aktualizovat prvek, pro který neexistuje FID.",

    'errorLoadingGML': "Chyba při načítání souboru GML ${url}",

    'browserNotSupported':
        "Váš prohlížeč nepodporuje vykreslování vektorů. Momentálně podporované nástroje jsou::\n${renderers}",

    'componentShouldBe': "addFeatures : komponenta by měla být ${geomType}",

    // console message
    'getFeatureError':
        "getFeatureFromEvent bylo zavoláno na vrstvě, která nemá vykreslovač. To obyčejně znamená, že " +
        "jste odstranil vrstvu, ale ne rutinu s ní asociovanou.",

    // console message
    'minZoomLevelError':
        "Vlastnost minZoomLevel by se měla používat pouze " +
        "s potomky FixedZoomLevels vrstvami. To znamená, že " +
        "vrstva wfs kontroluje, zda-li minZoomLevel není zbytek z minulosti." +
        "Nelze to ovšem vyjmout bez možnosti, že bychom rozbili " +
        "aplikace postavené na OL, které by na tom mohly záviset. " +
        "Proto tuto vlastnost nedoporučujeme používat --  kontrola minZoomLevel " +
        "bude odstraněna ve verzi 3.0. Použijte prosím " +
        "raději nastavení min/max podle příkaldu popsaného na: " +
        "http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS Transaction: ÚSPĚCH ${response}",

    'commitFailed': "WFS Transaction: CHYBA ${response}",

    'googleWarning':
        "Nepodařilo se správně načíst vrstvu Google.<br><br>" +
        "Abyste se zbavili této zprávy, zvolte jinou základní vrstvu " +
        "v přepínači vrstev.<br><br>" +
        "To se většinou stává, pokud " +
        "nebyl načten skript, nebo neobsahuje správný " +
        "klíč pro API pro tuto stránku.<br><br>" +
        "Vývojáři: Pro pomoc, aby tohle fungovalo , " +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>klikněte sem</a>",

    'getLayerWarning':
        "The ${layerType} Layer was unable to load correctly.<br><br>" +
        "To get rid of this message, select a new BaseLayer " +
        "in the layer switcher in the upper-right corner.<br><br>" +
        "Most likely, this is because the ${layerLib} library " +
        "script was either not correctly included.<br><br>" +
        "Developers: For help getting this working correctly, " +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>click here</a>",

    'scale': "Měřítko = 1 : ${scaleDenom}",

    // console message
    'layerAlreadyAdded':
        "Pokusili jste se přidat vrstvu: ${layerName} do mapy, ale tato vrstva je již v mapě přítomna.",

    // console message
    'reprojectDeprecated':
        "Použil jste volbu 'reproject' " +
        "ve vrstvě ${layerName}. Tato volba není doporučená: " +
        "byla zde proto, aby bylo možno zobrazovat data z okomerčních serverů, " + 
        "ale tato funkce je nyní zajištěna pomocí podpory " +
        "Spherical Mercator. Více informací naleznete na " +
        "http://trac.openlayers.org/wiki/SphericalMercator.",

    // console message
    'methodDeprecated':
        "Tato metodat není doporučená a bude vyjmuta ve verzi 3.0. " +
        "Prosím, použijte raději ${newMethod}.",

    // console message
    'boundsAddError': "Pro přídavnou funkci musíte zadat obě souřadnice x a y.",

    // console message
    'lonlatAddError': "Pro přídavnou funkci musíte zadat obě souřadnice lon a lat.",

    // console message
    'pixelAddError': "Pro přídavnou funkci musíte zadat obě souřadnice x a y.",

    // console message
    'unsupportedGeometryType': "Nepodporovaný typ geometrie: ${geomType}",

    // console message
    'pagePositionFailed':
        "OpenLayers.Util.pagePosition selhalo: element s  id ${elemId} je asi umístěn chybně.",
                    
    'end': ''
};
