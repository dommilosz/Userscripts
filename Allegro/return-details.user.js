// ==UserScript==
// @name        Allegro - show return details
// @namespace   Violentmonkey Scripts
// @match       https://allegro.pl/moje-allegro/zakupy/kupione
// @grant       none
// @version     1.7
// @author      dommilosz
// @description 10/22/2023, 2:13:18 PM
// @updateURL https://github.com/dommilosz/Userscripts/raw/master/Allegro/return-details.user.js
// @downloadURL https://github.com/dommilosz/Userscripts/raw/master/Allegro/return-details.user.js
// ==/UserScript==


async function delay(ms) {
  return await new Promise(r => setTimeout(r, ms));
}

let props = {};
function addProperty(id, title, value, div) {
  let orderDiv = div.querySelector(`:scope>div>div:has(section)`);

  let child;
  if (orderDiv.querySelector(`#prop-id-${id}`) != null) {
    child = orderDiv.querySelector(`#prop-id-${id}`);
  } else {
    child = document.createElement('div');
    orderDiv.appendChild(child);
  }


  child.innerHTML = `<div id="prop-id-${id}" class="myre_zn myre_8v_l" bis_skin_checked="1"><div class="mpof_ki m7f5_sf m389_a6 _355a6_H7r-d" bis_skin_checked="1"><div class="mpof_ki m389_a6 mwdn_1" bis_skin_checked="1"><p id="total-price-label-bd38004c-1b9e-30ae-81e0-55ec852c7ddd" class="m9qz_yr msa3_z4 mryx_0 mp4t_0 m3h2_8">${title}</p><div class="mpof_ki mr3m_1 mjyo_6x gel0f mh36_0" bis_skin_checked="1"></div></div><div id="total-price-bd38004c-1b9e-30ae-81e0-55ec852c7ddd" class="m9qz_yr" bis_skin_checked="1"><span class="mli8_k4 msa3_z4 mqu1_1 mp0t_0a mgmw_qw mgn2_14">${value}</span></div></div></div>`
  if(!props[div.id])props[div.id] = {};

  props[div.id][id] = {title,value};
}

function addButton(title, name, id, unclickable, defaultState) {
  if (document.querySelector(`#${id}`) != null) return;

  let li = document.createElement("li");
  li.className = "mp7g_oh mpof_ki mp4t_0 m3h2_8 mryx_8 munh_0";
  li.innerHTML = `<div class="m7er_k4 msa3_z4 _355a6_5yU4X"><input type="radio" name="${name}" id="${id}" class="mp7g_f6 meqh_en mg9e_0 mvrt_0 mj7a_0 mh36_0 m911_5r mefy_5r mnyp_5r mdwl_5r so63mt"><label for="${id}" class="mjyo_6x mpof_ki myre_zn m7f5_6m m389_6m mg9e_4 mvrt_4 mj7a_4 mh36_4 msbw_2 mldj_2 mtag_2 mm2b_2 mqen_m6 meqh_en m0ux_fp mp5q_jr so1did"><span>${title}</span></label></div>`

  li.onclick = async () => {
    li.querySelector("input").click();
  }

  let rg = document.querySelector("ul[role='radiogroup']");
  rg.appendChild(li);

  if (unclickable) {
    li.onclick = async () => {
      li.querySelector("input").checked = false;
    }
  }

  if(defaultState){
    li.querySelector("input").checked = true;
  }
}

let details = {};

