const child_process = require('child_process');
const fs = require('fs');
const turf = require('@turf/turf');

const data1 = fs.readFileSync("./stations-order.csv", "utf-8");
const data2 = fs.readFileSync("./stations-order-manual.csv", "utf-8");

const data = data1 + "\r\n" + data2;

const result = {};

const tmp = {
  compName: "",
  railName: "",
  flag: 0,
  from: {}
};

data.split("\r\n").forEach( line => {
  
  if(line.match(/^99999/)){
    
    const c = line.split(",");
    tmp.compName = c[1];
    tmp.railName = c[2];
    tmp.flag = c[3];
    
    // 初期化
    tmp.from = {};
    
    
    if(!result[tmp.compName]) result[tmp.compName] = {};
    if(!result[tmp.compName][tmp.railName]){
      result[tmp.compName][tmp.railName] = [];
    }else{
      console.log("路線の重複: " + tmp.compName + " / " + tmp.railName);
    }
    
    
  }else if(line.match(/^100/)){
    const c = line.split(",");
    
    const to = {
      name : c[1],
      lng : +c[2],
      lat : +c[3]
    };
    
    if(to.name == "_error_"){
      // 何もしない
      return;
    }
    
    if(to.name == tmp.from.name){
      return;
    }
    
    const f = {
      "type": "Feature",
      "properties": {
        "name": to.name
      },
      "geometry": {
         "type": "Point",
         "coordinates": [
           +to.lng,
           +to.lat
         ]
      }
    };
    
    result[tmp.compName][tmp.railName].push(f);
    
  }
});

const dType = ["flood", "hightide", "tsunami"];

dType.forEach( hazard => {
  
  const fh = JSON.parse(fs.readFileSync(`./hazard/stations-${hazard}.json`, "utf-8")).features;
  fh.forEach( s => {
    
    const statName = s.properties.N02_005;
    const compName = s.properties.N02_004;
    const railName = s.properties.N02_003;
    const rank = s.properties.rank;
    const r = s.properties.r;
    const g = s.properties.g;
    const b = s.properties.b;
    
    let checkFlag = 0;
    
    result[compName][railName].forEach( station => {
      if(station.properties.name == statName){
        station.properties[hazard + "-rank"] = rank;
        station.properties[hazard + "-r"] = +r;
        station.properties[hazard + "-g"] = +g;
        station.properties[hazard + "-b"] = +b;
        
        checkFlag += 1;
      }
    });
    
    if(checkFlag < 1){
      console.log(compName, railName, statName, ": not match", checkFlag);
    }
  
  });
  console.log("-------------------------------");
});


// チェック用
for( compName in result ){
  for( railName in result[compName] ){
    result[compName][railName].forEach( s => {
      const p = s.properties;
      if(!p["flood-rank"] || !p["hightide-rank"] || !p["tsunami-rank"]){
        if(p.name != "_break_"){
          console.log(compName, railName);
          console.log(p);
        }
      }
    });
  }
}


fs.writeFile(`./docs/slides/station-with-hazard.json`, JSON.stringify(result), (e) => {
  if(e){
    console.log(`ERROR: (write file)`);
    console.error(e);
  }
});

