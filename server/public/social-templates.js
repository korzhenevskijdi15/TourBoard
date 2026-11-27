(()=>{
 const params=new URLSearchParams(location.search),id=params.get("collectionId"),network=params.get("network")||"social";
 const labels={telegram:"Telegram",whatsapp:"WhatsApp",max:"MAX",vk:"ВКонтакте"};
 const box=document.getElementById("socialTemplateCards"),heading=document.getElementById("socialTemplateTitle");
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 if(!id){box.textContent="Не указана подборка.";return}
 fetch("/api/collections/"+encodeURIComponent(id)).then(r=>{if(!r.ok)throw Error("Подборка не найдена");return r.json()}).then(c=>{
  const link=location.origin+"/c/"+encodeURIComponent(id),offers=c.offers||[],names=offers.slice(0,3).map(o=>o.hotel).filter(Boolean),objects=names.length?names.join(", "):"варианты отдыха",title=c.title||"Подборка отдыха";
  heading.textContent="Варианты текста · "+(labels[network]||"Соц. сеть");
  const variants=[
   {name:"Короткий",text:`Подобрали для вас варианты отдыха: ${objects}.\n\n${title}\n${link}`},
   {name:"Информативный",text:`Предлагаем посмотреть подборку «${title}». Внутри ${offers.length} ${offers.length===1?"вариант":"варианта отдыха"}${names.length?": "+objects:""}.\n\nПодробности и цены по ссылке:\n${link}`},
   {name:"Приглашающий",text:`Пора планировать отдых! ☀️\nСобрали интересные варианты${names.length?": "+objects:""} в подборке «${title}».\n\nПосмотрите подборку и выберите, что подходит именно вам:\n${link}`}
  ];
  box.innerHTML=variants.map((v,i)=>`<article class="social-template-card"><div class="social-template-card-head"><h2>${v.name}</h2><button type="button" data-copy="${i}">Копировать текст</button></div><textarea readonly rows="7">${esc(v.text)}</textarea><span class="social-template-copy-status" aria-live="polite"></span></article>`).join("");
  box.querySelectorAll("[data-copy]").forEach(button=>button.addEventListener("click",async()=>{
   const card=button.closest("article"),text=card.querySelector("textarea").value,status=card.querySelector(".social-template-copy-status");
   try{await navigator.clipboard.writeText(text);status.textContent="Скопировано"}
   catch{const area=card.querySelector("textarea");area.focus();area.select();status.textContent="Выделите текст и скопируйте вручную"}
  }));
 }).catch(e=>{box.textContent=e.message});
})();