async function fetchDetails(groupId) {
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


async function processGroup(groupId) {
  if (!details[groupId]) {
    details[groupId] = await fetchDetails(groupId);
  }
  let group = details[groupId];

  let div = document.querySelector(`#group-id-${group.groupId}`)
  addCompactVersion(group, div)

  try {
    addProperty("returns", "Returns", group.myorders[0].status.actions.filter(el => el.type == "RETURN_PRODUCTS")[0].details.filter(el => el.type == "TEXT").map(el => el.value).join("<br>"), div);
  } catch { }

  try {
    group.timelines.forEach(waybill => {
      addProperty("parcel-" + waybill.waybillId, "Parcel", waybill.waybillId, div);
    })
  } catch { }

  try {
    group.rescissions.rescissions.forEach(waybill => {
      addProperty("return-" + waybill.rescissionId, "Return Status", waybill.timelineStatus.label + " " + waybill.timelineStatus.hint, div);
      addProperty("return-ref-" + waybill.rescissionId, "Return Code", waybill.referenceNumber + " " + waybill.readyReturnParcels.map(p => p.returnCode).join(","), div);
    })
  } catch { }

  try {
    addProperty("return-lbl", "Return", group.status.actions.filter(el => el.type == "RETURN_PRODUCTS")[0].details.filter(el => el.type == "TEXT").map(el => el.value).join(" "), div);
  } catch { }


}

function addCompactVersion(group, groupDiv){
  let compactDiv;
  if(groupDiv.querySelector("#compact-version")){
    compactDiv  =groupDiv.querySelector("#compact-version");
  }else{
    compactDiv = document.createElement('div');
    compactDiv.id = 'compact-version';
    compactDiv.className = "mg9e_0 mvrt_0 mj7a_0 mh36_0";
    groupDiv.appendChild(compactDiv);
  }

  let propText = Object.keys(props[groupDiv.id]??{}).map(key=>{
    let data = props[groupDiv.id][key];
    return `<div>${data.title} - ${data.value}</div>`;
  }).join("")

  compactDiv.innerHTML = `<div class="myre_8v msts_pt mryx_16 mp4t_16 mg9e_24 mvrt_24 mj7a_24 mh36_24 m389_0a mj9z_5r">
    ${group.seller.login} ${group.orderDate}
    ${group.offers.map(offer=>{
      return `<div>${offer.title} ${offer.unitPrice.amount}x${offer.quantity}=${offer.unitPrice.amount*offer.quantity}</div>`
    }).join("")}
    <div id="compact-props">${propText}</div>
  </div>`;
}

function processOrder(order) {
  order.style.display = "";
  [...order.querySelectorAll(":scope>div")].forEach(el=>el.style.display="");
  let content = order.textContent;

  if (document.querySelector("#pending_returns_li_btn")?.checked) {
    if (content.includes("Decyzja sprzedającego") || content.includes("Przesyłka odebrana") || content.includes("anulowany")) {
      order.style.display = "none";
    }
  }

  if (document.querySelector("#notfull_returns_li_btn")?.checked) {
    let content = order.textContent;
    if (!content.includes("Return Status") || content.includes("Pełen zwrot pieniędzy")) {
      order.style.display = "none";
    }
  }

  if (document.querySelector("#notfull_returns_li_btn")?.checked) {
    let content = order.textContent;
    if (!content.includes("Return Status") || content.includes("Pełen zwrot pieniędzy")) {
      order.style.display = "none";
    }
  }

  order.querySelector("#compact-version").style.display = "none";
  if (document.querySelector("#display_compact_li_btn")?.checked) {
    // order.style.display = "none";
    // order.style. = "none";

    if(order.querySelector("#compact-version")){
      [...order.querySelectorAll(":scope>div")].forEach(el=>el.style.display="none");
      order.querySelector("#compact-version").style.display = "";
    }
  }
}

async function main() {
  let autoRun = true;

  while (document.readyState != "complete") {
    await delay(500);
  }

  let groups = [...document.querySelectorAll("div.mryx_16")].filter(el => el.id.startsWith('group-id-')).map(el => el.id.replace("group-id-", ''));
  groups.forEach(processGroup)

  let orders = [...document.querySelectorAll("#my-orders-listing > span > div")].filter(el => el.id.startsWith("group-id-"))
  orders.forEach(processOrder);


  addButton("Pending", "filter2", "pending_returns_li_btn");
  addButton("Partial", "filter2", "notfull_returns_li_btn");
  addButton("Clear", "filter2", "clear_li_btn", true);

  addButton("Normal", "display_style", "display_normal_li_btn", false, true);
  addButton("Short", "display_style", "display_compact_li_btn");


}

setInterval(main, 1000);

main()
