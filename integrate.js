const child_process = require('child_process');
const fs = require('fs');
const turf = require('@turf/turf');

//const railLines = JSON.parse(fs.readFileSync("./data/N02-22_RailroadSection.geojson", "utf-8")).features;
const railLines = JSON.parse(fs.readFileSync("./result-type2.geojson", "utf-8")).features;
// 1回ではうまくいかないため、最初はN02-22_RailroadSectionを、次からはresultを読み込んで、コンソールへの出力がなくなるまで繰り返す。


const set = {};
let count = 0;

railLines.forEach( railLine => {
  
  const companyName = railLine.properties.N02_004;
  const lineName = railLine.properties.N02_003;
  
  if(!set[companyName]) set[companyName] = {};
  if(!set[companyName][lineName]) set[companyName][lineName] = [];
  
  railLine.properties.id = "id-" + count;
  
  if(!railLine.geometry.coordinates[0]) return;
  
  set[companyName][lineName].push(railLine);
  
  count += 1;
  
});

const result = {
  "type": "FeatureCollection",
  "features": []
};

for(let companyName in set){
  
  //if(companyName !== "沖縄都市モノレール") continue;
  
  const company = set[companyName];
  
  
  for(let lineName in company){
    
    const railline = company[lineName];
    //console.log(railline);
    
    for(let i=0; i<railline.length; i++){
    
      const f = railline[i];
      if(!f) continue;
      
      const coords = f.geometry.coordinates;
      //if(coords.length < 2) continue;
      
      if(!coords[0]) console.log(f);
        
      const startPtLng = coords[0][0];
      const startPtLat = coords[0][1];
      const endPtLng = coords[coords.length-1][0];
      const endPtLat = coords[coords.length-1][1];
      const id = f.properties.id;
      
      for(let j=0; j<railline.length; j++){
        const segment = railline[j];
        const mainId = segment.properties.id;
        if(id == mainId) continue;
        
        
        //console.log(segment);
        const mainCoords = segment.geometry.coordinates;
        if(mainCoords.length < 2) continue;
        
        
        const mainStartPtLng = mainCoords[0][0];
        const mainStartPtLat = mainCoords[0][1];
        const mainEndPtLng = mainCoords[mainCoords.length-1][0];
        const mainEndPtLat = mainCoords[mainCoords.length-1][1];
        
        if(id != mainId && mainStartPtLng==startPtLng && mainStartPtLat==startPtLat
           && mainEndPtLng!=endPtLng && mainEndPtLat!=endPtLat){
          f.geometry.coordinates = JSON.parse(JSON.stringify(coords)).reverse().concat(mainCoords);
          console.log("1. s-s");
        }else if(id != mainId && mainStartPtLng==endPtLng && mainStartPtLat==endPtLat
                    && mainEndPtLng!=startPtLng && mainEndPtLat!=startPtLat){
          f.geometry.coordinates = coords.concat(mainCoords);
          console.log("2. s-e");
        }else if(id != mainId && mainEndPtLng==startPtLng && mainEndPtLat==startPtLat
                 && mainStartPtLng!=endPtLng && mainStartPtLat!=endPtLat){
          f.geometry.coordinates = mainCoords.concat(coords);
          console.log("3. e-s");
        }else if(id != mainId && mainEndPtLng==endPtLng && mainEndPtLat==endPtLat
                 && mainStartPtLng!=startPtLng && mainStartPtLat!=startPtLat){
          f.geometry.coordinates = mainCoords.concat(JSON.parse(JSON.stringify(coords)).reverse());
          console.log("4. e-e");
        }else{
          continue;
        }
        
        //console.log("merge");
        f.properties._check = "メイン";
        f.properties._merge =  f.properties._merge ? 
          segment.properties._merge ? segment.properties._merge + f.properties._merge :  f.properties._merge + 1 :
          segment.properties._merge ? segment.properties._merge + 1 : 1 ;
          
        railline.splice(j,1);
        break;
        
      }
      
    }
    
    
    if(railline){
      railline.forEach( rail => {
        rail.properties._check = rail.properties._check ? rail.properties._check : "残り";
        result.features.push(rail);
      });
    }
  }
}


fs.writeFile(`./result-type2.geojson`, JSON.stringify(result, null, 2), (e) => {
  if(e){
    console.log(`ERROR: ${slideFilename} / ${companyName} ${lineName} (write file)`);
    console.error(e);
  }
});


