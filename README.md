# 蹄冠角度ノート v1.2
公開先: https://shamrooooock.github.io/hoof-angle/
旧キャッシュからの初回移行: https://shamrooooock.github.io/hoof-angle/?release=20261121a

静的HTML/CSS/JavaScript。依存ライブラリ・外部API・ログイン・サーバー不要。写真と馬名は外部へ送信しません。写真や測定履歴を永続保存しません。

## 操作
写真選択／撮影 → 蹄冠 A（前方）・B（後方） → 接地面 C（前方）・D（後方） → ドラッグで調整 → PNG保存。
拡大縮小はピンチ・ホイール・＋−、点以外をドラッグしてパン。A/B/C/Dボタンで点を選択して置き直せます。
点の選択後、矢印キーは元画像1画素、Shift併用は10画素移動。
マーカー半径9 CSS px、タッチ半径26 CSS px（直径52 px）。塗り不透明度35%、白黒の中心十字線。
HEICなどブラウザで読み込めない画像はJPEG/PNGに変換してください。

## 4点による相対角度（build 20261121a）
蹄冠線 A–B、蹄鉄接地面 C–D（裸蹄は蹄底の接地面）。両方とも前方→後方で指定します。
画像Y軸の向きを反転し、各線の方向を atan2(A.y−B.y, B.x−A.x)、atan2(C.y−D.y, D.x−C.x) で求めます。
方向差 δ に対し atan2(abs(sin δ), abs(cos δ)) × 180 / π で、従来と同じ0〜90°の角度の大きさへ正規化します。
点順の逆転や左右反転でも180度へ飛びません。接地面が水平なら従来の計算結果と一致します。
推定蹄骨底部角度 = 30 − 蹄冠角度。方向表示・丸め・掌側角／底側角の区別は変更していません。
元画像のEXIF向き補正済み座標で点を管理。どちらかの線が1画像画素未満、点が欠損・非数の場合は結果と保存を無効にします。
接地面が地面と平行であることが前提です。写真の回転の影響は相殺しますが、遠近法・撮影方向の誤差は残ります。
このモデルは暫定的経験則で、X線実測の精度・妥当性を保証しません。

## 記録・言語
馬名は翻訳しません。肢はRF/LF/RH/LHコード、表示・PNGは選択言語で表記。
撮影日は端末のローカル当日が初期値で、任意に変更できます。画像読込で上書きしません。
日付未入力時は画像内に未入力と表示し、ファイル名はundated。
PNGは写真下の余白へ馬名・肢・撮影日・角度・暫定式と注意書きを記載。長い文字列も折り返します。
写真は長辺最大2400px、出力幅は最低1000px。system-uiフォントで日本語・ラテン文字を描画。フォント読込を待ちます。
ファイル名は馬名_肢_YYYY-MM-DD.png。禁止文字を置換、末尾の空白・点、制御文字、予約名を処理し馬名部分を60文字以内に制限します。
ja/en/deの辞書はi18n.mjs。手動選択した言語・テーマだけlocalStorageに保存。初回はブラウザ言語、該当なしは英語。
OSダークモード追従／ライト／ダークを選択可能。

## 更新とオフライン
初回はHTTPSまたはlocalhostでオンライン起動。すべてのアプリファイルを事前キャッシュします。
新しいService Workerは自動的に作業中の画面を置換せず待機。更新通知を押したときだけACTIVATE_UPDATEを送信します。
写真や作業があると確認ダイアログを表示。キャンセル時は現状維持。了承後のみ1回再読み込みします。
馬名・肢・撮影日は更新時に一時的にsessionStorageへ退避して復元。写真・点は消える旨を通知に明示し、先にPNG保存するよう案内します。
他のタブで更新されても作業中のタブを強制再読み込みしません。
再訪・ページ再読込・オンライン復帰・タブ復帰で更新検出。インストール時はHTTPキャッシュをバイパスし、ファイルURLにも版を付けます。
有効化時は本アプリの旧キャッシュだけ削除。別アプリのキャッシュは削除しません。

