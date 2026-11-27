(() => {
"use strict";
function httpsImageUrl(raw,base=location.href){if(!raw)return "";const value=String(raw).trim();if(!value||/^(?:data:|blob:|javascript:)/i.test(value))return "";try{const url=new URL(value,base);if(!/^https?:$/i.test(url.protocol))return "";url.protocol="https:";return url.href;}catch{return ""}}
function runSearchParser(){
 const BUTTON_CLASS="tsp-add-button", PRICE_RE=/(?:\d[\s\u00a0]?){4,}\s?₽/;
 const params=new URL(location.href).searchParams;
 const queryDate=params.get("date")||"",queryNights=params.get("nights[0]")||params.get("nights")||"",queryAdults=params.get("adults")||"",queryChildren=params.get("children")||"";
 const norm=s=>(s||"").replace(/\u00a0/g," ").replace(/[ \t]+/g," ").replace(/\s*\n\s*/g,"\n").trim();
 const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=="none"&&s.visibility!=="hidden";};
 const priceFrom=s=>{const m=norm(s).match(/(?:\d[\s]?){4,}\s?₽/);return m?m[0].replace(/\s+/g," ").trim():"";};
 const generic=/^(цены и бронирование|показать все результаты|показать все|цены|бронирование|отели|санатории|результаты поиска|объект размещения)$/i;
 function goodTitle(s){const t=norm(s);return t.length>=3&&t.length<=180&&!generic.test(t)&&!/тариф|номер|питание|условия|комиссия|забронировать|в подборку|₽|руб\./i.test(t);}
 function offerNodeFor(priceNode){
  const row=priceNode.closest(".offers__row");
  if(row)return row;
  let n=priceNode;
  for(let i=0;i<12&&n&&n!==document.body;i++,n=n.parentElement){
   if(n.querySelector(".offers__col_tariff")&&n.querySelector(".offers__col_price"))return n;
  }
  return priceNode.parentElement||priceNode;
 }
 function cardFor(priceNode,offerNode){
  const direct=priceNode.closest(".hotel-card,.list-item,.search-result,.hotel-item")||
               offerNode.closest(".hotel-card,.list-item,.search-result,.hotel-item");
  if(direct)return direct;
  let n=offerNode;
  for(let i=0;i<14&&n&&n!==document.body;i++,n=n.parentElement){
   const hotelLink=n.querySelector("a[href*='/hotels/']");
   const rows=n.querySelectorAll(".offers__row");
   const image=[...n.querySelectorAll("img")].some(img=>visible(img)&&img.naturalWidth>=100&&img.naturalHeight>=60);
   const heading=n.querySelector(".list-item__link .heading.my-3,.heading.my-3,.heading");
   if(hotelLink&&heading&&goodTitle(heading.innerText||heading.textContent)&&
      (rows.length||n.querySelector(".offers__col_tariff"))&&image)return n;
  }
  // Fallback to the nearest ancestor whose hotel URL and heading coexist.
  n=offerNode;
  for(let i=0;i<8&&n&&n!==document.body;i++,n=n.parentElement){
   const a=n.querySelector("a[href*='/hotels/']");
   if(a){
    const t=norm(a.querySelector(".heading,h1,h2,h3,h4")?.innerText||a.innerText||a.textContent);
    if(goodTitle(t))return n;
   }
  }
  return offerNode;
 }
 function titleOf(card){
  if(!card)return "";
  // Keep the hotel name tied to this particular offer/card. Search markup can
  // contain several hotel headings in a larger ancestor, so don't take the
  // first arbitrary heading from the surrounding results list.
  const links=[...card.querySelectorAll("a[href*='/hotels/']")].filter(a=>visible(a));
  for(const a of links){
   const h=a.querySelector(".heading.my-3,.heading,h1,h2,h3,h4")||a;
   const t=norm(h.innerText||h.textContent);
   if(goodTitle(t))return t;
  }
  const preferred=[...card.querySelectorAll(".list-item__link .heading.my-3,.heading.my-3,.heading")].filter(visible);
  for(const el of preferred){
   const t=norm(el.innerText||el.textContent);
   if(goodTitle(t))return t;
  }
  return "";
 }
 function locationOf(card){
  if(!card)return "";
  const title=[...card.querySelectorAll(".list-item__link .heading.my-3,.heading.my-3,.heading")].find(el=>visible(el)&&goodTitle(el.innerText||el.textContent));
  if(title){
   // In Delfin search results the address is the first .my-2 element immediately after the hotel heading.
   let sibling=title.nextElementSibling;
   if(sibling&&sibling.classList.contains("my-2")){
    const address=norm(sibling.innerText||sibling.textContent);
    if(address&&address.length<=220&&!/^(отдых на море|отдых с детьми|леч|конференц|spa|комиссия)/i.test(address))return address;
   }
   const parent=title.parentElement;
   const addressNode=parent?.querySelector(":scope > .my-2");
   if(addressNode&&addressNode!==title){
    const address=norm(addressNode.innerText||addressNode.textContent);
    if(address&&address.length<=220&&!/^(отдых на море|отдых с детьми|леч|конференц|spa|комиссия)/i.test(address))return address;
   }
  }
  return "";
 }
 function labeled(node,label){
  const root=node.querySelector(".offers__col_tariff")||node;
  const raw=norm(root.innerText||root.textContent).replace(/\s+/g," ");
  const re=new RegExp("(?:^|\\s)"+label+"\\s*:\\s*(.*?)(?=\\s+(?:Тариф|Номер|Питание|Условия(?: оплаты и отмены| отмены)?|Комиссия)\\s*:|$)","i");
  return (raw.match(re)||[])[1]?.trim()||"";
 }
 function fieldFromLines(node,label){
  const lines=(node.innerText||"").split(/\n+/).map(norm);
  const line=lines.find(x=>new RegExp("^"+label+"\\s*:","i").test(x));
  return line?norm(line.replace(new RegExp("^"+label+"\\s*:\\s*","i"),"")):"";
 }
 function fields(node){
  const tariff=labeled(node,"Тариф")||fieldFromLines(node,"Тариф");
  const room=labeled(node,"Номер")||fieldFromLines(node,"Номер");
  const meal=labeled(node,"Питание")||fieldFromLines(node,"Питание");
  const conditions=(node.innerText||"").split(/\n+/).map(norm).find(x=>/^(Условия оплаты и отмены|Условия отмены|Условия)\s*:/i.test(x))||"";
  return {tariff,room,meal,cancellation:conditions};
 }
 function imageOf(card){
  if(!card)return "";
  const imgs=[...card.querySelectorAll("img")].filter(img=>visible(img)&&img.currentSrc&&img.naturalWidth>=100&&img.naturalHeight>=60&&!/logo|icon|avatar|flag|banner/i.test(img.alt+" "+img.src));
  imgs.sort((a,b)=>b.naturalWidth*b.naturalHeight-a.naturalWidth*a.naturalHeight);
  return httpsImageUrl(imgs[0]?.currentSrc||imgs[0]?.src||"");
 }
 function bindPrice(priceNode){
  if(priceNode.dataset.tspBound||priceNode.closest("."+BUTTON_CLASS))return;
  const price=priceFrom(priceNode.innerText||priceNode.textContent);if(!price)return;
  const offerNode=offerNodeFor(priceNode),card=cardFor(priceNode,offerNode);
  priceNode.dataset.tspBound="1";
  const btn=document.createElement("button");btn.type="button";btn.className=BUTTON_CLASS;btn.textContent="＋ В подборку";
  btn.addEventListener("click",async e=>{
   e.preventDefault();e.stopPropagation();
   const f=fields(offerNode),text=norm(offerNode.innerText||offerNode.textContent),hotel=titleOf(card),locationText=locationOf(card);
   const date=text.match(/\d{2}\.\d{2}\.\d{4}/),nights=text.match(/\d+\s*ночей?/i),img=imageOf(card);
   const offer={source:"Дельфин",sourceUrl:location.href,hotel:hotel||"Отель",location:locationText,
    price,date:queryDate||(date?date[0]:""),nights:queryNights||(nights?(nights[0].match(/\d+/)||[])[0]:""),
    adults:queryAdults,children:queryChildren,tariff:f.tariff,room:f.room,meal:f.meal,cancellation:f.cancellation,
    description:"",descriptionLink:"",comment:"",image:img,sourceImage:img,customImage:"",offerText:text.slice(0,1200),createdAt:new Date().toISOString()};
   offer.fingerprint=[location.href,offer.hotel,offer.price,offer.room,offer.tariff,offer.meal].join("|");
   try{
    const {offers=[]}=await chrome.storage.local.get({offers:[]});
    if(!offers.some(x=>x.fingerprint===offer.fingerprint)){offers.push(offer);await chrome.storage.local.set({offers});}
    btn.textContent="✓ Добавлено";btn.classList.add("is-added");
   }catch(err){console.error("[Tour Selection] save failed",err);btn.textContent="Ошибка сохранения";btn.title=String(err?.message||err);}
   setTimeout(()=>{btn.textContent="＋ В подборку";btn.classList.remove("is-added");btn.title="";},3500);
  });
  priceNode.insertAdjacentElement("afterend",btn); // Button immediately to the right of the price.
 }
 function scan(){
  [...document.querySelectorAll("body *")].filter(el=>el.children.length===0&&visible(el)&&PRICE_RE.test(el.textContent||"")).forEach(bindPrice);
 }
 let timer;const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,350);});
 scan();observer.observe(document.documentElement,{childList:true,subtree:true});
}

