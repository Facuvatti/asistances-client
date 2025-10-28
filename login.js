
import {httpRequest,formResult,Cookie} from "./utils.js";
async function onSubmit(event,newUser=true) {
    event.preventDefault();
    if( newUser === false) endpoint = "login";
    if( newUser === true) endpoint = "register";
    const body = formResult(event);
    if(!body) return;
    body.fingerprint =  Cookie.get("fingerprint");
    let response = await httpRequest(endpoint,"POST",body);
    const user = response.id;
    window.location.href = "index.html";
    closeSession = document.createElement("button");
    closeSession.textContent = "Cerrar Sesion";
    closeSession.addEventListener("click", () => {
        window.location.href = "index.html";
    });
    document.querySelector("body").append(closeSession);

}
const form = document.querySelector("form");
form.addEventListener("submit", onSubmit);