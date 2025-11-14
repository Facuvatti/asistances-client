import {httpRequest,formResult} from "./utils.js";
async function account(event,endpoint) {
    event.preventDefault();
    const body = formResult(event);
    if(!body) return;
    if(!endpoint) endpoint = "register";
    let response = await httpRequest("account/"+endpoint,"POST",body);
    console.log(response);
    if(!response.ok){
        if(response.error === "existe") window.location.href = "account.html?account=login";
        if(response.error === "no existe") window.location.href = "account.html?account=register";
        else console.log(response.error);
    }
    else {
        let h1 = document.createElement("h1");
        h1.textContent = response.message;
        document.body.append(h1);
        window.location.href = "index.html";
    }; 
}
const params = new URLSearchParams(window.location.search);
const form = document.querySelector("form");
form.addEventListener("submit", async (event) => await account(event,params.get("account")));
