
import {httpRequest} from "./utils.js";

// async function getIp() {
//     let ips = await httpRequest("cdn-cgi/trace","GET",undefined,'https://www.cloudflare.com/');
//     const ipRegex = /[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}/;
//     const ip = ips.match(ipRegex)[0];
//     return ip;
// }

async function checkSession () {
    let userCreated = await httpRequest("account","GET");
    userCreated = userCreated.user;
    if(userCreated) {
        if(!document.querySelector(".closeSession")){
            if(document.querySelector(".login")) document.querySelector(".login").remove();
            if(document.querySelector(".register")) document.querySelector(".register").remove();
            let closeSession = document.createElement("button");
            closeSession.classList.add("closeSession");
            closeSession.textContent = "Cerrar Sesion";
            closeSession.addEventListener("click", async () => {
                const response = await httpRequest("account/logout","POST")
                console.log(response.message);
                location.href = "index.html";
            });        
            document.querySelector("header").append(closeSession);
    }
    } else if(!userCreated) {
        if(document.querySelector(".closeSession")) document.querySelector(".closeSession").remove();
        if(!document.querySelector(".login")){
            let login = document.createElement("button");
            login.classList.add("login");
            login.textContent = "Iniciar Sesion";
            login.addEventListener("click", () => location.href = "account.html?account=login");
            document.querySelector("header").append(login);
        }
        if(!document.querySelector(".register")){
            let register = document.createElement("button");
            register.classList.add("register");
            register.textContent = "Registrarse";
            register.addEventListener("click", () => location.href = "account.html?account=register");
            document.querySelector("header").append(register);
        }
        if(window.location.pathname === "/account.html") {
            if(document.querySelector(".login")) document.querySelector(".login").remove();
            if(document.querySelector(".register")) document.querySelector(".register").remove();
        }
    }
}
checkSession();
