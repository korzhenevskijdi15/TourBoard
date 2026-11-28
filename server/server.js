const http=require("http"),fs=require("fs"),path=require("path"),crypto=require("crypto");
// Load optional server/.env; SMTP credentials never leave the server.
try{for(const line of fs.readFileSync(path.join(__dirname,".env"),"utf8").split(/\r?\n/)){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^(["'])(.*)\1$/,"$2")}}catch{}
let mailTransport=null;
const {promisify}=require("util");
const scrypt=promisify(crypto.scrypt);
const PORT=Number(process.env.PORT||8787),DATA=path.join(__dirname,"data.json"),PUBLIC_URL=String(process.env.PUBLIC_URL||"https://tourboard.online").replace(/\/$/,"");
const sessions=new Map(),SESSION_MS=12*60*60*1000;
const defaultOrganization={emailCollectionBcc:false,companyName:"Рюкзак путешествий",logo:"https://content.btpanel.ru/storage/uploads/2026/11/25/6b06973cdf73b---11--02-1.webp",address:"Республика Крым, ул. Екатерининская, 48, 2 этаж",website:"https://bagtravels.ru/",phone:"+7 978 550-03-00",email:"",telegram:"https://qui-quo.ru/telegram-chat?user-name=%2B79785500300",whatsapp:"",max:"https://max.ru/u/f9LHodD0cOK8RdqaCnUtHKiJmyXJ0IAIXk5Vf3rNh9LRhvKIG94lDfi9ZBc",vk:"https://vk.com/bag_travels"};
const personalKeys=["name","phone","email","telegram","whatsapp","max","vk","managerPhoto"];
const organizationKeys=["companyName","logo","address","website","phone","email","telegram","whatsapp","max","vk"];
const organizationBoolKeys=["allowManagerSocials","emailCollectionBcc"];
function orgIdFor(user){return user.organizationId||user.id}
function orgSettingsFor(db,user){const orgId=orgIdFor(user);return {...defaultOrganization,...(db.organizations?.[orgId]?.settings|| (user.role==="admin"?db.organization:null)||{})}}
function ensureOrganization(db,adminId,settings){db.organizations=db.organizations||{};db.organizations[adminId]=db.organizations[adminId]||{id:adminId,adminId,settings:{...defaultOrganization,...(settings||{})}};db.users[adminId].organizationId=adminId;return db.organizations[adminId]}
function read(){try{return JSON.parse(fs.readFileSync(DATA,"utf8"))}catch{return {collections:{}}}}
function write(db){const tmp=DATA+"."+process.pid+".tmp";fs.writeFileSync(tmp,JSON.stringify(db,null,2),"utf8");fs.renameSync(tmp,DATA)}
function send(res,status,obj,headers={}){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...headers});res.end(JSON.stringify(obj))}
function applyCors(req,res){
 const origin=req.headers.origin||"";
 if(/^chrome-extension:\/\/[a-p]{32}$/.test(origin)||/^http:\/\/(?:localhost|127\.0\.0\.1):8787$/.test(origin)){
  res.setHeader("Access-Control-Allow-Origin",origin);
  res.setHeader("Access-Control-Allow-Credentials","true");
  res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type, X-Tour-Selection");
  res.setHeader("Vary","Origin");
 }
}
// The collection editor copies computed browser styles into the email HTML.
// That can inflate the message to 100+ KB and cause Gmail to clip the footer.
// Keep only properties that materially affect email rendering; discard editor
// layout/debug properties (flex/grid/inset/opacity/etc.) before sending.
const emailStyleProperties=new Set([
 "display","width","max-width","margin","padding","background","background-color",
 "color","font","font-family","font-size","font-weight","font-style","line-height",
 "text-align","text-decoration","vertical-align","border","border-top","border-bottom",
 "border-collapse","table-layout","border-radius","white-space","overflow-wrap"
]);;
function compactEmailHtmlStyles(html){
 return String(html).replace(/\sstyle\s*=\s*(["'])[\s\S]*?\1/gi,(match,quote)=>{
  const raw=match.slice(match.indexOf(quote)+1,-1),kept=[];
  for(const declaration of raw.split(";")){
   const colon=declaration.indexOf(":");if(colon<1)continue;
   const name=declaration.slice(0,colon).trim().toLowerCase(),value=declaration.slice(colon+1).trim();
   if(!emailStyleProperties.has(name)||!value||/expression\s*\(|javascript\s*:/i.test(value))continue;
   kept.push(name+":"+value);
  }
  return kept.length?" style="+quote+kept.join(";")+quote:"";
 });
}
function sendPage(res,file){fs.readFile(path.join(__dirname,"public",file),(err,data)=>{if(err){res.writeHead(404);return res.end("Not found")}res.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"});res.end(data)})}
function body(req){return new Promise((resolve,reject)=>{let b="";req.on("data",c=>{b+=c;if(b.length>10e6)reject(new Error("payload too large"))});req.on("end",()=>{try{resolve(JSON.parse(b||"{}"))}catch{reject(new Error("invalid JSON"))}})})}
function cookie(req,name){const raw=req.headers.cookie||"";const m=raw.match(new RegExp("(?:^|;\\s*)"+name+"=([^;]*)"));return m?decodeURIComponent(m[1]):""}
function currentUser(req){const token=cookie(req,"ts_session"),session=sessions.get(token);if(!session)return null;if(session.expires<Date.now()){sessions.delete(token);return null}const db=read(),user=db.users?.[session.userId];if(!user||user.disabled)return null;session.expires=Date.now()+SESSION_MS;return user}
function setSession(res,user){const token=crypto.randomBytes(32).toString("hex");sessions.set(token,{userId:user.id,expires:Date.now()+SESSION_MS});res.setHeader("Set-Cookie",`ts_session=${token}; HttpOnly; SameSite=None; Secure; Path=/; Max-Age=${SESSION_MS/1000}`)}
function clearSession(req,res){const token=cookie(req,"ts_session");if(token)sessions.delete(token);res.setHeader("Set-Cookie","ts_session=; HttpOnly; SameSite=None; Secure; Path=/; Max-Age=0")}
function requireUser(req,res){const user=currentUser(req);if(!user){send(res,401,{error:"Требуется авторизация"});return null}return user}
function requireAdmin(req,res){const user=requireUser(req,res);if(!user)return null;if(user.role!=="admin"){send(res,403,{error:"Доступно только администратору"});return null}return user}
function safeUser(user){return {id:user.id,username:user.username,role:user.role,managerId:user.managerId||null,adminId:user.adminId||null,name:user.name||"",createdAt:user.createdAt}}
function passwordValid(p){return typeof p==="string"&&p.length>=10&&p.length<=200}
async function passwordHash(password){const salt=crypto.randomBytes(16).toString("hex"),key=await scrypt(password,salt,64);return `scrypt$${salt}$${key.toString("hex")}`}
async function passwordVerify(password,stored){try{const [,salt,hex]=stored.split("$"),key=await scrypt(password,salt,64),expected=Buffer.from(hex,"hex");return expected.length===key.length&&crypto.timingSafeEqual(key,expected)}catch{return false}}
function validateUsername(name){return typeof name==="string"&&((/^[a-zA-Z0-9_.-]{3,40}$/.test(name))||(/^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(name)&&name.length<=120))}
function validSettings(input,keys,base){const out={...base};for(const k of keys){const value=String(input[k]??out[k]??"").trim();out[k]=k==="managerPhoto"?value.slice(0,700000):value.slice(0,500)}for(const k of ["telegram","whatsapp","max","vk","logo","website"]){if(out[k]&&!/^https?:\/\//i.test(out[k]))throw Error(`Для поля ${k} укажите ссылку, начинающуюся с http:// или https://`)}if(out.managerPhoto&&!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(out.managerPhoto))throw Error("Фото менеджера должно быть изображением JPEG, PNG или WebP");if(out.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email))throw Error("Проверьте email");return out}
function migrateLegacy(db,adminId){
 db.collections=db.collections||{};
 for(const item of Object.values(db.collections)){
  if(!item.ownerId){item.ownerId=adminId;item.adminId=adminId;item.managerId=null}
  if(!item.organizationId)item.organizationId=item.adminId||adminId;
 }
 if(!db.users[adminId].settings){const legacy=db.settings||{};db.users[adminId].settings=Object.fromEntries(personalKeys.map(k=>[k,legacy[k]??""]))}
 if(!db.organization){const legacy=db.settings||{};db.organization={...defaultOrganization,...Object.fromEntries(organizationKeys.map(k=>[k,legacy[k]??defaultOrganization[k]]))}}
 ensureOrganization(db,adminId,db.organization);
 if(db.organizations[adminId].settings.allowManagerSocials===undefined)db.organizations[adminId].settings.allowManagerSocials=false;
}
function managerSettingsFor(db,item){const owner=db.users?.[item.ownerId]||db.users?.[item.adminId]||Object.values(db.users||{}).find(u=>u.role==="admin");return {...Object.fromEntries(personalKeys.map(k=>[k,""])),...(owner?.settings||{})}}
function publicSettings(db,item){
 const admin=db.users?.[item.adminId]||db.users?.[item.ownerId]||Object.values(db.users||{}).find(u=>u.role==="admin");
 const organization=admin?orgSettingsFor(db,admin):{...defaultOrganization,...(db.organization||{})};
 const personal=managerSettingsFor(db,item);
 if(!organization.allowManagerSocials&&db.users?.[item.ownerId]?.role==="manager")["telegram","whatsapp","max","vk"].forEach(k=>personal[k]="");
 const result={...organization,...personal};
 for(const key of ["phone","email","telegram","whatsapp","max","vk"]){
  const personalValue=String(personal[key]||"").trim(),organizationValue=String(organization[key]||"").trim();
  result[key]=personalValue||organizationValue;
 }
 return result;
}
function collectionOrganizationId(db,item){
 if(item.organizationId)return item.organizationId;
 if(item.adminId)return item.adminId;
 const owner=db.users?.[item.ownerId];return owner?.role==="admin"?orgIdFor(owner):(owner?.adminId||null);
}
function collectionOwnerAllowed(user,item,db){
 if(user.role==="creator")return true;
 const organizationId=orgIdFor(user.role==="admin"?user:(db.users?.[user.adminId]||user));
 if(collectionOrganizationId(db,item)!==organizationId)return false;
 if(user.role==="admin")return true;
 return user.role==="manager"&&(item.ownerId===user.id||(!item.ownerId&&item.adminId===user.adminId));
}
function safeCollectionList(item,db){const owner=db.users?.[item.ownerId],client=db.clients?.[item.clientId];return {id:item.id,title:item.title,offerCount:(item.offers||[]).length,createdAt:item.createdAt,updatedAt:item.updatedAt,managerId:item.managerId||null,managerName:owner?.role==="manager"?(owner.name||owner.username):"Администратор",clientId:item.clientId||null,client:client?{id:client.id,name:client.name||"",phone:client.phone||"",email:client.email||""}:null}}
function validateCollectionClient(db,user,clientId){if(!clientId)return null;const adminId=user.role==="admin"?user.id:user.adminId,client=db.clients?.[clientId];if(!client||client.adminId!==adminId)throw Error("Выберите клиента из списка вашей организации");return clientId}
const app=http.createServer(async(req,res)=>{
 applyCors(req,res);
 if(req.method==="OPTIONS"){res.writeHead(204);return res.end()}
 const u=new URL(req.url,"http://localhost"),db=read();
 if(req.method==="GET"&&u.pathname==="/api/auth/status")return send(res,200,{setupRequired:!Object.values(db.users||{}).some(x=>x.role==="admin")&&!Object.values(db.users||{}).some(x=>x.role==="creator")});
 if(req.method==="POST"&&u.pathname==="/api/auth/setup"){
  try{const input=await body(req);if(Object.values(db.users||{}).some(x=>x.role==="admin"))return send(res,409,{error:"Администратор уже создан. Войдите в систему."});
   if(Object.values(db.users||{}).some(x=>x.role==="creator"))return send(res,403,{error:"Первого администратора создаёт пользователь «Создатель». Войдите под его учётной записью."});
   if(!validateUsername(input.username))return send(res,400,{error:"Логин: 3–40 символов или корректный Email"});
   if(!passwordValid(input.password))return send(res,400,{error:"Пароль должен содержать не менее 10 символов"});
   db.users=db.users||{};const id="admin";const user={id,username:input.username.toLowerCase(),passwordHash:await passwordHash(input.password),role:"admin",managerId:null,adminId:null,organizationId:id,name:String(input.name||"Администратор").trim().slice(0,150),settings:{...Object.fromEntries(personalKeys.map(k=>[k,(db.settings?.[k]??defaultOrganization[k]??"")])),name:String(input.name||db.settings?.name||"").trim()},createdAt:new Date().toISOString()};
   if(Object.values(db.users).some(x=>x.username===user.username))return send(res,409,{error:"Такой логин уже существует"});
   db.users[id]=user;migrateLegacy(db,id);write(db);setSession(res,user);return send(res,201,{user:safeUser(user)});
  }catch(e){return send(res,400,{error:e.message})}
 }
 if(req.method==="POST"&&u.pathname==="/api/auth/login"){
  try{const input=await body(req),username=String(input.username||"").trim().toLowerCase(),user=Object.values(db.users||{}).find(x=>x.username===username);
   if(!user||user.disabled||!(await passwordVerify(String(input.password||""),user.passwordHash)))return send(res,401,{error:"Неверный логин или пароль"});
   setSession(res,user);return send(res,200,{user:safeUser(user)});
  }catch(e){return send(res,400,{error:e.message})}
 }
 if(req.method==="POST"&&u.pathname==="/api/auth/logout"){clearSession(req,res);return send(res,200,{ok:true})}
 if(req.method==="GET"&&u.pathname==="/api/auth/me"){const user=currentUser(req);return user?send(res,200,{user:safeUser(user)}):send(res,401,{error:"Не авторизован"})}
 if(req.method==="GET"&&u.pathname==="/api/users"){
  const user=requireUser(req,res);if(!user)return;if(user.role!=="creator")return send(res,403,{error:"Доступно только Создателю"});
  const users=Object.values(db.users||{}).filter(x=>x.role==="admin"||x.role==="manager").map(x=>({...safeUser(x),adminName:x.role==="manager"?(db.users?.[x.adminId]?.name||db.users?.[x.adminId]?.username||""): ""}));
  return send(res,200,users)
 }
 if(req.method==="POST"&&u.pathname==="/api/users"){
  const user=requireUser(req,res);if(!user)return;if(user.role!=="creator")return send(res,403,{error:"Доступно только Создателю"});
  try{
   const input=await body(req),role=String(input.role||""),username=String(input.username||"").trim().toLowerCase(),name=String(input.name||"").trim().slice(0,150);
   if(!["admin","manager"].includes(role))return send(res,400,{error:"Можно создать только Администратора или Менеджера"});
   if(!name)return send(res,400,{error:"Укажите имя пользователя"});
   if(!validateUsername(username))return send(res,400,{error:"Логин: 3–40 символов или корректный Email"});
   if(!passwordValid(input.password))return send(res,400,{error:"Пароль должен содержать не менее 10 символов"});
   if(Object.values(db.users||{}).some(x=>x.username===username))return send(res,409,{error:"Такой логин уже существует"});
   const id=role+"_"+crypto.randomBytes(12).toString("hex"),createdAt=new Date().toISOString();
   if(role==="admin"){
    const companyName=String(input.companyName||"").trim().slice(0,180);
    if(!companyName)return send(res,400,{error:"Укажите название организации администратора"});
    const admin={id,username,passwordHash:await passwordHash(input.password),role:"admin",managerId:null,adminId:null,organizationId:id,name,settings:{...Object.fromEntries(personalKeys.map(k=>[k,""])),name},createdAt};
    db.users=db.users||{};db.users[id]=admin;
    db.organizations=db.organizations||{};db.organizations[id]={id,adminId:id,settings:{...defaultOrganization,companyName}};
    write(db);return send(res,201,{user:safeUser(admin)})
   }
   const adminId=String(input.adminId||"").trim(),admin=db.users?.[adminId];
   if(!admin||admin.role!=="admin")return send(res,400,{error:"Укажите действующий ID администратора"});
   let managerId="M-"+crypto.randomBytes(4).toString("hex").toUpperCase();
   while(Object.values(db.users||{}).some(x=>x.managerId===managerId))managerId="M-"+crypto.randomBytes(4).toString("hex").toUpperCase();
   const manager={id,username,passwordHash:await passwordHash(input.password),role:"manager",managerId,adminId:admin.id,name,settings:{...Object.fromEntries(personalKeys.map(k=>[k,""])),name},createdAt};
   db.users=db.users||{};db.users[id]=manager;write(db);return send(res,201,{user:safeUser(manager)})
  }catch(e){return send(res,400,{error:e.message})}
 }
 if(req.method==="GET"&&u.pathname==="/api/organizations"){
  const user=requireUser(req,res);if(!user)return;if(user.role!=="creator")return send(res,403,{error:"Доступно только Создателю"});
  const admins=Object.values(db.users||{}).filter(x=>x.role==="admin");
  const organizations=admins.map(admin=>{const settings=orgSettingsFor(db,admin);return {id:orgIdFor(admin),name:settings.companyName||"Организация без названия",adminName:admin.name||admin.username,adminUsername:admin.username,phone:settings.phone||"",email:settings.email||"",website:settings.website||"",telegram:settings.telegram||"",whatsapp:settings.whatsapp||"",max:settings.max||"",vk:settings.vk||""}});
  return send(res,200,organizations)
 }
 if(req.method==="POST"&&u.pathname==="/api/organizations"){
  const user=requireUser(req,res);if(!user)return;if(user.role!=="creator")return send(res,403,{error:"Доступно только Создателю"});
  try{const input=await body(req),username=String(input.username||"").trim().toLowerCase(),name=String(input.adminName||"Администратор").trim().slice(0,150);
   if(!String(input.companyName||"").trim())return send(res,400,{error:"Укажите название организации"});
   if(!validateUsername(username))return send(res,400,{error:"Логин администратора: 3–40 символов или корректный Email"});
   if(!passwordValid(input.password))return send(res,400,{error:"Пароль должен содержать не менее 10 символов"});
   if(Object.values(db.users||{}).some(x=>x.username===username))return send(res,409,{error:"Такой логин уже существует"});
   const id="admin_"+crypto.randomBytes(12).toString("hex"),settings=validSettings(input,organizationKeys,{...defaultOrganization,companyName:String(input.companyName).trim()});
   const admin={id,username,passwordHash:await passwordHash(input.password),role:"admin",managerId:null,adminId:null,organizationId:id,name,settings:{...Object.fromEntries(personalKeys.map(k=>[k,""])),name},createdAt:new Date().toISOString()};
   db.users=db.users||{};db.users[id]=admin;db.organizations=db.organizations||{};db.organizations[id]={id,adminId:id,settings:{...settings,allowManagerSocials:!!input.allowManagerSocials}};write(db);return send(res,201,{id,organization:db.organizations[id]});
  }catch(e){return send(res,400,{error:e.message})}
 }
 if(req.method==="GET"&&u.pathname==="/api/managers"){
  const user=requireAdmin(req,res);if(!user)return;return send(res,200,Object.values(db.users||{}).filter(x=>x.role==="manager"&&x.adminId===user.id).map(safeUser))
 }
 const managerDeleteMatch=u.pathname.match(/^\/api\/managers\/([^/]+)$/);
if(req.method==="DELETE"&&managerDeleteMatch){
 const admin=requireAdmin(req,res);if(!admin)return;
 const managerId=decodeURIComponent(managerDeleteMatch[1]),manager=db.users?.[managerId];
 if(!manager||manager.role!=="manager"||manager.adminId!==admin.id)return send(res,404,{error:"Менеджер не найден"});
 for(const item of Object.values(db.collections||{})){
  if(item.ownerId===manager.id){item.ownerId=admin.id;item.createdBy=admin.id;item.adminId=admin.id;item.organizationId=item.organizationId||orgIdFor(admin);item.managerId=null}
 }
 delete db.users[manager.id];
 for(const [token,session] of sessions){if(session.userId===manager.id)sessions.delete(token)}
 write(db);return send(res,200,{ok:true});
}
if(req.method==="POST"&&u.pathname==="/api/managers"){
  const admin=requireAdmin(req,res);if(!admin)return;
  try{const input=await body(req),username=String(input.username||"").trim().toLowerCase(),name=String(input.name||"").trim().slice(0,150);
   if(!validateUsername(username))return send(res,400,{error:"Логин: 3–40 символов или корректный Email"});
   if(!passwordValid(input.password))return send(res,400,{error:"Пароль должен содержать не менее 10 символов"});
   if(Object.values(db.users||{}).some(x=>x.username===username))return send(res,409,{error:"Такой логин уже существует"});
   const id="manager_"+crypto.randomBytes(12).toString("hex");let managerId="M-"+crypto.randomBytes(4).toString("hex").toUpperCase();while(Object.values(db.users||{}).some(x=>x.managerId===managerId))managerId="M-"+crypto.randomBytes(4).toString("hex").toUpperCase();
   const manager={id,username,passwordHash:await passwordHash(input.password),role:"manager",managerId,adminId:admin.id,name,settings:{...Object.fromEntries(personalKeys.map(k=>[k,""])),name},createdAt:new Date().toISOString()};
   db.users[id]=manager;write(db);return send(res,201,{user:safeUser(manager)});
  }catch(e){return send(res,400,{error:e.message})}
 }
 if(req.method==="GET"&&u.pathname==="/api/extension/branding"){
  const organization={...defaultOrganization,...(db.organization||{})};
  return send(res,200,{companyName:organization.companyName||"",logo:organization.logo||""});
 }
 if(req.method==="POST"&&u.pathname==="/api/account"){
  const user=requireUser(req,res);if(!user)return;if(user.role!=="creator")return send(res,403,{error:"Изменять логин и пароль может только Создатель"});
  try{
   const input=await body(req),currentPassword=String(input.currentPassword||""),username=String(input.username||"").trim().toLowerCase(),newPassword=String(input.newPassword||"");
   if(!(await passwordVerify(currentPassword,user.passwordHash)))return send(res,401,{error:"Текущий пароль указан неверно"});
   if(!validateUsername(username))return send(res,400,{error:"Логин: 3–40 символов или корректный Email"});
   if(Object.values(db.users||{}).some(x=>x.id!==user.id&&x.username===username))return send(res,409,{error:"Такой логин уже существует"});
   if(newPassword&&!passwordValid(newPassword))return send(res,400,{error:"Новый пароль должен содержать не менее 10 символов"});
   const stored=db.users[user.id];stored.username=username;if(newPassword)stored.passwordHash=await passwordHash(newPassword);write(db);for(const [token,session] of sessions){if(session.userId===user.id)sessions.delete(token)}setSession(res,stored);return send(res,200,{ok:true,user:safeUser(stored)});
  }catch(e){return send(res,400,{error:e.message})}
 }
 if(req.method==="POST"&&u.pathname==="/api/account/password"){
  const user=requireUser(req,res);if(!user)return;
  if(user.role==="creator")return send(res,403,{error:"Для Создателя изменение пароля доступно в настройках учётной записи"});
  try{
   const input=await body(req),currentPassword=String(input.currentPassword||""),newPassword=String(input.newPassword||""),confirmPassword=String(input.confirmPassword||"");
   if(!(await passwordVerify(currentPassword,user.passwordHash)))return send(res,401,{error:"Текущий пароль указан неверно"});
   if(!passwordValid(newPassword))return send(res,400,{error:"Новый пароль должен содержать от 10 до 200 символов"});
   if(newPassword!==confirmPassword)return send(res,400,{error:"Новые пароли не совпадают"});
   const stored=db.users?.[user.id];if(!stored)return send(res,404,{error:"Пользователь не найден"});
   stored.passwordHash=await passwordHash(newPassword);write(db);
   for(const [token,session] of sessions){if(session.userId===user.id)sessions.delete(token)}
   setSession(res,stored);return send(res,200,{ok:true});
  }catch(e){return send(res,400,{error:e.message})}
 }
 if(req.method==="GET"&&u.pathname==="/api/settings"){
  const user=requireUser(req,res);if(!user)return;
  const settings={...Object.fromEntries(personalKeys.map(k=>[k,""])),...(user.settings||{})};
  settings.allowManagerSocials= user.role==="manager" ? !!orgSettingsFor(db,db.users?.[user.adminId]||user).allowManagerSocials : true;
  return send(res,200,settings);
 }
 if(req.method==="POST"&&u.pathname==="/api/settings"){
  const user=requireUser(req,res);if(!user)return;
  try{const input=await body(req);const allowedInput={...input};if(user.role==="manager"&&!orgSettingsFor(db,db.users?.[user.adminId]||user).allowManagerSocials){["telegram","whatsapp","max","vk"].forEach(k=>allowedInput[k]="")}
   db.users[user.id].settings=validSettings(allowedInput,personalKeys,{...Object.fromEntries(personalKeys.map(k=>[k,""])),...(db.users[user.id].settings||{})});write(db);return send(res,200,{ok:true,settings:db.users[user.id].settings})}catch(e){return send(res,400,{error:e.message})}
 }
 if(req.method==="GET"&&u.pathname==="/api/organization"){
  const user=requireAdmin(req,res);if(!user)return;return send(res,200,orgSettingsFor(db,user));
 }
 if(req.method==="POST"&&u.pathname==="/api/organization"){
  const user=requireAdmin(req,res);if(!user)return;
  try{const input=await body(req);const settings=validSettings(input,organizationKeys,orgSettingsFor(db,user));organizationBoolKeys.forEach(k=>settings[k]=!!input[k]);const org=ensureOrganization(db,user.id,settings);org.settings=settings;db.organization=settings;write(db);return send(res,200,{ok:true,settings})}catch(e){return send(res,400,{error:e.message})}
 }
 if(req.method==="GET"&&u.pathname==="/api/public/settings"){
  const id=u.searchParams.get("collectionId"),item=db.collections?.[id];if(!item)return send(res,404,{error:"Подборка не найдена"});return send(res,200,publicSettings(db,item))
 }
 if(req.method==="GET"&&u.pathname==="/api/clients"){
  const user=requireUser(req,res);if(!user)return;
  if(!["admin","manager"].includes(user.role))return send(res,403,{error:"Раздел доступен Менеджеру и Администратору"});
  const adminId=user.role==="admin"?user.id:user.adminId;
  const clients=Object.values(db.clients||{}).filter(x=>x.adminId===adminId).sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
  return send(res,200,clients.map(x=>({id:x.id,name:x.name,phone:x.phone,email:x.email,createdAt:x.createdAt})));
 }
 if(req.method==="POST"&&u.pathname==="/api/clients"){
  const user=requireUser(req,res);if(!user)return;
  if(!["admin","manager"].includes(user.role))return send(res,403,{error:"Раздел доступен Менеджеру и Администратору"});
  try{
   const input=await body(req),name=String(input.name||"").trim().slice(0,150),phone=String(input.phone||"").trim().slice(0,80),email=String(input.email||"").trim().slice(0,150);
   if(!name&&!phone&&!email)return send(res,400,{error:"Заполните хотя бы одно поле: имя, телефон или Email"});
   if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return send(res,400,{error:"Проверьте Email клиента"});
   const adminId=user.role==="admin"?user.id:user.adminId;
   if(!adminId||!db.users?.[adminId]||db.users[adminId].role!=="admin")return send(res,400,{error:"Не удалось определить организацию клиента"});
   db.clients=db.clients||{};const id="client_"+crypto.randomBytes(12).toString("hex"),client={id,adminId,name,phone,email,createdBy:user.id,createdAt:new Date().toISOString()};
   db.clients[id]=client;write(db);return send(res,201,{id,name,phone,email,createdAt:client.createdAt});
  }catch(e){return send(res,400,{error:e.message})}
 }
 if(req.method==="PATCH"&&u.pathname.startsWith("/api/clients/")){
  const user=requireUser(req,res);if(!user)return;if(!["admin","manager"].includes(user.role))return send(res,403,{error:"Раздел доступен Менеджеру и Администратору"});
  const clientId=decodeURIComponent(u.pathname.split("/").pop()),client=db.clients?.[clientId];if(!client)return send(res,404,{error:"Клиент не найден"});
  const adminId=user.role==="admin"?user.id:user.adminId;if(client.adminId!==adminId)return send(res,403,{error:"Нет доступа к этому клиенту"});
  try{const input=await body(req),collection=db.collections?.[String(input.collectionId||"")];if(!collection||collection.clientId!==clientId||!collectionOwnerAllowed(user,collection))return send(res,403,{error:"Клиент не связан с доступной вам подборкой"});const email=String(input.email||"").trim().slice(0,150);if(!email)return send(res,400,{error:"Укажите Email клиента"});if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return send(res,400,{error:"Проверьте Email клиента"});client.email=email;client.updatedAt=new Date().toISOString();write(db);return send(res,200,{id:client.id,name:client.name||"",phone:client.phone||"",email:client.email,updatedAt:client.updatedAt})}catch(e){return send(res,400,{error:e.message})}
 }
 if(req.method==="POST"&&/^\/api\/collections\/[^/]+\/email$/.test(u.pathname)){
  const user=requireUser(req,res);if(!user)return;
  try{
   const id=decodeURIComponent(u.pathname.split("/")[3]),item=db.collections?.[id];
   if(!item)return send(res,404,{error:"Подборка не найдена"});
   if(!collectionOwnerAllowed(user,item,db))return send(res,403,{error:"Нет прав на отправку этой подборки"});
   const input=await body(req),to=String(input.to||"").trim(),subject=String(input.subject||"").trim().slice(0,200);
   let html=String(input.html||"");
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))return send(res,400,{error:"Укажите корректный Email получателя"});
   if(!subject)return send(res,400,{error:"Укажите тему письма"});
   if(!html||html.length>8000000)return send(res,400,{error:"Письмо пустое или слишком большое (максимум 8 МБ)"});
   const smtpHost=process.env.SMTP_HOST||"smtp.spaceweb.ru",smtpPort=Number(process.env.SMTP_PORT||465),smtpUser=process.env.SMTP_USER||"offers@tourboard.online",smtpPass=process.env.SMTP_PASS;
   if(!smtpPass)return send(res,503,{error:"SMTP не настроен на сервере: задайте SMTP_PASS в server/.env"});
   let nodemailer;try{nodemailer=require("nodemailer")}catch{return send(res,503,{error:"Не установлен Nodemailer. Выполните npm install в папке server"})}
   if(!mailTransport)mailTransport=nodemailer.createTransport({host:smtpHost,port:smtpPort,secure:String(process.env.SMTP_SECURE||"true").toLowerCase()==="true",auth:{user:smtpUser,pass:smtpPass},connectionTimeout:15000,greetingTimeout:15000,socketTimeout:30000});
   // Compact the editor-generated computed CSS before transport.
   html=compactEmailHtmlStyles(html);
   html=html.replace(/>\s+</g, "><").replace(/<!--[\s\S]*?-->/g, "");
   // Host inline editor images as public HTTPS files instead of attaching
   // base64/MIME parts. This keeps the .eml small; recipients load images
   // from the application's HTTPS domain.
   const emailImageDir=path.join(__dirname,"public","email-images");
   fs.mkdirSync(emailImageDir,{recursive:true});
   let imageIndex=0;
   html=html.replace(/\bsrc\s*=\s*(["'])\s*data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/=\r\n]+)\s*\1/gi,(match,quote,type,data)=>{
    const bytes=Buffer.from(data.replace(/\\s+/g,""),"base64");
    if(!bytes.length||bytes.length>5*1024*1024)return 'src="#"';
    const ext=type==="jpeg"?"jpg":type;
    const filename=`email-${Date.now()}-${crypto.randomBytes(12).toString("hex")}-${++imageIndex}.${ext}`;
    fs.writeFileSync(path.join(emailImageDir,filename),bytes,{flag:"wx"});
    return `src="${PUBLIC_URL}/email-images/${filename}"`;
   });
   // Aggregator photos remain HTTPS URLs in the HTML, not email attachments.
   html=html.replace(/<\s*(script|iframe|object|embed|form|input|button|textarea|video|audio)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,"").replace(/<\s*(script|iframe|object|embed|form|input|button|textarea|video|audio)[^>]*\/?\s*>/gi,"");
   html=html.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,"").replace(/(href|src)\s*=\s*(["'])\s*(javascript:|vbscript:)[\s\S]*?\2/gi,'$1="#"');
   const adminId=user.role==="admin"?user.id:user.adminId,admin=db.users?.[adminId],settings=admin?orgSettingsFor(db,admin):{...defaultOrganization,...(db.organization||{})};
   const from=process.env.SMTP_FROM||'Tour Selection <offers@tourboard.online>',replyTo=settings.email||undefined,bcc=settings.emailCollectionBcc&&settings.email?settings.email:undefined;
   const text=html.replace(/<\/\s*(p|div|tr|h[1-6])\s*>/gi,"\n").replace(/<br\s*\/?\s*>/gi,"\n").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s{2,}/g," ").trim();
   const info=await mailTransport.sendMail({from,to,subject,html,text,replyTo,bcc});
   return send(res,200,{ok:true,messageId:info.messageId,accepted:info.accepted});
  }catch(e){console.error("Collection email error:",e.code||"",e.message);return send(res,502,{error:e.code==="EAUTH"?"SMTP не принял логин или пароль. Проверьте SMTP_USER и SMTP_PASS.":e.code==="ETIMEDOUT"||e.code==="ECONNECTION"?"Не удалось подключиться к SMTP-серверу. Проверьте SMTP_HOST, порт и TLS.":e.message||"Не удалось отправить письмо"})}
 }
 if(req.method==="GET"&&u.pathname==="/api/collections"){
  const user=requireUser(req,res);if(!user)return;
  const organizationId=orgIdFor(user.role==="admin"?user:(db.users?.[user.adminId]||user));
  const items=Object.values(db.collections||{}).filter(x=>user.role==="creator"||(collectionOrganizationId(db,x)===organizationId&&(user.role==="admin"||x.ownerId===user.id))).sort((a,b)=>String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt)));
  return send(res,200,items.map(item=>safeCollectionList(item,db)))
 }
 if(req.method==="DELETE"&&u.pathname.startsWith("/api/collections/")){
  const user=requireUser(req,res);if(!user)return;const id=decodeURIComponent(u.pathname.split("/").pop()),item=db.collections[id];
  if(!item)return send(res,404,{error:"Подборка не найдена"});if(!collectionOwnerAllowed(user,item,db))return send(res,403,{error:"Нет прав на эту подборку"});
  delete db.collections[id];write(db);return send(res,200,{ok:true});
 }
 if(req.method==="POST"&&u.pathname==="/api/collections"){
  const user=requireUser(req,res);if(!user)return;
  try{const input=await body(req),id=crypto.randomBytes(6).toString("hex"),allowedTemplates=["detailed","simple","tearoff","cards-scroll","modern","travel"];
   if(["admin","manager"].includes(user.role)&&!input.clientId)return send(res,400,{error:"Выберите клиента для подборки"});const clientId=validateCollectionClient(db,user,input.clientId);const item={id,title:String(input.title||"Моя подборка").slice(0,150),clientId,template:allowedTemplates.includes(input.template)?input.template:"modern",offers:Array.isArray(input.offers)?input.offers:[],ownerId:user.id,adminId:user.role==="admin"?user.id:user.adminId,organizationId:orgIdFor(user.role==="admin"?user:(db.users?.[user.adminId]||user)),managerId:user.managerId||null,createdBy:user.id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
   db.collections=db.collections||{};db.collections[id]=item;write(db);return send(res,201,{id,url:`${PUBLIC_URL}/c/${id}`,collection:item})
  }catch(e){return send(res,400,{error:e.message})}
 }
 if(req.method==="GET"&&u.pathname.startsWith("/api/collections/")){
  const id=decodeURIComponent(u.pathname.split("/").pop()),item=db.collections?.[id];return item?send(res,200,item):send(res,404,{error:"Подборка не найдена"})
 }
 if(req.method==="PATCH"&&u.pathname.startsWith("/api/collections/")&&u.pathname!=="/api/collections/"){
  const user=requireUser(req,res);if(!user)return;if(!["admin","manager"].includes(user.role))return send(res,403,{error:"Изменять шаблон могут Менеджер и Администратор"});
  const id=decodeURIComponent(u.pathname.split("/").pop()),item=db.collections?.[id];if(!item)return send(res,404,{error:"Подборка не найдена"});if(!collectionOwnerAllowed(user,item,db))return send(res,403,{error:"Нет прав на эту подборку"});
  try{const input=await body(req),allowedTemplates=["detailed","simple","tearoff","cards-scroll","modern","travel"];if(!allowedTemplates.includes(input.template))return send(res,400,{error:"Неизвестный шаблон"});item.template=input.template;item.updatedAt=new Date().toISOString();write(db);return send(res,200,{ok:true,template:item.template,updatedAt:item.updatedAt})}catch(e){return send(res,400,{error:e.message})}
 }
 if(req.method==="POST"&&u.pathname.startsWith("/api/collections/")){
  const user=requireUser(req,res);if(!user)return;const id=decodeURIComponent(u.pathname.split("/").pop());
  try{const input=await body(req),item=db.collections?.[id];if(!item)return send(res,404,{error:"Подборка не найдена"});if(!collectionOwnerAllowed(user,item,db))return send(res,403,{error:"Нет прав на эту подборку"});
   item.title=String(input.title||item.title).slice(0,150);if(Object.prototype.hasOwnProperty.call(input,"clientId")){if(["admin","manager"].includes(user.role)&&!input.clientId)return send(res,400,{error:"Выберите клиента для подборки"});item.clientId=validateCollectionClient(db,user,input.clientId);}const allowedTemplates=["detailed","simple","tearoff","cards-scroll","modern","travel"];if(allowedTemplates.includes(input.template))item.template=input.template;item.offers=Array.isArray(input.offers)?input.offers:item.offers;item.updatedAt=new Date().toISOString();write(db);return send(res,200,item)
  }catch(e){return send(res,400,{error:e.message})}
 }
 if(req.method==="GET"&&(u.pathname==="/"||u.pathname==="/cabinet"||u.pathname==="/edit"||u.pathname.startsWith("/edit/"))){
  const hasAdmin=Object.values(db.users||{}).some(x=>x.role==="admin"),user=currentUser(req);
  return sendPage(res,user?"cabinet.html":(hasAdmin?"login.html":"setup.html"))
 }
 if(req.method==="GET"&&u.pathname==="/login")return sendPage(res,"login.html");
 if(req.method==="GET"&&u.pathname==="/setup")return sendPage(res,Object.values(db.users||{}).some(x=>x.role==="creator")?"login.html":"setup.html");
 if(req.method==="GET"&&u.pathname==="/social-templates")return sendPage(res,"social-templates.html");
 if(req.method==="GET"&&u.pathname.startsWith("/c/"))return sendPage(res,"client.html");
 let file=u.pathname.replace(/^\/+/,"");const full=path.resolve(__dirname,"public",file);
 if(!full.startsWith(path.resolve(__dirname,"public")+path.sep)){res.writeHead(403);return res.end("Forbidden")}
 fs.readFile(full,(err,data)=>{if(err){res.writeHead(404);return res.end("Not found")}res.writeHead(200,{"Content-Type":({".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8"})[path.extname(full)]||"application/octet-stream"});res.end(data)});
});
async function provisionCreator(){
 const db=read();db.users=db.users||{};
 let creator=Object.values(db.users).find(x=>x.role==="creator");
 if(!creator){
  const id="creator_master";
  creator={id,username:"korzhenevskij.d.i15@gmail.com",passwordHash:await passwordHash("1234567890"),role:"creator",managerId:null,adminId:null,organizationId:null,name:"Создатель",settings:{},createdAt:new Date().toISOString()};
  db.users[id]=creator;db.creatorAccountProvisioned=true;write(db);return;
 }
 if(!db.creatorAccountProvisioned){
  const desired="korzhenevskij.d.i15@gmail.com",collision=Object.values(db.users).find(x=>x.id!==creator.id&&x.username===desired);
  if(collision)throw new Error("Не удалось назначить стандартный логин Создателя: он занят другой учётной записью");
  creator.username=desired;creator.passwordHash=await passwordHash("1234567890");db.creatorAccountProvisioned=true;write(db);
 }
}
provisionCreator().then(()=>app.listen(PORT,()=>console.log(`Tour Selection server: http://localhost:${PORT}`))).catch(e=>{console.error("Creator account initialization failed:",e);process.exit(1)});
