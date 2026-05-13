-- ============================================================
--  POKÉMON BATTLE TEAMS — Script de creación de base de datos
--  Ejecutar en MariaDB: mysql -u root < crear_base_de_datos.sql
--  O pegar directamente en la consola de MariaDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS pokemon_box
    CHARACTER SET utf8
    COLLATE utf8_general_ci;

USE pokemon_box;

CREATE TABLE usuarios (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    fecha_registro DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE equipos (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre_equipo  VARCHAR(50)  NOT NULL,
    usuario_id     INT          NULL,
    fecha_creacion DATETIME     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipo_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE equipo_pokemon (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id      INT         NOT NULL,
    pokemon_id     INT         NOT NULL,
    pokemon_nombre VARCHAR(50) NOT NULL,
    slot           INT         NOT NULL,
    CONSTRAINT fk_pokemon_equipo
        FOREIGN KEY (equipo_id) REFERENCES equipos(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