function runAleanParser(){
 const BUTTON_CLASS="tsp-add-button";
 const params=new URL(location.href).searchParams;
 const norm=s=>(s||"").replace(/\u00a0/g," ").replace(/[ \t]+/g," ").replace(/\s*\n\s*/g,"\n").trim();
 const textOf=el=>norm(el?.innerText||el?.textContent||"");
 const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect(),st=getComputedStyle(el);return r.width>0&&r.height>0&&st.display!=="none"&&st.visibility!=="hidden";};
 const getOffer=node=>node?.closest(".resultProductRoomsExpanded-offer")||node?.closest(".resultProductRoomsExpanded-offerBuyCost")||node?.closest(".resultProductRoomsExpanded-offerCostCol")||node;
 const getTour=node=>node?.closest(".resultProductRoomsExpanded")||node?.closest(".resultProductOffers-offer")||node?.closest("[class*='resultProduct']");
 const getRoom=node=>node?.closest(".resultProductRoomsExpanded")||getTour(node);
 const priceText=node=>textOf(node?.querySelector(".resultCost-final,.ksbDiscountPrice-finalValue")||node);
 const priceNumber=t=>{
  const raw=norm(t);
  // Alean sometimes renders the amount as plain digits ("49400") without
  // grouping or currency. Normalize it to the same visible mask as Delfin.
  const m=raw.match(/(?:\d[\d\s\u00a0]*)(?:[.,]\d{1,2})?/);
  if(!m)return "";
  const digits=m[0].replace(/\D/g,"");
  if(!digits)return "";
  const amount=Number(digits);
  if(!Number.isFinite(amount))return "";
  return amount.toLocaleString("ru-RU").replace(/\u00a0/g," ")+" ₽";
};
 const currencyOf=t=>{const c=norm(t).replace(/[\d\s.,]+/g,"").trim();return /₽|р\.|руб/i.test(c)?"RUB":c||"RUB";};
 const addYear=raw=>{const m=norm(raw).match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/);if(!m)return "";let y=m[3]||String(new Date().getFullYear());if(y.length===2)y="20"+y;return `${m[1].padStart(2,"0")}.${m[2].padStart(2,"0")}.${y}`;};
 function datesOf(tour){
  let ds=[...(tour||document).querySelectorAll("[ng-bind*='Begin|simDate'],[ng-bind*='End|simDate']")].map(textOf).filter(Boolean);
  if(ds.length<2)ds=[...(tour||document).querySelectorAll("[ng-bind*='Begin'],[ng-bind*='End']")].map(addYear).filter(Boolean);
  if(ds.length<2){const dur=textOf(tour?.querySelector(".resultProductRoomsExpanded-offerDurationItem"));ds=dur.split("-").map(addYear).filter(Boolean);}
  if(ds.length<2){const q=params.get("date")||"";if(q){const m=q.match(/(\d{4})-(\d{2})-(\d{2})/);ds=[m?`${m[3]}.${m[2]}.${m[1]}`:addYear(q)];}}
  return ds;
 }
 function nightsOf(tour,ds){
  const n=textOf(tour?.querySelector(".resultProductRoomsExpanded-offerDurationItem,.resultProductRoomsExpanded-offerPeriod>b")).match(/\d+/);
  if(n)return n[0];
  if(ds.length>1){const parse=x=>{const [d,m,y]=x.split(".").map(Number);return new Date(y,m-1,d);};return Math.max(0,Math.round((parse(ds[1])-parse(ds[0]))/86400000)).toString();}
  return params.get("nights")||params.get("nights[0]")||"";
 }
 function titleOf(tour){
  const hotel=document.querySelector(".product-title");
  if(hotel){const t=textOf(hotel),stars=String(hotel.className||"").match(/(\d)star/);return t+(stars?" "+stars[1]+"*":"");}
  for(const el of [tour?.querySelector("[class*='hotelName'],[class*='hotelTitle'],h1,h2,h3"),document.querySelector("h1")]){
   const t=textOf(el);if(t&&t.length<180&&!/цены и бронирование|забронировать/i.test(t))return t;
  }
  return document.title.replace(/\s*[|—-].*$/,"").trim();
 }
 function regionOf(){
  const addr=textOf(document.querySelector(".product-address"));
  if(addr)return addr;
  const crumbs=[...document.querySelectorAll(".breadcrumbs .breadcrumbs-link,.product .breadcrumbs-link,.bb-breadcrumbs-link")].map(textOf).filter(Boolean);
  return crumbs.slice(1,-1).join(", ");
 }
 function boardOf(tour){
  const services=[...(tour||document).querySelectorAll(".ksbOfferPacket-serviceItem")].map(textOf).filter(Boolean).join(", ");
  if(services)return services;
  const packet=textOf(tour?.querySelector(".ksbOfferPacket-info")).replace(/проживание,/i,"").trim();
  if(packet)return packet;
  return [textOf(tour?.querySelector(".aleanIcons-nutrition + span")),textOf(tour?.querySelector(".aleanIcons-heartbeat + span"))].filter(Boolean).join(" / ");
 }
 function imageList(room){
  const urls=[...(document.querySelectorAll(".productGallery [data-full-src]"))].map(el=>httpsImageUrl(el.getAttribute("data-full-src"))).filter(Boolean);
  const bg=room?.querySelector(".resultProductRoomsExpanded-imgArea[style*='background-image']");
  const match=bg?.getAttribute("style")?.match(/url\(["']?(.*?)["']?\)/i);if(match?.[1]){const imageUrl=httpsImageUrl(match[1]);if(imageUrl)urls.push(imageUrl);}
  if(!urls.length){const img=[...(room||document).querySelectorAll("img")].find(el=>el.currentSrc&&el.naturalWidth>100&&!/logo|icon|flag/i.test(el.src));if(img){const imageUrl=httpsImageUrl(img.currentSrc||img.src);if(imageUrl)urls.push(imageUrl);}}
  return [...new Set(urls)];
 }
 function parseTicket(ticket){
  if(!ticket)return null;
  const blocks=[...ticket.querySelectorAll(".resultTicket-block")];
  if(!blocks.length)return null;
  const sectors=blocks.map(block=>{
   const lines=[...block.querySelectorAll(".resultTicket-line")].map(textOf);
   const line=caption=>lines.find(x=>caption.test(x))||"";
   let dep=line(/Из аэропорта/i).replace(/.*Из аэропорта\s*:?\s*/i,"");
   let arr=line(/В аэропорт/i).replace(/.*В аэропорт\s*:?\s*/i,"");
   if(!dep||!arr){
    const route=[...block.querySelectorAll(".resultTicket-line>div>div")].map(textOf).filter(x=>/вылет.*из|прил[её]т.*в/i.test(x));
    dep=dep||route[0]?.replace(/вылет.*из\s*/i,"")||"";
    arr=arr||route[1]?.replace(/прил[её]т.*в\s*/i,"")||"";
   }
   const splitAirport=x=>{const m=x.match(/^(.*?)\s*\((.*?)\)\s*$/);return {airport:(m?.[1]||x).trim(),city:(m?.[2]||"").trim()};};
   const d=splitAirport(dep),a=splitAirport(arr);
   const dt=line(/Вылет в|Время вылета/i).match(/\d{2}:\d{2}/)?.[0]||"";
   const at=line(/Прилет в|Время прил[её]та/i).match(/\d{2}:\d{2}/)?.[0]||"";
   const date=(textOf(block.querySelector(".resultTicketInfoTrip-way"))||"").match(/\d{2}\.\d{2}\.\d{4}/)?.[0]||"";
   return {segments:[{departureTime:dt,departureCity:d.city,departureAirport:d.airport,departureDate:date,arrivalTime:at,arrivalCity:a.city,arrivalAirport:a.airport,arrivalDate:date,flightNumber:line(/Рейсом|Рейс/i).replace(/Рейсом?\s*:?\s*/i,"")}]};
  });
  if(sectors.length>1){const first=sectors[0].segments[0],last=sectors[sectors.length-1].segments[0];first.arrivalCity=last.departureCity;first.arrivalAirport=last.departureAirport;last.arrivalCity=first.departureCity;last.arrivalAirport=first.departureAirport;}
  return {sectors};
 }
 async function retrieveFlight(tour){
  if(!tour)return null;
  const link=tour.querySelector('[ng-click*="howTicket"]');
  if(!link)return null;
  try{
   link.click();
   let ticket=null;
   for(let i=0;i<20;i++){ticket=document.querySelector(".opentip-container .resultTicket");if(ticket)break;await new Promise(resolve=>setTimeout(resolve,100));}
   const flight=parseTicket(ticket);
   document.querySelector(".opentip-container .ot-close")?.click();
   return flight;
  }catch(e){console.warn("[Tour Selection] Alean flight parse",e);document.querySelector(".opentip-container .ot-close")?.click();return null;}
 }
 function offerData(target){
  const tour=getTour(target),offer=getOffer(target),room=getRoom(target);
  const ds=datesOf(tour),pt=priceText(tour),price=priceNumber(pt||textOf(target)),imgs=imageList(room);
  const descSection=[...document.querySelectorAll(".productSection")].find(sec=>sec.querySelector(".aleanIcons-complex,.aleanIcons-hotel-ta"));
  const description=textOf(descSection?.querySelector(".productSection-content"));
  const occupancyText=textOf(document.querySelector(".field-passengers .text,.field-passengers input"));
  const adults=occupancyText.match(/(\d+)\s*взросл/i)?.[1]||params.get("adults")||"";
  const children=occupancyText.match(/(\d+)\s*реб/i)?.[1]||params.get("children")||"";
  return {tour,offer,room,hotel:titleOf(tour),location:regionOf(),price:price||"Цена уточняется",currency:currencyOf(pt),date:ds[0]||params.get("date")||"",nights:nightsOf(tour,ds),adults,children,roomType:textOf(room?.querySelector(".resultProductRoomsExpanded-name,.resultProductRoomsExpanded-title")),meal:boardOf(tour),description,images:imgs,offerText:textOf(offer||tour).slice(0,1800)};
 }
 function bind(target){
  if(!target||target.dataset.tspAleanBound||target.closest("."+BUTTON_CLASS))return;
  const price=priceText(getTour(target))||textOf(target);if(!/\d/.test(price))return;
  target.dataset.tspAleanBound="1";
  const btn=document.createElement("button");btn.type="button";btn.className=BUTTON_CLASS;btn.textContent="＋ В подборку";
  btn.addEventListener("click",async e=>{
   e.preventDefault();e.stopPropagation();btn.disabled=true;btn.textContent="Загрузка...";
   try{
    const data=offerData(target);
    const flight=await retrieveFlight(data.tour);
    const offer={source:"Алеан",sourceUrl:location.href,hotel:data.hotel,location:data.location,price:data.price,currency:data.currency,
     date:data.date,nights:data.nights,adults:data.adults,children:data.children,room:data.roomType,meal:data.meal,tariff:"",
     flight:flight,flightIncluded:flight?"yes":"",description:data.description,descriptionLink:"",comment:"",image:data.images[0]||"",sourceImage:data.images[0]||"",images:data.images,customImage:"",
     offerText:data.offerText,createdAt:new Date().toISOString()};
    offer.fingerprint=[location.href,offer.hotel,offer.price,offer.room,offer.meal].join("|");
    const {offers=[]}=await chrome.storage.local.get({offers:[]});
    if(!offers.some(x=>x.fingerprint===offer.fingerprint)){offers.push(offer);await chrome.storage.local.set({offers});}
    btn.textContent="✓ Добавлено";btn.classList.add("is-added");
   }catch(err){console.error("[Tour Selection] Alean save failed",err);btn.textContent="Ошибка сохранения";btn.title=String(err?.message||err);}
   finally{btn.disabled=false;setTimeout(()=>{btn.textContent="＋ В подборку";btn.classList.remove("is-added");btn.title="";},3500);}
  });
  target.append(btn);
 }
 function scan(){
  document.querySelectorAll(".resultProductRoomsExpanded-offerBuyCost,.resultProductRoomsExpanded-offers .resultProductRoomsExpanded-offer .resultProductRoomsExpanded-offerCostCol")
   .forEach(bind);
 }
 let timer;const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,350);});
 scan();observer.observe(document.documentElement,{childList:true,subtree:true});
}

