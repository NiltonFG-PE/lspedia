// ========================================
// LSPedia
// Archivo principal
// ========================================

"use strict";

// Estado global de la aplicación
const App = {

    palabras: [],

    favoritos: [],

    historial: []

};

// Iniciar aplicación
document.addEventListener("DOMContentLoaded", iniciarApp);

// ----------------------------------------

async function iniciarApp(){

    await cargarPalabras();

    actualizarEstadisticas();

    mostrarUltimasPalabras();

    mostrarFavoritos();

}

// ----------------------------------------

async function cargarPalabras(){

    try{

        const respuesta = await fetch("data/palabras.json");

        App.palabras = await respuesta.json();

    }
    catch(error){

        console.error(error);

        alert("No fue posible cargar el diccionario.");

    }

