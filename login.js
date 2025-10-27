import {httpRequest,formResult,Cookie} from "./utils.js";
async function onSubmit(event) {
  event.preventDefault();
  const body = formResult(event);
  if(!body) return;
  body.deviceId =  Cookie.get("deviceId");
  let response = await httpRequest("register","POST",body);
  const user = response.id;

  window.location.href = "index.html";

}
const form = document.querySelector("form");
form.addEventListener("submit", onSubmit);