if(/(^|\.)alean\.ru$/i.test(location.hostname)){runAleanParser();return;}

if(location.pathname.startsWith("/search/")){ runSearchParser(); return; }
const BUTTON_CLASS="tsp-add-button";
const PRICE_RE=/(?:\d[\s\u00a0]?){4,}\s?₽/;
const url=new URL(location.href), params=url.searchParams;
const queryDate=params.get("date")||"", queryNights=params.get("nights[0]")||params.get("nights")||"", queryAdults=params.get("adults")||"", queryChildren=params.get("children")||"";
const PAGE_TITLE=(document.querySelector("h1")?.innerText||document.title||"").trim();
const HOTEL_TITLE_SELECTORS=[
 "h2","h3","h4",".hotel-title",".hotel__title",".hotel-name",".hotel__name",
 ".object-title",".object-name",".hotel-card__title",".hotel-card-title",
 "[class*='hotel__title']","[class*='hotel-title']","[class*='object-title']",
 "a[href*='/hotels/']","a[href*='/hotel/']"
];
function visible(el){if(!el)return false;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=="none"&&s.visibility!=="hidden";}
function norm(s){return (s||"").replace(/\u00a0/g," ").replace(/[ \t]+/g," ").replace(/\s*\n\s*/g,"\n").trim();}
function priceFrom(s){const m=norm(s).match(/(?:\d[\s]?){4,}\s?₽/);return m?m[0].replace(/\s+/g," ").trim():"";}
function linesOf(node){return (node?.innerText||"").split(/\n+/).map(norm).filter(Boolean);}
function hasPrice(node){return !!priceFrom(node?.innerText||node?.textContent||"");}
function hasRoomTariff(node){
 const text=norm(node?.innerText||"");
 return (!!node?.querySelector?.(".offers__col_tariff .tariff,.tariff")&&!!node?.querySelector?.(".offers__col_tariff .room,.room")) ||
  (/Тариф\s*:/i.test(text)&&/Номер\s*:/i.test(text));
}
function findOfferNode(priceNode){
 // First prefer a single Delfin room/price row. This keeps each room's price independent.
 let n=priceNode;
 for(let i=0;i<14&&n&&n!==document.body;i++,n=n.parentElement){
  if(!hasPrice(n))continue;
  const cls=String(n.className||"");
  const rowLike=/(?:offer|room|price|tariff|row|item)/i.test(cls)&&/(?:offers|hotel|search|result|room|price)/i.test(cls);
  if(hasRoomTariff(n)&&(rowLike||n.querySelectorAll(".offers__col_tariff .room,.room").length<=2))return n;
 }
 // Fallback: use the nearest ancestor with the tariff and room labels.
 n=priceNode;
 for(let i=0;i<10&&n&&n!==document.body;i++,n=n.parentElement){if(hasPrice(n)&&hasRoomTariff(n))return n;}
 // Generic row fallback used by markup changes on the search page.
 n=priceNode.closest("tr,[class*='offer-row'],[class*='room-row'],[class*='price-row'],[class*='offers__row']");
 return n||priceNode.parentElement||priceNode;
}
function findLabelBlock(container,label){
 const blocks=[...container.querySelectorAll(".offers__col_tariff .body-2,.body-2,[class*='tariff']")];
 return blocks.find(el=>{
  const t=norm(el.querySelector(".mn-1")?.textContent||el.textContent).toLowerCase();
  return t.startsWith(label.toLowerCase()+":");
 });
}
function labeledValue(container,label,selector){
 const block=findLabelBlock(container,label);
 if(block){
  const value=block.querySelector(selector);
  if(value)return norm(value.innerText||value.textContent);
  const labelEl=block.querySelector(".mn-1");
  const raw=norm(block.textContent.replace(labelEl?.textContent||label,""));
  if(raw)return raw.replace(/^\s*:?\s*/,"");
 }
 const line=linesOf(container).find(x=>x.toLowerCase().startsWith(label.toLowerCase()+":"));
 return line?norm(line.replace(new RegExp("^"+label+"\\s*:\\s*","i"),"")):"";
}
function extractFields(node){
 const text=norm(node.innerText);
 const tariff=labeledValue(node,"Тариф",".tariff")||matchLabel(text,"Тариф");
 const room=labeledValue(node,"Номер",".room")||matchLabel(text,"Номер");
 const meal=labeledValue(node,"Питание","a, .meal, .food")||matchLabel(text,"Питание");
 const cancellation=linesOf(node).find(x=>/^(Условия оплаты и отмены|Условия отмены|Условия)\s*:/i.test(x))||"";
 return {tariff,room,meal,cancellation};
}
function matchLabel(text,label){
 const re=new RegExp("(?:^|\\n)"+label+"\\s*:\\s*([^\\n]+)","i");
 return norm(text.match(re)?.[1]||"");
}

