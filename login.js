import {httpRequest,formResult,Cookie} from "./utils.js";
async function account(event,endpoint) {
    event.preventDefault();
    const body = formResult(event);
    if(!body) return;
    body.fingerprint =  Cookie.get("fingerprint");
    let response = await httpRequest("account/"+endpoint,"POST",body);
    console.log(response);
    alert("Iniciaste sesión con exito!");
    window.location.href = "index.html";

}
const form = document.querySelector("form");
form.addEventListener("submit", await account("login"));