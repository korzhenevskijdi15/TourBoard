(async()=>{
const authResponse=await fetch("/api/auth/me");
if(!authResponse.ok){location.replace("/login");return;}
const authData=await authResponse.json(),currentUser=authData.user;
const $=id=>document.getElementById(id);
let collectionData=[],clientData=[];
const badge=$("currentUserBadge");
if(badge){
 if(currentUser.role==="admin"){
  badge.replaceChildren();
  const roleLine=document.createElement("span");roleLine.textContent="Администратор";
  const nameLine=document.createElement("strong");nameLine.textContent=currentUser.name||currentUser.username;
  badge.append(roleLine,nameLine);badge.classList.add("admin-user-badge");
 }else if(currentUser.role==="creator")badge.textContent=`Создатель · ${currentUser.name||currentUser.username}`;
 else badge.textContent=`Менеджер · ${currentUser.managerId||"ID не назначен"} · ${currentUser.name||currentUser.username}`;
}
$("logoutButton").addEventListener("click",async()=>{await fetch("/api/auth/logout",{method:"POST"});location.replace("/login")});
if(currentUser.role==="admin"){
 $("clientsTab").hidden=false;$("clientsTab").style.display="";
 $("organizationTab").hidden=false;$("organizationTab").style.display="";
 $("managersTab").hidden=false;$("managersTab").style.display="";
 $("organizationsTab").hidden=true;$("organizationsTab").style.display="none";
 $("userCreationTab").hidden=true;$("userCreationTab").style.display="none";
 $("userCreationPanel").hidden=true;$("userCreationPanel").style.display="none";
}else if(currentUser.role==="creator"){
 ["collectionsTab","organizationTab","managersTab"].forEach(id=>{$(id).hidden=true;$(id).style.display="none";});
 ["collectionsPanel","organizationSettings","managersPanel"].forEach(id=>{$(id).hidden=true;$(id).style.display="none";});
 $("organizationsTab").hidden=false;$("organizationsTab").style.display="";
 $("userCreationTab").hidden=false;$("userCreationTab").style.display="";
 $("creatorAccountSettings").hidden=false;
}else{
 $("clientsTab").hidden=false;$("clientsTab").style.display="";
 ["organizationTab","managersTab","organizationsTab","userCreationTab"].forEach(id=>{$(id).hidden=true;$(id).style.display="none";});
 ["organizationSettings","managersPanel","organizationsPanel","userCreationPanel"].forEach(id=>{$(id).hidden=true;$(id).style.display="none";});
 $("creatorAccountSettings").hidden=true;
}
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let editingId=null,offers=[],collectionTemplate="modern";
const fields=[["hotel","Название объекта"],["location","Адрес"],["customImage","URL фото отеля"],["descriptionLink","Ссылка на описание"],["price","Стоимость"],["tariff","Тариф"],["room","Номер"],["meal","Питание"],["flightIncluded","Перелёт"],["description","Описание"],["comment","Комментарий для клиента"]];
const templateNames={detailed:"Универсальный",simple:"Строгий","cards-scroll":"Карточки с прокруткой",modern:"Современный"};
function drawTemplatePreview(){const template=$("collectionTemplate").value||"modern",first=offers[0]||{};const preview=$("templatePreview");preview.className="template-preview preview-"+(template==="tearoff"?"cards-scroll":template);$("templateCurrentName").textContent=templateNames[template]||"Современный";$("tpCollectionTitle").textContent=$("title").value.trim()||"Моя подборка";$("tpHotel").textContent=first.hotel||"Название объекта";$("tpLocation").textContent=first.location||"";$("tpDescription").textContent=first.description||"Описание объекта появится здесь";$("tpPrice").textContent=first.price||"Стоимость";const photo=first.customImage||first.image||"";$("tpPhoto").style.backgroundImage=photo?`url(${JSON.stringify(photo)})`:"none";$("tpPhoto").textContent=photo?"":"Фото объекта";[["previewHotel","hotel"],["previewLocation","location"],["previewPrice","price"],["previewDescription","description"]].forEach(([id,key])=>{const el=$(id);if(el&&document.activeElement!==el)el.value=first[key]||"";});}
function bindPreviewFields(){[["previewHotel","hotel"],["previewLocation","location"],["previewPrice","price"],["previewDescription","description"]].forEach(([id,key])=>$(id).addEventListener("input",()=>{if(!offers.length)offers.push(blankOffer());offers[0][key]=$(id).value;drawTemplatePreview();drawOffers();}));}

function setResult(msg,link){const el=$("result");el.textContent="";el.className="result";el.append(document.createTextNode(msg+" "));if(link){const a=document.createElement("a");a.href=link;a.target="_blank";a.textContent=link;el.append(a)}}
function syncCount(){$("offerCount").textContent=offers.length}
function drawOffers(){
 syncCount();drawTemplatePreview();const box=$("offerCards");
 if(!offers.length){box.innerHTML='<div class="empty">Пока нет предложений. Добавьте новое или откройте сохранённую подборку.</div>';return}
 box.innerHTML=offers.map((o,i)=>`<article class="offer-edit-card" data-i="${i}">
 <div class="offer-card-head"><div><span class="offer-number">Предложение ${i+1}</span><h4>${esc(o.hotel||"Отель не указан")}</h4></div><div class="offer-card-actions"><button class="secondary" data-up="${i}" ${i===0?"disabled":""} title="Выше">↑</button><button class="secondary" data-down="${i}" ${i===offers.length-1?"disabled":""} title="Ниже">↓</button><button class="danger" data-remove="${i}">Удалить</button></div></div>
 <div class="offer-preview">${(o.customImage||o.image)?`<img src="${esc(o.customImage||o.image)}" alt="Фото отеля" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><div class="image-fallback" style="display:none">Не удалось загрузить изображение</div>`:'<div class="image-fallback">Фото отеля не добавлено</div>'}
 <div class="preview-info"><strong>${esc(o.hotel||"Отель")}</strong><span>${esc(o.date||"Дата не указана")} · ${esc(o.nights||"—")} ночей · ${esc(o.adults||"—")} взрослых</span><b>${esc(o.price||"Цена не указана")}</b></div></div>
 <div class="field-grid">${fields.map(([key,label])=>`<label>${label}${key==="flightIncluded"?`<select data-field="${key}" data-i="${i}"><option value="" ${!o[key]?"selected":""}>Не указано</option><option value="yes" ${o[key]==="yes"?"selected":""}>С перелётом</option><option value="no" ${o[key]==="no"?"selected":""}>Без перелёта</option></select>`:key==="description"||key==="comment"?`<textarea rows="3" data-field="${key}" data-i="${i}" placeholder="${label}">${esc(o[key]||"")}</textarea>`:`<input ${(key==="customImage"||key==="descriptionLink")?'type="url"':''} data-field="${key}" data-i="${i}" value="${esc(o[key]||"")}" placeholder="${key==="customImage"?"https://example.com/hotel.jpg":key==="descriptionLink"?"https://example.com/hotel-description":label}">`}</label>`).join("")}</div>
 <details class="more-fields"><summary>Данные поездки и дополнительные условия</summary><div class="field-grid">${[["date","Дата заезда"],["nights","Ночей"],["adults","Взрослых"],["children","Детей"],["cancellation","Условия отмены"],["sourceUrl","Ссылка на агрегатор"]].map(([k,l])=>`<label>${l}<input data-field="${k}" data-i="${i}" value="${esc(o[k]||"")}" placeholder="${l}"></label>`).join("")}</div></details></article>`).join("");
 box.querySelectorAll("[data-field]").forEach(el=>el.addEventListener("change",()=>{const i=+el.dataset.i,key=el.dataset.field,val=el.value.trim();if((key==="customImage"||key==="descriptionLink")&&val&&!/^https?:\/\//i.test(val)){el.setCustomValidity("Укажите URL с http:// или https://");el.reportValidity();return}el.setCustomValidity("");offers[i][key]=val;if(key==="customImage")offers[i].image=val||offers[i].sourceImage||"";drawOffers()}));
 box.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{offers.splice(+b.dataset.remove,1);drawOffers()});
 box.querySelectorAll("[data-up]").forEach(b=>b.onclick=()=>{let i=+b.dataset.up;[offers[i-1],offers[i]]=[offers[i],offers[i-1]];drawOffers()});
 box.querySelectorAll("[data-down]").forEach(b=>b.onclick=()=>{let i=+b.dataset.down;[offers[i+1],offers[i]]=[offers[i],offers[i+1]];drawOffers()});
}
function blankOffer(){return {hotel:"",price:"",tariff:"",room:"",meal:"",flightIncluded:"",description:"",descriptionLink:"",comment:"",customImage:"",date:"",nights:"",adults:"2",children:"",cancellation:"",sourceUrl:""}}
function resetForm(){editingId=null;offers=[];collectionTemplate="modern";$("collectionTemplate").value="modern";$("title").value="Моя подборка";if($("collectionClientSelect"))$("collectionClientSelect").value="";drawTemplatePreview();$("formTitle").textContent="Новая подборка";$("create").hidden=false;$("save").hidden=true;setResult("");drawOffers()}
let collectionsPage=1;const COLLECTIONS_PER_PAGE=10;
function renderCollections(){
 const box=$("collections"),from=$("collectionDateFrom").value,to=$("collectionDateTo").value,clientQuery=$("collectionClientSearch").value.trim().toLowerCase(),titleQuery=$("collectionTitleSearch").value.trim().toLowerCase();
 const list=collectionData.filter(c=>{const stamp=new Date(c.createdAt||0).getTime(),start=from?new Date(from+"T00:00:00").getTime():null,end=to?new Date(to+"T23:59:59.999").getTime():null,client=c.client||{},contacts=[client.name,client.phone,client.email].join(" ").toLowerCase();return (!start||stamp>=start)&&(!end||stamp<=end)&&(!clientQuery||contacts.includes(clientQuery))&&(!titleQuery||String(c.title||"").toLowerCase().includes(titleQuery))});
 const pagination=$("collectionPagination");
 if(!list.length){box.innerHTML=collectionData.length?'<div class="empty-state">По заданным фильтрам подборки не найдены.</div>':'<div class="empty-state">Пока нет сохранённых подборок. Создайте её из расширения или добавьте предложения в редакторе.</div>';if(pagination){pagination.hidden=true;pagination.innerHTML=""}return}
 const pageCount=Math.ceil(list.length/COLLECTIONS_PER_PAGE);collectionsPage=Math.max(1,Math.min(collectionsPage,pageCount));
 const pageItems=list.slice((collectionsPage-1)*COLLECTIONS_PER_PAGE,collectionsPage*COLLECTIONS_PER_PAGE);
 box.innerHTML=pageItems.map(c=>{const client=c.client||{},contact=[client.name,client.phone,client.email].filter(Boolean).map(esc).join(", ");return `<div class="collection-row"><div class="collection-row-main"><div class="collection-row-heading"><h4>${esc(c.title)}</h4></div><div class="meta">${c.offerCount} предложений · ${new Date(c.updatedAt||c.createdAt).toLocaleString("ru-RU")}</div><div class="meta">ID: ${esc(c.id)}</div><div class="meta collection-client-line">${contact?`<span class="collection-client">Клиент: ${contact}</span>`:'<span class="collection-client">Клиент не выбран</span>'}</div></div><div class="collection-actions-wrap"><div class="collection-manager">Менеджер: ${esc(c.managerName||"Администратор")}</div><div class="collection-actions"><button class="secondary" data-link="${esc(c.id)}">Открыть подборку</button><button data-edit="${esc(c.id)}">Редактировать</button><button class="danger" data-delete="${esc(c.id)}">Удалить</button></div></div></div>`}).join("");
 if(pagination){if(pageCount<=1){pagination.hidden=true;pagination.innerHTML=""}else{pagination.hidden=false;let pages=[];for(let p=1;p<=pageCount;p++){if(p===1||p===pageCount||Math.abs(p-collectionsPage)<=2)pages.push(p)}let sequence=[];let last=0;for(const p of pages){if(p-last>1)sequence.push(`<span class="pagination-ellipsis">…</span>`);sequence.push(`<button type="button" class="pagination-page${p===collectionsPage?' active':''}" data-page="${p}"${p===collectionsPage?' aria-current="page"':''}>${p}</button>`);last=p}pagination.innerHTML=`<button type="button" class="pagination-prev" data-page="${Math.max(1,collectionsPage-1)}" ${collectionsPage===1?'disabled':''}>‹</button>${sequence.join("")}<button type="button" class="pagination-next" data-page="${Math.min(pageCount,collectionsPage+1)}" ${collectionsPage===pageCount?'disabled':''}>›</button><span class="pagination-count">Всего: ${list.length}</span>`;pagination.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{collectionsPage=Number(b.dataset.page);renderCollections();$("collectionsPanel").scrollIntoView({behavior:"smooth",block:"start"})})}}
 box.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{location.href="/edit/"+encodeURIComponent(b.dataset.edit)});box.querySelectorAll("[data-link]").forEach(b=>b.onclick=()=>window.open(location.origin+"/c/"+b.dataset.link,"_blank"));box.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteCollection(b.dataset.delete));
}
async function loadList(){const box=$("collections");box.textContent="Загружаем…";try{const r=await fetch("/api/collections");if(!r.ok)throw Error("Не удалось получить список");collectionData=await r.json();renderCollections()}catch(e){box.textContent="Ошибка: "+e.message}}
async function editCollection(id){try{const r=await fetch("/api/collections/"+id),c=await r.json();if(!r.ok)throw Error(c.error);editingId=id;$("title").value=c.title;await loadClientOptions(c.clientId||"");collectionTemplate=c.template==="tearoff"?"cards-scroll":(c.template||"modern");$("collectionTemplate").value=collectionTemplate;offers=JSON.parse(JSON.stringify(c.offers||[]));offers.forEach(o=>{if(!o.customImage)o.customImage=o.image||""});$("formTitle").textContent="Редактирование подборки";$("create").hidden=true;$("save").hidden=false;setResult("");drawOffers();$("editor").scrollIntoView({behavior:"smooth",block:"start"})}catch(e){
  $("editor").hidden=false;
  $("formTitle").textContent="Не удалось открыть подборку";
  setResult("Ошибка загрузки подборки: "+e.message);
  console.error("[Tour Selection] editCollection failed",e);
 }}
async function deleteCollection(id){if(!confirm("Удалить подборку? Клиентская ссылка перестанет работать."))return;try{const r=await fetch("/api/collections/"+id,{method:"DELETE"}),d=await r.json();if(!r.ok)throw Error(d.error);if(editingId===id)resetForm();loadList()}catch(e){alert("Ошибка удаления: "+e.message)}}
async function submit(isUpdate){if(!offers.length){setResult("Добавьте хотя бы одно предложение.");return}if(["admin","manager"].includes(currentUser.role)&&$("collectionClientSelect")&&!$("collectionClientSelect").value){setResult("Выберите клиента для этой подборки.");return}collectionTemplate=$("collectionTemplate").value||"modern";const payload={title:$("title").value.trim()||"Моя подборка",template:collectionTemplate,offers,clientId:$("collectionClientSelect")?.value||""};setResult("Сохраняем…");try{const url=isUpdate?"/api/collections/"+editingId:"/api/collections";const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok)throw Error(d.error||"Ошибка сервера");editingId=d.id||editingId;const link=location.origin+"/c/"+editingId;$("formTitle").textContent="Редактирование подборки";$("create").hidden=true;$("save").hidden=false;setResult("Сохранено. Клиентская ссылка:",link);loadList()}catch(e){setResult("Не удалось сохранить: "+e.message)}}
$("collectionTemplate").addEventListener("change",drawTemplatePreview);$("title").addEventListener("input",drawTemplatePreview);bindPreviewFields();
$("create").onclick=()=>submit(false);$("save").onclick=()=>submit(true);$("new").onclick=()=>{resetForm();loadClientOptions();};$("startNewCollection").onclick=()=>{resetForm();loadClientOptions();activateCabinetTab("editor");$("formTitle").textContent="Новая подборка";};$("refresh").onclick=loadList;["collectionDateFrom","collectionDateTo","collectionClientSearch","collectionTitleSearch"].forEach(id=>$(id).addEventListener("input",()=>{collectionsPage=1;renderCollections()}));$("clearCollectionFilters").onclick=()=>{["collectionDateFrom","collectionDateTo","collectionClientSearch","collectionTitleSearch"].forEach(id=>$(id).value="");collectionsPage=1;renderCollections()};$("addOffer").onclick=()=>{offers.push(blankOffer());drawOffers();document.querySelector(".offer-edit-card:last-child")?.scrollIntoView({behavior:"smooth",block:"start"})};
const editRoute=location.pathname.match(/^\/edit\/([^/]+)\/?$/);
const cabinetTabSections=["collectionsPanel","managerSettings","organizationSettings","managersPanel","clientsPanel","organizationsPanel","userCreationPanel","editor"];
function activateCabinetTab(id){cabinetTabSections.forEach(sectionId=>$(sectionId).hidden=sectionId!==id);document.querySelectorAll(".cabinet-tab").forEach(tab=>tab.classList.toggle("active",tab.dataset.tab===id));}
document.querySelectorAll(".cabinet-tab").forEach(tab=>tab.addEventListener("click",()=>{if(tab.dataset.tab==="editor"&&!editingId){if(!offers.length)offers.push(blankOffer());drawOffers();}activateCabinetTab(tab.dataset.tab);if(tab.dataset.tab==="managerSettings")loadManagerSettings();if(tab.dataset.tab==="organizationSettings"&&currentUser.role==="admin")loadOrgSettings();if(tab.dataset.tab==="managersPanel"&&currentUser.role==="admin")loadManagers();if(tab.dataset.tab==="clientsPanel"&&["admin","manager"].includes(currentUser.role))loadClients();if(tab.dataset.tab==="organizationsPanel"&&currentUser.role==="creator")loadOrganizations();if(tab.dataset.tab==="userCreationPanel"&&currentUser.role==="creator")loadUsers();}));
if(editRoute){
 const id=decodeURIComponent(editRoute[1]);
 $("editor").hidden=false;
 document.querySelector(".hero").hidden=true;
 $("cabinetTabs").hidden=true;
 $("managerSettings").hidden=true;
 $("collectionsPanel").hidden=true;
 $("backToCabinet").hidden=false;
 $("backToCabinetBottom").hidden=false;
 document.querySelector("header p").textContent="Редактирование подборки";
 $("formTitle").textContent="Загружаем подборку…";
 $("new").hidden=true;
 editCollection(id).then(()=>{}); // load selected collection directly in this tab
 }else if(currentUser.role==="creator"){activateCabinetTab("organizationsPanel");loadOrganizations();}
else{activateCabinetTab("collectionsPanel");loadList();drawOffers();}
// Version 0.10: manager contact settings
const settingKeys=["name","phone","email","telegram","whatsapp","max","vk"];
let managerPhotoData="";
function showManagerPhoto(data){
 managerPhotoData=data||"";
 const preview=$("managerPhotoPreview"),img=$("managerPhotoPreviewImg"),remove=$("removeManagerPhoto");
 if(managerPhotoData){img.src=managerPhotoData;preview.hidden=false;remove.hidden=false}
 else{img.removeAttribute("src");preview.hidden=true;remove.hidden=true}
}
$("managerPhotoFile").addEventListener("change",async e=>{
 const file=e.target.files?.[0];if(!file)return;
 if(!file.type.startsWith("image/")){$("settingsResult").textContent="Выберите файл изображения.";e.target.value="";return}
 try{
  const source=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error("Не удалось прочитать файл"));reader.readAsDataURL(file)});
  const img=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error("Не удалось открыть изображение"));image.src=source});
  const max=500,scale=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
  canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
  showManagerPhoto(canvas.toDataURL("image/jpeg",.82));
  $("settingsResult").textContent="Фото готово к сохранению. Не забудьте сохранить настройки.";
 }catch(err){$("settingsResult").textContent=err.message}
});
$("removeManagerPhoto").addEventListener("click",()=>{showManagerPhoto("");$("managerPhotoFile").value="";$("settingsResult").textContent="Фото удалено. Сохраните настройки, чтобы применить изменение."});
const settingIds={name:"managerName",phone:"managerPhone",email:"managerEmail",telegram:"managerTelegram",whatsapp:"managerWhatsapp",max:"managerMax",vk:"managerVk"};
async function loadManagerSettings(){
 try{
  const r=await fetch("/api/settings"),s=await r.json();if(!r.ok)throw Error(s.error||"Не удалось загрузить настройки");
  settingKeys.forEach(k=>$(settingIds[k]).value=s[k]||"");if(currentUser.role==="creator")$("creatorAccountUsername").value=currentUser.username;document.querySelectorAll(".manager-social-field").forEach(el=>el.hidden=currentUser.role==="manager"&&!s.allowManagerSocials);showManagerPhoto(s.managerPhoto||"");
 }catch(e){$("settingsResult").textContent="Не удалось загрузить настройки: "+e.message}
}
$("settingsForm").addEventListener("submit",async e=>{
 e.preventDefault();const payload={};settingKeys.forEach(k=>payload[k]=$(settingIds[k]).value.trim());payload.managerPhoto=managerPhotoData;
 const result=$("settingsResult");result.textContent="Сохраняем…";
 try{const r=await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok)throw Error(d.error||"Ошибка сохранения");result.textContent="Персональные настройки сохранены."; }
 catch(err){result.textContent="Не удалось сохранить: "+err.message}
});

