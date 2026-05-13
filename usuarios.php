<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "db.php";
require_once "log.php";   // ← Módulo de logs

$accion = $_GET['accion'] ?? '';
$datos  = json_decode(file_get_contents("php://input"), true);

// ── REGISTRO ──────────────────────────────────────────────────────────
if ($accion === 'registrar') {

    $username = trim($datos['username'] ?? '');
    $password = trim($datos['password'] ?? '');

    if (strlen($username) < 3) {
        registrarLog($conexion, $username, 'REGISTRO_FALLIDO', 'Usuario demasiado corto');
        echo json_encode(["error" => "El usuario debe tener al menos 3 caracteres"]);
        exit();
    }
    if (strlen($password) < 4) {
        registrarLog($conexion, $username, 'REGISTRO_FALLIDO', 'Contraseña demasiado corta');
        echo json_encode(["error" => "La contraseña debe tener al menos 4 caracteres"]);
        exit();
    }

    $username_safe = mysqli_real_escape_string($conexion, $username);
    $check = mysqli_query($conexion, "SELECT id FROM usuarios WHERE username = '$username_safe'");

    if (mysqli_num_rows($check) > 0) {
        registrarLog($conexion, $username, 'REGISTRO_FALLIDO', 'Nombre de usuario ya existe');
        echo json_encode(["error" => "Ese nombre de usuario ya está en uso"]);
        exit();
    }

    $hash      = password_hash($password, PASSWORD_DEFAULT);
    $hash_safe = mysqli_real_escape_string($conexion, $hash);

    $sql = "INSERT INTO usuarios (username, password_hash) VALUES ('$username_safe', '$hash_safe')";

    if (mysqli_query($conexion, $sql)) {
        $id = mysqli_insert_id($conexion);
        registrarLog($conexion, $username, 'REGISTRO_OK', "Cuenta creada con ID=$id");
        echo json_encode([
            "ok"      => true,
            "mensaje" => "¡Cuenta creada! Bienvenido, $username",
            "usuario" => ["id" => $id, "username" => $username]
        ]);
    } else {
        registrarLog($conexion, $username, 'REGISTRO_ERROR', 'Error SQL al crear cuenta');
        echo json_encode(["error" => "Error al crear la cuenta"]);
    }

// ── LOGIN ─────────────────────────────────────────────────────────────
} elseif ($accion === 'login') {

    $username = trim($datos['username'] ?? '');
    $password = trim($datos['password'] ?? '');

    if (empty($username) || empty($password)) {
        registrarLog($conexion, $username ?: 'anónimo', 'LOGIN_FALLIDO', 'Campos vacíos');
        echo json_encode(["error" => "Usuario y contraseña requeridos"]);
        exit();
    }

    $username_safe = mysqli_real_escape_string($conexion, $username);
    $res = mysqli_query($conexion, "SELECT * FROM usuarios WHERE username = '$username_safe'");

    if (mysqli_num_rows($res) === 0) {
        registrarLog($conexion, $username, 'LOGIN_FALLIDO', 'Usuario no encontrado');
        echo json_encode(["error" => "Usuario o contraseña incorrectos"]);
        exit();
    }

    $usuario = mysqli_fetch_assoc($res);

    if (!password_verify($password, $usuario['password_hash'])) {
        registrarLog($conexion, $username, 'LOGIN_FALLIDO', 'Contraseña incorrecta');
        echo json_encode(["error" => "Usuario o contraseña incorrectos"]);
        exit();
    }

    registrarLog($conexion, $username, 'LOGIN_OK', "Sesión iniciada (ID={$usuario['id']})");
    echo json_encode([
        "ok"      => true,
        "mensaje" => "¡Bienvenido, " . $usuario['username'] . "!",
        "usuario" => [
            "id"       => (int) $usuario['id'],
            "username" => $usuario['username']
        ]
    ]);

} else {
    echo json_encode(["error" => "Acción no válida"]);
}

mysqli_close($conexion);
?>
