const child_process = require('child_process');
const fs = require('fs');
const turf = require('@turf/turf');

const data1 = fs.readFileSync("./stations-order.csv", "utf-8");
const data2 = fs.readFileSync("./stations-order-manual.csv", "utf-8");

const data = data1 + "\r\n" + data2;

let csv = "\ufeff" + "鉄道事業者,路線,駅1,駅2,経度1,緯度1,経度2,緯度2,フラグ,value" + "\r\n";

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
    
    if(to.name == "_break_"){
      // 初期化
      tmp.from = {};
      return;
    }
    
    if(!tmp.from || !tmp.from.name){
      tmp.from = to;
      return;
    }
    
    
    if(to.name == tmp.from.name){
      return;
    }
    
    const text = `${tmp.compName},${tmp.railName},${tmp.from.name},${to.name},${tmp.from.lng},${tmp.from.lat},${to.lng},${to.lat},${tmp.flag},`;
    //csv += text + "\r\n";
    
    result[tmp.compName][tmp.railName].push(text);
    
    tmp.from = to;
    
  }
});

for(companyName in result){
  for(railName in result[companyName]){
    result[companyName][railName].forEach(text => {
      csv += text + "\r\n";
    });
  }
}

fs.writeFile(`./stations-order-all.csv`, csv, (e) => {
  if(e){
    console.log(`ERROR: (write file)`);
    console.error(e);
  }
});

