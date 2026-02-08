# Deploy en Render

## Errores que tenías

1. **`Your lockfile needs to be updated, but yarn was run with --frozen-lockfile`**  
   Render usaba Yarn con `--frozen-lockfile` y tu `yarn.lock` no estaba al día con `package.json`, o hay mezcla con `package-lock.json` (npm).

2. **`nest: not found`**  
   Al fallar la instalación con Yarn, `node_modules` no se instalaba bien y el comando `nest` (Nest CLI) no existía al ejecutar el build.

## Solución: usar npm en Render

El proyecto tiene `package-lock.json` (npm). En Render conviene usar **solo npm** para instalar y construir.

### En el Dashboard de Render

1. Entrá a tu **Web Service**.
2. **Build Command** (reemplazá lo que tengas):
   ```bash
   npm ci && npm run build
   ```
   - `npm ci` instala exactamente lo que dice `package-lock.json` (reproducible y no modifica el lockfile).
3. **Start Command**:
   ```bash
   npm run start:prod
   ```
   (o `node dist/main.js` si lo tenés configurado así.)

4. Guardá los cambios y volvé a hacer **Deploy**.

---

## Base de datos: sí, primero la base

La API usa **MySQL**. Render **no** ofrece MySQL como base gestionada (solo PostgreSQL), así que tenés que crear la base en un servicio externo y después conectar la API desde Render con variables de entorno.

### Dónde crear la base MySQL (recomendado)

1. **PlanetScale** (MySQL compatible, gratis para empezar)  
   - https://planetscale.com  
   - Crear cuenta → Create database → elegir región.  
   - Te dan host, usuario, contraseña y nombre de base.  
   - En el panel: **Connect** → **Connect with: General** para ver la URL o los datos (host, user, password, database).

2. **Railway** (MySQL, tiene capa gratis)  
   - https://railway.app  
   - New Project → Add MySQL.  
   - Ver más abajo la sección **“MySQL en Railway paso a paso”**.

3. **Otras opciones**: Aiven, AWS RDS, etc. Cualquier MySQL accesible por internet sirve.

### Orden recomendado

1. **Crear la base** en PlanetScale, Railway o el proveedor que elijas.  
2. **Anotar** host, puerto, usuario, contraseña y nombre de la base.  
3. **Configurar en Render** las variables de entorno de la base (ver abajo).  
4. **Desplegar la API** en Render.  
   - Con tu configuración actual, TypeORM tiene `synchronize: true`, así que **la primera vez que arranque la API en Render se crearán solas las tablas** en esa base. No hace falta correr migraciones a mano.  
5. **Datos iniciales** (categorías, medios de pago): los scripts están en `scripts/` (`insert-categorias.sql`, `insert-medios-pago.sql`). Podés ejecutarlos una sola vez contra la base de producción desde tu PC (con un cliente MySQL conectado a la URL/host que te dio el proveedor) o desde el panel del proveedor si tiene consola SQL.

### Variables de entorno en Render

En **Render** → tu Web Service → **Environment** agregá (con los valores de la base que creaste):