$("creatorAccountForm").addEventListener("submit",async e=>{
 e.preventDefault();const f=new FormData(e.currentTarget),result=$("creatorAccountResult");result.textContent="Сохраняем…";
 try{const r=await fetch("/api/account",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:f.get("username"),currentPassword:f.get("currentPassword"),newPassword:f.get("newPassword")})}),d=await r.json();if(!r.ok)throw Error(d.error||"Не удалось изменить учётную запись");currentUser.username=d.user.username;result.textContent="Логин и пароль обновлены.";e.currentTarget.elements.currentPassword.value="";e.currentTarget.elements.newPassword.value="";}
 catch(err){result.textContent="Ошибка: "+err.message}
});
const orgKeys=["companyName","logo","phone","email","telegram","whatsapp","max","vk","address","website"];
const orgIds={companyName:"orgName",logo:"orgLogo",phone:"orgPhone",email:"orgEmail",telegram:"orgTelegram",whatsapp:"orgWhatsapp",max:"orgMax",vk:"orgVk",address:"orgAddress",website:"orgWebsite"};
async function loadOrgSettings(){try{const r=await fetch("/api/organization"),s=await r.json();if(!r.ok)throw Error(s.error);orgKeys.forEach(k=>$(orgIds[k]).value=s[k]||"");$("allowManagerSocials").checked=!!s.allowManagerSocials;$("emailCollectionBcc").checked=!!s.emailCollectionBcc}catch(e){$("orgResult").textContent="Не удалось загрузить: "+e.message}}
$("orgSettingsForm").addEventListener("submit",async e=>{e.preventDefault();const payload={};orgKeys.forEach(k=>payload[k]=$(orgIds[k]).value.trim());payload.allowManagerSocials=$("allowManagerSocials").checked;payload.emailCollectionBcc=$("emailCollectionBcc").checked;const result=$("orgResult");result.textContent="Сохраняем…";try{const r=await fetch("/api/organization",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok)throw Error(d.error);result.textContent="Настройки организации сохранены."}catch(err){result.textContent="Не удалось сохранить: "+err.message}});

