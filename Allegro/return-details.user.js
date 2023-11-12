// ==UserScript==
// @name        Allegro - show return details
// @namespace   Violentmonkey Scripts
// @match       https://allegro.pl/moje-allegro/zakupy/kupione
// @grant       none
// @version     1.3
// @author      dommilosz
// @description 10/22/2023, 2:13:18 PM
// @updateURL https://github.com/dommilosz/Userscripts/raw/master/Allegro/return-details.user.js
// @downloadURL https://github.com/dommilosz/Userscripts/raw/master/Allegro/return-details.user.js
// ==/UserScript==


async function delay(ms){
  return await new Promise(r=>setTimeout(r, ms));
}

function getReturnInfo(el){
  let returnStatus = el.querySelector("#opbox-myorder-returns > div > div > div > div");
  let returnTimes = [...(el.querySelector(`button[data-button-type="return"]`).parentNode.querySelectorAll("span"))];

  let returnTime = document.createElement("div");
  returnTime.style.display = "flex";
  returnTime.style.flexDirection = "column";
  returnTimes.forEach(el=>{
    returnTime.appendChild(el)
  })

  if(!returnStatus){
    returnStatus = document.createElement("div");
    returnStatus.outerHTML = `<div class="mpof_ki mwdn_1 mr3m_1 gvl9v">Brak zwrotu</div>`
  }

  returnStatus.className = "mpof_ki mwdn_1 mr3m_1 gvl9v msts_pt munh_0 mj7a_16 mg9e_16 m389_6m";

  returnStatus.appendChild(returnTime);
  returnTime.className = "mpof_ki mr3m_1 mjyo_6x gel0f";

  return returnStatus;
}

async function loadDetails(url){
  let details = await (await fetch(url)).text();
  var el = document.createElement( 'html' );
  el.innerHTML = details;
  window.el = el;

  let banner = document.createElement("div");

  let returnInfo = getReturnInfo(el);

  banner.appendChild(returnInfo);

  return  banner;
}

async function main(){
  let autoRun = true;

  while(document.readyState != "complete"){
    await delay(500);
  }

  let orders = [...document.querySelectorAll("#my-orders-listing > span > div")].filter(el=>el.id.startsWith("group-id-"))
  for(let order of orders){
    let url = [...order.querySelectorAll("a")].filter(el=>el.href.includes("/moje-allegro/zakupy/kupione/"))[0].href;
    let group = order.children[0];

    if(group.className.includes("button-added")){
      if(document.querySelector("#pending_returns_li_btn")?.checked){
        let content = order.textContent;
        if(content.includes("Zwrot zakończony") || content.includes("Przesyłka odebrana")){
          order.style.display="none";
        }
      }else{
        order.style.display="";
      }
      continue;
    }
    group.classList.add("button-added");

    let button = document.createElement("button");
    button.innerHTML = "Fetch details";
    button.onclick = ftch;

    let header = order.querySelector("div:nth-child(1) > div:nth-child(1) > div:nth-child(2)");
    header.appendChild(button);

    async function ftch(){
      let banner = await loadDetails(url, header.parentNode);

      let childBefore = group.children[1];

      group.insertBefore(banner, childBefore);
      let hr = document.createElement("hr");
      hr.className = `mpof_z0 m7er_k4 mp4t_0 m3h2_0 mryx_0 munh_0 m911_5r mefy_5r mnyp_5r mdwl_5r mse2_1 msts_me`
      group.insertBefore(hr, banner);
      button.style.display = "none";
    }
    if(autoRun){
      ftch();
    }
  }

  if(!document.querySelector("#pending_returns_li_btn")){
    let li = document.createElement("li");
    li.className = "mp7g_oh mpof_ki mp4t_0 m3h2_8 mryx_8 munh_0";
    li.innerHTML = `<div class="m7er_k4 msa3_z4 _355a6_5yU4X"><input type="checkbox" name="filter2" id="pending_returns_li_btn" value="returned" class="mp7g_f6 meqh_en mg9e_0 mvrt_0 mj7a_0 mh36_0 m911_5r mefy_5r mnyp_5r mdwl_5r so63mt"><label for="pending_returns_li_btn" class="mjyo_6x mpof_ki myre_zn m7f5_6m m389_6m mg9e_4 mvrt_4 mj7a_4 mh36_4 msbw_2 mldj_2 mtag_2 mm2b_2 mqen_m6 meqh_en m0ux_fp mp5q_jr so1did"><span>In progress</span></label></div>`

    let rg = document.querySelector("ul[role='radiogroup']");
    li.onclick = async ()=>{
      li.querySelector("input").checked = !li.querySelector("input").checked;
    }
    rg.appendChild(li);
  }
}

setInterval(main, 1000);

main()