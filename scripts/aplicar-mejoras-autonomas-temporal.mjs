#!/usr/bin/env node
import fs from 'node:fs';

const ruta = 'js/alfabetizacion.js';
let texto = fs.readFileSync(ruta, 'utf8');
const duplicado = '    function nivelUnirActual() {    function nivelUnirActual() {';
const correcto = '    function nivelUnirActual() {';
const veces = texto.split(duplicado).length - 1;
if (veces !== 1) throw new Error(`Se esperaba exactamente 1 duplicado de nivelUnirActual y se encontraron ${veces}`);
texto = texto.replace(duplicado, correcto);
fs.writeFileSync(ruta, texto, 'utf8');
console.log('Duplicado de nivelUnirActual corregido.');
