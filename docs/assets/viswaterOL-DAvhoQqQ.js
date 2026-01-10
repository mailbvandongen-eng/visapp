import{V as c,a as l,S as y,b as w,F as p}from"./index-CDAJtRd0.js";import{G as d}from"./GeoJSON-DfCFI_mW.js";const g=`
[out:json][timeout:90];
area["name"="Nederland"]->.nl;
(
  way["natural"="water"]["fishing"="yes"](area.nl);
  relation["natural"="water"]["fishing"="yes"](area.nl);
  way["water"="lake"]["fishing"="yes"](area.nl);
  way["water"="pond"]["fishing"="yes"](area.nl);
);
out geom;
`;async function f(){const t=new c,s=new l({source:t,style:new y({fill:new p({color:"rgba(33, 150, 243, 0.2)"}),stroke:new w({color:"#2196F3",width:2})}),properties:{name:"Viswater"}});try{const n=await(await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:`data=${encodeURIComponent(g)}`})).json(),a=[];n.elements.forEach(e=>{e.type==="way"&&e.geometry&&a.push({type:"Feature",geometry:{type:"Polygon",coordinates:[e.geometry.map(o=>[o.lon,o.lat])]},properties:{id:e.id,name:e.tags?.name||"Viswater",fishing:e.tags?.fishing,access:e.tags?.access}})});const i={type:"FeatureCollection",features:a};t.addFeatures(new d().readFeatures(i,{featureProjection:"EPSG:3857"})),console.log(`Loaded ${a.length} viswateren`)}catch(r){console.error("Failed to load viswater:",r)}return s}export{f as createViswaterLayer};
//# sourceMappingURL=viswaterOL-DAvhoQqQ.js.map
