const list=document.getElementById("list"),empty=document.getElementById("empty"),count=document.getElementById("count");
const titleInput=document.getElementById("collectionTitle"),saveStatus=document.getElementById("saveStatus");
async function loadOrganizationBrand(){
 try{
  const [brandResponse,meResponse,settingsResponse]=await Promise.all([
   fetch("https://tourboard.online/api/extension/branding",{credentials:"include"}),
   fetch("https://tourboard.online/api/auth/me",{credentials:"include"}),
   fetch("https://tourboard.online/api/settings",{credentials:"include"})
  ]);
  const brand=brandResponse.ok?await brandResponse.json():{};
  const me=meResponse.ok?await meResponse.json():{};
  const settings=settingsResponse.ok?await settingsResponse.json():{};
  const company=document.getElementById("companyName"),manager=document.getElementById("managerName");
  const logo=document.getElementById("companyLogo"),wrap=document.getElementById("companyLogoWrap");
  if(company)company.textContent=brand.companyName||"Tour Selection";
  if(manager)manager.textContent=settings.name||me.user?.name||me.user?.username||"Менеджер";
  if(logo&&brand.logo){
   logo.src=brand.logo;logo.hidden=false;logo.alt=brand.companyName||"Логотип организации";
   logo.onload=()=>{logo.style.width=Math.min(logo.naturalWidth||150,150)+"px";logo.style.height="auto";};
   logo.onerror=()=>{logo.hidden=true;if(wrap)wrap.classList.remove("has-company-logo");};
   if(wrap)wrap.classList.add("has-company-logo");
  }
 }catch(e){/* If the local server is offline, retain the neutral fallback brand. */}
}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
const editable=[["price","Стоимость"],["tariff","Тариф"],["room","Номер"],["meal","Питание"],["flightIncluded","Перелёт"],["description","Описание"],["descriptionLink","Ссылка на описание"]];
async function render(){
 const {offers=[],collectionTitle="Моя подборка"}=await chrome.storage.local.get({offers:[],collectionTitle:"Моя подборка"});
 if(document.activeElement!==titleInput)titleInput.value=collectionTitle;
 const n=offers.length,mod10=n%10,mod100=n%100;
 const noun=(mod10===1&&mod100!==11)?"объект":(mod10>=2&&mod10<=4&&!(mod100>=12&&mod100<=14))?"объекта":"объектов";
 count.textContent=n+" "+noun+" в подборке";empty.style.display=offers.length?"none":"block";
 list.innerHTML=offers.map((o,i)=>`<article class="offer" data-index="${i}">
 <div class="offer-head"><h3>${esc(o.hotel||"Отель")}</h3><div class="card-tools"><button class="move" data-move="-1" data-index="${i}" ${i===0?"disabled":""} title="Выше">↑</button><button class="move" data-move="1" data-index="${i}" ${i===offers.length-1?"disabled":""} title="Ниже">↓</button><button class="remove" data-remove="${i}" title="Удалить">✕</button></div></div>
 <div class="offer-data">
 <p class="trip-meta"><b>Дата:</b> ${esc(o.date||"—")} · <b>Ночей:</b> ${esc(o.nights||"—")} · <b>Туристы:</b> ${esc(o.adults||"—")} взрослых${o.children?`, ${esc(o.children)} детей`:""}</p>
 <p><b>Стоимость:</b> ${esc((o.price||"—").replace(/\s*₽?$/,""))} руб.</p>
 <p><b>Тариф:</b> ${esc(o.tariff||"—")}</p><p><b>Номер:</b> ${esc(o.room||"—")}</p><p><b>Питание:</b> ${esc(o.meal||"—")}</p><p><b>Перелёт:</b> ${o.flightIncluded==="yes"?"С перелётом":o.flightIncluded==="no"?"Без перелёта":"Не указано"}</p>

 ${o.comment?`<p><b>Комментарий:</b> ${esc(o.comment)}</p>`:""}
 ${o.cancellation?`<p><b>Условия:</b> ${esc(o.cancellation)}</p>`:""}
 </div>
 <label class="edit-label">Комментарий для клиента:<textarea class="edit-field client-comment" data-field="comment" data-index="${i}" rows="3" placeholder="Комментарий для клиента">${esc(o.comment||"")}</textarea></label>
 <details class="edit-offer-fields"><summary>Редактировать данные</summary>
 ${editable.map(([key,label])=>key==="flightIncluded"?`<label class="edit-label">${label}:<select class="edit-field" data-field="${key}" data-index="${i}"><option value="" ${!o[key]?"selected":""}>Не указано</option><option value="yes" ${o[key]==="yes"?"selected":""}>С перелётом</option><option value="no" ${o[key]==="no"?"selected":""}>Без перелёта</option></select></label>`:`<label class="edit-label">${label}:<input class="edit-field" ${key==="descriptionLink"?'type="url"':''} data-field="${key}" data-index="${i}" value="${esc(o[key]||"")}" placeholder="${key==="descriptionLink"?"https://...":label}"></label>`).join("")}
 <label class="edit-label">Своё фото отеля (URL картинки):<input class="edit-field" type="url" data-field="customImage" data-index="${i}" value="${esc(o.customImage||"")}" placeholder="https://example.com/hotel.jpg"></label>
 </details>
 ${o.cancellation?`<p class="conditions"><b>Условия:</b> ${esc(o.cancellation)}</p>`:""}
 </article>`).join("");
}
list.addEventListener("click",async e=>{
 const remove=e.target.dataset.remove,move=e.target.dataset.move;
 const {offers=[]}=await chrome.storage.local.get({offers:[]});
 if(remove!==undefined){offers.splice(Number(remove),1);await chrome.storage.local.set({offers});render();return;}
 if(move!==undefined){const i=Number(e.target.dataset.index),j=i+Number(move);if(j<0||j>=offers.length)return;[offers[i],offers[j]]=[offers[j],offers[i]];await chrome.storage.local.set({offers});render();}
});
list.addEventListener("change",async e=>{
 const key=e.target.dataset.field;if(!key)return;const i=Number(e.target.dataset.index),value=e.target.value.trim();
 if((key==="customImage"||key==="descriptionLink")&&value&&!/^https?:\/\//i.test(value)){e.target.setCustomValidity("Введите ссылку, начинающуюся с http:// или https://");e.target.reportValidity();return;}
 e.target.setCustomValidity("");const {offers=[]}=await chrome.storage.local.get({offers:[]});if(!offers[i])return;
 offers[i][key]=value;if(key==="customImage")offers[i].image=value||offers[i].sourceImage||"";
 await chrome.storage.local.set({offers});render();
});
titleInput.addEventListener("change",async()=>{await chrome.storage.local.set({collectionTitle:titleInput.value.trim()||"Моя подборка"});});
document.getElementById("clear").addEventListener("click",async()=>{if(!confirm("Начать новую подборку? Текущие предложения будут очищены. Уже сохранённая подборка в кабинете останется."))return;await chrome.storage.local.set({offers:[],serverCollectionId:null,collectionTitle:"Моя подборка"});titleInput.value="Моя подборка";saveStatus.textContent="Новая подборка";render();});
async function syncCollection(clientId){
 const {offers=[],serverCollectionId=null}=await chrome.storage.local.get({offers:[],serverCollectionId:null});
 const title=titleInput.value.trim()||"Моя подборка";
 if(!offers.length)throw new Error("Добавьте хотя бы одно предложение");
 const payload={title,offers,clientId};
 const url=serverCollectionId?`https://tourboard.online/api/collections/${encodeURIComponent(serverCollectionId)}`:"https://tourboard.online/api/collections";
 const response=await fetch(url,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
 const data=await response.json();if(!response.ok)throw new Error(data.error||"Ошибка сервера");
 await chrome.storage.local.set({offers,collectionTitle:title,serverCollectionId:data.id||serverCollectionId,savedCollection:{title,offers:JSON.parse(JSON.stringify(offers)),clientId,savedAt:new Date().toISOString()}});
 const collectionId=data.id||serverCollectionId;if(!collectionId)throw new Error("Сервер не вернул ID сохранённой подборки");
 return {id:collectionId,url:data.url||`https://tourboard.online/c/${collectionId}`};
}
const saveButton=document.getElementById("save");
const clientModal=document.getElementById("clientModal"),clientSelect=document.getElementById("saveClientSelect"),clientModalStatus=document.getElementById("clientModalStatus"),confirmSave=document.getElementById("confirmSaveCollection"),createClientForm=document.getElementById("popupCreateClientForm");
async function openClientModal(){saveButton.disabled=true;saveStatus.textContent="Загружаем клиентов…";clientModalStatus.textContent="";try{const r=await fetch("https://tourboard.online/api/clients",{credentials:"include"}),data=await r.json();if(!r.ok)throw Error(data.error||"Не удалось загрузить клиентов. Войдите в личный кабинет.");clientSelect.innerHTML='<option value="">Выберите клиента…</option>'+data.map(c=>`<option value="${esc(c.id)}">${esc(c.name||"Клиент без имени")}${c.phone?" · "+esc(c.phone):""}${c.email?" · "+esc(c.email):""}</option>`).join("");const {savedCollection}=await chrome.storage.local.get({savedCollection:null});if(savedCollection?.clientId)clientSelect.value=savedCollection.clientId;confirmSave.disabled=!clientSelect.value;clientModal.hidden=false;saveStatus.textContent="Выберите клиента для подборки.";}catch(e){saveStatus.textContent="Не удалось открыть выбор клиента: "+e.message;}finally{saveButton.disabled=false}}
clientSelect.addEventListener("change",()=>confirmSave.disabled=!clientSelect.value);
document.getElementById("showCreateClient").addEventListener("click",()=>{createClientForm.hidden=false;createClientForm.elements.name.focus()});
document.getElementById("cancelPopupCreateClient").addEventListener("click",()=>{createClientForm.reset();createClientForm.hidden=true;clientModalStatus.textContent=""});
createClientForm.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(createClientForm),payload={name:f.get("name"),phone:f.get("phone"),email:f.get("email")};if(!Object.values(payload).some(v=>String(v||"").trim())){clientModalStatus.textContent="Заполните хотя бы одно поле: имя, телефон или Email.";return}clientModalStatus.textContent="Создаём клиента…";try{const r=await fetch("https://tourboard.online/api/clients",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok)throw Error(d.error||"Не удалось создать клиента");const option=document.createElement("option");option.value=d.id;option.textContent=[d.name||"Клиент без имени",d.phone,d.email].filter(Boolean).join(" · ");clientSelect.append(option);clientSelect.value=d.id;confirmSave.disabled=false;createClientForm.reset();createClientForm.hidden=true;clientModalStatus.textContent="Клиент создан и выбран."}catch(err){clientModalStatus.textContent="Ошибка: "+err.message}});
document.getElementById("cancelClientModal").addEventListener("click",()=>{clientModal.hidden=true;saveStatus.textContent="Сохранение отменено."});
confirmSave.addEventListener("click",async()=>{if(!clientSelect.value){clientModalStatus.textContent="Выберите клиента.";return}confirmSave.disabled=true;saveButton.disabled=true;clientModalStatus.textContent="Сохраняем подборку…";try{const result=await syncCollection(clientSelect.value);clientModal.hidden=true;await chrome.storage.local.set({offers:[],serverCollectionId:null,collectionTitle:"Моя подборка"});titleInput.value="Моя подборка";saveStatus.textContent="Подборка сохранена. Открываем редактор…";await render();try{await chrome.tabs.create({url:`https://tourboard.online/edit/${encodeURIComponent(result.id)}`})}catch(tabError){saveStatus.textContent="Подборка сохранена, но редактор не открылся. Откройте её из веб-кабинета."}}catch(e){clientModalStatus.textContent="Не удалось сохранить подборку: "+e.message}finally{confirmSave.disabled=!clientSelect.value;saveButton.disabled=false}});
saveButton.addEventListener("click",openClientModal);
// Быстрый переход в веб-кабинет в новой вкладке Chrome.
document.getElementById("cabinet").addEventListener("click",()=>{chrome.tabs.create({url:"https://tourboard.online/cabinet"});});

// При каждом открытии popup заново читаем локальный черновик, чтобы предложения
// не оставались невидимыми до следующего изменения.
chrome.storage.onChanged.addListener((changes, areaName)=>{
 if(areaName==="local"&&changes.offers)render().catch(err=>{
  saveStatus.textContent="Не удалось показать предложения: "+(err?.message||err);
 });
});
loadOrganizationBrand();
render().catch(err=>{
 saveStatus.textContent="Не удалось загрузить предложения: "+(err?.message||err);
 console.error("[Tour Selection] popup render failed",err);
});
