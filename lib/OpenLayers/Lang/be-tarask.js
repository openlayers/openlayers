/* Translators (2009 onwards):
 *  - EugeneZelenko
 *  - Jim-by
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["be-tarask"]
 * Dictionary for Беларуская (тарашкевіца).  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["be-tarask"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Неапрацаваны вынік запыту ${statusText}",

    'permalink': "Сталая спасылка",

    'overlays': "Слаі",

    'baseLayer': "Базавы слой",

    'sameProjection': "Аглядная мапа працуе толькі калі яна мае тую ж праекцыю, што і асноўная мапа",

    'readNotImplemented': "Функцыянальнасьць чытаньня ня створаная.",

    'writeNotImplemented': "Функцыянальнасьць запісу ня створаная.",

    'noFID': "Немагчыма абнавіць магчымасьць, для якога не існуе FID.",

    'errorLoadingGML': "Памылка загрузкі файла GML ${url}",

    'browserNotSupported': "Ваш браўзэр не падтрымлівае вэктарную графіку. У цяперашні момант падтрымліваюцца: ${renderers}",

    'componentShouldBe': "addFeatures : кампанэнт павінен быць ${geomType}",

    'getFeatureError': "getFeatureFromEvent выкліканы для слоя бяз рэндэру. Звычайна гэта азначае, што Вы зьнішчылі слой, але пакінулі зьвязаны зь ім апрацоўшчык.",

    'minZoomLevelError': "Уласьцівасьць minZoomLevel прызначана толькі для выкарыстаньня са слаямі вытворнымі ад FixedZoomLevels. Тое, што  гэты wfs-слой правяраецца на minZoomLevel — рэха прошлага. Але мы ня можам выдаліць гэтую магчымасьць, таму што ад яе залежаць некаторыя заснаваныя на OL дастасаваньні. Тым ня менш, праверка minZoomLevel будзе выдаленая ў вэрсіі 3.0. Калі ласка, выкарыстоўваеце замест яе ўстаноўкі мінімальнага/максымальнага памераў, як апісана тут: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS-транзакцыя: ПОСЬПЕХ ${response}",

    'commitFailed': "WFS-транзакцыя: ПАМЫЛКА ${response}",

    'googleWarning': "Не атрымалася загрузіць слой Google. \x3cbr\x3e\x3cbr\x3eКаб пазбавіцца гэтага паведамленьня, выберыце новы базавы слой у сьпісе ў верхнім правым куце.\x3cbr\x3e\x3cbr\x3e Хутчэй за ўсё, прычына ў тым, што скрыпт бібліятэкі Google Maps ня быў уключаныя альбо не ўтрымлівае слушны API-ключ для Вашага сайта.\x3cbr\x3e\x3cbr\x3eРаспрацоўшчыкам: Для таго, каб даведацца як зрабіць так, каб усё працавала, \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3eнацісьніце тут\x3c/a\x3e",

    'getLayerWarning': "Немагчыма загрузіць слой ${layerType}.\x3cbr\x3e\x3cbr\x3eКаб пазбавіцца гэтага паведамленьня, выберыце новы базавы слой у сьпісе ў верхнім правым куце.\x3cbr\x3e\x3cbr\x3eХутчэй за ўсё, прычына ў тым, што скрыпт бібліятэкі ${layerLib} ня быў слушна ўключаны.\x3cbr\x3e\x3cbr\x3eРаспрацоўшчыкам: Для таго, каб даведацца як зрабіць так, каб усё працавала, \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eнацісьніце тут\x3c/a\x3e",

    'scale': "Маштаб = 1 : ${scaleDenom}",

    'W': "З",

    'E': "У",

    'N': "Пн",

    'S': "Пд",

    'layerAlreadyAdded': "Вы паспрабавалі дадаць слой ${layerName} на мапу, але ён ужо дададзены",

    'reprojectDeprecated': "Вы выкарыстоўваеце ўстаноўку \'reproject\' для слоя ${layerName}. Гэтая ўстаноўка зьяўляецца састарэлай: яна выкарыстоўвалася для падтрымкі паказу зьвестак на камэрцыйных базавых мапах, але гэта функцыя цяпер рэалізаваная ў убудаванай падтрымцы сфэрычнай праекцыі Мэркатара. Дадатковая інфармацыя ёсьць на http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Гэты мэтад састарэлы і будзе выдалены ў вэрсіі 3.0. Калі ласка, замест яго выкарыстоўвайце ${newMethod}.",

    'boundsAddError': "Вам неабходна падаць абодва значэньні x і y для функцыі складаньня.",

    'lonlatAddError': "Вам неабходна падаць абодва значэньні lon і lat для функцыі складаньня.",

    'pixelAddError': "Вам неабходна падаць абодва значэньні x і y для функцыі складаньня.",

    'unsupportedGeometryType': "Тып геамэтрыі не падтрымліваецца: ${geomType}",

    'pagePositionFailed': "OpenLayers.Util.pagePosition failed: верагодна элемэнт з ідэнтыфікатарам ${elemId} займае няслушнае месца.",

    'filterEvaluateNotImplemented': "evaluate не рэалізаваны для гэтага тыпу фільтру."

});