| Variable     | Ejemplo / descripción                    |
|-------------|------------------------------------------|
| `DB_HOST`   | host que te da PlanetScale/Railway       |
| `DB_PORT`   | `3306` (o el que indique el proveedor)   |
| `DB_USERNAME` | usuario de la base                    |
| `DB_PASSWORD` | contraseña de la base                  |
| `DB_NAME`   | nombre de la base (ej. `miguita`)       |
| `JWT_SECRET` | una clave secreta larga y aleatoria   |
| `NODE_ENV`  | `production`                             |
| `PORT`      | Render lo asigna; podés dejarlo vacío    |
| Cloudinary  | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` si los usás |

**Resumen:** Primero creás la base MySQL en un proveedor (ej. PlanetScale o Railway), después configurás esas variables en Render y recién ahí desplegás la API. La API, al arrancar, creará las tablas si no existen.

---

## MySQL en Railway paso a paso

Railway te muestra variables como `MYSQL_DATABASE`, `MYSQL_ROOT_PASSWORD`, `MYSQL_URL`, etc. Muchas usan `${{...}}`: son **placeholders que Railway rellena solo**. No tenés que escribir esos `${{...}}` a mano.

### 1. En Railway (servicio MySQL)

- **No hace falta que pongas nada** para que la base funcione. Railway ya genera:
  - `MYSQL_ROOT_PASSWORD`
  - `RAILWAY_PRIVATE_DOMAIN` (el host)
  - `MYSQLUSER` (por defecto `root`)
  - etc.

- **Opcional:** si querés que la base se llame `miguita` (como en tu `.env`), en el servicio MySQL → pestaña **Variables** agregá o editá:
  - **Variable:** `MYSQL_DATABASE`  
  - **Valor:** `miguita`  
  (Si no la tocás, Railway suele usar `railway` como nombre de base.)

- **Opcional:** podés poner **tu propia contraseña** en lugar de la que genera Railway. En **Variables** agregá o editá:
  - **Variable:** `MYSQL_ROOT_PASSWORD`  
  - **Valor:** la contraseña que elijas (guardala para ponerla después en `DB_PASSWORD` en Render).

- Guardá. Railway puede reiniciar el servicio y te mostrará los valores **reales** (por ejemplo la contraseña generada).

### 2. Dónde ver los valores reales en Railway (y usar la conexión **pública**)

Si tu **API está en Render** (fuera de Railway), no podés usar el host **interno** (`mysql.railway.internal` o `RAILWAY_PRIVATE_DOMAIN`): ese solo funciona entre servicios del mismo proyecto en Railway. Render no puede resolver ese nombre.

Tenés que usar la **conexión pública** de MySQL:

1. En Railway → **servicio MySQL** → pestaña **Settings** (o **Variables**).
2. Buscá **"Networking"** o **"Public Networking"** y **activá** la red pública / TCP Proxy para MySQL (puerto 3306).
3. Railway te va a mostrar un **host público** (ej. `monorail.proxy.rlwy.net`) y un **puerto público** (ej. `12345`). A veces está en la variable **`MYSQL_PUBLIC_URL`** o en **Connect** → "Public".
4. En **Render** usá para tu API:
   - **`DB_HOST`** = ese **host público** (no `mysql.railway.internal`).
   - **`DB_PORT`** = el **puerto público** que te dio Railway (no siempre es 3306).

El resto igual: `DB_USERNAME` = `root`, `DB_PASSWORD` = `MYSQL_ROOT_PASSWORD`, `DB_NAME` = `MYSQL_DATABASE`.

### 3. Cómo mapear a lo que usa tu API (tu .env / Render)

Tu app usa **estas** variables (como en tu `.env` local):

| Tu variable (API) | De dónde sale en Railway | Ejemplo |
|-------------------|--------------------------|---------|
| `DB_HOST`         | `MYSQLHOST` o `RAILWAY_PRIVATE_DOMAIN` | `containers-us-west-xxx.railway.app` |
| `DB_PORT`         | `MYSQLPORT`              | `3306` |
| `DB_USERNAME`     | `MYSQLUSER`              | `root` |
| `DB_PASSWORD`     | `MYSQL_ROOT_PASSWORD`   | (el valor que muestra Railway) |
| `DB_NAME`         | `MYSQL_DATABASE`        | `miguita` o `railway` |

- **En local:** no cambies tu `.env` para desarrollo; seguís usando `localhost` y tu Docker.
- **En Render:** en el Web Service de la API → **Environment** → agregá exactamente esas 5 variables con los valores que ves en Railway (Variables del servicio MySQL). No uses `${{...}}` en Render; poné el valor concreto (host, 3306, root, contraseña, nombre de base).

### 4. Resumen

- **Railway (MySQL):** no tenés que “rellenar” los `${{...}}`. Opcional: poner `MYSQL_DATABASE=miguita`. El resto lo genera Railway.
- **Render (API):** cargar `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` con los valores **reales** que muestra Railway en la pestaña Variables del servicio MySQL.

Tu `.env` local queda solo para desarrollo (Docker); en producción la API en Render usa las variables que configures en Render con los datos de Railway.

---

## Opcional: dejar solo un package manager

Tenés tanto `package-lock.json` (npm) como `yarn.lock` / `.yarnrc.yml` (Yarn). Para evitar confusiones:

- **Si en Render usás npm** (recomendado con lo anterior): podés borrar `yarn.lock` y `.yarnrc.yml` (y la carpeta `.yarn` si existe) y usar siempre `npm install` en local.  
- **Si preferís Yarn en Render**: quitá `package-lock.json`, ejecutá `yarn install` en tu máquina, subí el nuevo `yarn.lock`, y en Render usá:
  - Build: `yarn install --frozen-lockfile && yarn run build`
  - Start: `yarn run start:prod`

Con el **Build Command** cambiado a `npm ci && npm run build` y **Start** a `npm run start:prod` el deploy en Render debería funcionar.
