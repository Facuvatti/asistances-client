import {httpRequest,formResult,Cookie} from "./utils.js";
async function onSubmit(event) {
  event.preventDefault();
  const body = formResult(event);
  if(!body) return;
  let response = await httpRequest("register","POST",body);
  const user = response.id;
  Cookie.set("user",user);
  window.location.href = "index.html";

}
const form = document.querySelector("form");
form.addEventListener("submit", onSubmit);