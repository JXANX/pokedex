// Variables globales
const API      = "https://pokeapi.co/api/v2/pokemon";
const SPRITES  = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
const API_BACK = "equipos.php";
const API_AUTH = "usuarios.php";

let listaPokemon  = [];
let cajaActual    = 0;
const POR_CAJA    = 30;

let pokemonSeleccionado = null;
let equipoActual        = new Array(6).fill(null);

// Sesión guardada en localStorage (persiste al recargar la página)
let usuarioActual = JSON.parse(localStorage.getItem("pokemon_usuario")) || null;

// ──────────────────────────────────────────────────────
//  AUTH
// ──────────────────────────────────────────────────────

function mostrarTab(tab) {
    document.getElementById("form-login").style.display    = tab === "login"    ? "flex" : "none";
    document.getElementById("form-registro").style.display = tab === "registro" ? "flex" : "none";
    document.getElementById("tab-login").classList.toggle("activo",    tab === "login");
    document.getElementById("tab-registro").classList.toggle("activo", tab === "registro");
    document.getElementById("login-error").innerText = "";
    document.getElementById("reg-error").innerText   = "";
}

async function hacerLogin() {
    const username = document.getElementById("login-user").value.trim();
    const password = document.getElementById("login-pass").value.trim();
    const errEl    = document.getElementById("login-error");

    if (!username || !password) { errEl.innerText = "Completa los campos"; return; }

    try {
        const resp = await fetch(API_AUTH + "?accion=login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await resp.json();
        if (data.ok) {
            iniciarSesion(data.usuario);
        } else {
            errEl.innerText = data.error || "Error al iniciar sesión";
        }
    } catch {
        errEl.innerText = "Error: ¿XAMPP está corriendo?";
    }
}

async function hacerRegistro() {
    const username = document.getElementById("reg-user").value.trim();
    const password = document.getElementById("reg-pass").value.trim();
    const errEl    = document.getElementById("reg-error");

    if (!username || !password) { errEl.innerText = "Completa los campos"; return; }

    try {
        const resp = await fetch(API_AUTH + "?accion=registrar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await resp.json();
        if (data.ok) {
            iniciarSesion(data.usuario);
        } else {
            errEl.innerText = data.error || "Error al registrarse";
        }
    } catch {
        errEl.innerText = "Error: ¿XAMPP está corriendo?";
    }
}

function iniciarSesion(usuario) {
    usuarioActual = usuario;
    localStorage.setItem("pokemon_usuario", JSON.stringify(usuario));

    document.getElementById("pantalla-auth").style.display   = "none";
    document.getElementById("app-principal").style.display   = "block";
    document.getElementById("nombre-usuario-barra").innerText = "👤 " + usuario.username.toUpperCase();

    cargarApp();
}

function cerrarSesion() {
    usuarioActual = null;
    localStorage.removeItem("pokemon_usuario");

    document.getElementById("app-principal").style.display = "none";
    document.getElementById("pantalla-auth").style.display = "block";

    document.getElementById("login-user").value = "";
    document.getElementById("login-pass").value = "";
    document.getElementById("reg-user").value   = "";
    document.getElementById("reg-pass").value   = "";
    document.getElementById("login-error").innerText = "";
    document.getElementById("reg-error").innerText   = "";
    mostrarTab("login");
}

// ──────────────────────────────────────────────────────
//  APP
// ──────────────────────────────────────────────────────

async function cargarApp() {
    try {
        let respuesta = await fetch(API + "?limit=2000");
        let datos     = await respuesta.json();
        listaPokemon  = datos.results;

        document.getElementById("texto-total").innerText = "Total: " + listaPokemon.length;
        document.getElementById("texto-carga").innerText = "Listo!";

        mostrarCaja();
        renderizarSlots();
        cargarEquiposGuardados();
    } catch {
        document.getElementById("texto-carga").innerText = "Error al cargar";
    }
}

// ──────────────────────────────────────────────────────
//  PC BOX
// ──────────────────────────────────────────────────────

function mostrarCaja() {
    let grilla = document.getElementById("grilla-pokemon");
    grilla.innerHTML = "";

    let inicio = cajaActual * POR_CAJA;
    let fin    = Math.min(inicio + POR_CAJA, listaPokemon.length);
    document.getElementById("nombre-caja").innerText = "BOX " + (cajaActual + 1);

    for (let i = inicio; i < fin; i++) {
        let partes = listaPokemon[i].url.split("/");
        let id     = partes[partes.length - 2];

        let celda = document.createElement("div");
        celda.className = "celda-pokemon";

        let img   = document.createElement("img");
        img.src   = SPRITES + id + ".png";
        img.alt   = listaPokemon[i].name;
        img.title = listaPokemon[i].name;
        img.onerror = function () { img.style.display = "none"; };

        celda.onclick = function () { seleccionarPokemon(id, celda); };
        celda.appendChild(img);
        grilla.appendChild(celda);
    }
}

function cambiarCaja(dir) {
    let total = Math.ceil(listaPokemon.length / POR_CAJA);
    cajaActual += dir;
    if (cajaActual >= total) cajaActual = 0;
    if (cajaActual < 0)      cajaActual = total - 1;
    mostrarCaja();
}

async function seleccionarPokemon(id, celda) {
    let anterior = document.querySelector(".celda-pokemon.seleccionado");
    if (anterior) anterior.classList.remove("seleccionado");
    celda.classList.add("seleccionado");

    document.getElementById("mensaje-inicial").style.display    = "none";
    document.getElementById("pokemon-imagen").style.display     = "none";
    document.getElementById("pokemon-nombre").innerText         = "Cargando...";
    document.getElementById("btn-agregar-equipo").style.display = "none";

    try {
        let resp    = await fetch(API + "/" + id);
        let pokemon = await resp.json();
        mostrarInfo(pokemon);
        pokemonSeleccionado = { id: pokemon.id, nombre: pokemon.name };
        document.getElementById("btn-agregar-equipo").style.display = "block";
    } catch {
        document.getElementById("pokemon-nombre").innerText = "Error";
    }
}

function mostrarInfo(pokemon) {
    let img = document.getElementById("pokemon-imagen");
    img.src = SPRITES + pokemon.id + ".png";
    img.style.display = "block";

    document.getElementById("pokemon-nombre").innerText = pokemon.name;
    document.getElementById("pokemon-numero").innerText = "Nº " + String(pokemon.id).padStart(4, "0");

    let cajaTipos = document.getElementById("pokemon-tipos");
    cajaTipos.innerHTML = "";
    for (let t of pokemon.types) {
        let nombre = t.type.name;
        cajaTipos.innerHTML += `<span class="tipo tipo-${nombre}">${nombre.toUpperCase()}</span> `;
    }

    document.getElementById("pokemon-altura").innerText = "Altura: " + (pokemon.height / 10) + " m";
    document.getElementById("pokemon-peso").innerText   = "Peso: "   + (pokemon.weight / 10) + " kg";

    let stats = "";
    for (let s of pokemon.stats) stats += s.stat.name + ": " + s.base_stat + "\n";
    document.getElementById("pokemon-stats").innerText = stats;
}

// ──────────────────────────────────────────────────────
//  EQUIPO
// ──────────────────────────────────────────────────────

function renderizarSlots() {
    let contenedor = document.getElementById("slots-equipo");
    contenedor.innerHTML = "";

    for (let i = 0; i < 6; i++) {
        let slot = document.createElement("div");
        slot.className = "slot-poke";
        slot.id = "slot-" + i;

        if (equipoActual[i]) {
            slot.classList.add("ocupado");

            let img = document.createElement("img");
            img.src = SPRITES + equipoActual[i].id + ".png";
            img.alt = equipoActual[i].nombre;

            let nombre = document.createElement("span");
            nombre.className = "slot-nombre";
            nombre.innerText = equipoActual[i].nombre;

            let btnQuitar = document.createElement("button");
            btnQuitar.className = "quitar-slot";
            btnQuitar.innerText = "✕";
            btnQuitar.onclick   = (e) => { e.stopPropagation(); quitarDelEquipo(i); };

            slot.appendChild(img);
            slot.appendChild(nombre);
            slot.appendChild(btnQuitar);
        } else {
            let num = document.createElement("span");
            num.className = "slot-num";
            num.innerText = (i + 1);
            slot.appendChild(num);
        }

        contenedor.appendChild(slot);
    }
}

function agregarAlEquipo() {
    if (!pokemonSeleccionado) return;

    if (equipoActual.some(p => p && p.id === pokemonSeleccionado.id)) {
        mostrarMensaje("¡Ya está en el equipo!", "error");
        return;
    }

    let slotLibre = equipoActual.findIndex(p => p === null);
    if (slotLibre === -1) {
        mostrarMensaje("El equipo está lleno (máx 6)", "error");
        return;
    }

    equipoActual[slotLibre] = { ...pokemonSeleccionado };
    renderizarSlots();
    mostrarMensaje("¡" + pokemonSeleccionado.nombre.toUpperCase() + " agregado!", "ok");
}

function quitarDelEquipo(index) {
    equipoActual[index] = null;
    renderizarSlots();
}

function limpiarEquipo() {
    equipoActual = new Array(6).fill(null);
    document.getElementById("campo-nombre-equipo").value = "";
    renderizarSlots();
}

function mostrarMensaje(texto, tipo) {
    let msg = document.getElementById("mensaje-equipo");
    msg.innerText     = texto;
    msg.className     = tipo;
    msg.style.display = "block";
    setTimeout(() => { msg.style.display = "none"; }, 2500);
}

async function guardarEquipo() {
    if (!usuarioActual) return;

    let nombre  = document.getElementById("campo-nombre-equipo").value.trim();
    let pokemon = equipoActual.filter(p => p !== null);

    if (!nombre)         { mostrarMensaje("Ponle un nombre al equipo", "error"); return; }
    if (!pokemon.length) { mostrarMensaje("Agrega al menos 1 Pokémon", "error"); return; }

    try {
        let resp = await fetch(API_BACK + "?accion=guardar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario_id: usuarioActual.id,
                nombre_equipo: nombre,
                pokemon: pokemon
            })
        });
        let resultado = await resp.json();

        if (resultado.ok) {
            mostrarMensaje("✓ " + resultado.mensaje, "ok");
            limpiarEquipo();
            cargarEquiposGuardados();
        } else {
            mostrarMensaje(resultado.error || "Error al guardar", "error");
        }
    } catch {
        mostrarMensaje("Error: ¿XAMPP está corriendo?", "error");
    }
}

