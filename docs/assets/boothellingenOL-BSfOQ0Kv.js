import{V as s,a as i,S as c,C as u,b as p,F as d}from"./index-Bm30xzOy.js";import{G as y}from"./GeoJSON-r4HxCa8a.js";const f=`
[out:json][timeout:60];
area["name"="Nederland"]->.nl;
(
  node["leisure"="slipway"](area.nl);
  way["leisure"="slipway"](area.nl);
);
out center tags;
`;async function h(){const a=new s,o=new i({source:a,style:new c({image:new u({radius:8,fill:new d({color:"#4CAF50"}),stroke:new p({color:"#fff",width:2})})}),properties:{title:"Trailerhellingen",name:"Trailerhellingen"}});try{const n=(await(await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:`data=${encodeURIComponent(f)}`})).json()).elements.filter(t=>t.lat&&t.lon||t.center).map(t=>{const e=t.tags||{};return{type:"Feature",geometry:{type:"Point",coordinates:[t.lon||t.center?.lon,t.lat||t.center?.lat]},properties:{layerType:"trailerhelling",id:t.id,name:e.name||null,access:e.access||null,fee:e.fee||null,surface:e.surface||null,operator:e.operator||null,website:e.website||e["contact:website"]||null,description:e.description||null,opening_hours:e.opening_hours||null,capacity:e.capacity||null,boat:e.boat||e["seamark:small_craft_facility:category"]||null}}}),l={type:"FeatureCollection",features:n};a.addFeatures(new y().readFeatures(l,{featureProjection:"EPSG:3857"})),console.log(`Loaded ${n.length} trailerhellingen`)}catch(r){console.error("Failed to load trailerhellingen:",r)}return o}export{h as createBoothellingenLayer};
//# sourceMappingURL=boothellingenOL-BSfOQ0Kv.js.map
