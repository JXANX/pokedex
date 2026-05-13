<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "db.php";
require_once "log.php";   // ← Módulo de logs

$accion     = $_GET['accion']     ?? '';
$usuario_id = intval($_GET['usuario_id'] ?? 0);

// Obtener el nombre del usuario para el log
function getNombreUsuario($conexion, int $uid): string {
    if ($uid <= 0) return 'desconocido';
    $res = mysqli_query($conexion, "SELECT username FROM usuarios WHERE id = $uid");
    if ($res && $row = mysqli_fetch_assoc($res)) {
        return $row['username'];
    }
    return "usuario#$uid";
}

// ── LISTAR — solo equipos del usuario logueado ─────────────────────────
if ($accion === 'listar') {

    if ($usuario_id <= 0) {
        echo json_encode(["error" => "Se requiere usuario_id"]);
        exit();
    }

    $nombre = getNombreUsuario($conexion, $usuario_id);

    $sql_equipos = "SELECT * FROM equipos
                    WHERE usuario_id = $usuario_id
                    ORDER BY fecha_creacion DESC";
    $resultado = mysqli_query($conexion, $sql_equipos);

    $equipos = [];

    while ($equipo = mysqli_fetch_assoc($resultado)) {
        $id_equipo = $equipo['id'];

        $sql_pokemon = "SELECT * FROM equipo_pokemon
                        WHERE equipo_id = $id_equipo
                        ORDER BY slot ASC";
        $res_pokemon = mysqli_query($conexion, $sql_pokemon);

        $equipo['pokemon'] = [];
        while ($poke = mysqli_fetch_assoc($res_pokemon)) {
            $equipo['pokemon'][] = $poke;
        }

        $equipos[] = $equipo;
    }

    $total = count($equipos);
    registrarLog($conexion, $nombre, 'LISTAR_EQUIPOS', "Consultó sus equipos (total: $total)");
    echo json_encode($equipos);

// ── GUARDAR ────────────────────────────────────────────────────────────
} elseif ($accion === 'guardar') {

    $datos = json_decode(file_get_contents("php://input"), true);

    $uid           = intval($datos['usuario_id'] ?? 0);
    $nombre_equipo = mysqli_real_escape_string($conexion, $datos['nombre_equipo'] ?? '');
    $lista_pokemon = $datos['pokemon'] ?? [];
    $nombre        = getNombreUsuario($conexion, $uid);

    if ($uid <= 0) {
        echo json_encode(["error" => "Se requiere usuario_id"]);
        exit();
    }
    if (empty($nombre_equipo)) {
        registrarLog($conexion, $nombre, 'GUARDAR_FALLIDO', 'Nombre de equipo vacío');
        echo json_encode(["error" => "El equipo necesita un nombre"]);
        exit();
    }
    if (empty($lista_pokemon) || count($lista_pokemon) < 1) {
        registrarLog($conexion, $nombre, 'GUARDAR_FALLIDO', 'Equipo sin Pokémon');
        echo json_encode(["error" => "El equipo debe tener al menos 1 Pokémon"]);
        exit();
    }
    if (count($lista_pokemon) > 6) {
        registrarLog($conexion, $nombre, 'GUARDAR_FALLIDO', 'Más de 6 Pokémon en el equipo');
        echo json_encode(["error" => "El equipo no puede tener más de 6 Pokémon"]);
        exit();
    }

    $sql_equipo = "INSERT INTO equipos (nombre_equipo, usuario_id)
                   VALUES ('$nombre_equipo', $uid)";
    mysqli_query($conexion, $sql_equipo);
    $id_nuevo_equipo = mysqli_insert_id($conexion);

    $nombres_pokemon = [];
    foreach ($lista_pokemon as $index => $poke) {
        $pokemon_id     = intval($poke['id']);
        $pokemon_nombre = mysqli_real_escape_string($conexion, $poke['nombre']);
        $slot           = $index + 1;
        $nombres_pokemon[] = $poke['nombre'];

        $sql_poke = "INSERT INTO equipo_pokemon (equipo_id, pokemon_id, pokemon_nombre, slot)
                     VALUES ($id_nuevo_equipo, $pokemon_id, '$pokemon_nombre', $slot)";
        mysqli_query($conexion, $sql_poke);
    }

    $detalle = "Equipo '$nombre_equipo' guardado (ID=$id_nuevo_equipo) con: " . implode(', ', $nombres_pokemon);
    registrarLog($conexion, $nombre, 'GUARDAR_EQUIPO', $detalle);

    echo json_encode([
        "ok"      => true,
        "mensaje" => "Equipo '$nombre_equipo' guardado correctamente",
        "id"      => $id_nuevo_equipo
    ]);

// ── ELIMINAR ───────────────────────────────────────────────────────────
} elseif ($accion === 'eliminar') {

    $id     = intval($_GET['id']          ?? 0);
    $uid    = intval($_GET['usuario_id']  ?? 0);
    $nombre = getNombreUsuario($conexion, $uid);

    if ($id <= 0 || $uid <= 0) {
        echo json_encode(["error" => "ID inválido"]);
        exit();
    }

    // Obtener nombre del equipo antes de borrar (para el log)
    $res_eq     = mysqli_query($conexion, "SELECT nombre_equipo FROM equipos WHERE id = $id AND usuario_id = $uid");
    $nombre_eq  = ($res_eq && $row = mysqli_fetch_assoc($res_eq)) ? $row['nombre_equipo'] : "ID=$id";

    $sql = "DELETE FROM equipos WHERE id = $id AND usuario_id = $uid";

    if (mysqli_query($conexion, $sql) && mysqli_affected_rows($conexion) > 0) {
        registrarLog($conexion, $nombre, 'ELIMINAR_EQUIPO', "Eliminó equipo '$nombre_eq' (ID=$id)");
        echo json_encode(["ok" => true, "mensaje" => "Equipo eliminado"]);
    } else {
        registrarLog($conexion, $nombre, 'ELIMINAR_FALLIDO', "Intento de eliminar equipo ID=$id sin permiso");
        echo json_encode(["error" => "No se pudo eliminar o no te pertenece"]);
    }

// ── CONSULTAR LOGS ─────────────────────────────────────────────────────
} elseif ($accion === 'logs') {

    $uid    = intval($_GET['usuario_id'] ?? 0);
    $filtro = $_GET['filtro']            ?? 'todo'; // semana | mes | todo
    $solo   = $_GET['solo_usuario']      ?? '';      // nombre específico

    $where_partes = [];

    if (!empty($solo)) {
        $solo_safe       = mysqli_real_escape_string($conexion, $solo);
        $where_partes[]  = "usuario = '$solo_safe'";
    }

    if ($filtro === 'semana') {
        $where_partes[] = "fecha_log >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } elseif ($filtro === 'mes') {
        $where_partes[] = "fecha_log >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
    }
    // 'todo' → sin restricción de fecha

    $where = count($where_partes) ? 'WHERE ' . implode(' AND ', $where_partes) : '';

    $sql_logs = "SELECT * FROM logs $where ORDER BY fecha_log DESC LIMIT 200";
    $res_logs = mysqli_query($conexion, $sql_logs);

    $registros = [];
    while ($row = mysqli_fetch_assoc($res_logs)) {
        $registros[] = $row;
    }

    echo json_encode($registros);

} else {
    echo json_encode(["error" => "Acción no válida"]);
}

mysqli_close($conexion);
?>
