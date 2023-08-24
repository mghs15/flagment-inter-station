# flagment-inter-station
鉄道の駅間ラインデータ

## ウェブサイト

https://mghs15.github.io/flagment-inter-station/

* 駅間ラインデータの閲覧が可能
	* 特定の文字を事業者名、路線名、駅名に含む駅間ラインデータの絞り込みが可能
* 以下の仕様の CSV をアップロードし、地図上へ表示可能

### CSV 仕様

* カラムの1～8列目は以下の通りで固定

1. 鉄道事業者
2. 路線
3. 駅1
4. 駅2
5. 経度1（駅1）
6. 緯度1（駅1）
7. 経度2（駅2）
8. 緯度2（駅2）

* 9列目以降は、独自のデータを追加可能。
* 特定のカラム名（以下）にすることでウェブ地図上で表示する際のスタイルを指定可能。
	* `_sort-key`：*Number* 表示の優先度。値が大きいほど、相対的に上に表示される。
	* `_width`： *Number* ラインの太さ。なお、ラインには blur をかけているので、12以上はほしい。
	* `_opacity`：*Number* ラインの透過度。0～1。
	* `_color`：*String* Hex (`#FFFFFF` 形式)を想定。
	* `_r`、`_g`、`_b`：*Number* RGB をそれぞれ0～255で指定。`_color` が設定されている場合は無効。

* サンプルの CSV は、本レポジトリ `sample` ディレクトリへ格納してあります。

## プログラム概要

### 国土数値情報のデータの格納先
* 区間データ：`data/N02-22_RailroadSection.geojson`
* 駅データ：`data/N02-22_Station.geojson`

### 各プログラム
* integrate.js
	* 国土数値情報の「鉄道区間」データを、事業者・路線ごとに断片をできる限り結合させる。
	* 2回目以降は、読込先を `result-type2.geojson` にして、何度も繰り返すと良い。
	* 入力：`data/N02-22_RailroadSection.geojson` （2回目以降は`result-type2.geojson`）
	* 出力：`result-type2.geojson`
* main1.js
	* 路線全体が1つのラインデータとなっている場合、端点からの経路長で駅を並び替える。
	* 入力：`data/N02-22_Station.geojson`、`result-type2.geojson`
	* 出力：`stations-order.csv`、`stations-blank.csv`、`stations.json`、`stations.geojson`
* (manual process)
	* 駅名を順番通りに `stations-blank.csv` へ書き込み、`stations-manual.csv` として保存する。
		* ※情報源として Wikipedia を利用。
	* 入力：`stations-blank.csv`
	* 出力：`stations-manual.csv`
* main2.js
	* `stations-manual.csv` から駅名を取り出し、座標を付与し、CSV として整理する。
	* 国土数値情報上、その路線に該当駅が登録されていない場合、例外処理として追加する。
		* 今のところ、main2.js へハードコード。
		* 主に接続線でこの例外処理が発生。
	* 入力：`stations-manual.csv`、`stations.json`
	* 出力：`stations-order-manual.csv`
* merge.js
	* これまでの結果を結合し、整理する。
	* 入力：`stations-order.csv`、`stations-order-manual.csv`
	* 出力：`stations-order-all.csv`
* segment.js
	* CSV から GeoJSON へ変換する。
	* 入力：`stations-order-all.csv` 等
	* 出力：`station-interval-flagment.geojson`
* tippecanoe.sh
	* 駅間データ、駅代表点のベクトルタイルを作成する。
	* 入力：`station-interval-flagment.geojson`、`stations.geojson`
	* 出力：`docs/railway-section.pmtiles`、`docs/railway-station.pmtiles`


## 参考文献
### データ
* 国土数値情報（鉄道データ）https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-v2_3.html
* Wikipedia（各鉄道路線のページ）

### 背景地図
* 国土地理院最適化ベクトルタイル https://github.com/gsi-cyberjapan/optimal_bvmap

### ツール等
* Turf.js https://turfjs.org/
* Tippecanoe https://github.com/felt/tippecanoe

* PMTiles https://github.com/protomaps/PMTiles
* MapLibre GL JS https://github.com/maplibre/maplibre-gl-js