### 旧版からの移行制約
旧v1.0/v1.1はページ全体をcache-firstで返すうえ、画面とJSが同一URLのままなので混在が起こり得ました。
既に古いSWが端末を制御している場合、新版の案内コード自体がまだ実行されません。
オンラインで上記のrelease付きURLを開き、更新通知に従ってください。旧版が残る端末ではタブを閉じて再度開くか、サイトデータの削除が必要な場合があります（写真・点は先に保存）。
ブラウザがサイトデータを消した後はオンラインで再準備が必要です。

### 次回のリリース
index.htmlのJS/CSS、app.jsと各モジュールのimport、sw.jsのCACHEとFILES、updates.mjsのregister URLにあるbuild IDを全て更新し、同じコミットで配置します。
既存のsw.jsパスを残し、旧SWの定期更新でも新コードを発見できるようにします。
GitHub Pages: main /(root)。ビルド不要。ローカル: node server.mjs。

## 用語の根拠（2026-10-28確認）
- 蹄冠: coronary band（英）、Kronsaum（独）。Kronrandも使用されますが、骨のMargo coronalisを指す文脈との混同を避け、写真上の境界にはKronsaumを採用。
- 蹄冠角度: coronary band angle / Kronsaumwinkel。旧版では前後2点の直線と水平のなす角の絶対値と定義。本改良では蹄冠線と接地面の0〜90°の相対角度へ変更。研究のcoronet angleと完全に同一の測定プロトコルであることは未確認。
- 蹄骨: distal phalanx（coffin bone）/ Hufbein。
- 推定蹄骨底部角度: Estimated palmar angle of the distal phalanx（前肢）、Estimated plantar angle of the distal phalanx（後肢）。独語はGeschätzter Palmarwinkel/Plantarwinkel des Hufbeins。日本語は推定蹄骨底部角度（掌側角／底側角）。
- これらの解剖学的角度は通常X線上で測定。写真の30°モデルからの推定であることを画面とPNGで明示し、同等の測定と扱わない。日本語「掌側角／底側角」の標準対訳としての確立は未確認、解剖学的部位を説明する補助表記。
- 前方／後方の方向ラベルは既存アプリの暫定モデルの符号説明を維持し、臨床的な回転診断としない。

資料:
1. Grotzke et al. 2022, Pferdeheilkunde 38:246–251. 独英対訳、Kronsaumwinkel、前肢Palmar/後肢Plantar、Hufbein/third phalanxの定義を確認。
https://pferdeheilkunde.de/files/20220305.pdf
2. Staples et al., Equine Veterinary Education, DOI 10.1111/eve.13554. Palmar angleはdistal phalanxのpalmar processesと地面の関係として定義。
https://beva.onlinelibrary.wiley.com/doi/10.1111/eve.13554
3. Fugazzola, Thieme Tiermedizin, Akute Lahmheit in der Außenpraxis. 写真・X線マーキング文脈でKronrandの使用を確認。
https://tiermedizin.thieme.de/pferd-co/detail/akute-lahmheit-in-der-aussenpraxis-246
30°経験則そのものの妥当性や、全個体での精度を今回の調査で検証したものではありません。

## テスト
node --test geometry.test.mjs relative.test.mjs v12.test.mjs
計算・座標変換、辞書網羅性、肢とファイル名、ローカル日付、折返し、Service Workerの事前キャッシュ・オフライン応答・待機・有効化・削除範囲、更新UIのキャンセルと単回リロードを検証。
ブラウザ実操作と未確認項目の詳細は納品の実装報告を参照してください。


## 今回の公開状況
基点コミット: 4b96068（表示は既にv1.2、計算は旧2点方式）。今回のbuildは20261121aです。
本番未反映。実機で撮影・タッチ・ピンチを確認してから、既存GitHub Pagesのmain / (root)へ反映します。
GitHub認証を利用できずpushは未実施。RELEASE-REPORT.mdに検証済み項目と未検証項目を記載しています。
