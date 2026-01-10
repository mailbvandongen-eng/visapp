import{V as s,a as c,S as l,C as i,b as d,F as p}from"./index-CiZYINls.js";import{G as u}from"./GeoJSON-B9abF0yw.js";const y=`
[out:json][timeout:60];
area["name"="Nederland"]->.nl;
(
  node["leisure"="slipway"](area.nl);
  way["leisure"="slipway"](area.nl);
);
out center;
`;async function g(){const o=new s,n=new c({source:o,style:new l({image:new i({radius:8,fill:new p({color:"#4CAF50"}),stroke:new d({color:"#fff",width:2})})}),properties:{name:"Boothellingen"}});try{const a=(await(await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:`data=${encodeURIComponent(y)}`})).json()).elements.filter(e=>e.lat&&e.lon||e.center).map(e=>({type:"Feature",geometry:{type:"Point",coordinates:[e.lon||e.center?.lon,e.lat||e.center?.lat]},properties:{id:e.id,name:e.tags?.name||"Boothelling",access:e.tags?.access||"unknown",fee:e.tags?.fee||"unknown",surface:e.tags?.surface}})),r={type:"FeatureCollection",features:a};o.addFeatures(new u().readFeatures(r,{featureProjection:"EPSG:3857"})),console.log(`Loaded ${a.length} boothellingen`)}catch(t){console.error("Failed to load boothellingen:",t)}return n}export{g as createBoothellingenLayer};
//# sourceMappingURL=boothellingenOL-fkGRsvBW.js.map
