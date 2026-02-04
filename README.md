# API Nonna

API REST desarrollada con NestJS para gestión de usuarios y autenticación.

## 🚀 Inicio Rápido

### Instalación

```bash
# Instalar dependencias
npm install
```

### Configuración

1. Crear archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=tu_clave_secreta_super_segura

# Base de Datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=tu_password
DB_NAME=nonna
```

2. Crear la base de datos MySQL:
```sql
CREATE DATABASE nonna;
```

### Iniciar el Servidor

```bash
# Modo desarrollo (con hot-reload)
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

El servidor estará disponible en `http://localhost:3000`

## 📚 Documentación API

Una vez iniciado el servidor, la documentación Swagger está disponible en:
```
http://localhost:3000/api
```

## 🔐 Endpoints Principales

### Autenticación

#### POST `/auth/signup`
Registrar nuevo usuario y autenticarlo
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "nombreUsuario": "juanperez123",
  "contrasena": "mipassword123",
  "email": "juanperez@gmail.com",
  "activo": true
}
```

#### POST `/auth/login`
Iniciar sesión
```json
{
  "email": "juanperez@gmail.com",
  "contrasena": "mipassword123"
}
```

#### PATCH `/auth/change-password`
Cambiar contraseña (no requiere autenticación)
```json
{
  "email": "juanperez@gmail.com",
  "contrasena": "nuevaPassword123",
  "confirmarContrasena": "nuevaPassword123"
}
```

#### GET `/auth/me`
Obtener información del usuario autenticado (requiere token JWT)

### Usuarios

#### POST `/usuario`
Crear un nuevo usuario
```json
{
  "nombre": "María",
  "apellido": "González",
  "nombreUsuario": "mariagonzalez",
  "contrasena": "password123",
  "email": "maria@gmail.com",
  "activo": true
}
```

#### POST `/usuario/with-id`
Crear usuario con ID de persona existente
```json
{
  "personaId": 1,
  "nombreUsuario": "usuario123",
  "contrasena": "password123",
  "email": "usuario@gmail.com",
  "activo": true
}
```

#### GET `/usuario/search`
Buscar usuarios (requiere autenticación)
```
GET /usuario/search?page=1&limit=10&nombreUsuario=usuario
```

#### GET `/usuario/:id`
Obtener usuario por ID (requiere autenticación)

#### PATCH `/usuario/:id`
Actualizar usuario (requiere autenticación)
```json
{
  "nombreUsuario": "nuevoUsuario",
  "email": "nuevo@email.com",
  "nombre": "Nuevo Nombre",
  "apellido": "Nuevo Apellido"
}
```

#### DELETE `/usuario/:id`
Eliminar usuario (requiere autenticación)

### Personas

#### POST `/persona`
Crear una nueva persona
```json
{
  "nombre": "Carlos",
  "apellido": "Rodríguez"
}
```

#### GET `/persona/search`
Buscar personas con sus usuarios (requiere autenticación)
```
GET /persona/search?page=1&limit=10&nombre=Carlos
```

#### GET `/persona/:id`
Obtener persona por ID con sus usuarios (requiere autenticación)

#### DELETE `/persona/:id`
Eliminar persona y sus usuarios asociados (requiere autenticación)

## 🔑 Autenticación

Para acceder a endpoints protegidos, incluir el token JWT en el header:

```
Authorization: Bearer <token_jwt>
```

El token se obtiene al hacer login o signup.

## 📋 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Linting
npm run lint

# Formateo
npm run format
```

## 🛠️ Tecnologías

- **NestJS** - Framework Node.js
- **TypeORM** - ORM para MySQL
- **JWT** - Autenticación con tokens
- **Swagger** - Documentación API
- **bcrypt** - Encriptación de contraseñas
- **class-validator** - Validación de datos

## 📝 Notas

- Las contraseñas se encriptan automáticamente con bcrypt
- Los usuarios eliminados se marcan con soft delete (no se borran físicamente)
- Una persona puede tener múltiples usuarios asociados
- Un usuario pertenece a una única persona
