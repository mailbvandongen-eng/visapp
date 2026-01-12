import{V as s,a as i,S as c,C as l,b as d,F as g}from"./index-i7xsr2DC.js";import{G as p}from"./GeoJSON-NjkLbIoR.js";const m=`
[out:json][timeout:60];
area["name"="Nederland"]->.nl;
(
  node["leisure"="marina"](area.nl);
  node["mooring"="yes"](area.nl);
  way["leisure"="marina"](area.nl);
);
out center;
`;async function f(){const t=new s,o=new i({source:t,style:new c({image:new l({radius:8,fill:new g({color:"#2196F3"}),stroke:new d({color:"#fff",width:2})})}),properties:{name:"Aanlegsteigers"}});try{const r=(await(await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:`data=${encodeURIComponent(m)}`})).json()).elements.filter(e=>e.lat&&e.lon||e.center).map(e=>({type:"Feature",geometry:{type:"Point",coordinates:[e.lon||e.center?.lon,e.lat||e.center?.lat]},properties:{id:e.id,name:e.tags?.name||"Aanlegsteiger",type:e.tags?.leisure||e.tags?.mooring||"marina",website:e.tags?.website,phone:e.tags?.phone}})),n={type:"FeatureCollection",features:r};t.addFeatures(new p().readFeatures(n,{featureProjection:"EPSG:3857"})),console.log(`Loaded ${r.length} aanlegsteigers`)}catch(a){console.error("Failed to load aanlegsteigers:",a)}return o}export{f as createAanlegsteigersLayer};
//# sourceMappingURL=aanlegsteigersOL-BnK9xTt0.js.map
