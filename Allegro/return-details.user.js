// ==UserScript==
// @name        Allegro - show return details
// @namespace   Violentmonkey Scripts
// @match       https://allegro.pl/moje-allegro/zakupy/kupione
// @grant       none
// @version     1.5
// @author      dommilosz
// @description 10/22/2023, 2:13:18 PM
// @updateURL https://github.com/dommilosz/Userscripts/raw/master/Allegro/return-details.user.js
// @downloadURL https://github.com/dommilosz/Userscripts/raw/master/Allegro/return-details.user.js
// ==/UserScript==


async function delay(ms){
  return await new Promise(r=>setTimeout(r, ms));
}

function addProperty(id,title, value, orderDiv){
  let child;
  if(orderDiv.querySelector(`#prop-id-${id}`) != null){
    child = orderDiv.querySelector(`#prop-id-${id}`);
  }else{
    child = document.createElement('div');
    orderDiv.appendChild(child);
  }


  child.innerHTML=`<div id="prop-id-${id}" class="myre_zn myre_8v_l" bis_skin_checked="1"><div class="mpof_ki m7f5_sf m389_a6 _355a6_H7r-d" bis_skin_checked="1"><div class="mpof_ki m389_a6 mwdn_1" bis_skin_checked="1"><p id="total-price-label-bd38004c-1b9e-30ae-81e0-55ec852c7ddd" class="m9qz_yr msa3_z4 mryx_0 mp4t_0 m3h2_8">${title}</p><div class="mpof_ki mr3m_1 mjyo_6x gel0f mh36_0" bis_skin_checked="1"></div></div><div id="total-price-bd38004c-1b9e-30ae-81e0-55ec852c7ddd" class="m9qz_yr" bis_skin_checked="1"><span class="mli8_k4 msa3_z4 mqu1_1 mp0t_0a mgmw_qw mgn2_14">${value}</span></div></div></div>`


}

let details = {};

async function fetchDetails(groupId){
  let detailsRes = await fetch(`https://edge.allegro.pl/myorder-api/myorders/${groupId}`, {
    "headers": {
        "Content-Type": "application/vnd.allegro.public.v3+json",
        "Accept": "application/vnd.allegro.public.v3+json",
    },
    "method": "GET",
});

  let details = (await detailsRes.json()).myorders[0];

  return details;
}


async function processGroup(groupId){
  if(!details[groupId]){
    details[groupId] = await fetchDetails(groupId);
  }
  let group = details[groupId];

  let div = document.querySelector(`#group-id-${group.groupId}`)
  let orderDiv = document.querySelector(`#group-id-${group.groupId}>div>div:has(section)`);

  try{
  addProperty("returns","Returns",group.myorders[0].status.actions.filter(el=>el.type=="RETURN_PRODUCTS")[0].details.filter(el=>el.type=="TEXT").map(el=>el.value).join("<br>"),orderDiv);
}catch{}

  try{
  group.timelines.forEach(waybill=>{
    addProperty("parcel-"+waybill.waybillId, "Parcel", waybill.waybillId, orderDiv);
  })}catch{}

  try{
  group.rescissions.rescissions.forEach(waybill=>{
    addProperty("return-"+waybill.rescissionId, "Return Status", waybill.timelineStatus.label + " " + waybill.timelineStatus.hint, orderDiv);
  })}catch{}

  try{
  addProperty("return-lbl", "Return", group.status.actions.filter(el=>el.type=="RETURN_PRODUCTS")[0].details.filter(el=>el.type=="TEXT").map(el=>el.value).join(" "), orderDiv);
  }catch{}
}

