import{V as c,a as y,S as p,b as w,F as d}from"./index-CgQZTJGY.js";import{G as u}from"./GeoJSON-BWLbjPQM.js";const g=`
[out:json][timeout:90];
area["name"="Nederland"]->.nl;
(
  way["natural"="water"]["fishing"="yes"](area.nl);
  relation["natural"="water"]["fishing"="yes"](area.nl);
  way["water"="lake"]["fishing"="yes"](area.nl);
  way["water"="pond"]["fishing"="yes"](area.nl);
);
out geom;
`;async function h(){const r=new c,n=new y({source:r,style:new p({fill:new d({color:"rgba(33, 150, 243, 0.2)"}),stroke:new w({color:"#2196F3",width:2})}),properties:{title:"Viswater",name:"Viswater"}});try{const i=await(await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:`data=${encodeURIComponent(g)}`})).json(),t=[];i.elements.forEach(e=>{if(e.type==="way"&&e.geometry){const a=e.tags||{};t.push({type:"Feature",geometry:{type:"Polygon",coordinates:[e.geometry.map(s=>[s.lon,s.lat])]},properties:{layerType:"viswater",id:e.id,name:a.name||null,fishing:a.fishing,access:a.access,operator:a.operator||null}})}});const l={type:"FeatureCollection",features:t};r.addFeatures(new u().readFeatures(l,{featureProjection:"EPSG:3857"})),console.log(`Loaded ${t.length} viswateren`)}catch(o){console.error("Failed to load viswater:",o)}return n}export{h as createViswaterLayer};
//# sourceMappingURL=viswaterOL-BMeNGKvK.js.map