function detectFlightIncluded(text){
 const t=norm(text).toLowerCase();
 if(/(?:перел[её]т|авиа|авиабилет|авиаперел[её]т).{0,35}(?:включ[её]н|включен в стоимость|входит в стоимость|предусмотрен)/i.test(t)||
    /(?:с перел[её]том|перел[её]т включ[её]н)/i.test(t))return "yes";
 if(/(?:без перел[её]та|перел[её]т не включ[её]н|без авиаперел[её]та)/i.test(t))return "no";
 return "";
}
function hotelDetailTitle(){
 if(!location.pathname.startsWith("/hotels/"))return "";
 const selectors=["h1[itemprop='name']","h1.display-1","h1[itemprop='headline']","h1"];
 for(const selector of selectors){
  const el=document.querySelector(selector);
  if(!el||!visible(el))continue;
  const title=norm(el.innerText||el.textContent);
  if(title.length>=3&&title.length<=180&&!/^(цены и бронирование|бронирование|отель|цены)$/i.test(title)&&!/забронировать|в подборку|тариф|номер|питание|комиссия|руб\.|₽/i.test(title))return title;
 }
 const meta=document.querySelector("meta[itemprop='name'][content]");
 const metaTitle=norm(meta?.getAttribute("content")||"");
 if(metaTitle.length>=3&&metaTitle.length<=180&&!/цены и бронирование|тариф|₽/i.test(metaTitle))return metaTitle;
 return "";
}