async function main(){
  let autoRun = true;

  while(document.readyState != "complete"){
    await delay(500);
  }

  let groups = [...document.querySelectorAll("div.mryx_16")].filter(el=>el.id.startsWith('group-id-')).map(el=>el.id.replace("group-id-",''));
  groups.forEach(processGroup)

  let orders = [...document.querySelectorAll("#my-orders-listing > span > div")].filter(el=>el.id.startsWith("group-id-"))
  for(let order of orders){
    let url = [...order.querySelectorAll("a")].filter(el=>el.href.includes("/moje-allegro/zakupy/kupione/"))[0].href;
    let group = order.children[0];

    if(document.querySelector("#pending_returns_li_btn")?.checked){
        let content = order.textContent;
        if(content.includes("Decyzja sprzedającego") || content.includes("Przesyłka odebrana") || content.includes("anulowany")){
          order.style.display="none";
        }
      }else if (document.querySelector("#notfull_returns_li_btn")?.checked){
        let content = order.textContent;
        if(!content.includes("Return Status") || content.includes("Pełen zwrot pieniędzy")){
          order.style.display="none";
        }
      }else{
        order.style.display="";
      }
      continue;
  }


  if(!document.querySelector("#pending_returns_li_btn")){
    let li = document.createElement("li");
    li.className = "mp7g_oh mpof_ki mp4t_0 m3h2_8 mryx_8 munh_0";
    li.innerHTML = `<div class="m7er_k4 msa3_z4 _355a6_5yU4X"><input type="radio" name="filter2" id="pending_returns_li_btn" value="returned" class="mp7g_f6 meqh_en mg9e_0 mvrt_0 mj7a_0 mh36_0 m911_5r mefy_5r mnyp_5r mdwl_5r so63mt"><label for="pending_returns_li_btn" class="mjyo_6x mpof_ki myre_zn m7f5_6m m389_6m mg9e_4 mvrt_4 mj7a_4 mh36_4 msbw_2 mldj_2 mtag_2 mm2b_2 mqen_m6 meqh_en m0ux_fp mp5q_jr so1did"><span>In progress</span></label></div>`

    li.onclick = async ()=>{
      li.querySelector("input").click();
    }

    let rg = document.querySelector("ul[role='radiogroup']");
    rg.appendChild(li);

    let li2 = document.createElement("li");
    li2.className = "mp7g_oh mpof_ki mp4t_0 m3h2_8 mryx_8 munh_0";
    li2.innerHTML = `<div class="m7er_k4 msa3_z4 _355a6_5yU4X"><input type="radio" name="filter2" id="notfull_returns_li_btn" value="returned" class="mp7g_f6 meqh_en mg9e_0 mvrt_0 mj7a_0 mh36_0 m911_5r mefy_5r mnyp_5r mdwl_5r so63mt"><label for="notfull_returns_li_btn" class="mjyo_6x mpof_ki myre_zn m7f5_6m m389_6m mg9e_4 mvrt_4 mj7a_4 mh36_4 msbw_2 mldj_2 mtag_2 mm2b_2 mqen_m6 meqh_en m0ux_fp mp5q_jr so1did"><span>Not full return</span></label></div>`

    li2.onclick = async ()=>{
      li2.querySelector("input").click();
    }

    rg.appendChild(li2);

    let li3 = document.createElement("li");
    li3.className = "mp7g_oh mpof_ki mp4t_0 m3h2_8 mryx_8 munh_0";
    li3.innerHTML = `<div class="m7er_k4 msa3_z4 _355a6_5yU4X"><input type="radio" name="filter2" id="clear_li_btn" value="returned" class="mp7g_f6 meqh_en mg9e_0 mvrt_0 mj7a_0 mh36_0 m911_5r mefy_5r mnyp_5r mdwl_5r so63mt"><label for="clear_li_btn" class="mjyo_6x mpof_ki myre_zn m7f5_6m m389_6m mg9e_4 mvrt_4 mj7a_4 mh36_4 msbw_2 mldj_2 mtag_2 mm2b_2 mqen_m6 meqh_en m0ux_fp mp5q_jr so1did"><span>Clear</span></label></div>`

    li3.onclick = async ()=>{
      li3.querySelector("input").checked = false;
    }

    rg.appendChild(li3);
  }
}

setInterval(main, 1000);

main()