function renderClients(){const box=$("clientList"),q=$("clientSearch").value.trim().toLowerCase(),list=clientData.filter(c=>[c.name,c.phone,c.email].join(" ").toLowerCase().includes(q));if(!list.length){box.innerHTML=clientData.length?'<div class="empty-state">Клиенты по запросу не найдены.</div>':'<div class="empty-state">Клиентов пока нет. Нажмите «Создать», чтобы добавить первого.</div>';return}box.innerHTML=list.map(c=>`<div class="client-row"><div><h4>${esc(c.name||"Клиент без имени")}</h4><div class="client-contacts">${c.phone?`<span>Телефон: ${esc(c.phone)}</span>`:""}${c.email?`<span>Email: ${esc(c.email)}</span>`:""}</div></div><small>${new Date(c.createdAt).toLocaleDateString("ru-RU")}</small></div>`).join("")}
async function loadClientOptions(selected=""){const select=$("collectionClientSelect");if(!select||!['admin','manager'].includes(currentUser.role))return;try{const r=await fetch("/api/clients"),data=await r.json();if(!r.ok)throw Error(data.error||"Не удалось загрузить клиентов");select.innerHTML='<option value="">Клиент не выбран</option>'+data.map(c=>`<option value="${esc(c.id)}">${esc(c.name||"Клиент без имени")}${c.phone?" · "+esc(c.phone):""}${c.email?" · "+esc(c.email):""}</option>`).join("");select.value=selected||""}catch(e){select.innerHTML='<option value="">Не удалось загрузить клиентов</option>'}}
async function loadClients(){const box=$("clientList");if(!box)return;box.textContent="Загружаем клиентов…";try{const r=await fetch("/api/clients"),data=await r.json();if(!r.ok)throw Error(data.error||"Не удалось загрузить клиентов");clientData=data;renderClients()}catch(e){box.textContent="Ошибка: "+e.message}}
$("clientSearch").addEventListener("input",renderClients);
$("createClientButton").addEventListener("click",()=>{$("clientCreateForm").hidden=false;$("clientCreateForm").scrollIntoView({behavior:"smooth",block:"nearest"});$("clientCreateForm").elements.name.focus()});
$("cancelClientCreate").addEventListener("click",()=>{$("clientCreateForm").reset();$("clientCreateForm").hidden=true;$("clientCreateResult").textContent=""});
$("clientCreateForm").addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget,data=new FormData(form),result=$("clientCreateResult"),payload={name:data.get("name"),phone:data.get("phone"),email:data.get("email")};if(!Object.values(payload).some(v=>String(v||"").trim())){result.textContent="Заполните хотя бы одно поле.";return}result.textContent="Сохраняем…";try{const r=await fetch("/api/clients",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok)throw Error(d.error||"Не удалось сохранить клиента");result.textContent="Клиент сохранён.";form.reset();await loadClients();await loadClientOptions();}catch(err){result.textContent=err.message}});

