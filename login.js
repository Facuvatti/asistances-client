import {httpRequest,formResult} from "./utils.js";
async function account(event,endpoint) {
    event.preventDefault();
    const body = formResult(event);
    let h2 = document.createElement("h2");
    if(!body) return;
    if(!endpoint) endpoint = "register";
    let response = await httpRequest("account/"+endpoint,"POST",body);
    console.log(response);
    if(!response?.ok){
        h2.style.color = "red";
        if(response.error === "existe") {
            window.location.href = "account.html?account=login";
            const response = await httpRequest("account/login","POST",body);
            h2.textContent = "El usuario ya existe: "+response.message;
        }
        if(response.error === "no existe") h2.textContent = "El usuario no existe, intentá de vuelta";
        else h2.textContent = response.error;
    }
    else {
        h2.textContent = response.message;
        setInterval(() => window.location.href = "index.html", 5000);
        
    }; 
    document.body.append(h2);
}
const params = new URLSearchParams(window.location.search);
let h1 = document.createElement("h1");
if(params.get("account") == "register") h1.textContent = "Registrarse";
if(params.get("account") == "login") h1.textContent = "Iniciar Sesion";
const form = document.querySelector("form");
document.body.insertBefore(h1,form);
form.addEventListener("submit", async (event) => await account(event,params.get("account")));