import {httpRequest,formResult} from "./utils.js";
async function account(event,endpoint) {
    event.preventDefault();
    const body = formResult(event);
    let h1 = document.createElement("h1");
    if(!body) return;
    if(!endpoint) endpoint = "register";
    let response = await httpRequest("account/"+endpoint,"POST",body);
    console.log(response);
    if(!response?.ok){
        h1.style.color = "red";
        if(response.error === "existe") {
            window.location.href = "account.html?account=login";
            const response = await httpRequest("account/login","POST",body);
            h1.textContent = "El usuario ya existe: "+response.message;
        }
        if(response.error === "no existe") h1.textContent = "El usuario no existe, intentá de vuelta";
        else h1.textContent = response.error;
    }
    else {
        h1.textContent = response.message;
        setInterval(() => window.location.href = "index.html", 5000);
        
    }; 
    document.body.append(h1);
}
const params = new URLSearchParams(window.location.search);
const form = document.querySelector("form");
form.addEventListener("submit", async (event) => await account(event,params.get("account")));
