const child_process = require('child_process');
const fs = require('fs');
const turf = require('@turf/turf');

const db = JSON.parse(fs.readFileSync("./stations.json", "utf-8"));
const data = fs.readFileSync("./stations-manual.csv", "utf-8");

const result = {};

const tmp = {
  compName: "",
  railName: "",
  flag: 0,
  // set: []
};

data.split("\r\n").forEach( line => {
  
  if(line.match(/^99999/)){
    
    const c = line.split(",");
    tmp.compName = c[1];
    tmp.railName = c[2];
    tmp.flag = c[3];
    
    if(!result[tmp.compName]) result[tmp.compName] = {};
    if(!result[tmp.compName][tmp.railName]) result[tmp.compName][tmp.railName] = [];
    result[tmp.compName][tmp.railName] = {
      stations: [],
      info: {
        flag: tmp.flag
      }
    };
    
  }else if(line.match(/^###/)){
    // 仮置き
    result[tmp.compName][tmp.railName].stations.push({
      "type": "Feature",
      "properties": {
        "N02_005": "_break_"
      },
      "geometry": {
         "type": "Point",
         "coordinates": [
           0,0
         ]
      }
    });
  }else{
    const m = line.match(/(^|\s)(\S+)(駅|停留場)/);
    
    //console.log(m);
    
    if(m){
      const stationName = m[2];
      let stationInfo;
      
      db[tmp.compName][tmp.railName].stations.forEach( station => {
        if(station.properties.N02_005 == stationName){
          stationInfo = station;
        }
        
        // ヶとケの表記ゆれ対応
        if(
          station.properties.N02_005.replace("ケ", "ヶ")
          == stationName.replace("ケ", "ヶ")
        ){
          stationInfo = station;
        }
        
        // 副駅名などによる表記ゆれへの対応
        if(station.properties.N02_005.split("（")[0] == stationName.split("（")[0]){
          stationInfo = station;
        }
        
      });
      
      if(stationInfo){
        result[tmp.compName][tmp.railName].stations.push(stationInfo);
      }else{
        result[tmp.compName][tmp.railName].stations.push({
          "type": "Feature",
          "properties": {
            "N02_005": "_error_",
            "ErrorName": stationName
          },
          "geometry": {
             "type": "Point",
             "coordinates": [
               0,0
             ]
          }
        });
      }
    }
  }  
});

let csv1 = "";

for(let companyName in result){
  const company = result[companyName];
  for(let lineName in company){
    const railline = company[lineName].stations;
    const railInfo = company[lineName].info;
    
    csv1 += `99999,${companyName},${lineName},${railInfo.flag}\r\n`;
    
    railline.forEach( station => {
      
      if(!station){
        return;  
      }
      
      const stationName = station.properties.N02_005;
      //const d = station.properties.d;
      //const flag = station.properties.flag;
      const lng = station.geometry.coordinates[0];
      const lat = station.geometry.coordinates[1];
      
      csv1 += `100,${stationName},${lng},${lat}\r\n`;
      
    });
  }
}


// 例外処理
csv1 += "99999,三岐鉄道,近鉄連絡線,1" + "\r\n";
csv1 += "100,近鉄富田,136.64929,35.00628" + "\r\n";
csv1 += "100,大矢知,136.633415,35.022144999999995" + "\r\n";

csv1 += "99999,富山地方鉄道,富山駅南北接続線,2" + "\r\n";
csv1 += "100,富山駅,137.21299592,36.70175498" + "\r\n";
csv1 += "100,電鉄富山駅・エスタ前,137.214065,36.699905" + "\r\n";
csv1 += "100,_break_,0,0" + "\r\n";
csv1 += "100,富山駅,137.21299592,36.70175498" + "\r\n";
csv1 += "100,新富町,137.211435,36.698859999999996" + "\r\n";

// 書き出し
fs.writeFile(`./stations-order-manual.csv`, csv1, (e) => {
  if(e){
    console.log(`ERROR: (write file)`);
    console.error(e);
  }
});