async function cargarEquiposGuardados() {
    if (!usuarioActual) return;

    let contenedor = document.getElementById("contenedor-equipos");

    try {
        let resp    = await fetch(API_BACK + "?accion=listar&usuario_id=" + usuarioActual.id);
        let equipos = await resp.json();

        contenedor.innerHTML = "";

        if (!equipos.length) {
            contenedor.innerHTML = `<div id="sin-equipos">No hay equipos guardados.<br>¡Arma tu primer equipo!</div>`;
            return;
        }

        for (let equipo of equipos) {
            let tarjeta = document.createElement("div");
            tarjeta.className = "tarjeta-equipo";

            let fecha = new Date(equipo.fecha_creacion).toLocaleDateString("es-CO", {
                day: "2-digit", month: "short", year: "numeric"
            });

            let spritesHTML = equipo.pokemon.map(p =>
                `<img src="${SPRITES}${p.pokemon_id}.png" alt="${p.pokemon_nombre}" title="${p.pokemon_nombre}">`
            ).join("");

            tarjeta.innerHTML = `
                <div class="tarjeta-equipo-info">
                    <p class="tarjeta-nombre">${equipo.nombre_equipo}</p>
                    <div class="tarjeta-sprites">${spritesHTML}</div>
                    <p class="tarjeta-fecha">${fecha} · ${equipo.pokemon.length} Pokémon</p>
                </div>
                <button class="btn-eliminar-equipo" onclick="eliminarEquipo(${equipo.id})">✕</button>
            `;

            contenedor.appendChild(tarjeta);
        }
    } catch {
        contenedor.innerHTML = `<div id="sin-equipos">Error al conectar.<br>¿Está XAMPP corriendo?</div>`;
    }
}

async function eliminarEquipo(id) {
    if (!confirm("¿Eliminar este equipo?")) return;
    if (!usuarioActual) return;

    try {
        let resp = await fetch(
            API_BACK + "?accion=eliminar&id=" + id + "&usuario_id=" + usuarioActual.id,
            { method: "DELETE" }
        );
        let resultado = await resp.json();
        if (resultado.ok) cargarEquiposGuardados();
    } catch {
        alert("Error al eliminar");
    }
}

// ──────────────────────────────────────────────────────
//  ARRANQUE
// ──────────────────────────────────────────────────────
window.onload = function () {
    if (usuarioActual) {
        // Había sesión guardada, entra directo
        iniciarSesion(usuarioActual);
    }
    // Si no, se queda en la pantalla de auth
};