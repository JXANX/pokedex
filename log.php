<?php
/**
 * log.php — Módulo de registro de eventos (logs)
 * Guarda en archivo de texto Y en la tabla `logs` de la BD.
 *
 * Uso: registrarLog($conexion, $usuario, $accion, $detalle)
 */

define('LOG_DIR',  __DIR__ . '/logs/');
define('LOG_FILE', LOG_DIR . 'pokemon_app.log');

// Crea la carpeta de logs si no existe
if (!is_dir(LOG_DIR)) {
    mkdir(LOG_DIR, 0755, true);
}

/**
 * Registra un evento tanto en el archivo de texto como en la BD.
 *
 * @param mysqli      $conexion  Conexión activa de MySQLi
 * @param string      $usuario   Nombre del usuario que ejecuta la acción
 * @param string      $accion    Identificador corto de la acción (ej. 'LOGIN', 'GUARDAR_EQUIPO')
 * @param string      $detalle   Descripción legible del evento
 */
function registrarLog($conexion, string $usuario, string $accion, string $detalle): void
{
    $fecha  = date('Y-m-d H:i:s');
    $ip     = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';

    // ── 1. Archivo de texto ───────────────────────────────────────────
    $linea = "[$fecha] | IP: $ip | Usuario: $usuario | Acción: $accion | $detalle" . PHP_EOL;
    file_put_contents(LOG_FILE, $linea, FILE_APPEND | LOCK_EX);

    // ── 2. Base de datos ──────────────────────────────────────────────
    if ($conexion) {
        $u = mysqli_real_escape_string($conexion, $usuario);
        $a = mysqli_real_escape_string($conexion, $accion);
        $d = mysqli_real_escape_string($conexion, $detalle);
        $i = mysqli_real_escape_string($conexion, $ip);

        mysqli_query(
            $conexion,
            "INSERT INTO logs (usuario, accion, detalle, ip, fecha_log)
             VALUES ('$u', '$a', '$d', '$i', NOW())"
        );
    }
}
?>
