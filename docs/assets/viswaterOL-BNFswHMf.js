import{V as w,a as p,S as y,b as d,F as u}from"./index-B6JBE438.js";import{G as g}from"./GeoJSON-A0iHQ-fv.js";const f=`
[out:json][timeout:90];
area["name"="Nederland"]->.nl;
(
  way["natural"="water"]["fishing"="yes"](area.nl);
  relation["natural"="water"]["fishing"="yes"](area.nl);
  way["water"="lake"]["fishing"="yes"](area.nl);
  way["water"="pond"]["fishing"="yes"](area.nl);
);
out geom;
`;async function S(){const o=new w,i=new p({source:o,style:new y({fill:new u({color:"rgba(33, 150, 243, 0.2)"}),stroke:new d({color:"#2196F3",width:2})}),properties:{title:"Viswater",name:"Viswater"}});try{const e=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:`data=${encodeURIComponent(f)}`});if(!e.ok)throw e.status===429?new Error("Overpass rate limit bereikt (429). Probeer later opnieuw."):new Error(`Overpass request failed: ${e.status}`);const s=e.headers.get("content-type")||"";if(!s.includes("application/json")){const t=(await e.text()).slice(0,120);throw new Error(`Overpass gaf geen JSON terug (${s}): ${t}`)}const l=await e.json(),a=[];l.elements.forEach(t=>{if(t.type==="way"&&t.geometry){const r=t.tags||{};a.push({type:"Feature",geometry:{type:"Polygon",coordinates:[t.geometry.map(n=>[n.lon,n.lat])]},properties:{layerType:"viswater",id:t.id,name:r.name||null,fishing:r.fishing,access:r.access,operator:r.operator||null}})}});const c={type:"FeatureCollection",features:a};o.addFeatures(new g().readFeatures(c,{featureProjection:"EPSG:3857"})),console.log(`Loaded ${a.length} viswateren`)}catch(e){throw console.error("Failed to load viswater:",e),e}return i}export{S as createViswaterLayer};
//# sourceMappingURL=viswaterOL-BNFswHMf.js.map
