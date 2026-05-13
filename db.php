<?php
$conexion = mysqli_connect("localhost", "root", "", "pokemon_box");

if (!$conexion) {
    die(json_encode([
        "error" => "Error de conexión: " . mysqli_connect_error()
    ]));
}

// UTF-8 para que los acentos y la ñ funcionen bien
mysqli_set_charset($conexion, "utf8");
?>