/* Translators (2009 onwards):
 *  - Fryed-peach
 *  - Mage Whopper
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["ja"]
 * Dictionary for 日本語.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["ja"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "未処理の要求は ${statusText} を返します",

    'Permalink': "パーマリンク",

    'Overlays': "オーバーレイ",

    'Base Layer': "基底レイヤー",

    'noFID': "FID のない地物は更新できません。",

    'browserNotSupported': "あなたのブラウザはベクターグラフィックスの描写に対応していません。現時点で対応しているソフトウェアは以下のものです。\n${renderers}",

    'minZoomLevelError': "minZoomLevel プロパティは FixedZoomLevels を継承するレイヤーでの使用のみを想定しています。この minZoomLevel に対する WFS レイヤーの検査は歴史的なものです。しかしながら、この検査を除去するとそれに依存する OpenLayers ベースのアプリケーションを破壊してしまう可能性があります。よって廃止が予定されており、この minZoomLevel 検査はバージョン3.0で除去されます。代わりに、http://trac.openlayers.org/wiki/SettingZoomLevels で解説されている、最小および最大解像度設定を使用してください。",

    'commitSuccess': "WFS トランザクション: 成功 ${response}",

    'commitFailed': "WFS トランザクション: 失敗 ${response}",

    'googleWarning': "Google レイヤーが正しく読み込みを行えませんでした。\x3cbr\x3e\x3cbr\x3eこのメッセージを消すには、右上の隅にあるレイヤー切り替え部分で新しい基底レイヤーを選んでください。\x3cbr\x3e\x3cbr\x3eおそらく、これは Google マップ用ライブラリのスクリプトが組み込まれていないか、あなたのサイトに対応する正しい API キーが設定されていないためです。\x3cbr\x3e\x3cbr\x3e開発者の方へ: 正しい動作をさせるために\x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3eこちらのウィキ\x3c/a\x3eを参照してください。",

    'getLayerWarning': "${layerType} レイヤーが正しく読み込みを行えませんでした。\x3cbr\x3e\x3cbr\x3eこのメッセージを消すには、右上の隅にあるレイヤー切り替え部分で新しい基底レイヤーを選んでください。\x3cbr\x3e\x3cbr\x3eおそらく、これは ${layerLib} ライブラリのスクリプトが正しく組み込まれていないためです。\x3cbr\x3e\x3cbr\x3e開発者の方へ: 正しい動作をさせるために\x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eこちらのウィキ\x3c/a\x3eを参照してください。",

    'Scale = 1 : ${scaleDenom}': "縮尺 = 1 : ${scaleDenom}",

    'W': "西",

    'E': "東",

    'N': "北",

    'S': "南",

    'reprojectDeprecated': "あなたは「${layerName}」レイヤーで reproject オプションを使っています。このオプションは商用の基底地図上に情報を表示する目的で設計されましたが、現在ではその機能は Spherical Mercator サポートを利用して実現されており、このオプションの使用は非推奨です。追加の情報は http://trac.openlayers.org/wiki/SphericalMercator で入手できます。",

    'methodDeprecated': "このメソッドは廃止が予定されており、バージョン3.0で除去されます。代わりに ${newMethod} を使用してください。"

});
