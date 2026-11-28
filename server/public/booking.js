const params=new URLSearchParams(location.search);
const collectionId=params.get("collectionId")||"";
const offerIndex=Number.parseInt(params.get("offerIndex")||"",10);
const summary=document.getElementById("bookingSummary");
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const text=(value,fallback="Не указано")=>String(value??"").trim()||fallback;
function row(label,value){return `<div class="booking-detail-row"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;}
function renderOffer(collection,offer){
 const hotel=text(offer.hotel,"Объект размещения");
 const date=text(offer.date);
 const nights=text(offer.nights);
 const guests=[offer.adults?text(offer.adults)+" взрослых":"",offer.children?text(offer.children)+" детей":""].filter(Boolean).join(" · ")||"Не указано";
 const price=text(offer.price,"Цена уточняется");
 const image=text(offer.customImage||offer.image||offer.sourceImage,"");
 const location=text(offer.location,"");
 const rows=[
  ["Адрес",location],
  ["Дата заезда",date],
  ["Количество ночей",nights==="Не указано"?"Не указано":nights+" ночей"],
  ["Состав гостей",guests],
  ["Номер",text(offer.room)],
  ["Цена",price]
 ].filter(([,v])=>v);
 summary.innerHTML=`${image?'<div class="booking-object-image"><img src="'+esc(image)+'" alt="'+esc(hotel)+'"></div>':""}
  <div class="booking-object-title"><span>Объект размещения</span><h3>${esc(hotel)}</h3></div>
  <dl class="booking-details">${rows.map(([label,value])=>row(label,value)).join("")}</dl>
  ${offer.meal?'<div class="booking-meal"><span>Питание</span><strong>'+esc(offer.meal)+'</strong></div>':""}
  <div class="booking-price"><span>Стоимость</span><strong>${esc(price)}</strong></div>`;
 document.title="Запрос на бронирование — "+hotel;
}
async function load(){
 if(!collectionId||!Number.isInteger(offerIndex)||offerIndex<0){summary.innerHTML='<div class="booking-error">Ссылка на выбранный вариант некорректна. Вернитесь в подборку и нажмите «Забронировать» ещё раз.</div>';return;}
 try{
  const response=await fetch("/api/collections/"+encodeURIComponent(collectionId));
  if(!response.ok)throw Error("Подборка не найдена или ссылка устарела.");
  const collection=await response.json(),offer=collection.offers?.[offerIndex];
  if(!offer)throw Error("Выбранный вариант не найден в подборке.");
  renderOffer(collection,offer);
 }catch(error){summary.innerHTML='<div class="booking-error">'+esc(error.message||"Не удалось загрузить вариант.")+'</div>';}
}
document.getElementById("bookingRequestForm").addEventListener("submit",event=>event.preventDefault());
load();