function hotelDetailLocation(){
 if(!location.pathname.startsWith("/hotels/"))return "";
 const breadcrumbs=document.querySelector("ul.v-breadcrumbs");
 if(!breadcrumbs)return "";
 // Read only the breadcrumb label, not the separator nodes (often a standalone "/").
 const parts=[...breadcrumbs.querySelectorAll("li")].map(li=>{
  const label=li.querySelector("a,span.v-breadcrumbs__item,span")||li;
  return norm(label.innerText||label.textContent);
 }).filter(part=>part&&!/^\/+$/u.test(part));
 const unique=[];
 for(const part of parts){if(!/^\/+$/u.test(part)&&!unique.includes(part)&&part.length<=100)unique.push(part);}
 return unique.join(", ");
}

function titleFrom(container,reference){
 if(!container)return "";
 const candidates=[];
 for(const selector of HOTEL_TITLE_SELECTORS){
  for(const el of container.querySelectorAll(selector)){
   if(!visible(el))continue;
   const title=norm(el.innerText||el.textContent);
   if(title.length<3||title.length>180)continue;
   if(/забронировать|в подборку|тариф|номер|питание|комиссия|руб\.|₽/i.test(title))continue;
   if(el.matches("h1")&&title===PAGE_TITLE)continue;
   const a=el.getBoundingClientRect(),b=(reference||container).getBoundingClientRect();
   candidates.push({title,el,distance:Math.abs((a.top+a.bottom)/2-(b.top+b.bottom)/2)});
  }
 }
 candidates.sort((a,b)=>a.distance-b.distance);
 return candidates[0]?.title||"";
}
function hotelContainerFor(offerNode){
 let n=offerNode,best=null;
 for(let i=0;i<12&&n&&n!==document.body;i++,n=n.parentElement){
  const title=titleFrom(n,offerNode);
  if(!title)continue;
  const imgs=[...n.querySelectorAll("img")].filter(img=>img.currentSrc&&img.naturalWidth>=180&&img.naturalHeight>=100&&!/logo|icon|avatar|flag/i.test(img.alt+" "+img.src));
  // Avoid selecting the entire results list: choose the smallest ancestor that has its own title and image.
  if(imgs.length){best=n;break;}
 }
 return best;
}
function hotelImage(container){
 if(!container)return "";
 const imgs=[...container.querySelectorAll("img")].filter(img=>visible(img)&&img.currentSrc&&img.naturalWidth>=180&&img.naturalHeight>=100&&!img.closest("."+BUTTON_CLASS)&&!/logo|icon|banner|avatar|flag/i.test(img.alt+" "+img.src));
 imgs.sort((a,b)=>(b.naturalWidth*b.naturalHeight)-(a.naturalWidth*a.naturalHeight));
 return imgs[0]?httpsImageUrl(imgs[0].currentSrc||imgs[0].src):"";
}
function extractHotelDescription(container){
 if(!container)return "";
 const normDescription=s=>norm(s).replace(/\\s+/g," ").trim();
 const isNoise=t=>/график проведения|профилактическ|в период проведения|плановых работ|заявка для групп|отзывы пока нет|цены и бронирование|номерной фонд|инфраструктура и услуги|лечени[ея]|трансферы|похожие отели/i.test(t);
 const isDescription=t=>t.length>=90&&t.length<=1600&&!isNoise(t)&&
  !/Тариф\\s*:|Номер\\s*:|Питание\\s*:|Забронировать|Комиссия по туру|₽|условия оплаты и отмены/i.test(t);
 // On hotel detail pages Delfin's introductory description is the first
 // editorial paragraph below the gallery (often italic). Prioritize it over
 // later service notices and operational schedules.
 const main=document.querySelector("main")||document.querySelector("#content")||document.body;
 const preferred=[
  ".hotel-description",".hotel__description",".hotel-description__text",
  "[itemprop='description']",".hotel-info__description",".description-hotel",
  ".hotel-about",".hotel-text"
 ];
 for(const sel of preferred){
  for(const el of main.querySelectorAll(sel)){
   if(!visible(el))continue;
   const t=normDescription(el.innerText);
   if(isDescription(t)&&!isNoise(t))return t;
  }
 }
 const paragraphs=[...main.querySelectorAll("p, .text, .content-text, [class*='description']")].filter(visible);
 const candidates=[];
 for(const el of paragraphs){
  const t=normDescription(el.innerText);
  if(!isDescription(t))continue;
  const cls=String(el.className||"").toLowerCase();
  const italic=el.tagName==="I"||el.tagName==="EM"||!!el.querySelector("i,em")||/italic|description|about|intro/.test(cls);
  // Prefer the introductory paragraph near the gallery, then longer clean text.
  const rect=el.getBoundingClientRect();
  const gallery=document.querySelector(".hotel-gallery,.gallery,.hotel-photos,[class*='gallery']");
  const galleryBottom=gallery?gallery.getBoundingClientRect().bottom:0;
  const distance=Math.max(0,rect.top-galleryBottom);
  candidates.push({t,score:(italic?10000:0)+(el.tagName==="P"?500:0)+Math.min(t.length,700)-Math.min(distance/20,500)});
 }
 candidates.sort((a,b)=>b.score-a.score);
 return candidates[0]?.t||"";
}
function extractOffer(node,priceNode){
 const fields=extractFields(node),text=norm(node.innerText);
 const hotelContainer=hotelContainerFor(node);
 const hotel=hotelDetailTitle()||titleFrom(hotelContainer,node)||titleFrom(node,node)||PAGE_TITLE||"Отель";
 const img=hotelImage(hotelContainer)||hotelImage(node);
 const dateLine=text.match(/\d{2}\.\d{2}\.\d{4}/),nightsLine=text.match(/\d+\s*ночей?/i);
 const offer={
  source:"Дельфин",sourceUrl:location.href,hotel,location:hotelDetailLocation(),
  price:priceFrom(priceNode.innerText||priceNode.textContent),
  date:queryDate|| (dateLine?dateLine[0]:""),
  nights:queryNights|| (nightsLine?(nightsLine[0].match(/\d+/)||[])[0]:""),
  adults:queryAdults,children:queryChildren,
  tariff:fields.tariff,room:fields.room,meal:fields.meal,
  cancellation:fields.cancellation,description:extractHotelDescription(hotelContainer),
  descriptionLink:"",comment:"",image:img,sourceImage:img,customImage:"",
  offerText:text.slice(0,1600),createdAt:new Date().toISOString()
 };
 // Include the hotel and room details in deduplication: identical prices at different properties are distinct offers.
 offer.fingerprint=[location.href,offer.hotel,offer.price,offer.room,offer.tariff,offer.meal,offer.cancellation].join("|");
 return offer;
}
function addButton(priceNode){
 if(priceNode.dataset.tspBound||priceNode.closest("."+BUTTON_CLASS))return;
 const price=priceFrom(priceNode.innerText||priceNode.textContent);if(!price)return;
 const offerNode=findOfferNode(priceNode);
 priceNode.dataset.tspBound="1";
 const btn=document.createElement("button");btn.type="button";btn.className=BUTTON_CLASS;btn.textContent="＋ В подборку";
 btn.addEventListener("click",async e=>{
  e.preventDefault();e.stopPropagation();
  const offer=extractOffer(offerNode,priceNode);
  try{
   if(!globalThis.chrome?.storage?.local)throw new Error("Chrome Storage API недоступен. Проверьте разрешение «storage» в manifest.json и перезагрузите расширение на chrome://extensions.");
   const {offers=[]}=await chrome.storage.local.get({offers:[]});
   if(!offers.some(x=>x.fingerprint===offer.fingerprint)){offers.push(offer);await chrome.storage.local.set({offers});}
   btn.textContent="✓ Добавлено";btn.classList.add("is-added");
  }catch(err){
   console.error("[Tour Selection] Не удалось сохранить предложение:",err);
   const message=String(err?.message||err);
   if(message.includes("Extension context invalidated")||!globalThis.chrome?.runtime?.id){btn.textContent="Обновите страницу";btn.title="Расширение было обновлено или перезапущено. Обновите вкладку Дельфина (Ctrl+Shift+R) и попробуйте снова.";btn.classList.add("tsp-error");btn.disabled=true;}
   else{btn.textContent="Ошибка сохранения";btn.title=message;btn.classList.add("tsp-error");}
  }
  if(!btn.disabled)setTimeout(()=>{btn.textContent="＋ В подборку";btn.classList.remove("is-added","tsp-error");btn.title="";},3500);
 });
 priceNode.insertAdjacentElement("afterend",btn); // Button immediately to the right of the price.
}
function scan(){
 const candidates=[...document.querySelectorAll("body *")].filter(el=>el.children.length===0&&visible(el)&&PRICE_RE.test(el.textContent||""));
 candidates.forEach(addButton);
}
let timer;const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,350);});
scan();observer.observe(document.documentElement,{childList:true,subtree:true});
})();
