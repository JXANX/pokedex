/* ============================================
   POKÉMON PC BOX - Script Principal
   Carga Pokémon de la API y los muestra en cajas
   ============================================ */

// Lista de todos los Pokémon
let listaPokemon = [];

// Caja actual (empieza en 0 = BOX 1)
let cajaActual = 0;

// 30 Pokémon por caja (6 columnas x 5 filas)
const POR_CAJA = 30;

// URLs de la API
const API = "https://pokeapi.co/api/v2/pokemon";
const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

// ============================================
// Cargar todos los Pokémon al iniciar la página
// ============================================
async function iniciar() {
    try {
        // Pedimos todos los Pokémon a la API
        let respuesta = await fetch(API + "?limit=2000");
        let datos = await respuesta.json();
        listaPokemon = datos.results;

        // Mostramos el total y la primera caja
        document.getElementById("texto-total").innerText = "Total: " + listaPokemon.length;
        document.getElementById("texto-carga").innerText = "Listo!";
        mostrarCaja();
    } catch (error) {
        document.getElementById("texto-carga").innerText = "Error al cargar";
    }
}

// ============================================
// Mostrar los 30 Pokémon de la caja actual
// ============================================
function mostrarCaja() {
    let grilla = document.getElementById("grilla-pokemon");
    grilla.innerHTML = "";

    // Rango de Pokémon para esta caja
    let inicio = cajaActual * POR_CAJA;
    let fin = Math.min(inicio + POR_CAJA, listaPokemon.length);

    // Nombre de la caja
    document.getElementById("nombre-caja").innerText = "BOX " + (cajaActual + 1);

    // Crear cada celda con su sprite
    for (let i = inicio; i < fin; i++) {
        // Sacamos el ID de la URL (ej: ".../pokemon/25/" → "25")
        let partes = listaPokemon[i].url.split("/");
        let id = partes[partes.length - 2];

        // Creamos la celda
        let celda = document.createElement("div");
        celda.className = "celda-pokemon";

        // Creamos la imagen
        let img = document.createElement("img");
        img.src = SPRITES + id + ".png";
        img.alt = listaPokemon[i].name;
        img.title = listaPokemon[i].name;
        img.onerror = function () { img.style.display = "none"; };

        // Al hacer clic, mostramos la info
        celda.onclick = function () { seleccionarPokemon(id, celda); };

        celda.appendChild(img);
        grilla.appendChild(celda);
    }
}

// ============================================
// Seleccionar un Pokémon y cargar sus datos
// ============================================
async function seleccionarPokemon(id, celda) {
    // Quitar selección anterior y marcar la nueva
    let anterior = document.querySelector(".seleccionado");
    if (anterior) anterior.classList.remove("seleccionado");
    celda.classList.add("seleccionado");

    // Ocultar mensaje inicial
    document.getElementById("mensaje-inicial").style.display = "none";
    document.getElementById("pokemon-imagen").style.display = "none";
    document.getElementById("pokemon-nombre").innerText = "Cargando...";

    try {
        // Pedimos los datos de este Pokémon
        let respuesta = await fetch(API + "/" + id);
        let pokemon = await respuesta.json();
        mostrarInfo(pokemon);
    } catch (error) {
        document.getElementById("pokemon-nombre").innerText = "Error";
    }
}

// ============================================
// Mostrar la info del Pokémon en el panel izquierdo
// ============================================
//
// ¿Qué es "pokemon"? Es un OBJETO que nos devuelve la API.
// Es como una ficha con muchos datos adentro. Por ejemplo:
//
// pokemon = {
//     id: 25,
//     name: "pikachu",
//     height: 4,           (en decímetros)
//     weight: 60,          (en hectogramos)
//     types: [
//         { type: { name: "electric" } }
//     ],
//     stats: [
//         { stat: { name: "hp" }, base_stat: 35 },
//         { stat: { name: "attack" }, base_stat: 55 },
//         ...
//     ],
//     sprites: {
//         front_default: "url_de_la_imagen.png"
//     }
// }
//
// Entonces cuando escribimos pokemon.name estamos sacando "pikachu",
// y pokemon.height estamos sacando 4, etc.
//
function mostrarInfo(pokemon) {

    // --- IMAGEN ---
    // Usamos el sprite normal del Pokémon
    let img = document.getElementById("pokemon-imagen");
    img.src = SPRITES + pokemon.id + ".png";
    img.style.display = "block";

    // --- NOMBRE ---
    // pokemon.name = "pikachu", lo ponemos en el HTML
    document.getElementById("pokemon-nombre").innerText = pokemon.name;

    // --- NÚMERO ---
    // pokemon.id = 25, lo convertimos a texto con ceros: "0025"
    let numero = String(pokemon.id);          // "25"
    let numeroBonito = numero.padStart(4, "0"); // "0025"
    document.getElementById("pokemon-numero").innerText = "Nº " + numeroBonito;

    // --- TIPOS ---
    // pokemon.types es una lista, ejemplo: [ {type:{name:"electric"}} ]
    // Puede tener 1 o 2 tipos
    let cajaTipos = document.getElementById("pokemon-tipos");
    cajaTipos.innerHTML = ""; // Limpiar lo anterior

    for (let i = 0; i < pokemon.types.length; i++) {
        // Sacamos el nombre del tipo paso a paso:
        let unTipo = pokemon.types[i];       // { type: { name: "electric" } }
        let datosTipo = unTipo.type;          // { name: "electric" }
        let nombreTipo = datosTipo.name;      // "electric"

        // Creamos la etiqueta HTML con el color del tipo
        cajaTipos.innerHTML += '<span class="tipo tipo-' + nombreTipo + '">' + nombreTipo.toUpperCase() + '</span> ';
    }

    // --- ALTURA ---
    // pokemon.height viene en decímetros (4 = 0.4 metros)
    let alturaEnMetros = pokemon.height / 10;
    document.getElementById("pokemon-altura").innerText = "Altura: " + alturaEnMetros + " m";

    // --- PESO ---
    // pokemon.weight viene en hectogramos (60 = 6.0 kg)
    let pesoEnKg = pokemon.weight / 10;
    document.getElementById("pokemon-peso").innerText = "Peso: " + pesoEnKg + " kg";

    // --- STATS ---
    // pokemon.stats es una lista con 6 stats:
    // [ {stat:{name:"hp"}, base_stat:35}, {stat:{name:"attack"}, base_stat:55}, ... ]
    let textoStats = "";

    for (let i = 0; i < pokemon.stats.length; i++) {
        // Sacamos cada stat paso a paso:
        let unStat = pokemon.stats[i];       // { stat: { name: "hp" }, base_stat: 35 }
        let nombreStat = unStat.stat.name;    // "hp"
        let valorStat = unStat.base_stat;     // 35

        // Lo agregamos al texto
        textoStats += nombreStat + ": " + valorStat + "\n";
    }

    document.getElementById("pokemon-stats").innerText = textoStats;
}

// ============================================
// Cambiar de caja con las flechas
// ============================================
function cambiarCaja(direccion) {
    let totalCajas = Math.ceil(listaPokemon.length / POR_CAJA);
    cajaActual += direccion;

    // Si nos pasamos, volvemos al otro extremo
    if (cajaActual >= totalCajas) cajaActual = 0;
    if (cajaActual < 0) cajaActual = totalCajas - 1;

    mostrarCaja();
}

// Ejecutar al cargar la página
window.onload = iniciar;