async function loadManagers(){
 const box=$("managerList");box.textContent="Загружаем список…";
 try{const r=await fetch("/api/managers"),list=await r.json();if(!r.ok)throw Error(list.error||"Ошибка загрузки");
  if(!list.length){box.innerHTML='<div class="empty">Менеджеры ещё не созданы.</div>';return}
  box.innerHTML=list.map(m=>`<div class="manager-account-row"><div><strong>${esc(m.name||m.username)}</strong><small>Логин: ${esc(m.username)} · ID менеджера: ${esc(m.managerId)} · ID пользователя: ${esc(m.id)}</small><small>Создан: ${new Date(m.createdAt).toLocaleString("ru-RU")}</small></div><span class="meta">Привязан к администратору</span></div>`).join("");
 }catch(e){box.textContent="Не удалось загрузить менеджеров: "+e.message}
}
$("refreshManagers").addEventListener("click",loadManagers);
$("managerCreateForm").addEventListener("submit",async e=>{
 e.preventDefault();const f=new FormData(e.currentTarget),result=$("managerCreateResult");result.textContent="Создаём менеджера…";
 try{const r=await fetch("/api/managers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:f.get("name"),username:f.get("username"),password:f.get("password")})}),d=await r.json();if(!r.ok)throw Error(d.error||"Не удалось создать менеджера");
  result.textContent=`Менеджер создан. Уникальный ID: ${d.user.managerId}`;e.currentTarget.reset();loadManagers();
 }catch(err){result.textContent="Ошибка: "+err.message}
});


const userRoleSelect=$("newUserRole");
function syncNewUserRole(){const manager=userRoleSelect.value==="manager";$("newUserCompanyField").hidden=manager;$("newUserAdminField").hidden=!manager;$("userCreateForm").elements.companyName.required=!manager;$("userCreateForm").elements.adminId.required=manager}
userRoleSelect.addEventListener("change",syncNewUserRole);syncNewUserRole();
let userDirectory=[];
function renderUsers(){
 const box=$("userList");if(!userDirectory.length){box.innerHTML='<div class="empty">Пользователи ещё не созданы.</div>';return}
 box.innerHTML=userDirectory.map(u=>`<div class="manager-account-row"><div><strong>${esc(u.name||u.username)} · ${u.role==="admin"?"Администратор":"Менеджер"}</strong><small>Логин: ${esc(u.username)} · ID пользователя: ${esc(u.id)}</small>${u.role==="manager"?`<small>ID менеджера: ${esc(u.managerId||"")} · Администратор: ${esc(u.adminName||u.adminId)} (${esc(u.adminId)})</small>`:`<small>ID администратора: ${esc(u.id)}</small>`}</div></div>`).join("");
}
async function loadUsers(){
 const box=$("userList");box.textContent="Загружаем пользователей…";
 try{const r=await fetch("/api/users"),d=await r.json();if(!r.ok)throw Error(d.error||"Ошибка загрузки");userDirectory=d;const admins=d.filter(u=>u.role==="admin");$("newUserAdminId").innerHTML='<option value="">Выберите администратора…</option>'+admins.map(a=>`<option value="${esc(a.id)}">${esc(a.name||a.username)} — ${esc(a.id)}</option>`).join("");renderUsers()}
 catch(e){box.textContent="Не удалось загрузить пользователей: "+e.message}
}
$("refreshUsers").addEventListener("click",loadUsers);
$("userCreateForm").addEventListener("submit",async e=>{
 e.preventDefault();const f=new FormData(e.currentTarget),role=f.get("role"),payload={role,name:f.get("name"),username:f.get("username"),password:f.get("password"),companyName:f.get("companyName"),adminId:f.get("adminId")},result=$("userCreateResult");result.textContent="Создаём пользователя…";
 try{const r=await fetch("/api/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok)throw Error(d.error||"Не удалось создать пользователя");result.textContent=`Пользователь создан: ${d.user.name||d.user.username}. ${d.user.role==="manager"?"ID менеджера: "+d.user.managerId+"; привязан к администратору "+d.user.adminId:"ID администратора: "+d.user.id}`;e.currentTarget.reset();syncNewUserRole();await loadUsers()}
 catch(err){result.textContent="Ошибка: "+err.message}
});
let organizationsCache=[];
function drawOrganizations(){
 const query=$("organizationSearch").value.trim().toLocaleLowerCase("ru-RU"),box=$("organizationList");
 const list=organizationsCache.filter(o=>String(o.name||"").toLocaleLowerCase("ru-RU").includes(query));
 if(!list.length){box.innerHTML='<div class="empty">Организации не найдены.</div>';return}
 box.innerHTML=list.map(o=>`<div class="organization-row"><div><h4>${esc(o.name)}</h4><div class="meta">Администратор: ${esc(o.adminName)} · логин: ${esc(o.adminUsername)}</div><div class="organization-contacts"><span>Телефон: ${esc(o.phone||"—")}</span><span>Email: ${esc(o.email||"—")}</span><span>Сайт: ${esc(o.website||"—")}</span><span>Telegram: ${esc(o.telegram||"—")}</span><span>WhatsApp: ${esc(o.whatsapp||"—")}</span><span>MAX: ${esc(o.max||"—")}</span><span>VK: ${esc(o.vk||"—")}</span></div></div></div>`).join("");
}
async function loadOrganizations(){
 const box=$("organizationList");box.textContent="Загружаем организации…";
 try{const r=await fetch("/api/organizations"),d=await r.json();if(!r.ok)throw Error(d.error||"Ошибка загрузки");organizationsCache=d;drawOrganizations()}
 catch(e){box.textContent="Не удалось загрузить организации: "+e.message}
}
$("refreshOrganizations").addEventListener("click",loadOrganizations);
$("organizationSearch").addEventListener("input",drawOrganizations);
$("organizationCreateForm").addEventListener("submit",async e=>{
 e.preventDefault();const f=new FormData(e.currentTarget),payload={};["companyName","adminName","username","password","phone","email","website","telegram","whatsapp","max","vk"].forEach(k=>payload[k]=f.get(k));const result=$("organizationCreateResult");result.textContent="Создаём организацию…";
 try{const r=await fetch("/api/organizations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok)throw Error(d.error||"Не удалось создать организацию");result.textContent="Организация и учётная запись администратора созданы.";e.currentTarget.reset();await loadOrganizations()}
 catch(err){result.textContent="Ошибка: "+err.message}
});
})();
