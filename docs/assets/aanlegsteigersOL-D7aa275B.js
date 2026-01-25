import{V as l,a as i}from"./index-CXxekM0s.js";import{G as c}from"./GeoJSON-Cr1aCpEK.js";import{V as p}from"./iconStyles-D6gS2W5k.js";const u=`
[out:json][timeout:60];
area["name"="Nederland"]->.nl;
(
  node["leisure"="marina"](area.nl);
  node["mooring"="yes"](area.nl);
  way["leisure"="marina"](area.nl);
);
out center tags;
`;async function f(){const a=new l,o=new i({source:a,style:p.aanlegsteigers,properties:{title:"Aanlegsteigers",name:"Aanlegsteigers"}});try{const n=(await(await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:`data=${encodeURIComponent(u)}`})).json()).elements.filter(t=>t.lat&&t.lon||t.center).map(t=>{const e=t.tags||{};return{type:"Feature",geometry:{type:"Point",coordinates:[t.lon||t.center?.lon,t.lat||t.center?.lat]},properties:{layerType:"aanlegsteiger",id:t.id,name:e.name||null,type:e.leisure||e.mooring||"marina",operator:e.operator||null,access:e.access||null,fee:e.fee||null,capacity:e.capacity||null,website:e.website||e["contact:website"]||null,phone:e.phone||e["contact:phone"]||null}}}),s={type:"FeatureCollection",features:n};a.addFeatures(new c().readFeatures(s,{featureProjection:"EPSG:3857"})),console.log(`Loaded ${n.length} aanlegsteigers`)}catch(r){console.error("Failed to load aanlegsteigers:",r)}return o}export{f as createAanlegsteigersLayer};
//# sourceMappingURL=aanlegsteigersOL-D7aa275B.js.map
