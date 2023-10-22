// ==UserScript==
// @name        Allegro - show return details
// @namespace   Violentmonkey Scripts
// @match       https://allegro.pl/moje-allegro/zakupy/kupione
// @grant       none
// @version     1.0
// @author      dommilosz
// @description 10/22/2023, 2:13:18 PM
// ==/UserScript==


async function delay(ms){
  return await new Promise(r=>setTimeout(r, ms));
}

async function loadDetails(url){
  let details = await (await fetch(url)).text();
  var el = document.createElement( 'html' );
  el.innerHTML = details;
  console.log(details)
  window.el = el;

  let returnStatus = el.querySelector("#opbox-myorder-returns > div > div > div > div");
  let returnTime = el.querySelector(`button[data-button-type="return"]`).parentNode.querySelector("span");

  if(!returnStatus){
    returnStatus = document.createElement("div");
    returnStatus.outerHTML = `<div class="mpof_ki mwdn_1 mr3m_1 gvl9v">Brak zwrotu</div>`
  }

  return  {returnStatus, returnTime};
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

    let button = document.createElement("button");
    button.innerHTML = "Fetch details";
    button.onclick = ftch;

    let header = order.querySelector("div:nth-child(1) > div:nth-child(1) > div:nth-child(2)");
    header.appendChild(button);

    async function ftch(){
      let {returnStatus, returnTime} = await loadDetails(url, header.parentNode);

      returnStatus.className = "mpof_ki mwdn_1 mr3m_1 gvl9v msts_pt munh_0 mj7a_16 mg9e_16 m389_6m";

      returnStatus.appendChild(returnTime);
      returnTime.className = "mpof_ki mr3m_1 mjyo_6x gel0f";
      group.insertBefore(returnStatus, group.children[1]);
      button.style.display = "none";
    }
    if(autoRun){
      ftch();
    }
  }
  console.log(orders);
}

main()