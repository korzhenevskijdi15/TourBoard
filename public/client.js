const id=location.pathname.split("/").filter(Boolean).pop();
const app=document.getElementById("app");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const value=(s,fallback="")=>String(s??fallback).trim();
function objectDescriptionUrl(o){
 const specified=value(o.descriptionLink);
 if(/^https?:\/\//i.test(specified))return specified;
 return "https://www.google.com/search?q="+encodeURIComponent(value(o.hotel,"Отель"));
}
function objectTitleLink(o,hotel){
 return `<a class="client-object-link" href="${esc(objectDescriptionUrl(o))}" target="_blank" rel="noopener">${esc(hotel)}</a>`;
}
function chips(o){
 const items=[];
 if(o.date)items.push(`<span class="client-chip">${esc(o.date)}</span>`);
 if(o.nights)items.push(`<span class="client-chip"><b>${esc(o.nights)} ночей</b></span>`);
 if(o.adults)items.push(`<span class="client-chip">${esc(o.adults)} взрослых${o.children?` · ${esc(o.children)} детей`:""}</span>`);
 if(o.meal)items.push(`<span class="client-chip">Питание: ${esc(o.meal)}</span>`);
 if(o.flightIncluded==="yes")items.push(`<span class="client-chip">С перелётом</span>`);
 if(o.flightIncluded==="no")items.push(`<span class="client-chip">Без перелёта</span>`);
 if(o.room)items.push(`<span class="client-chip">${esc(o.room)}</span>`);
 if(o.tariff)items.push(`<span class="client-chip">${esc(o.tariff)}</span>`);
 return items.length?`<div class="client-chips">${items.join("")}</div>`:"";
}
let managerSettings={name:"Корженевский Дмитрий",phone:"+7 978 550-03-00",email:"",telegram:"https://qui-quo.ru/telegram-chat?user-name=%2B79785500300",whatsapp:"",max:"https://max.ru/u/f9LHodD0cOK8RdqaCnUtHKiJmyXJ0IAIXk5Vf3rNh9LRhvKIG94lDfi9ZBc",vk:"https://vk.com/bag_travels"};
function primaryContact(){
 return managerSettings.telegram||managerSettings.whatsapp||managerSettings.max||managerSettings.vk||
 (managerSettings.email?`mailto:${managerSettings.email}`:"")||
 (managerSettings.phone?`tel:${managerSettings.phone.replace(/[^\+\d]/g,"")}`:"#");
}
function socialIcon(key){
 const files={telegram:"telegram.png",vk:"vk.png",whatsapp:"whatsapp.png",max:"max.png"};
 return `<img class="client-social-icon" src="/icons/${files[key]}" alt="" aria-hidden="true">`;
}
function managerContactLinks(){
 const entries=[["telegram","Telegram"],["whatsapp","WhatsApp"],["max","MAX"],["vk","ВКонтакте"]];
 const links=entries.filter(([key])=>/^https?:\/\//i.test(String(managerSettings[key]||""))).map(([key,label])=>`<a class="client-social-link" href="${esc(managerSettings[key])}" target="_blank" rel="noopener">${socialIcon(key)}<span>${label}</span></a>`);
 return links.join("");
}

function updateHeaderContacts(){
 const area=document.querySelector(".client-header-contacts");if(!area)return;
 const phone=managerSettings.phone||"",email=managerSettings.email||"";
 const phoneHref=phone.replace(/[^+\d]/g,"");
 area.innerHTML=`${phone?`<a class="client-phone" href="tel:${esc(phoneHref)}">${esc(phone)}</a>`:""}${email?`<a href="mailto:${esc(email)}">${esc(email)}</a>`:""}`;
 const logo=document.getElementById("clientOrgLogo");if(logo&&managerSettings.logo){logo.src=managerSettings.logo;logo.alt=managerSettings.companyName||"Логотип организации";}
 const name=document.getElementById("clientOrgName");if(name)name.textContent=managerSettings.companyName||"";
 const address=document.getElementById("clientOrgAddress");if(address)address.textContent=managerSettings.address||"";
 const website=document.getElementById("clientOrgWebsite");if(website){website.href=managerSettings.website||"#";website.textContent=(managerSettings.website||"").replace(/^https?:\/\//,"");website.hidden=!managerSettings.website;}
 [["footerVk","vk"],["footerMax","max"],["footerTelegram","telegram"],["footerWhatsapp","whatsapp"]].forEach(([id,key])=>{const el=document.getElementById(id);if(!el)return;const url=String(managerSettings[key]||"").trim();if(!/^https?:\/\//i.test(url)){el.remove();return;}el.hidden=false;el.href=url;el.innerHTML=`${socialIcon(key)}<span>${el.dataset.label||el.textContent.trim()}</span>`;});
}

function offerCard(o,i){
 const image=value(o.customImage||o.image||o.sourceImage);
 const price=value(o.price,"Цена уточняется");
 const hotel=value(o.hotel,"Вариант размещения");
 const detail=o.comment?`<div class="client-manager-note"><strong>Информация от менеджера</strong><div>${esc(o.comment)}</div></div>`:"";
 const description=value(o.description);
 const descriptionExcerpt=description.length>360?description.slice(0,357).trimEnd()+"…":description;
 const descriptionMarkup=description?`<p class="client-description client-description-limited" data-full="${esc(description)}">${esc(descriptionExcerpt)}</p>${description.length>360?`<button type="button" class="client-description-toggle" aria-expanded="false">подробное описание</button>`:""}`:"";
 const cancellation=o.cancellation?`<div class="client-terms"><strong>Условия</strong><div>${esc(o.cancellation)}</div></div>`:"";
 const contactHref=primaryContact();
 return `<article class="client-offer">
  ${image?`<div class="client-photo-wrap"><a class="client-object-link client-photo-link" href="${esc(objectDescriptionUrl(o))}" target="_blank" rel="noopener"><img class="client-photo" src="${esc(image)}" alt="${esc(hotel)}" loading="${i>0?"lazy":"eager"}" onerror="this.closest('.client-photo-wrap').classList.add('image-error');this.style.display='none'"></a><div class="client-photo-fallback">Фото отеля</div></div>`:""}
  <div class="client-offer-body">
   <div class="client-offer-title-row"><h2>${objectTitleLink(o,hotel)}</h2><span class="client-offer-mark" aria-hidden="true">✦</span></div>
   ${o.location?`<div class="client-location">${esc(o.location)}</div>`:""}
   ${chips(o)}
   ${descriptionMarkup}
   ${detail}
   ${cancellation}
   <div class="client-price-panel">
    <div class="client-price-block"><div class="client-price">${esc(price)}</div><div class="client-price-caption">${o.nights?`за ${esc(o.nights)} ночей`:"Стоимость проживания"}${o.adults?`, ${esc(o.adults)} взрослых`:""}${o.children?` + ${esc(o.children)} детей`:""}${o.meal?`, питание: ${esc(o.meal).toLowerCase()}`:""}</div></div>
    <a class="client-cta" href="${contactHref}" target="_blank" rel="noopener">Забронировать <span aria-hidden="true">↗</span></a>
   </div>
  </div>
 </article>`;
}

function universalOffer(o,i){
 const image=value(o.customImage||o.image||o.sourceImage),hotel=value(o.hotel,"Вариант размещения"),description=value(o.description);
 const price=value(o.price,"Цена уточняется"),locationText=value(o.location),nights=value(o.nights);
 const date=value(o.date),room=value(o.room),meal=value(o.meal),comment=value(o.comment);
 const adults=value(o.adults),children=value(o.children);
 const guests=[adults?`${adults} взрослых`:"",children?`${children} детей`:""].filter(Boolean).join(" + ");
 const extras=[["Состав туристов",guests],["Перелёт",o.flightIncluded==="yes"?"С перелётом":o.flightIncluded==="no"?"Без перелёта":""],["Тариф",o.tariff]].filter(([,v])=>value(v));
 const row=(label,v)=>value(v)?`<tr><td style="padding:8px 12px;border-bottom:1px solid #dce2e9;color:#68788c;font:14px Arial,sans-serif;width:35%;vertical-align:top">${esc(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #dce2e9;color:#14243b;font:bold 14px Arial,sans-serif;vertical-align:top">${esc(v)}</td></tr>`:"";
 const extraRows=extras.map(([label,v])=>row(label,v)).join("");
 const descriptionExcerpt=description.length>400?description.slice(0,399).trimEnd()+"…":description;
 const descriptionHtml=description?`<div class="client-description universal-description" data-full="${esc(description)}" style="color:#52657d;font:14px/1.6 Arial,sans-serif;white-space:pre-line">${esc(descriptionExcerpt)}</div>`:"";
 const commentHtml=comment?`<div style="margin:14px 0;padding:12px 14px;background:#f5f7fa;color:#52657d;font:14px/1.6 Arial,sans-serif"><strong>Комментарий менеджера:</strong> ${esc(comment)}</div>`:"";
 const terms=o.cancellation?`<div style="margin:10px 0;color:#52657d;font:13px/1.5 Arial,sans-serif"><strong>Условия:</strong> ${esc(o.cancellation)}</div>`:"";
 const photo= image?`<td width="${descriptionHtml?"48%":"100%"}" valign="top" style="width:${descriptionHtml?"48%":"100%"};padding:${descriptionHtml?"0 14px 0 0":"0"}"><a href="${esc(objectDescriptionUrl(o))}" target="_blank" rel="noopener"><img src="${esc(image)}" alt="${esc(hotel)}" style="display:block;width:100%;max-width:100%;height:auto;border:0"></a></td>`:"";
 const descCell=descriptionHtml?`<td valign="top" style="padding:0;color:#52657d;font:14px/1.6 Arial,sans-serif">${descriptionHtml}</td>`:"";
 return `<article class="client-offer universal-offer" style="width:100%;max-width:100%;margin:0 auto 28px;background:#fff;color:#14243b;font-family:Arial,sans-serif;box-sizing:border-box">
  <div style="padding:22px 24px 24px">
   <h2 style="margin:0 0 8px;color:#14243b;font:26px/1.25 Georgia,serif">${objectTitleLink(o,hotel)}</h2>
   ${locationText?`<div style="margin:0 0 16px;color:#68788c;font:14px/1.5 Arial,sans-serif">${esc(locationText)}</div>`:""}
   ${image||description?`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:0 0 16px"><tr>${photo}${descCell}</tr></table>`:""}
   <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:0">
    ${row("Даты размещения",date)}${row("Количество ночей",nights)}${row("Номер",room)}${row("Питание",meal)}${extraRows}
   </table>
   ${commentHtml}${terms}
   <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:18px 0 0;border-top:1px solid #dce2e9"><tr>
    <td valign="middle" style="padding:18px 12px 0 0"><div style="color:#14243b;font:30px/1.2 Georgia,serif">${esc(price)}</div><div style="margin-top:5px;color:#68788c;font:13px Arial,sans-serif">за весь тур${nights?` · ${esc(nights)} ночей`:""}</div></td>
    <td valign="middle" align="right" style="padding:18px 0 0"><a href="${primaryContact()}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 18px;background:#14243b;color:#fff;text-decoration:none;font:bold 14px Arial,sans-serif">Уточнить и забронировать&nbsp; ↗</a></td>
   </tr></table>
  </div>
 </article>`;
}

function strictOffer(o,i){
 const image=value(o.customImage||o.image||o.sourceImage),hotel=value(o.hotel,"Вариант размещения"),price=value(o.price,"Цена уточняется"),description=value(o.description);
 const excerpt=description.length>360?description.slice(0,357).trimEnd()+"…":description;
 const descriptionMarkup=description?`<p class="client-description strict-description" data-full="${esc(description)}">${esc(excerpt)}</p>${description.length>360?`<button type="button" class="client-description-toggle" aria-expanded="false">подробное описание</button>`:""}`:"";
 const detail=o.comment?`<div class="strict-comment"><strong>Комментарий менеджера:</strong> ${esc(o.comment)}</div>`:"";
 const terms=o.cancellation?`<div class="strict-comment"><strong>Условия:</strong> ${esc(o.cancellation)}</div>`:"";
 const fields=[["Номер",o.room],["Питание",o.meal],["Тариф",o.tariff],["Начало тура",o.date],["Ночей",o.nights],["Туристы",[o.adults?`${o.adults} взрослых`:"",o.children?`${o.children} детей`:""].filter(Boolean).join(" + ")],["Перелёт",o.flightIncluded==="yes"?"С перелётом":o.flightIncluded==="no"?"Без перелёта":""]].filter(([,v])=>value(v));
 const rows=fields.map(([label,v])=>`<tr><td>${esc(label)}</td><td><strong>${esc(v)}</strong></td></tr>`).join("");
 return `<article class="client-offer strict-offer">
  ${image?`<div class="client-photo-wrap strict-photo"><a class="client-object-link client-photo-link" href="${esc(objectDescriptionUrl(o))}" target="_blank" rel="noopener"><img class="client-photo" src="${esc(image)}" alt="${esc(hotel)}" loading="${i>0?"lazy":"eager"}" onerror="this.closest('.client-photo-wrap').classList.add('image-error');this.style.display='none'"></a><div class="client-photo-fallback">Фото отеля</div></div>`:""}
  <div class="client-offer-body strict-offer-body">
   <div class="strict-offer-number">Вариант ${i+1}</div>
   <div class="client-offer-title-row"><h2>${objectTitleLink(o,hotel)}</h2></div>
   ${o.location?`<div class="client-location">${esc(o.location)}</div>`:""}
   ${descriptionMarkup}${detail}${terms}
   ${rows?`<table class="strict-details"><tbody>${rows}</tbody></table>`:""}
   <div class="client-price-panel strict-price-panel"><div><div class="client-price">${esc(price)}</div><div class="client-price-caption">${o.nights?`<span class="client-price-caption-nights">за ${esc(o.nights)} ночей</span>`:""}</div></div><a class="client-cta" href="${primaryContact()}" target="_blank" rel="noopener">Забронировать</a></div>
  </div>
 </article>`;
}
function cardsScrollOffer(o,i){
 const image=value(o.customImage||o.image||o.sourceImage);
 const hotel=value(o.hotel,"Вариант размещения");
 const price=value(o.price,"Цена уточняется");
 const priceHasCurrency=/₽|руб/i.test(price);
 const priceMarkup=`${esc(price)}${priceHasCurrency?"":' <span class="cards-currency">₽</span>'}`;
 const description=value(o.description);
 const excerpt=description.length>176?description.slice(0,173).trimEnd()+"…":description;
 const detail=o.comment?`<div class="client-manager-note"><strong>Информация от менеджера</strong><div>${esc(o.comment)}</div></div>`:"";
 const cancellation=o.cancellation?`<div class="client-terms"><strong>Условия</strong><div>${esc(o.cancellation)}</div></div>`:"";
 const location=value(o.location);
 const occupants=[o.adults?`${esc(o.adults)} взрослых`:"",o.children?`${esc(o.children)} детей`:""].filter(Boolean).join(" · ");
 const room=value(o.room),meal=value(o.meal),tariff=value(o.tariff);
 const info=[meal?`<div><strong>Питание:</strong> ${esc(meal)}</div>`:"",room?`<div><strong>Номер:</strong> ${esc(room)}</div>`:"",tariff?`<div><strong>Тариф:</strong> ${esc(tariff)}</div>`:"",occupants?`<span class="cards-occupants">👥 ${occupants}</span>`:""].filter(Boolean).join("");
 return `<article class="client-offer cards-scroll-offer">
  <div class="client-photo-wrap cards-photo-wrap">
   ${image?`<a class="client-object-link client-photo-link" href="${esc(objectDescriptionUrl(o))}" target="_blank" rel="noopener"><img class="client-photo" src="${esc(image)}" alt="${esc(hotel)}" loading="${i>0?"lazy":"eager"}" onerror="this.closest('.client-photo-wrap').classList.add('image-error');this.style.display='none'"></a>`:`<div class="client-photo-fallback cards-photo-fallback">Фото отеля</div>`}
   ${location?`<span class="cards-location">📍 ${esc(location)}</span>`:""}
  </div>
  <div class="client-offer-body cards-scroll-body">
   <div class="client-offer-title-row"><h2>${objectTitleLink(o,hotel)}</h2></div>
   ${description?`<p class="client-description cards-description" data-full="${esc(description)}">${esc(excerpt)}</p>${description.length>176?`<button type="button" class="cards-description-toggle" aria-expanded="false">Подробнее ↓</button>`:""}`:""}
   ${detail}${cancellation}
   <div class="client-price-panel cards-price-panel">
    <div class="cards-price-info"><div class="client-price">${priceMarkup}</div>${info?`<div class="cards-offer-details">${info}</div>`:""}</div>
    <a class="client-cta" href="${primaryContact()}" target="_blank" rel="noopener">Забронировать <span aria-hidden="true">↗</span></a>
   </div>
  </div>
 </article>`;
}
function equalizeCardsPricePanels(){
 const panels=[...document.querySelectorAll(".client-template-cards-scroll .cards-price-panel")];
 if(!panels.length)return;
 panels.forEach(panel=>panel.style.height="auto");
 requestAnimationFrame(()=>{
  const maxHeight=Math.max(...panels.map(panel=>panel.getBoundingClientRect().height));
  panels.forEach(panel=>panel.style.height=`${Math.ceil(maxHeight)}px`);
 });
}
let currentCollection=null,currentTemplate="modern",managerMode=false;
const templateLabels={detailed:"Универсальный",simple:"Строгий","cards-scroll":"Карточки с прокруткой",modern:"Современный",tearoff:"Карточки с прокруткой"};
const socialLabels={telegram:"Telegram",whatsapp:"WhatsApp",max:"MAX",vk:"ВКонтакте"};
function initCollectionControls(collection){
 currentCollection=collection;currentTemplate=collection.template||"modern";
 const bar=document.getElementById("collectionControlBar"),menu=document.getElementById("collectionTemplateMenu"),choose=document.getElementById("chooseCollectionTemplate"),socialMenu=document.getElementById("collectionSocialMenu"),socialButton=document.getElementById("sendCollectionSocial"),status=document.getElementById("collectionControlStatus");
 if(!managerMode||!bar)return;bar.hidden=false;
 function closeMenus(){menu.hidden=true;socialMenu.hidden=true;choose.setAttribute("aria-expanded","false");socialButton.setAttribute("aria-expanded","false")}
 function refreshTemplateMenu(){menu.querySelectorAll("[data-template]").forEach(button=>{const active=button.dataset.template===(currentTemplate==="tearoff"?"cards-scroll":currentTemplate);button.setAttribute("aria-checked",String(active));button.classList.toggle("selected",active);button.innerHTML=esc(templateLabels[button.dataset.template])+ (active?' <span class="template-check" aria-hidden="true">✓</span>':"")})}
 refreshTemplateMenu();choose.onclick=()=>{const opening=menu.hidden;closeMenus();menu.hidden=!opening;choose.setAttribute("aria-expanded",String(opening))};
 menu.querySelectorAll("[data-template]").forEach(button=>button.onclick=async()=>{const next=button.dataset.template;closeMenus();if(next===currentTemplate||(currentTemplate==="tearoff"&&next==="cards-scroll"))return;status.textContent="Сохраняем шаблон…";try{const response=await fetch("/api/collections/"+encodeURIComponent(id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({template:next})}),data=await response.json();if(!response.ok)throw Error(data.error||"Не удалось изменить шаблон");currentTemplate=next;currentCollection.template=next;refreshTemplateMenu();render(currentCollection);status.textContent="Шаблон применён"}catch(e){status.textContent=e.message}});
 const socials=Object.entries(socialLabels).filter(([key])=>/^https?:\/\//i.test(String(managerSettings[key]||"")));
 socialMenu.innerHTML=socials.length?socials.map(([key,label])=>`<button type="button" role="menuitem" data-social="${key}">${label}</button>`).join(""):'<div class="collection-social-empty">Социальные сети не указаны в настройках</div>';
 socialButton.onclick=()=>{const opening=socialMenu.hidden;closeMenus();socialMenu.hidden=!opening;socialButton.setAttribute("aria-expanded",String(opening))};
 socialMenu.querySelectorAll("[data-social]").forEach(button=>button.onclick=()=>{closeMenus();const url=new URL("/social-templates",location.origin);url.searchParams.set("collectionId",id);url.searchParams.set("network",button.dataset.social);window.open(url.toString(),"_blank","noopener")});
 document.getElementById("sendCollectionEmail").onclick=()=>openEmailPreview();
 document.addEventListener("click",event=>{if(!bar.contains(event.target))closeMenus()},{once:false});
}
let emailPreviewClient=null;
function closeEmailPreview(){const modal=document.getElementById("emailPreviewModal");if(modal)modal.hidden=true;}
async function openEmailPreview(){
 const modal=document.getElementById("emailPreviewModal"),recipient=document.getElementById("emailPreviewRecipient"),subject=document.getElementById("emailPreviewSubject"),status=document.getElementById("emailPreviewStatus");
 if(!modal||!currentCollection)return;
 status.textContent="";subject.value=value(currentCollection.title,"Подборка отдыха");document.getElementById("emailBodyVisual").innerHTML=defaultEmailBodyHtml();document.getElementById("emailBodySource").value=document.getElementById("emailBodyVisual").innerHTML;setEmailHtmlMode(false);emailPreviewClient=null;
 recipient.value="";recipient.disabled=true;
 modal.hidden=false;
 try{
  if(currentCollection.clientId){const response=await fetch("/api/clients"),clients=await response.json();if(!response.ok)throw Error(clients.error||"Не удалось загрузить клиента");emailPreviewClient=clients.find(c=>c.id===currentCollection.clientId)||null;recipient.value=emailPreviewClient?.email||"";}
  recipient.disabled=false;
  if(!currentCollection.clientId)status.textContent="К этой подборке не привязан клиент. Укажите адрес получателя вручную.";
  else if(!recipient.value)status.textContent="У клиента не указан Email. Введите адрес — он сохранится в карточке клиента.";
  recipient.focus();
 }catch(e){recipient.disabled=false;status.textContent=e.message;}
}
async function saveCollectionClientEmail(showStatus=true){
 const recipient=document.getElementById("emailPreviewRecipient"),status=document.getElementById("emailPreviewStatus"),email=recipient.value.trim();
 if(!email){if(showStatus)status.textContent="Укажите Email получателя.";return false;}
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){if(showStatus)status.textContent="Проверьте Email получателя.";return false;}
 if(!currentCollection?.clientId){if(showStatus)status.textContent="Адрес получателя введён вручную и не привязан к карточке клиента.";return true;}
 if(emailPreviewClient?.email===email){if(showStatus)status.textContent="Email клиента уже актуален.";return true;}
 try{const response=await fetch("/api/clients/"+encodeURIComponent(currentCollection.clientId),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,collectionId:id})}),data=await response.json();if(!response.ok)throw Error(data.error||"Не удалось сохранить Email клиента");emailPreviewClient={...(emailPreviewClient||{}),...data};if(showStatus)status.textContent="Email сохранён в карточке клиента.";return true;}catch(e){if(showStatus)status.textContent=e.message;return false;}
}
function emailSafeHref(raw){
 const href=String(raw||"").trim();
 return /^(?:https?:\/\/|mailto:|tel:)/i.test(href)?esc(href):"#";
}
function emailImageUrl(raw){
 const src=String(raw||"").trim();if(!src||/^(?:data:|blob:)/i.test(src))return "";
 try{const url=new URL(src,location.href);if(!/^https?:$/i.test(url.protocol))return "";url.protocol="https:";return esc(url.href)}catch{return ""}
}
function emailLineText(raw){return esc(raw).replace(/\r\n?|\n/g,"<br>")}
function modernEmailBodyHtml(collection){
 const title=value(collection.title,"Подборка отдыха"),offers=Array.isArray(collection.offers)?collection.offers:[];
 const settings=managerSettings||{},company=value(settings.companyName,"Рюкзак путешествий"),manager=value(settings.name,"Ваш менеджер");
 const logo=emailImageUrl(settings.logo||document.getElementById("clientOrgLogo")?.src);
 const phone=value(settings.phone),email=value(settings.email),website=value(settings.website),address=value(settings.address);
 const phoneHref=phone?`tel:${phone.replace(/[^+\d]/g,"")}`:"";
 const headerContacts=[phone?`<tr><td align="right" style="padding:0 0 5px;font: bold 16px/1.35 Arial,Helvetica,sans-serif;color:#173d65"><a href="${emailSafeHref(phoneHref)}" style="color:#173d65;text-decoration:none">${esc(phone)}</a></td></tr>`:"",email?`<tr><td align="right" style="padding:0;font:13px/1.45 Arial,Helvetica,sans-serif;word-break:break-word"><a href="${emailSafeHref(`mailto:${email}`)}" style="color:#356cae;text-decoration:none">${esc(email)}</a></td></tr>`:""].join("");
 const logoCell=logo?`<img src="${logo}" width="160" alt="${esc(company)}" style="display:block;width:160px;max-width:100%;height:auto;border:0">`:`<div style="font:bold 18px/1.3 Arial,Helvetica,sans-serif;color:#173d65">${esc(company)}</div>`;
 const arrivalRaw=value(offers[0]?.date),arrival=arrivalRaw?arrivalRaw.split(/\s+(?:по|–|—|-)\s+/i)[0].replace(/^с\s*/i,"").trim():"";
 const nights=value(offers[0]?.nights);
 const meta=[arrival?`🗓️ Заезд: ${arrival}`:"",nights?`🌙 ${nights} ночей`:""] .filter(Boolean);
 const metaMarkup=meta.length?`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr><td style="padding:14px 0 0;font:14px/1.5 Arial,Helvetica,sans-serif;color:#dceafa">${meta.map(esc).join("&nbsp;&nbsp;&nbsp;")}</td></tr></table>`:"";
 const managerLinks=[ ["telegram","Telegram"],["whatsapp","WhatsApp"],["max","MAX"],["vk","ВКонтакте"] ].filter(([key])=>/^https?:\/\//i.test(String(settings[key]||""))).map(([key,label])=>{
  const icons={telegram:"telegram.png",whatsapp:"whatsapp.png",max:"max.png",vk:"vk.png"};
  const icon=emailImageUrl(new URL(`/icons/${icons[key]}`,location.origin).href);
  return `<td align="left" style="padding:0 8px 8px 0"><a href="${emailSafeHref(settings[key])}" style="display:inline-block;padding:8px 10px;border:1px solid #e2eaf2;border-radius:8px;background:#f6f9fd;color:#356cae;text-decoration:none;font:12px/1.2 Arial,Helvetica,sans-serif">${icon?`<img src="${icon}" width="16" height="16" alt="" style="display:inline-block;width:16px;height:16px;vertical-align:middle;border:0;margin-right:5px">`:""}${esc(label)}</a></td>`;
 }).join("");
 const managerPhoto=emailImageUrl(settings.managerPhoto);
 const managerBlock=`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse"><tr>${managerPhoto?`<td width="64" valign="top" style="width:64px;padding:0 14px 0 0"><img src="${managerPhoto}" width="52" height="52" alt="${esc(manager)}" style="display:block;width:52px;height:52px;object-fit:cover;border-radius:12px;border:0"></td>`:""}<td valign="top" style="font:14px/1.55 Arial,Helvetica,sans-serif;color:#52657d"><strong style="display:block;font-size:16px;color:#173d65">${esc(manager)}</strong><p style="margin:6px 0 12px">Помогу выбрать подходящий вариант и отвечу на вопросы. Если предложенные варианты не подошли, подберу другие.</p>${managerLinks?`<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${managerLinks}</tr></table>`:""}</td></tr></table>`;
 const offerHtml=offers.map((o,i)=>{
  const hotel=value(o.hotel,"Вариант размещения"),image=emailImageUrl(o.customImage||o.image||o.sourceImage),price=value(o.price,"Цена уточняется"),locationText=value(o.location),description=value(o.description),comment=value(o.comment),terms=value(o.cancellation);
  const descriptionChars=Array.from(description),emailDescription=descriptionChars.length>400?`${descriptionChars.slice(0,399).join("").trimEnd()}…`:description;
  const descriptionHtml=emailDescription?`<div style="margin:14px 0 0;font:14px/1.65 Arial,Helvetica,sans-serif;color:#59677c">${emailLineText(emailDescription)}</div>`:"";
  const detailRows=[ ["Даты",o.date], ["Ночей",o.nights], ["Номер",o.room], ["Питание",o.meal], ["Туристы",[o.adults?`${o.adults} взрослых`:"",o.children?`${o.children} детей`:""].filter(Boolean).join(" + ")], ["Перелёт",o.flightIncluded==="yes"?"С перелётом":o.flightIncluded==="no"?"Без перелёта":""], ["Тариф",o.tariff] ].filter(([,v])=>value(v));
  const rows=detailRows.map(([label,v])=>`<tr><td width="34%" valign="top" style="width:34%;padding:8px 10px 8px 0;border-bottom:1px solid #e8edf4;font:12px/1.45 Arial,Helvetica,sans-serif;color:#71839a">${esc(label)}</td><td valign="top" style="padding:8px 0;border-bottom:1px solid #e8edf4;font:bold 13px/1.45 Arial,Helvetica,sans-serif;color:#263b59;overflow-wrap:anywhere">${emailLineText(value(v))}</td></tr>`).join("");
  const photo=image?`<tr><td style="padding:0"><a href="${emailSafeHref(objectDescriptionUrl(o))}" style="text-decoration:none"><img src="${image}" width="560" alt="${esc(hotel)}" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:14px 14px 0 0"></a></td></tr>`:"";
  const contact=primaryContact();
  return `<tr><td style="padding:0 0 18px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border:1px solid #e2eaf2;border-collapse:separate;border-spacing:0;background:#fff;border-radius:16px;overflow:hidden">${photo}<tr><td style="padding:22px 22px 20px"><div style="font:bold 22px/1.25 Arial,Helvetica,sans-serif;color:#173d65"><a href="${emailSafeHref(objectDescriptionUrl(o))}" style="color:#173d65;text-decoration:none">${esc(hotel)}</a></div>${locationText?`<div style="margin:8px 0 0;font:13px/1.5 Arial,Helvetica,sans-serif;color:#3b78ad">${esc(locationText)}</div>`:""}${descriptionHtml}${comment?`<div style="margin:14px 0 0;padding:13px 14px;background:#fffaf0;border:1px solid #f2e5c7;border-radius:10px;font:13px/1.55 Arial,Helvetica,sans-serif;color:#665532"><strong>Информация от менеджера</strong><br>${emailLineText(comment)}</div>`:""}${terms?`<div style="margin:12px 0 0;padding:12px 14px;background:#f8fafc;border:1px solid #e7edf4;border-radius:10px;font:13px/1.55 Arial,Helvetica,sans-serif;color:#66758a"><strong>Условия</strong><br>${emailLineText(terms)}</div>`:""}${rows?`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;margin:16px 0 0;border-collapse:collapse">${rows}</table>`:""}<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;margin:18px 0 0;border-collapse:collapse"><tr><td style="padding:16px 0 0;border-top:1px solid #e4edf6"><div style="font:bold 28px/1.2 Arial,Helvetica,sans-serif;color:#173d65">${esc(price)}</div><div style="margin:5px 0 14px;font:12px/1.4 Arial,Helvetica,sans-serif;color:#71839a">${o.nights?`за ${esc(o.nights)} ночей · `:""}стоимость всего предложения</div><a href="${emailSafeHref(contact)}" style="display:block;padding:14px 16px;background:#1769b2;border-radius:10px;color:#fff;text-align:center;text-decoration:none;font:bold 14px/1.3 Arial,Helvetica,sans-serif">Забронировать&nbsp; ↗</a></td></tr></table></td></tr></table></td></tr>`;
 }).join("");
 const footerLinks=[ ["vk","ВКонтакте"],["max","MAX"],["telegram","Telegram"],["whatsapp","WhatsApp"] ].filter(([key])=>/^https?:\/\//i.test(String(settings[key]||""))).map(([key,label])=>`<a href="${emailSafeHref(settings[key])}" style="color:#356cae;text-decoration:none;padding:0 6px">${esc(label)}</a>`).join(" · ");
 const web=website?`<a href="${emailSafeHref(website)}" style="color:#356cae;text-decoration:none">${esc(website.replace(/^https?:\/\//i,""))}</a>`:"";
 return `<style type="text/css">@media screen and (max-width:620px){.tb-email-outer{width:100%!important}.tb-email-pad{padding:20px 14px!important}.tb-email-title{font-size:28px!important}.tb-email-header-pad{padding:18px 14px!important}.tb-email-footer-pad{padding:18px 14px!important}}</style><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="center" class="tb-email-outer" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;background:#f4f7fb;color:#263b59;font-family:Arial,Helvetica,sans-serif"><tr><td style="padding:18px 18px 14px" class="tb-email-header-pad"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse"><tr><td valign="middle" style="padding:0 12px 0 0">${logoCell}</td><td valign="middle" align="right" style="width:55%"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse">${headerContacts}</table></td></tr></table></td></tr><tr><td class="tb-email-pad" style="padding:28px 24px;background:#173d65;background-image:linear-gradient(125deg,#183a63,#2d80ae);border-radius:18px 18px 0 0"><div style="font:bold 10px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#c8e6f7">ПОДБОРКА ДЛЯ ВАС</div><div class="tb-email-title" style="margin:12px 0 0;font:bold 32px/1.15 Arial,Helvetica,sans-serif;letter-spacing:-.5px;color:#fff">${esc(title)}</div>${metaMarkup}</td></tr><tr><td style="padding:20px 24px;background:#fff;border-left:1px solid #e4eaf2;border-right:1px solid #e4eaf2">${managerBlock}</td></tr><tr><td style="padding:22px 24px 8px;background:#fff;border-left:1px solid #e4eaf2;border-right:1px solid #e4eaf2"><div style="font:bold 19px/1.3 Arial,Helvetica,sans-serif;color:#173d65">Предложения для вас</div><div style="margin:5px 0 0;font:12px/1.4 Arial,Helvetica,sans-serif;color:#71839a">${offers.length} ${offers.length===1?"вариант":"варианта"}</div></td></tr><tr><td style="padding:16px 16px 4px;background:#fff;border-left:1px solid #e4eaf2;border-right:1px solid #e4eaf2"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse">${offerHtml||`<tr><td style="padding:20px;font:14px Arial,sans-serif;color:#71839a">В подборке пока нет предложений.</td></tr>`}</table></td></tr><tr><td class="tb-email-pad" style="padding:24px;background:#fff;border-left:1px solid #e4eaf2;border-right:1px solid #e4eaf2;border-bottom:1px solid #e4eaf2;text-align:center"><div style="font:bold 19px/1.3 Arial,Helvetica,sans-serif;color:#173d65">Не нашли подходящий вариант?</div><div style="margin:8px 0 16px;font:13px/1.5 Arial,Helvetica,sans-serif;color:#66758a">Напишите менеджеру — подберём отдых под ваши пожелания.</div><a href="${emailSafeHref(primaryContact())}" style="display:inline-block;padding:13px 22px;background:#1769b2;border-radius:10px;color:#fff;text-decoration:none;font:bold 14px/1.2 Arial,Helvetica,sans-serif">Связаться с менеджером</a></td></tr><tr><td class="tb-email-footer-pad" style="padding:22px 18px;text-align:center;font:12px/1.7 Arial,Helvetica,sans-serif;color:#71839a"><div style="font:bold 14px/1.4 Arial,Helvetica,sans-serif;color:#173d65">${esc(company)}</div>${address?`<div>${esc(address)}</div>`:""}${footerLinks?`<div style="margin:7px 0">${footerLinks}</div>`:""}${web?`<div>${web}</div>`:""}</td></tr></table>`;
}
function defaultEmailBodyHtml(){
 if(currentTemplate==="modern"&&currentCollection)return modernEmailBodyHtml(currentCollection);
 const shell=document.querySelector(".client-shell");
 if(!shell)return `<div style="font-family:Arial,sans-serif">${esc(value(currentCollection?.title,"Подборка отдыха"))}</div>`;
 const clone=shell.cloneNode(true);
 const originals=[shell,...shell.querySelectorAll("*")],clones=[clone,...clone.querySelectorAll("*")];
 const styleProps=["display","box-sizing","width","max-width","min-width","height","min-height","max-height","margin","padding","background","background-color","background-image","color","font-family","font-size","font-weight","font-style","line-height","letter-spacing","text-align","text-decoration","text-transform","vertical-align","border","border-top","border-right","border-bottom","border-left","border-radius","box-shadow","flex","flex-direction","flex-wrap","flex-grow","flex-shrink","align-items","align-content","align-self","justify-content","gap","grid-template-columns","grid-template-rows","grid-column","grid-row","position","top","right","bottom","left","overflow","white-space","object-fit","object-position","opacity"];
 originals.forEach((source,index)=>{
  const target=clones[index];if(!target)return;const computed=getComputedStyle(source);
  styleProps.forEach(prop=>{const val=computed.getPropertyValue(prop);if(val)target.style.setProperty(prop,val)});
 });
 clone.querySelector("#collectionControlBar")?.remove();clone.querySelector("#emailPreviewModal")?.remove();
 clone.querySelectorAll(".client-description-toggle,.cards-description-toggle").forEach(button=>button.remove());
 // Email descriptions are limited to 400 characters for every collection template.
 clone.querySelectorAll(".client-description,.cards-description").forEach(paragraph=>{
  const full=String(paragraph.dataset.full||paragraph.textContent||"").trim();
  paragraph.textContent=full.length>400?full.slice(0,399).trimEnd()+"…":full;
  paragraph.removeAttribute("data-full");
 });
 clone.querySelectorAll("#offersPrev,#offersNext").forEach(button=>button.remove());
 clone.querySelectorAll(".client-offers-scroll").forEach(el=>{el.style.display="block";el.style.overflow="visible";el.style.width="100%";el.style.padding="0"});
 clone.querySelectorAll(".cards-scroll-offer").forEach(el=>{el.style.width="100%";el.style.minWidth="0";el.style.maxWidth="100%";el.style.margin="0 0 16px"});
 clone.querySelectorAll("img").forEach(img=>{img.removeAttribute("onerror");img.removeAttribute("loading");const src=img.getAttribute("src");if(!src)return;if(/^data:|^blob:/i.test(src)){img.removeAttribute("src");return;}try{const url=new URL(src,location.origin);if(/^https?:$/i.test(url.protocol)){url.protocol="https:";img.setAttribute("src",url.href);}else img.removeAttribute("src");}catch{img.removeAttribute("src");}});
 clone.querySelectorAll("a[href]").forEach(a=>{const href=a.getAttribute("href");if(href&&!/^(?:https?:|mailto:|tel:|#)/i.test(href)){try{a.setAttribute("href",new URL(href,location.href).href)}catch{}}});
 // Social icons must have explicit HTML dimensions: Gmail often ignores the
 // stylesheet class and otherwise renders the source PNG at its native size.
 clone.querySelectorAll("img.client-social-icon").forEach(img=>{
  img.setAttribute("width","18");img.setAttribute("height","18");
  img.setAttribute("style","display:inline-block;width:18px;height:18px;max-width:18px;max-height:18px;object-fit:contain;border:0;vertical-align:middle");
 });
 const emailMaxWidth=(currentTemplate==="simple"||currentTemplate==="modern")?"600px":"880px";
 clone.style.cssText=`width:100%;max-width:${emailMaxWidth};margin:0 auto;padding:0;background:#fff;color:#263b59;font-family:Arial,sans-serif;box-sizing:border-box`;
 const emailShell=clone.querySelector(".client-shell");if(emailShell){emailShell.style.setProperty("width","100%","important");emailShell.style.setProperty("max-width",(currentTemplate==="simple"||currentTemplate==="modern")?"600px":"880px","important");emailShell.style.setProperty("margin-left","auto","important");emailShell.style.setProperty("margin-right","auto","important");emailShell.style.setProperty("box-sizing","border-box","important");}const emailMain=clone.querySelector(".client-main");if(emailMain){emailMain.style.setProperty("margin-left","auto","important");emailMain.style.setProperty("margin-right","auto","important");emailMain.style.setProperty("width","100%","important");}
 if(currentTemplate==="simple"){
  // The template contains inline fixed widths (often 600px) copied from the
  // live page. Those widths keep cards/photo/body pinned to the left in the
  // email editor even when the outer shell is centered. Normalize the whole
  // strict layout to a single centered, fluid column in the email HTML.
  clone.style.setProperty("display","block","important");
  clone.style.setProperty("width","100%","important");
  clone.style.setProperty("max-width","600px","important");
  clone.style.setProperty("margin-left","auto","important");
  clone.style.setProperty("margin-right","auto","important");
  clone.style.setProperty("float","none","important");
  clone.style.setProperty("position","relative","important");
  clone.style.setProperty("box-sizing","border-box","important");
  const strictShell=clone.querySelector(".client-shell");if(strictShell){strictShell.style.setProperty("display","block","important");strictShell.style.setProperty("width","100%","important");strictShell.style.setProperty("max-width","600px","important");strictShell.style.setProperty("margin","0 auto","important");strictShell.style.setProperty("padding","12px 0 22px","important");strictShell.style.setProperty("float","none","important");strictShell.style.setProperty("box-sizing","border-box","important");}
  const strictHeader=clone.querySelector(".client-header");if(strictHeader){strictHeader.style.setProperty("width","100%","important");strictHeader.style.setProperty("max-width","600px","important");strictHeader.style.setProperty("margin","0 auto","important");strictHeader.style.setProperty("box-sizing","border-box","important");}
  const strictMain=clone.querySelector(".client-main");if(strictMain){strictMain.style.setProperty("display","block","important");strictMain.style.setProperty("width","100%","important");strictMain.style.setProperty("max-width","600px","important");strictMain.style.setProperty("margin","24px auto","important");strictMain.style.setProperty("padding","0","important");strictMain.style.setProperty("overflow","visible","important");strictMain.style.setProperty("box-sizing","border-box","important");}
  clone.querySelectorAll(".client-hero,.client-hero h1,.client-hero-meta,.client-offers,.strict-offer,.strict-offer-body,.strict-photo,.strict-photo .client-photo-link,.strict-photo .client-photo,.client-manager-intro,.client-footer").forEach(el=>{
   el.style.setProperty("width","100%","important");
   el.style.setProperty("max-width","100%","important");
   el.style.setProperty("margin-left","auto","important");
   el.style.setProperty("margin-right","auto","important");
   el.style.setProperty("box-sizing","border-box","important");
  });
  // Keep the offer information (not its photo) and footer at the same 600px
  // centered width as the strict email header. Explicit inline styles survive
  // HTML email preview/editor serialization where stylesheet rules may not.
  clone.querySelectorAll(".strict-offer").forEach(el=>{el.style.setProperty("width","100%","important");el.style.setProperty("max-width","600px","important");});
  clone.querySelectorAll(".strict-offer-body").forEach(el=>{el.style.setProperty("width","100%","important");el.style.setProperty("max-width","600px","important");el.style.setProperty("padding","24px 32px 28px","important");el.style.setProperty("box-sizing","border-box","important");});
  const strictFooter=clone.querySelector(".client-footer");if(strictFooter){strictFooter.style.setProperty("width","100%","important");strictFooter.style.setProperty("max-width","600px","important");strictFooter.style.setProperty("margin-left","auto","important");strictFooter.style.setProperty("margin-right","auto","important");strictFooter.style.setProperty("box-sizing","border-box","important");}
  const strictManager=clone.querySelector(".client-manager-intro");if(strictManager){strictManager.style.setProperty("width","100%","important");strictManager.style.setProperty("max-width","600px","important");strictManager.style.setProperty("margin-left","auto","important");strictManager.style.setProperty("margin-right","auto","important");strictManager.style.setProperty("box-sizing","border-box","important");}
  const strictOffers=clone.querySelector(".client-offers");if(strictOffers){strictOffers.style.setProperty("display","block","important");strictOffers.style.setProperty("padding","0","important");strictOffers.style.setProperty("margin","0 auto","important");}
  clone.querySelectorAll(".strict-offer").forEach(card=>{card.style.setProperty("display","block","important");card.style.setProperty("margin-top","0","important");card.style.setProperty("margin-bottom","0","important");card.style.setProperty("box-sizing","border-box","important");});
  clone.querySelectorAll(".strict-photo .client-photo,.strict-photo .client-photo-link").forEach(el=>{el.style.setProperty("display","block","important");el.style.setProperty("width","100%","important");el.style.setProperty("height","auto","important");el.style.setProperty("max-width","100%","important");});
  clone.querySelectorAll(".strict-photo .client-photo").forEach(el=>{el.style.setProperty("object-fit","cover","important");});
 }
 if(currentTemplate==="modern"){
  const brand=clone.querySelector(".client-brand"),contacts=clone.querySelector(".client-header-contacts");
  if(brand)brand.style.marginLeft="12px";
  if(contacts)contacts.style.marginRight="12px";
 }
 // Strict template email compatibility: use table-based layout instead of
 // flexbox. Gmail/Outlook may ignore flex sizing and margins copied from CSS.
 if(currentTemplate==="simple"){
  const header=clone.querySelector(".client-header");
  if(header){
   const brand=header.querySelector(".client-brand"),logo=brand?.querySelector("img"),contacts=header.querySelector(".client-header-contacts"),links=[...(contacts?.querySelectorAll("a")||[])];
   const logoHtml=brand?brand.outerHTML:"";
   const contactRows=links.map(a=>{const link=a.cloneNode(true);link.setAttribute("style","display:inline-block;color:#14243d;text-decoration:none;font:14px/1.45 Arial,Helvetica,sans-serif;white-space:normal;overflow-wrap:anywhere");return `<tr><td align="right" style="padding:0 0 5px;text-align:right;white-space:normal;overflow-wrap:anywhere;font:14px/1.45 Arial,Helvetica,sans-serif;color:#14243d">${link.outerHTML}</td></tr>`}).join("");
   header.innerHTML=`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed"><tr><td class="strict-header-brand-cell" width="40%" valign="middle" align="left" style="width:40%;padding:8px 8px 18px 0;vertical-align:middle;box-sizing:border-box">${logoHtml}</td><td class="strict-header-contact-cell" width="60%" valign="middle" align="right" style="width:60%;padding:8px 0 18px 8px;vertical-align:middle;box-sizing:border-box"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse">${contactRows}</table></td></tr></table>`;
   header.style.cssText="display:block;width:100%;max-width:600px;margin:0 auto;padding:0 0 12px;border-bottom:1px solid #d9dce1;box-sizing:border-box";
   const newLogo=header.querySelector(".client-brand img");if(newLogo)newLogo.style.cssText="display:block;width:150px;max-width:100%;height:auto;border:0";
  }
  clone.querySelectorAll(".client-offer-title-row").forEach(row=>{row.style.cssText="display:block;width:100%;margin:0;padding:0;clear:both";const h=row.querySelector("h2");if(h)h.style.cssText="display:block;margin:0 0 7px;padding:0;font:21px/1.35 Georgia,'Times New Roman',serif;color:#14243d;white-space:normal;overflow-wrap:anywhere";});
  clone.querySelectorAll(".client-offer-title-row h2 a").forEach(a=>{a.style.setProperty("display","inline","important");a.style.setProperty("max-width","100%","important");a.style.setProperty("white-space","normal","important");a.style.setProperty("overflow-wrap","anywhere","important");});
  clone.querySelectorAll(".client-location").forEach(el=>{el.style.cssText="display:block;width:100%;max-width:100%;clear:both;margin:0 0 12px;padding:0;font:13px/1.5 Arial,Helvetica,sans-serif;color:#666d78;text-decoration:none;white-space:normal;overflow-wrap:anywhere;word-break:break-word;box-sizing:border-box";});
  clone.querySelectorAll(".client-hero h1").forEach(h=>{h.style.setProperty("display","block","important");h.style.setProperty("width","100%","important");h.style.setProperty("max-width","100%","important");h.style.setProperty("white-space","normal","important");h.style.setProperty("overflow-wrap","anywhere","important");h.style.setProperty("word-break","break-word","important");h.style.setProperty("box-sizing","border-box","important");});
  clone.querySelectorAll(".client-hero").forEach(hero=>{hero.style.setProperty("width","100%","important");hero.style.setProperty("max-width","100%","important");hero.style.setProperty("box-sizing","border-box","important");hero.style.setProperty("overflow","hidden","important");});
  clone.querySelectorAll(".client-location").forEach(el=>el.style.cssText="display:block;width:100%;max-width:100%;clear:both;margin:0 0 12px;padding:0;font:13px/1.5 Arial,Helvetica,sans-serif;color:#666d78;text-decoration:none;white-space:normal;overflow-wrap:anywhere;word-break:break-word;box-sizing:border-box");
  clone.querySelectorAll(".strict-details").forEach(table=>{table.style.cssText="width:100%;max-width:100%;table-layout:fixed;border-collapse:collapse;overflow-wrap:anywhere;word-break:break-word";table.querySelectorAll("td").forEach((td,index)=>{td.style.setProperty("max-width","100%","important");td.style.setProperty("overflow-wrap","anywhere","important");td.style.setProperty("word-break","break-word","important");td.style.setProperty("box-sizing","border-box","important");td.style.setProperty("width",index%2===0?"30%":"70%","important");});});
  clone.querySelectorAll(".strict-price-panel").forEach(panel=>{
   const priceBox=panel.firstElementChild,cta=panel.querySelector(".client-cta");if(!priceBox||!cta)return;
   const priceHtml=priceBox.outerHTML.replace(/ style="[^"]*"/g,'');
   const ctaHtml=cta.outerHTML.replace(/ style="[^"]*"/g,'');
   panel.innerHTML=`<table class="strict-price-layout" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed"><tr><td class="strict-price-info-cell" width="60%" valign="middle" align="left" style="width:60%;max-width:100%;padding:14px 12px 12px 0;vertical-align:middle;text-align:left;overflow-wrap:anywhere;word-break:break-word;box-sizing:border-box">${priceHtml}</td><td class="strict-price-cta-cell" width="40%" valign="middle" align="right" style="width:40%;max-width:100%;padding:14px 0 12px 8px;vertical-align:middle;text-align:right;box-sizing:border-box">${ctaHtml}</td></tr></table>`;
   panel.style.cssText="display:block;width:100%;max-width:100%;margin:16px 0 0;padding:0;border-top:1px solid #d9dce1;background:#fff;box-shadow:none;box-sizing:border-box;overflow:hidden";
   const button=panel.querySelector(".client-cta");if(button){button.textContent="Забронировать";button.style.cssText="display:inline-block;width:auto;max-width:100%;padding:13px 14px;background:#14243d;border:1px solid #14243d;color:#fff;text-decoration:none;font:700 14px/1.35 Arial,Helvetica,sans-serif;text-align:center;white-space:nowrap;overflow-wrap:normal;word-break:normal;box-sizing:border-box";}
  });
  const manager=clone.querySelector(".client-manager-intro");if(manager){manager.style.cssText="display:block;width:100%;max-width:600px;margin:0;padding:18px 12px;background:#f3f4f6;border-top:2px solid #14243d;box-sizing:border-box;overflow:hidden";const avatar=manager.querySelector(".client-manager-avatar");if(avatar)avatar.style.display="none";const copy=manager.querySelector(".client-manager-copy");if(copy)copy.style.cssText="display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box";const buttons=manager.querySelector(".client-manager-buttons");if(buttons){const links=[...buttons.querySelectorAll("a")].filter(a=>!a.hidden&&/^https?:\/\//i.test(a.getAttribute("href")||""));if(links.length){const cells=links.map((a,index)=>{const link=a.cloneNode(true);link.setAttribute("style","display:inline-block;margin:0;padding:0;background:transparent;color:#14243d;text-decoration:none;font:700 11px/1.35 Arial,Helvetica,sans-serif;white-space:nowrap;vertical-align:middle");link.querySelectorAll("img").forEach(img=>img.setAttribute("style","display:inline-block;width:16px;height:16px;max-width:16px;max-height:16px;object-fit:contain;border:0;vertical-align:middle;margin-right:3px"));return `<td align="left" valign="middle" style="padding:3px ${index===links.length-1?0:6}px 3px 0;white-space:nowrap;text-align:left;vertical-align:middle">${link.outerHTML}</td>`;}).join("");buttons.innerHTML=`<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left" width="100%" style="width:100%;max-width:100%;table-layout:auto;border-collapse:collapse;margin:8px 0 0"><tr>${cells}</tr></table>`;}else buttons.remove();buttons.style.cssText="display:block;width:100%;max-width:100%;margin:8px 0 0;padding:0;box-sizing:border-box;overflow:hidden";}}
  const footer=clone.querySelector(".client-footer");if(footer){footer.style.cssText="display:block;visibility:visible;width:100%;max-width:600px;margin:0 auto;padding:22px 8px 24px;text-align:center;color:#666d78;font:12px/1.8 Arial,Helvetica,sans-serif;box-sizing:border-box";footer.querySelectorAll("div").forEach(el=>{el.style.setProperty("display","block","important");el.style.setProperty("visibility","visible","important");el.style.setProperty("max-width","100%","important")});}
  const main=clone.querySelector(".client-main");if(main){main.style.setProperty("overflow","visible","important");main.style.setProperty("width","100%","important");main.style.setProperty("max-width","600px","important");main.style.setProperty("box-sizing","border-box","important");}
  // Remove fixed-width remnants copied from the live page. They are the source
  // of horizontal clipping in Gmail mobile; retain small fixed image/icon sizes.
  clone.querySelectorAll(".client-template-simple *").forEach(el=>{
   el.style.setProperty("box-sizing","border-box","important");
   el.style.setProperty("min-width","0","important");
   el.style.setProperty("overflow-wrap","anywhere","important");
   el.style.setProperty("max-width","100%","important");
   const width=el.style.getPropertyValue("width").trim();
   const match=width.match(/^(\d+(?:\.\d+)?)px$/i);
   if(match&&Number(match[1])>160)el.style.setProperty("width","100%","important");
   const attrWidth=Number.parseFloat(el.getAttribute("width")||"");
   if(Number.isFinite(attrWidth)&&attrWidth>160)el.setAttribute("width","100%");
   el.style.setProperty("min-width","0","important");
   if(el.style.getPropertyValue("max-width")==="none")el.style.setProperty("max-width","100%","important");
  });
 }
 // Modern template: use email-safe tables for the price panel and manager socials.
 // Some mobile mail clients ignore flex/grid and retain fixed heights from page CSS.
 if(currentTemplate==="modern"){
  // Normalize the Modern email to the same 600px canvas at every level.
  // Computed desktop styles copied above can contain wide pixel dimensions;
  // email clients may ignore max-width on nested divs and expand the message.
  clone.style.cssText="display:block;width:100%;max-width:600px;margin:0 auto;padding:0;background:#fff;color:#263b59;font-family:Arial,Helvetica,sans-serif;box-sizing:border-box";
  const modernShell=clone.querySelector(".client-shell");if(modernShell)modernShell.style.cssText="display:block;width:100%;max-width:600px;margin:0 auto;padding:12px 0 22px;box-sizing:border-box";
  const modernMain=clone.querySelector(".client-main");if(modernMain)modernMain.style.cssText="display:block;width:100%;max-width:600px;margin:0 auto;padding:0;background:#fff;border-radius:0;box-sizing:border-box;overflow:hidden";
  const modernHeader=clone.querySelector(".client-header"),modernBrand=modernHeader?.querySelector(".client-brand"),modernLogo=modernBrand?.querySelector("img"),modernContacts=modernHeader?.querySelector(".client-header-contacts");
  if(modernHeader){
   if(modernLogo){modernLogo.setAttribute("width","168");modernLogo.removeAttribute("height");modernLogo.style.cssText="display:block;width:168px;max-width:100%;height:auto;border:0";}
   if(modernBrand)modernBrand.style.cssText="display:block;width:168px;max-width:40%;margin:0;padding:0;box-sizing:border-box";
   if(modernContacts){modernContacts.style.cssText="display:block;width:100%;max-width:100%;margin:0;padding:0;text-align:right;font:14px/1.4 Arial,Helvetica,sans-serif;white-space:normal;overflow-wrap:anywhere;word-break:break-word;box-sizing:border-box";modernContacts.querySelectorAll("a").forEach(a=>a.style.cssText="display:block;width:100%;max-width:100%;margin:2px 0;color:#176d9f;text-decoration:none;font:14px/1.4 Arial,Helvetica,sans-serif;white-space:normal;overflow-wrap:anywhere;word-break:break-word;box-sizing:border-box");}
   modernHeader.innerHTML=`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:600px;border-collapse:collapse;table-layout:fixed"><tr><td width="42%" valign="middle" align="left" style="width:42%;padding:8px 8px 18px 0;vertical-align:middle;box-sizing:border-box">${modernBrand?.outerHTML||""}</td><td width="58%" valign="middle" align="right" style="width:58%;padding:8px 0 18px 8px;vertical-align:middle;box-sizing:border-box">${modernContacts?.outerHTML||""}</td></tr></table>`;
   modernHeader.style.cssText="display:block;width:100%;max-width:600px;margin:0 auto;padding:0 12px 12px;border-bottom:1px solid #e1e7ef;box-sizing:border-box";
  }
  clone.querySelectorAll(".client-hero,.client-manager-intro,.client-offers-heading,.client-offers,.client-offer,.client-offer-body,.client-last-cta,.client-footer").forEach(el=>{el.style.setProperty("width","100%","important");el.style.setProperty("max-width","600px","important");el.style.setProperty("min-width","0","important");el.style.setProperty("box-sizing","border-box","important");});
  clone.querySelectorAll(".client-photo-wrap,.client-photo-wrap a,.client-photo").forEach(el=>{el.style.setProperty("display","block","important");el.style.setProperty("width","100%","important");el.style.setProperty("max-width","600px","important");el.style.setProperty("height","auto","important");el.style.setProperty("box-sizing","border-box","important");});
  clone.querySelectorAll("img").forEach(img=>{if(img===modernLogo)return;if(img.classList.contains("client-social-icon"))return;img.style.setProperty("max-width","100%","important");img.style.setProperty("height","auto","important");});
  clone.querySelectorAll(".client-price-panel").forEach(panel=>{
   const priceBlock=panel.querySelector(".client-price-block"),cta=panel.querySelector(".client-cta");if(!priceBlock||!cta)return;
   const price=priceBlock.querySelector(".client-price"),caption=priceBlock.querySelector(".client-price-caption");
   if(price)price.style.cssText="display:block;margin:0;color:#173b5b;font:700 30px/1.15 Arial,Helvetica,sans-serif;white-space:nowrap;overflow-wrap:normal;word-break:normal;box-sizing:border-box";
   if(caption)caption.style.cssText="display:block;margin:8px 0 0;color:#657487;font:14px/1.45 Arial,Helvetica,sans-serif;white-space:normal;overflow-wrap:anywhere;word-break:break-word;box-sizing:border-box";
   const priceHtml=priceBlock.outerHTML;
   const button=cta.cloneNode(true);button.textContent="Забронировать";
   button.style.cssText="display:block;width:100%;max-width:100%;height:auto;min-height:0;margin:0;padding:18px 12px;background:#206eb0;border:1px solid #206eb0;border-radius:12px;color:#fff;text-decoration:none;font:700 15px/1.35 Arial,Helvetica,sans-serif;text-align:center;white-space:normal;overflow-wrap:anywhere;word-break:normal;box-sizing:border-box";
   panel.innerHTML=`<table class="modern-email-price-layout" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed"><tr><td class="modern-email-price-cell" width="50%" valign="middle" align="center" style="width:50%;max-width:100%;padding:14px 8px 14px 0;vertical-align:middle;text-align:center;box-sizing:border-box;overflow-wrap:anywhere">${priceHtml}</td><td class="modern-email-cta-cell" width="50%" valign="stretch" align="center" style="width:50%;max-width:100%;padding:14px 0 14px 8px;vertical-align:middle;text-align:center;box-sizing:border-box">${button.outerHTML}</td></tr></table>`;
   panel.style.cssText="display:block;width:100%;max-width:100%;min-width:0;height:auto;min-height:0;margin:16px 0 0;padding:0;background:#f1f7fc;border:1px solid #dce8f2;border-radius:16px;box-shadow:none;box-sizing:border-box;overflow:hidden";
  });
  const manager=clone.querySelector(".client-manager-intro"),socials=manager?.querySelector(".client-manager-buttons");
  if(socials){
   const links=[...socials.querySelectorAll("a")].filter(a=>!a.hidden&&/^https?:\/\//i.test(a.getAttribute("href")||""));
   if(links.length){const cells=links.map((a,i)=>{const link=a.cloneNode(true);link.style.cssText="display:inline-block;max-width:100%;margin:0;padding:7px 5px;background:#f4f8fc;border:1px solid #e0eaf2;border-radius:20px;color:#176d9f;text-decoration:none;font:700 12px/1.25 Arial,Helvetica,sans-serif;text-align:center;white-space:normal;overflow-wrap:anywhere;word-break:break-word;box-sizing:border-box";link.querySelectorAll("img").forEach(img=>img.style.cssText="display:inline-block;width:20px;height:20px;max-width:20px;max-height:20px;object-fit:contain;border:0;vertical-align:middle;margin-right:3px");return `<td class="modern-email-social-cell" width="${Math.floor(100/links.length)}%" valign="middle" align="center" style="width:${Math.floor(100/links.length)}%;padding:3px 3px;vertical-align:middle;text-align:center;box-sizing:border-box;overflow-wrap:anywhere">${link.outerHTML}</td>`;}).join("");socials.innerHTML=`<table class="modern-email-social-layout" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:100%;table-layout:fixed;border-collapse:collapse;margin:8px 0"><tr>${cells}</tr></table>`;}
   socials.style.cssText="display:block;width:100%;max-width:100%;margin:8px 0 0;padding:0;box-sizing:border-box;overflow:visible";
  }
 }
 // Email social/contact links: keep them in one email-safe table row for every template.
 const emailFooter=clone.querySelector(".client-footer");
 if(emailFooter){
  emailFooter.style.setProperty("display","block","important");
  emailFooter.style.setProperty("visibility","visible","important");
  const linkContainer=emailFooter.querySelector(".client-footer-links");
  if(linkContainer){
   const anchors=[...linkContainer.querySelectorAll("a")].filter(a=>!a.hidden&&/^https?:\/\//i.test(a.getAttribute("href")||""));
   linkContainer.querySelectorAll("a").forEach(a=>{if(a.hidden||!/^https?:\/\//i.test(a.getAttribute("href")||""))a.remove();});
   if(anchors.length){
    const cells=anchors.map(a=>{
     const link=a.cloneNode(true);
     link.setAttribute("style","display:inline-block;max-width:100%;white-space:normal;overflow-wrap:anywhere;word-break:break-word;margin:0;color:#14243d;text-decoration:none;font:12px/1.7 Arial,Helvetica,sans-serif;box-sizing:border-box");
     link.querySelectorAll("span").forEach(span=>span.setAttribute("style","display:inline!important;visibility:visible!important;max-width:100%;white-space:normal;overflow-wrap:anywhere;word-break:break-word;font:12px/1.7 Arial,Helvetica,sans-serif;vertical-align:middle"));
     link.querySelectorAll("img").forEach(img=>{
      img.setAttribute("width","18");img.setAttribute("height","18");
      img.setAttribute("style","display:inline-block;width:18px;height:18px;max-width:18px;max-height:18px;object-fit:contain;border:0;vertical-align:middle");
     });
     return `<td class="strict-footer-social-cell" width="${Math.floor(100/anchors.length)}%" valign="middle" align="center" style="width:${Math.floor(100/anchors.length)}%;padding:0 2px;white-space:normal;text-align:center;vertical-align:middle;overflow:hidden;box-sizing:border-box">${link.outerHTML}</td>`;
    }).join("");
    linkContainer.innerHTML=`<table class="strict-footer-socials-layout" role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="width:100%;max-width:100%;border-collapse:collapse;margin:6px auto;table-layout:fixed"><tr>${cells}</tr></table>`;
   }
   linkContainer.style.cssText="display:block;margin:6px 0;text-align:center";
  }
 }

 const rootClass=esc(document.body.className||"client-page");
 const outerMax=(currentTemplate==="simple"||currentTemplate==="modern")?"600px":"880px";
 const emailStyle=(currentTemplate==="simple"||currentTemplate==="modern")?`<style>
@media only screen and (max-width:600px){
 .email-outer-canvas{width:100%!important;max-width:600px!important}
 .client-template-simple,.client-template-simple .client-shell,.client-template-simple .client-main,.client-template-simple .strict-offer,.client-template-simple .strict-offer-body,.client-template-simple .client-manager-intro,.client-template-simple .client-footer{width:100%!important;max-width:100%!important;min-width:0!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important}
 .client-template-simple .client-shell{padding:0!important}
 .client-template-simple .client-header{width:100%!important;max-width:100%!important;padding:10px 12px!important;box-sizing:border-box!important}
 .client-template-simple .client-header table,.client-template-simple .client-header tbody,.client-template-simple .client-header tr{display:block!important;width:100%!important;max-width:100%!important;table-layout:fixed!important}
 .client-template-simple .strict-header-brand-cell,.client-template-simple .strict-header-contact-cell{display:block!important;width:100%!important;max-width:100%!important;padding:5px 0!important;text-align:left!important;box-sizing:border-box!important}
 .client-template-simple .strict-header-brand-cell img{width:125px!important;max-width:100%!important;height:auto!important}
 .client-template-simple .strict-header-contact-cell,.client-template-simple .strict-header-contact-cell table,.client-template-simple .strict-header-contact-cell td{text-align:left!important;width:100%!important;max-width:100%!important}
 .client-template-simple .client-header-contacts,.client-template-simple .client-header-contacts a{font-size:12px!important;line-height:1.35!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
 .client-template-simple .client-hero{width:100%!important;max-width:100%!important;padding:18px 14px!important;box-sizing:border-box!important}
 .client-template-simple .client-hero h1{width:100%!important;max-width:100%!important;font-size:23px!important;line-height:1.2!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
 .client-template-simple .client-hero-meta{display:block!important;width:100%!important;max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important}
 .client-template-simple .client-hero-meta>*{display:inline-block!important;max-width:100%!important;margin:0 8px 5px 0!important;white-space:normal!important}
 .client-template-simple .client-offers-heading{margin:0 14px!important}
 .client-template-simple .strict-offer{width:100%!important;max-width:100%!important;min-width:0!important}
 .client-template-simple .strict-photo,.client-template-simple .strict-photo a,.client-template-simple .strict-photo img{display:block!important;width:100%!important;max-width:100%!important;height:auto!important}
 .client-template-simple .strict-offer-body{width:100%!important;max-width:100%!important;min-width:0!important;padding:18px 14px 22px!important;overflow-wrap:anywhere!important;word-break:break-word!important}
 .client-template-simple .client-offer-title-row,.client-template-simple .client-offer-title-row h2,.client-template-simple .client-offer-title-row a,.client-template-simple .client-location,.client-template-simple .strict-description,.client-template-simple .strict-comment{width:100%!important;max-width:100%!important;min-width:0!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;box-sizing:border-box!important}
 .client-template-simple .strict-details{width:100%!important;max-width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}
 .client-template-simple .strict-details tr{width:100%!important;max-width:100%!important}
 .client-template-simple .strict-details td{max-width:100%!important;padding:7px 4px 7px 0!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;box-sizing:border-box!important}
 .client-template-simple .strict-details td:first-child{width:32%!important;padding-right:8px!important}
 .client-template-simple .strict-details td+td{width:68%!important}
 .client-template-simple .strict-price-panel{width:100%!important;max-width:100%!important;min-width:0!important;overflow:hidden!important;box-sizing:border-box!important}
 .client-template-simple .strict-price-layout,.client-template-simple .strict-price-layout tbody,.client-template-simple .strict-price-layout tr{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;table-layout:auto!important}
 .client-template-simple .strict-price-info-cell,.client-template-simple .strict-price-cta-cell{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;padding:10px 0!important;text-align:left!important;box-sizing:border-box!important}
 .client-template-simple .strict-price-cta-cell{text-align:left!important}
 .client-template-simple .strict-price-panel .client-cta{display:block!important;width:100%!important;max-width:100%!important;padding:13px 12px!important;text-align:center!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;box-sizing:border-box!important}
 .client-template-simple .client-price-caption-label,.client-template-simple .client-price-caption-nights{display:block!important;width:100%!important;max-width:100%!important}
 .client-template-simple .client-price-caption-separator{display:none!important}
 .client-template-simple .client-manager-intro{display:block!important;width:100%!important;max-width:100%!important;padding:18px 14px!important;box-sizing:border-box!important;overflow:hidden!important}
 .client-template-simple .client-manager-copy{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
 .client-template-simple .client-manager-buttons{display:block!important;width:100%!important;max-width:100%!important;overflow:hidden!important}
 .client-template-simple .strict-footer-socials-layout{display:table!important;width:100%!important;max-width:100%!important;table-layout:fixed!important}
 .client-template-simple .strict-footer-socials-layout tr{display:table-row!important;width:100%!important;max-width:100%!important}
 .client-template-simple .strict-footer-social-cell{display:table-cell!important;width:auto!important;max-width:100%!important;padding:3px 2px!important;text-align:center!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;box-sizing:border-box!important}
 .client-template-simple .strict-footer-social-cell a{display:inline-block!important;max-width:100%!important;font-size:11px!important;line-height:1.25!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
 .client-template-simple .strict-footer-social-cell img,.client-template-simple .client-social-icon{display:inline-block!important;width:16px!important;height:16px!important;max-width:16px!important;max-height:16px!important}
 .client-template-simple .client-footer{width:100%!important;max-width:100%!important;padding:18px 12px 22px!important;box-sizing:border-box!important}
 .client-template-simple .client-footer *{max-width:100%!important;overflow-wrap:anywhere!important;word-break:break-word!important;box-sizing:border-box!important}
}
@media only screen and (max-width:600px){
 .client-template-modern,.client-template-modern .client-shell,.client-template-modern .client-main,.client-template-modern .client-hero,.client-template-modern .client-manager-intro,.client-template-modern .client-offers,.client-template-modern .client-offer,.client-template-modern .client-offer-body,.client-template-modern .client-last-cta,.client-template-modern .client-footer{width:100%!important;max-width:100%!important;min-width:0!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important}
 .client-template-modern .client-shell{padding:0!important}
 .client-template-modern .client-main{border-radius:0!important;overflow:visible!important}
 .client-template-modern .client-header{display:block!important;width:100%!important;max-width:100%!important;padding:12px 14px!important;box-sizing:border-box!important}
 .client-template-modern .client-brand{display:block!important;width:auto!important;max-width:100%!important;margin:0 0 10px!important}
 .client-template-modern .client-brand img{display:block!important;width:125px!important;max-width:100%!important;height:auto!important}
 .client-template-modern .client-header-contacts{display:block!important;width:100%!important;max-width:100%!important;text-align:left!important;font-size:12px!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
 .client-template-modern .client-header-contacts a{display:block!important;max-width:100%!important;margin:3px 0!important;font-size:12px!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
 .client-template-modern .client-header-contacts .client-phone{font-size:14px!important}
 .client-template-modern .client-hero{padding:22px 16px!important;border-radius:0!important;overflow:hidden!important}
 .client-template-modern .client-hero h1{width:100%!important;max-width:100%!important;margin:12px 0 0!important;font-size:25px!important;line-height:1.2!important;letter-spacing:normal!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
 .client-template-modern .client-hero-meta{display:block!important;width:100%!important;max-width:100%!important;font-size:13px!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
 .client-template-modern .client-hero-meta>*{display:inline-block!important;max-width:100%!important;margin:0 8px 5px 0!important;white-space:normal!important}
 .client-template-modern .client-manager-intro{display:block!important;padding:18px 14px!important;overflow:visible!important}
 .client-template-modern .client-manager-avatar{margin:0 0 10px!important}
 .client-template-modern .client-manager-copy{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important}
 .client-template-modern .client-manager-copy>strong,.client-template-modern .client-manager-copy>span,.client-template-modern .client-manager-copy p{display:block!important;width:100%!important;max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
 .client-template-modern .client-manager-buttons{display:flex!important;width:100%!important;max-width:100%!important;flex-wrap:wrap!important;gap:6px!important;overflow:visible!important}
 .client-template-modern .client-manager-buttons a{display:inline-block!important;max-width:100%!important;padding:7px 10px!important;font-size:11px!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;box-sizing:border-box!important}
 .client-template-modern .client-offers-heading{display:block!important;width:auto!important;max-width:100%!important;margin:0 14px!important;padding:18px 0 12px!important}
 .client-template-modern .client-offers-heading h2{font-size:19px!important;white-space:normal!important;overflow-wrap:anywhere!important}
 .client-template-modern .client-offers-heading>span{display:inline-block!important;margin-top:6px!important;white-space:normal!important}
 .client-template-modern .client-offers{display:block!important;padding:0 10px 20px!important}
 .client-template-modern .client-offer{display:block!important;margin:0 0 16px!important;border-radius:12px!important;overflow:hidden!important;transform:none!important}
 .client-template-modern .client-photo-wrap,.client-template-modern .client-photo-wrap a{display:block!important;width:100%!important;max-width:100%!important}
 .client-template-modern .client-photo{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important}
 .client-template-modern .client-offer-body{display:block!important;padding:16px 14px!important;overflow:visible!important}
 .client-template-modern .client-offer-title-row{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important}
 .client-template-modern .client-offer-title-row h2,.client-template-modern .client-offer-title-row h2 a{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;font-size:19px!important;line-height:1.25!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
 .client-template-modern .client-offer-mark{display:none!important}
 .client-template-modern .client-location,.client-template-modern .client-description,.client-template-modern .client-manager-note,.client-template-modern .client-terms{width:100%!important;max-width:100%!important;min-width:0!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;box-sizing:border-box!important}
 .client-template-modern .client-chips{display:flex!important;width:100%!important;max-width:100%!important;flex-wrap:wrap!important;gap:5px!important}
 .client-template-modern .client-chip{max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;box-sizing:border-box!important}
 .client-template-modern .client-price-panel{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;margin-top:16px!important;padding:14px!important;text-align:left!important;box-sizing:border-box!important;overflow:visible!important}
 .client-template-modern .client-price-block,.client-template-modern .client-price-caption{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
 .client-template-modern .client-price{font-size:25px!important}
 .client-template-modern .client-cta{display:block!important;width:100%!important;max-width:100%!important;margin:12px 0 0!important;padding:12px 10px!important;text-align:center!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;box-sizing:border-box!important}
 .client-template-modern .client-last-cta{padding:20px 14px!important;text-align:left!important}
 .client-template-modern .client-last-cta h2,.client-template-modern .client-last-cta p{width:100%!important;max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
 .client-template-modern .client-last-cta>a{display:block!important;width:100%!important;max-width:100%!important;text-align:center!important;box-sizing:border-box!important}
 .client-template-modern .client-footer{padding:18px 12px 22px!important;text-align:center!important}
 .client-template-modern .client-footer *{max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;box-sizing:border-box!important}
 .client-template-modern .client-footer-links{display:flex!important;justify-content:center!important;flex-wrap:wrap!important;gap:8px!important}
 .client-template-modern img{max-width:100%!important;height:auto!important}
 .client-template-modern table{width:100%!important;max-width:100%!important;table-layout:fixed!important}
 .client-template-modern td{max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;box-sizing:border-box!important}
 .client-template-modern .modern-email-price-layout,.client-template-modern .modern-email-price-layout tbody,.client-template-modern .modern-email-price-layout tr{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;table-layout:auto!important}
 .client-template-modern .modern-email-price-cell,.client-template-modern .modern-email-cta-cell{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;padding:12px 0!important;text-align:center!important;box-sizing:border-box!important}
 .client-template-modern .modern-email-price-cell .client-price{white-space:nowrap!important;font-size:29px!important;line-height:1.15!important;}
 .client-template-modern .modern-email-cta-cell .client-cta{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;min-height:0!important;margin:0!important;padding:15px 10px!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important;box-sizing:border-box!important}
 .client-template-modern .modern-email-social-layout{display:table!important;width:100%!important;max-width:100%!important;table-layout:fixed!important}
 .client-template-modern .modern-email-social-layout tr{display:table-row!important;width:100%!important;max-width:100%!important}
 .client-template-modern .modern-email-social-cell{display:table-cell!important;width:auto!important;max-width:100%!important;padding:3px 2px!important;vertical-align:middle!important;box-sizing:border-box!important}
 .client-template-modern .modern-email-social-cell a{display:inline-block!important;max-width:100%!important;padding:6px 3px!important;font-size:10px!important;line-height:1.2!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;box-sizing:border-box!important}
 .client-template-modern .modern-email-social-cell img{display:inline-block!important;width:18px!important;height:18px!important;max-width:18px!important;max-height:18px!important;vertical-align:middle!important}
 .client-template-modern .client-header-contacts,.client-template-modern .client-header-contacts a{width:100%!important;max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
 .client-template-modern .client-header-contacts .client-phone{font-size:14px!important;line-height:1.35!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
}
</style>`:"";
 return `${emailStyle}<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="600" class="email-outer-canvas" style="width:600px;max-width:100%;margin:0 auto;border-collapse:collapse;table-layout:fixed;background:#fff"><tr><td align="center" style="padding:0;text-align:center"><div class="${rootClass}" style="display:block;width:100%;max-width:${outerMax};min-width:0;margin:0 auto;padding:0;background:#fff;font-family:Arial,Helvetica,sans-serif;text-align:left;overflow:visible;box-sizing:border-box">${clone.outerHTML}</div></td></tr></table>`;
}
function sanitizeEmailHtml(html){
 const doc=new DOMParser().parseFromString(String(html||""),"text/html");
 doc.querySelectorAll("script,iframe,frame,object,embed,form,meta,base,link").forEach(el=>el.remove());
 doc.querySelectorAll("*").forEach(el=>{
  [...el.attributes].forEach(attr=>{
   const name=attr.name.toLowerCase(),val=attr.value.trim();
   if(name.startsWith("on")||name==="srcdoc")el.removeAttribute(attr.name);
   else if(["href","src","xlink:href","action","formaction"].includes(name)&&/^\s*javascript:/i.test(val))el.removeAttribute(attr.name);
  });
 });
 return doc.body.innerHTML;
}
function normalizeStrictEmailForMobile(html){
 const doc=new DOMParser().parseFromString(String(html||""),"text/html");
 const page=doc.querySelector(".client-template-simple");if(!page)return html;
 page.style.setProperty("width","100%","important");page.style.setProperty("max-width","100%","important");page.style.setProperty("margin","0 auto","important");page.style.setProperty("overflow","visible","important");
 const shell=page.querySelector(".client-shell");if(shell){shell.style.setProperty("width","100%","important");shell.style.setProperty("max-width","600px","important");shell.style.setProperty("padding","12px 0 22px","important");}
 const main=page.querySelector(".client-main");if(main){main.style.setProperty("width","100%","important");main.style.setProperty("max-width","600px","important");main.style.setProperty("margin","18px auto","important");main.style.setProperty("padding","0","important");}
 // Reset computed desktop pixel widths copied from the live preview. They cause
 // Gmail mobile to shrink the whole message to a narrow strip.
 page.querySelectorAll(".strict-offer-number,.strict-description,.strict-details,.strict-details tbody,.strict-details tr,.strict-details td,.client-manager-intro,.client-manager-copy > p,.client-manager-copy > strong,.client-footer,.client-footer *,.client-hero-meta,.client-hero-meta *").forEach(el=>{
  const w=el.style.getPropertyValue("width");if(/^-?\d+(?:\.\d+)?px$/i.test(w))el.style.setProperty("width","100%","important");
  const ml=el.style.getPropertyValue("margin-left");if(/^-?\d+(?:\.\d+)?px$/i.test(ml))el.style.setProperty("margin-left","0","important");
  const max=el.style.getPropertyValue("max-width");if(max==="none")el.style.setProperty("max-width","100%","important");
 });
 page.querySelectorAll(".client-hero-meta").forEach(el=>{el.style.cssText="display:block;width:100%;margin:8px 0 14px;padding:0;line-height:1.5";el.querySelectorAll(".travel-meta-arrival,.travel-meta-nights").forEach(span=>{span.style.cssText="display:inline-block;width:auto;max-width:100%;margin:0 14px 4px 0;padding:0;vertical-align:top";});});
 page.querySelectorAll(".strict-details").forEach(table=>{table.style.setProperty("width","100%","important");table.style.setProperty("max-width","100%","important");table.querySelectorAll("td").forEach((td,i)=>{td.style.setProperty("width",i%2===0?"30%":"70%","important");td.style.setProperty("max-width","100%","important");});});
 page.querySelectorAll(".client-header .client-brand").forEach(el=>{el.style.setProperty("width","auto","important");el.style.setProperty("max-width","100%","important");});
 page.querySelectorAll(".client-social-icon").forEach(img=>{img.setAttribute("width","20");img.setAttribute("height","20");img.setAttribute("style","display:inline-block;width:20px;height:20px;max-width:20px;max-height:20px;object-fit:contain;border:0;vertical-align:middle");});
 page.querySelectorAll(".client-manager-buttons a,.client-footer-links a").forEach(a=>{a.style.setProperty("display","inline-block","important");a.style.setProperty("white-space","normal","important");a.style.setProperty("overflow-wrap","anywhere","important");a.style.setProperty("word-break","break-word","important");a.querySelectorAll("img").forEach(img=>{img.setAttribute("width","20");img.setAttribute("height","20");img.setAttribute("style","display:inline-block;width:20px;height:20px;max-width:20px;max-height:20px;object-fit:contain;border:0;vertical-align:middle");});});
 page.querySelectorAll(".client-footer,.client-footer div").forEach(el=>{el.style.setProperty("width","100%","important");el.style.setProperty("max-width","100%","important");});
 page.querySelectorAll("*").forEach(el=>{
  el.style.setProperty("box-sizing","border-box","important");
  el.style.setProperty("max-width","100%","important");
  el.style.setProperty("min-width","0","important");
  const width=el.style.getPropertyValue("width").trim().match(/^(\d+(?:\.\d+)?)px$/i);
  if(width&&Number(width[1])>160)el.style.setProperty("width","100%","important");
  const attrWidth=Number.parseFloat(el.getAttribute("width")||"");
  if(Number.isFinite(attrWidth)&&attrWidth>160)el.setAttribute("width","100%");
 });
 doc.querySelectorAll("img").forEach(img=>{if(img.classList.contains("client-social-icon")){img.setAttribute("width","20");img.setAttribute("height","20");}});
 // Put embedded responsive styles in the document head, like the reference email.
 doc.body.querySelectorAll("style").forEach(style=>doc.head.appendChild(style));
 return doc.head.innerHTML+doc.body.innerHTML;
}
function setEmailHtmlMode(enabled){
 const visual=document.getElementById("emailBodyVisual"),source=document.getElementById("emailBodySource"),actions=document.getElementById("emailHtmlActions"),toolbar=document.getElementById("emailEditorToolbar");
 if(enabled){source.value=visual.innerHTML;visual.hidden=true;source.hidden=false;actions.hidden=false;toolbar.querySelectorAll("button").forEach(b=>b.disabled=true);document.getElementById("emailHtmlMode").disabled=true;source.focus();}
 else{visual.innerHTML=sanitizeEmailHtml(source.value);visual.hidden=false;source.hidden=true;actions.hidden=true;toolbar.querySelectorAll("button").forEach(b=>b.disabled=false);document.getElementById("emailHtmlMode").disabled=false;visual.focus();}
}
function initEmailPreview(){
 const modal=document.getElementById("emailPreviewModal"),recipient=document.getElementById("emailPreviewRecipient"),form=document.getElementById("emailPreviewForm"),visual=document.getElementById("emailBodyVisual"),toolbar=document.getElementById("emailEditorToolbar"),imageFile=document.getElementById("emailImageFile");
 document.getElementById("closeEmailPreview").onclick=closeEmailPreview;document.getElementById("cancelEmailPreview").onclick=closeEmailPreview;
 modal.addEventListener("click",event=>{if(event.target===modal)closeEmailPreview()});
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!modal.hidden)closeEmailPreview()});
 recipient.addEventListener("blur",()=>saveCollectionClientEmail(true));
 toolbar.querySelectorAll("[data-command]").forEach(button=>button.addEventListener("mousedown",event=>event.preventDefault()));
 toolbar.querySelectorAll("[data-command]").forEach(button=>button.addEventListener("click",()=>{visual.focus();document.execCommand(button.dataset.command,false,null)}));
 document.getElementById("emailInsertLink").onclick=()=>{const url=prompt("Введите URL ссылки:","https://");if(url&&/^https?:\/\//i.test(url)){visual.focus();document.execCommand("createLink",false,url)}};
 document.getElementById("emailInsertImage").onclick=()=>imageFile.click();
 imageFile.addEventListener("change",()=>{const file=imageFile.files?.[0];if(!file)return;if(!file.type.startsWith("image/")){document.getElementById("emailPreviewStatus").textContent="Выберите файл изображения.";imageFile.value="";return;}if(file.size>5*1024*1024){document.getElementById("emailPreviewStatus").textContent="Изображение должно быть не больше 5 МБ.";imageFile.value="";return;}const reader=new FileReader();reader.onload=()=>{visual.focus();document.execCommand("insertHTML",false,`<img src="${reader.result}" alt="" style="max-width:100%;height:auto">`);};reader.readAsDataURL(file);imageFile.value="";});
 document.getElementById("emailHtmlMode").onclick=()=>setEmailHtmlMode(true);
 document.getElementById("emailApplyHtml").onclick=()=>setEmailHtmlMode(false);
 document.getElementById("emailBackToVisual").onclick=()=>setEmailHtmlMode(false);
 form.addEventListener("submit",async event=>{
  event.preventDefault();const status=document.getElementById("emailPreviewStatus"),submit=form.querySelector('button[type="submit"]'),to=recipient.value.trim(),subject=document.getElementById("emailPreviewSubject").value.trim();let html=document.getElementById("emailBodySource").hidden?visual.innerHTML:document.getElementById("emailBodySource").value;
  if(!to||!subject){status.textContent="Заполните Email получателя и тему письма.";return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)){status.textContent="Проверьте Email получателя.";return;}
  submit.disabled=true;submit.textContent="Отправляем…";status.textContent="Отправляем письмо через SMTP…";
  try{
   if(currentCollection?.clientId){const saved=await saveCollectionClientEmail(false);if(!saved)throw Error("Не удалось сохранить Email клиента.");}
   if(currentTemplate==="simple")html=normalizeStrictEmailForMobile(html);
   const response=await fetch("/api/collections/"+encodeURIComponent(id)+"/email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to,subject,html})}),data=await response.json();
   if(!response.ok)throw Error(data.error||"Не удалось отправить письмо.");
   status.textContent="Письмо успешно отправлено на "+to+".";
  }catch(error){status.textContent=error.message||"Ошибка отправки письма.";}
  finally{submit.disabled=false;submit.textContent="Отправить";}
 });
}
function render(c){
 document.title=value(c.title,"Подбор отдыха");
 const offers=c.offers||[];
 const rawTemplate=c.template||"modern";
 const template=rawTemplate==="tearoff"?"cards-scroll":(["detailed","simple","cards-scroll","modern"].includes(rawTemplate)?rawTemplate:"modern");
 document.body.className="client-page client-template-"+template;
 const first=offers[0]||{};
 const heading=value(c.title,"Подбор отдыха");
 const rawDate=value(first.date);
 const arrival=rawDate?rawDate.split(/\s+(?:по|–|—|-)\s+/i)[0].replace(/^с\s*/i,"").trim(): "";
 const nightCount=Number.parseInt(first.nights,10);
 const nightWord=Number.isFinite(nightCount)?(nightCount%10===1&&nightCount%100!==11?"ночь":nightCount%10>=2&&nightCount%10<=4&&(nightCount%100<12||nightCount%100>14)?"ночи":"ночей"):"ночей";
 const travelMeta=[arrival?{kind:"arrival",text:`🗓️ Заезд: ${arrival}`} : null,first.nights?{kind:"nights",text:`🌙 ${first.nights} ${nightWord}`} : null].filter(Boolean);
 const offersHeading=template==="simple" ? "" : template==="cards-scroll"
  ? `<div class="client-offers-heading"><div><h2>Предложения для вас</h2><span class="cards-scroll-subtitle">Листайте вправо — все варианты ниже</span></div><div class="cards-scroll-controls"><button type="button" class="cards-scroll-arrow" id="offersPrev" aria-label="Предыдущие предложения">←</button><button type="button" class="cards-scroll-arrow" id="offersNext" aria-label="Следующие предложения">→</button></div></div>`
  : `<div class="client-offers-heading"><h2>Предложения для вас</h2><span>${offers.length} вариантов</span></div>`;
 const managerIntro=`<section class="client-manager-intro ${managerSettings.managerPhoto?"has-manager-photo":"no-manager-photo"}">
  ${managerSettings.managerPhoto?`<div class="client-manager-avatar manager-photo-avatar"><img src="${esc(managerSettings.managerPhoto)}" alt="Фото ${esc(managerSettings.name||"менеджера")}"></div>`:""}
  <div class="client-manager-copy"><strong>${esc(managerSettings.name||"Ваш менеджер")}</strong><p>Помогу выбрать подходящий вариант и отвечу на вопросы. Если предложенные варианты не подошли, подберу другие.</p>
   <div class="client-manager-buttons">${managerContactLinks()}</div>
  </div>
 </section>`;
 app.innerHTML=`<section class="client-hero">
  <h1>${esc(heading)}</h1>
  ${travelMeta.length?`<div class="client-hero-meta cards-hero-meta">${travelMeta.map(x=>`<span class="travel-meta-${x.kind}">${esc(x.text)}</span>`).join("")}</div>`:""}
 </section>
 ${managerIntro}
 ${offersHeading}
 <section class="client-offers ${template==="cards-scroll"?"client-offers-scroll":""}">${offers.length?offers.map(template==="cards-scroll"?cardsScrollOffer:template==="simple"?strictOffer:template==="detailed"?universalOffer:offerCard).join(""):'<div class="client-empty">В подборке пока нет предложений.</div>'}</section>
 <section class="client-last-cta"><h2>Не нашли подходящий вариант?</h2><p>Напишите менеджеру — подберём отдых под ваши пожелания.</p><a href="${primaryContact()}" target="_blank" rel="noopener">Связаться с менеджером</a></section>`;
 if(template!=="cards-scroll"){
  app.querySelectorAll(".client-description-toggle").forEach(button=>button.addEventListener("click",()=>{
   const paragraph=button.previousElementSibling,full=paragraph.dataset.full,expanded=button.getAttribute("aria-expanded")==="true";
   paragraph.textContent=expanded?(full.length>360?full.slice(0,357).trimEnd()+"…":full):full;
   button.textContent=expanded?"подробное описание":"Свернуть";button.setAttribute("aria-expanded",String(!expanded));
  }));
 }
 if(template==="cards-scroll"){
  const rail=app.querySelector(".client-offers-scroll");
  app.querySelector("#offersPrev")?.addEventListener("click",()=>rail?.scrollBy({left:-Math.max(rail.clientWidth*.8,300),behavior:"smooth"}));
  app.querySelector("#offersNext")?.addEventListener("click",()=>rail?.scrollBy({left:Math.max(rail.clientWidth*.8,300),behavior:"smooth"}));
  app.querySelectorAll(".cards-description-toggle").forEach(button=>button.addEventListener("click",()=>{
   const paragraph=button.previousElementSibling,full=paragraph.dataset.full,expanded=button.getAttribute("aria-expanded")==="true";
   paragraph.textContent=expanded?(full.length>176?full.slice(0,173).trimEnd()+"…":full):full;
   button.textContent=expanded?"Подробнее ↓":"Свернуть ↑";button.setAttribute("aria-expanded",String(!expanded));
  }));
  equalizeCardsPricePanels();
  if(!window.cardsPricePanelsResizeBound){
   window.cardsPricePanelsResizeBound=true;
   window.addEventListener("resize",equalizeCardsPricePanels);
   if(document.fonts?.ready)document.fonts.ready.then(equalizeCardsPricePanels);
  }
 }
}
initEmailPreview();
Promise.all([fetch("/api/collections/"+encodeURIComponent(id)).then(r=>{if(!r.ok)throw Error("Подборка не найдена или ссылка устарела");return r.json()}),fetch("/api/public/settings?collectionId="+encodeURIComponent(id)).then(r=>r.ok?r.json():{}).catch(()=>({})),fetch("/api/auth/me").then(r=>r.ok?r.json():null).catch(()=>null)]).then(([collection,settings,auth])=>{managerSettings={...managerSettings,...settings};managerMode=!!auth&&["admin","manager"].includes(auth.user?.role);updateHeaderContacts();initCollectionControls(collection);render(collection)}).catch(e=>{app.innerHTML=`<div class="client-error"><h1>Не удалось открыть подборку</h1><p>${esc(e.message)}</p><a href="https://bagtravels.ru/">Перейти на сайт туроператора</a></div>`});
