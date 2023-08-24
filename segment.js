const child_process = require('child_process');
const fs = require('fs');
const turf = require('@turf/turf');

const data = fs.readFileSync("./stations-order-all.csv", "utf-8");
//const data = fs.readFileSync("./stations-order-all-edit-tokyoSubway.csv", "utf-8");

let geojson = {
  "type": "FeatureCollection",
  "features": []
};

const tmp = {
  campName: "",
  railName: "",
  flag: 0,
  from: {}
};

const lines = data.split("\r\n");
const header = lines[0].split(",");

lines.forEach( line => {
  
  const c = line.split(",");
  
  const campName = c[0];
  const railName = c[1];
  const from = {
    name: c[2],
    lng: +c[4],
    lat: +c[5]
  };
  const to = {
    name: c[3],
    lng: +c[6],
    lat: +c[7]
  };
  
  
  if(!from.lng || !to.lng) return;
  
  const f = {
    "type": "Feature",
    "properties": {
      "from": from.name,
      "to": to.name,
      "company": campName,
      "line": railName,
      
    },
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          +from.lng,
          +from.lat
        ],
        [
          +to.lng,
          +to.lat
        ]
      ]
    }
  };
  
  for( let i=8; i < header.length; i++){
    const keyName = header[i];
    const value = c[i];
    f.properties[keyName] = value;
  }
  
  geojson.features.push(f);
  
});


fs.writeFile(`./station-interval-flagment.geojson`, JSON.stringify(geojson, null, 2), (e) => {
  if(e){
    console.log(`ERROR: (write file)`);
    console.error(e);
  }
});

