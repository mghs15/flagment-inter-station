tippecanoe -l railway -o ./docs/railway-section.pmtiles ./station-interval-flagment.geojson \
  --force --no-tile-size-limit --no-tile-compression --no-feature-limit \
  --minimum-zoom=4 --maximum-zoom=10 --base-zoom=6 --simplification=2

tippecanoe -l railway -o ./docs/railway-station.pmtiles ./stations.geojson \
  --force --no-tile-size-limit --no-tile-compression --no-feature-limit \
  --minimum-zoom=4 --maximum-zoom=10 --base-zoom=6 --simplification=2
  

