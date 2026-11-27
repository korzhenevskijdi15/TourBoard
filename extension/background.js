"use strict";
async function refreshBadge(){
 try{
  const {offers=[]}=await chrome.storage.local.get({offers:[]});
  const n=offers.length;
  await chrome.action.setBadgeText({text:n?(n>99?"99+":String(n)):""});
  await chrome.action.setBadgeBackgroundColor({color:"#1769e0"});
  await chrome.action.setBadgeTextColor({color:"#ffffff"});
 }catch(e){console.warn("[Tour Selection] badge update failed",e);}
}
chrome.runtime.onInstalled.addListener(refreshBadge);
chrome.runtime.onStartup.addListener(refreshBadge);
chrome.storage.onChanged.addListener((changes,area)=>{
 if(area==="local"&&changes.offers)refreshBadge();
});
refreshBadge();
