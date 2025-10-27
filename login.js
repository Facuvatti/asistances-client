import {httpRequest,formResult} from "./utils.js";
async function onSubmit(event) {
  event.preventDefault();
    const body = formResult(event);
    let response = await httpRequest("register","POST",body);
    console.log(response);
}
const form = document.querySelector("form");
form.addEventListener("submit", onSubmit);