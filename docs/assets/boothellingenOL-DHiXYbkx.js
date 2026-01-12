import{V as s,a as i}from"./index-ByHmsuNe.js";import{G as c}from"./GeoJSON-BK8ovLVC.js";import{V as p}from"./iconStyles-B3IiBRE2.js";const u=`
[out:json][timeout:60];
area["name"="Nederland"]->.nl;
(
  node["leisure"="slipway"](area.nl);
  way["leisure"="slipway"](area.nl);
);
out center tags;
`;async function f(){const a=new s,o=new i({source:a,style:p.trailerhellingen,properties:{title:"Trailerhellingen",name:"Trailerhellingen"}});try{const n=(await(await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:`data=${encodeURIComponent(u)}`})).json()).elements.filter(t=>t.lat&&t.lon||t.center).map(t=>{const e=t.tags||{};return{type:"Feature",geometry:{type:"Point",coordinates:[t.lon||t.center?.lon,t.lat||t.center?.lat]},properties:{layerType:"trailerhelling",id:t.id,name:e.name||null,access:e.access||null,fee:e.fee||null,surface:e.surface||null,operator:e.operator||null,website:e.website||e["contact:website"]||null,description:e.description||null,opening_hours:e.opening_hours||null,capacity:e.capacity||null,boat:e.boat||e["seamark:small_craft_facility:category"]||null}}}),l={type:"FeatureCollection",features:n};a.addFeatures(new c().readFeatures(l,{featureProjection:"EPSG:3857"})),console.log(`Loaded ${n.length} trailerhellingen`)}catch(r){console.error("Failed to load trailerhellingen:",r)}return o}export{f as createBoothellingenLayer};
//# sourceMappingURL=boothellingenOL-DHiXYbkx.js.map
