import {httpRequest,dbOptions,selected} from "./utils.js";
async function init() {
    let response = await httpRequest("courses","GET");
    if(!response) document.querySelector("#index").remove();
}
init()
async function load(select){
    if(document.querySelector("#post-form")) document.querySelector("#post-form").remove();
    let option = selected(select).value;
    console.log(option);
    let form = document.createElement("form")
    form.id = "post-form";
    if(option == "Curso"){
        form.innerHTML = `
        <input type="text" name="year" placeholder="AÑO" id="year"></input>
        <input type="text" name="division" placeholder="DIVISION" id="division"></input>
        <input type="text" name="specialty" placeholder="ESPECIALIDAD" id="specialty"></input>
        <button type="submit">Enviar</button>
        `
        form.addEventListener("submit", async (e) => await httpRequest("courses","POST",undefined,undefined,e));
    }
    if(option == "Estudiantes"){
        let courses = document.createElement("select");
        courses = await dbOptions(courses,"courses");
        let subjects = document.createElement("select");
        subjects = await dbOptions(subjects,"subjects");
        form.append(courses,subjects);
        form.innerHTML += `
        <textarea rows="10" cols="50" id="students" name="students" placeholder="APELLIDO NOMBRE 
        APELLIDO NOMBRE" required></textarea>
        <button type="submit">Enviar</button>
        `
        form.addEventListener("submit", async (e) => await httpRequest("students","POST",undefined,undefined,e));
    }
    if (option == "Materia"){
        let courses = document.createElement("select");
        courses = await dbOptions(courses,"courses");
        form.append(courses);
        form.innerHTML += `
        <input type="text" name="subject" placeholder="ASIGNATURA" id="subject"></input>
        <input type="text" name="teacher" placeholder="PROFESOR" id="teacher"></input>
        <input type="text" name="hours" placeholder="HORAS" id="hours"></input>
        <button type="submit">Enviar</button>
        `
        form.addEventListener("submit", async (e) => await httpRequest("subjects","POST",undefined,undefined,e));
    }
    document.body.append(form);
}

let select = document.getElementById("selection");
select.addEventListener("change", async (e) => await load(e.target));
select.dispatchEvent(new Event('change'));