/* Translators (2009 onwards):
 *  - Helix84
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["sk"]
 * Dictionary for Slovenčina.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["sk"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Neobslúžené požiadavky vracajú ${statusText}",

    'permalink': "Trvalý odkaz",

    'overlays': "Prekrytia",

    'baseLayer': "Základná vrstva",

    'sameProjection': "Prehľadová mapka funguje iba vtedy, keď je v rovnakej projekcii ako hlavná mapa",

    'readNotImplemented': "Čítanie nie je implementované.",

    'writeNotImplemented': "Zápis nie je implementovaný.",

    'noFID': "Nie je možné aktualizovať vlastnosť, pre ktorú neexistuje FID.",

    'errorLoadingGML': "Chyba pri načítaní súboru GML ${url}",

    'browserNotSupported': "Váš prehliadač nepodporuje vykresľovanie vektorov. Momentálne podporované vykresľovače sú:\n${renderers}",

    'componentShouldBe': "addFeatures: komponent by mal byť ${geomType}",

    'getFeatureError': "getFeatureFromEvent bola zavolaná na vrstve bez vykresľovača. To zvyčajne znamená, že ste odstránili vrstvu, ale nie niektorú z obslúh, ktorá je s ňou asociovaná.",

    'minZoomLevelError': "Vlastnosť minZoomLevel je určený iba na použitie s vrstvami odvodenými od FixedZoomLevels. To, že táto wfs vrstva kontroluje minZoomLevel je pozostatok z minulosti. Nemôžeme ho však odstrániť, aby sme sa vyhli možnému porušeniu aplikácií založených na Open Layers, ktoré na tomto môže závisieť. Preto ho označujeme ako zavrhovaný - dolu uvedená kontrola minZoomLevel bude odstránená vo verzii 3.0. Použite prosím namiesto toho kontrolu min./max. rozlíšenia podľa tu uvedeného popisu: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transakcia WFS: ÚSPEŠNÁ ${response}",

    'commitFailed': "Transakcia WFS: ZLYHALA ${response}",

    'googleWarning': "Vrstvu Google nebolo možné správne načítať.\x3cbr\x3e\x3cbr\x3eAby ste sa tejto správy zbavili vyberte novú BaseLayer v prepínači vrstiev v pravom hornom rohu.\x3cbr\x3e\x3cbr\x3eToto sa stalo pravdepodobne preto, že skript knižnice Google Maps buď nebol načítaný alebo neobsahuje správny kľúč API pre vašu lokalitu.\x3cbr\x3e\x3cbr\x3eVývojári: Tu môžete získať \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3epomoc so sfunkčnením\x3c/a\x3e",

    'getLayerWarning': "Vrstvu ${layerType} nebolo možné správne načítať.\x3cbr\x3e\x3cbr\x3eAby ste sa tejto správy zbavili vyberte novú BaseLayer v prepínači vrstiev v pravom hornom rohu.\x3cbr\x3e\x3cbr\x3eToto sa stalo pravdepodobne preto, že skript knižnice ${layerType} buď nebol načítaný alebo neobsahuje správny kľúč API pre vašu lokalitu.\x3cbr\x3e\x3cbr\x3eVývojári: Tu môžete získať \x3ca href=\'http://trac.openlayers.org/wiki/${layerType}\' target=\'_blank\'\x3epomoc so sfunkčnením\x3c/a\x3e",

    'scale': "Mierka = 1 : ${scaleDenom}",

    'layerAlreadyAdded': "Pokúsili ste sa do mapy pridať vrstvu ${layerName}, ale tá už bola pridaná",

    'reprojectDeprecated': "Používate voľby „reproject“ vrstvy ${layerType}. Táto voľba je zzavrhovaná: jej použitie bolo navrhnuté na podporu zobrazovania údajov nad komerčnými základovými mapami, ale túto funkcionalitu je teraz možné dosiahnuť pomocou Spherical Mercator. Ďalšie informácie získate na stránke http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Táto metóda je zavrhovaná a bude odstránená vo verzii 3.0. Použite prosím namiesto nej metódu ${newMethod}.",

    'boundsAddError': "Sčítacej funkcii musíte dať hodnoty x aj y.",

    'lonlatAddError': "Sčítacej funkcii musíte dať hodnoty lon (zem. dĺžka) aj lat (zem. šírka).",

    'pixelAddError': "Sčítacej funkcii musíte dať hodnoty x aj y.",

    'unsupportedGeometryType': "Nepodporovaný typ geometrie: ${geomType}",

    'pagePositionFailed': "OpenLayers.Util.pagePosition zlyhalo: prvok s id ${elemId} môže byť zle umiestnený.",

    'filterEvaluateNotImplemented': "evaluate nie je implementovaný pre tento typ filtra"

});
