import {httpRequest,formResult} from "./utils.js";
async function init() {
    let response = await httpRequest("classes","GET");
    if(response.length == 0) document.querySelector("#index").remove();
}
init()
async function makeRoom(e) {
    e.preventDefault();
    let body = formResult(e);
    if(!body) return;
    else await httpRequest("students","POST",body);
}

document.querySelector("#load-class").addEventListener("submit", makeRoom);
window.addEventListener('DOMContentLoaded', () => {
    // Crear un objeto con los parámetros del URL
    const params = new URLSearchParams(window.location.search);

    // Rellenar los inputs si existen los parámetros
    const year = params.get('year');
    const division = params.get('division');
    const specialty = params.get('specialty');
    if (year) document.getElementById('year').value = year;
    if (division) document.getElementById('division').value = division;
    if (specialty) document.getElementById('specialty').value = specialty;
});