let palabras=[];

const buscar=document.getElementById("buscar");
const sugerencias=document.getElementById("sugerencias");
const resultado=document.getElementById("resultado");

fetch("data/palabras.json")
.then(r=>r.json())
.then(data=>{

palabras=data;

actualizarEstadisticas();

});

function actualizarEstadisticas(){

document.getElementById("totalPalabras").textContent=palabras.length;

document.getElementById("totalVideos").textContent=palabras.length;

const categorias=[...new Set(palabras.map(p=>p.categoria))];

document.getElementById("totalCategorias").textContent=categorias.length;

}

buscar.addEventListener("input",()=>{

const texto=buscar.value.toLowerCase().trim();

resultado.innerHTML="";
sugerencias.innerHTML="";

if(texto=="") return;

const encontrados=palabras
.filter(p=>p.palabra.toLowerCase().includes(texto))
.slice(0,10);

if(encontrados.length==0){

sugerencias.innerHTML='<div class="list-group-item">Sin resultados</div>';

return;

}

encontrados.forEach(p=>{

const b=document.createElement("button");

b.className="list-group-item list-group-item-action";

b.innerHTML="📖 "+p.palabra;

b.onclick=()=>mostrar(p);

sugerencias.appendChild(b);

});

});

function mostrar(p){

buscar.value=p.palabra;

sugerencias.innerHTML="";

resultado.innerHTML=`

<div class="card shadow-lg">

<div class="card-body">

<span class="badge bg-primary">${p.categoria}</span>

<h2 class="mt-3">${p.palabra}</h2>

<p>${p.definicion}</p>

<div class="ratio ratio-16x9">

<iframe
src="https://www.youtube.com/embed/${p.video}"
allowfullscreen>
</iframe>

</div>

</div>

</div>

`;

}

document.addEventListener("click",(e)=>{

if(!buscar.contains(e.target) &&
!sugerencias.contains(e.target)){

sugerencias.innerHTML="";

}

});let categorias=[];

fetch("data/categorias.json")
.then(r=>r.json())
.then(data=>{

categorias=data;

});

document
.getElementById("btnCategorias")
.onclick=mostrarCategorias;

function mostrarCategorias(){

const contenedor=document.getElementById("categorias");

contenedor.innerHTML="";

categorias.forEach(c=>{

contenedor.innerHTML+=`

<div class="col-md-4">

<div class="card h-100 shadow">

<div class="card-body text-center">

<h1>${c.icono}</h1>

<h4>${c.nombre}</h4>

</div>

</div>

</div>

`;

});

}