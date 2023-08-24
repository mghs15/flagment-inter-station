const child_process = require('child_process');
const fs = require('fs');
const turf = require('@turf/turf');

const railLines = JSON.parse(fs.readFileSync("./result-type2.geojson", "utf-8")).features;
const stations = JSON.parse(fs.readFileSync("./data/N02-22_Station.geojson", "utf-8")).features;

const set = {};
const geojson = {
  "type": "FeatureCollection",
  "features": []
};

railLines.forEach( railLine => {
  
  const companyName = railLine.properties.N02_004;
  const lineName = railLine.properties.N02_003;
  
  if(!set[companyName]) set[companyName] = {};
  
  // if(set[companyName][lineName]) console.log(lineName);
  
  if(!set[companyName][lineName]) set[companyName][lineName] = [];
  
  set[companyName][lineName].push(railLine);
  
});

/* 
 * ラインデータの代表点の経緯度を返す。
 */
const makeLineRepresentative = (coords) => {
  
  if(coords.length == 2){
    const point = [
      (coords[0][0] + coords[1][0]) / 2,
      (coords[0][1] + coords[1][1]) / 2
    ];
    return point;
  }
  
  if(coords.length > 2){
    const point = coords[Math.ceil(coords.length/2) - 1];
    return point;
  }
  
  return null;
  
}

const stationSet = {};

stations.forEach( sta => {
  
  let station = JSON.parse(JSON.stringify(sta));
  
  // 同名駅を ID を用いて同じ座標を付与する。
  // なお、1路線に同じ ID で複数の地物が含まれていることがあるため、それに対処するために全駅について処理を行う。
  // 無駄なループが多くなるが、このファイルを使う処理頻度が少ないこと、そんなに時間はかからないことから許容する。
  //if(sta.properties.N02_005c != sta.properties.N02_005g){
    stations.forEach( sta2 => {
      if(sta.properties.N02_005g == sta2.properties.N02_005c){
        
        station.geometry.coordinates = JSON.parse(JSON.stringify(sta2.geometry.coordinates));
        station.properties.N02_005c = sta2.properties.N02_005c;
        station.properties.original = sta2.properties.N02_004 + "/" + sta2.properties.N02_003;
        return;
      }
    });
  //}
  
  const companyName = station.properties.N02_004;
  const lineName = station.properties.N02_003;
  const stationName = station.properties.N02_005;
  
  if(!stationSet[companyName]) stationSet[companyName] = {};
  if(!stationSet[companyName][lineName]) stationSet[companyName][lineName] = {};
  
  if(station.geometry.type == "MultiLineString"){
    station.geometry.coordinates = makeLineRepresentative(station.geometry.coordinates[0]);
  }else{
    station.geometry.coordinates = makeLineRepresentative(station.geometry.coordinates);
  }
  
  if(stationSet[companyName][lineName][stationName]){
    return;
  }
  
  station.geometry.type = "Point";
  stationSet[companyName][lineName][stationName] = station;
  
  geojson.features.push(station);
  
});

//console.log(turf);

const result = {};

for(let companyName in stationSet){
  const company = stationSet[companyName];
  result[companyName] = {};
  for(let lineName in company){
  
    const railline = company[lineName];
    result[companyName][lineName] = {
      stations: [],
      info: {}
    };
    
    // console.log(companyName, lineName, set[companyName][lineName].length);
    
    for(let stationName in railline){
      const station = railline[stationName];
      const line = set[companyName][lineName];
      
      let flag = line.length;
      
      const segment = line[0];
      
      stationSet[companyName][lineName][stationName].properties.flag = flag;
      
      // ------
      
      const snapped = turf.nearestPointOnLine(segment, station);
      const sliced = turf.lineSlice(segment.geometry.coordinates[0], snapped, segment);
      const d = turf.length(sliced) + 1;
      
      stationSet[companyName][lineName][stationName].properties.d = Math.min(d || 999999, stationSet[companyName][lineName][stationName].properties.d || 999999);
      
      result[companyName][lineName].stations.push(stationSet[companyName][lineName][stationName]);
      result[companyName][lineName].info.flag = flag;
      
      // ------
      
    }
    result[companyName][lineName].stations.sort((a, b) => a.properties.d - b.properties.d);
  }
}

fs.writeFile(`./stations.json`, JSON.stringify(result, null, 2), (e) => {
  if(e){
    console.log(`ERROR: (write file)`);
    console.error(e);
  }
});


let csv1 = "";
let csv2 = "";

for(let companyName in result){
  const company = result[companyName];
  for(let lineName in company){
    const railline = company[lineName].stations;
    const railInfo = company[lineName].info;
    
    if(railInfo.flag == 1){
      csv1 += `99999,${companyName},${lineName},${railInfo.flag}\r\n`;
    }else{
      csv2 += `99999,${companyName},${lineName},${railInfo.flag}\r\n`;
    }
    
    railline.forEach( station => {
      const stationName = station.properties.N02_005;
      const d = station.properties.d;
      const flag = station.properties.flag;
      const lng = station.geometry.coordinates[0];
      const lat = station.geometry.coordinates[1];
      
      if(railInfo.flag == 1){
        csv1 += `100,${stationName},${lng},${lat},${d}\r\n`;
      }
      
    });
  }
}

fs.writeFile(`./stations-order.csv`, csv1, (e) => {
  if(e){
    console.log(`ERROR: (write file)`);
    console.error(e);
  }
});

fs.writeFile(`./stations-blank.csv`, csv2, (e) => {
  if(e){
    console.log(`ERROR: (write file)`);
    console.error(e);
  }
});

fs.writeFile(`./stations.geojson`, JSON.stringify(geojson), (e) => {
  if(e){
    console.log(`ERROR: (write file)`);
    console.error(e);
  }
});

