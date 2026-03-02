# API MiGuita – Finanzas Personales

API REST desarrollada con **NestJS + TypeORM + MySQL** para gestionar finanzas personales: cuentas, movimientos, transferencias, gastos fijos y **presupuestos con dashboard e informes**.

---

## 🚀 Inicio rápido

### Instalación

```bash
npm install
```

### Configuración `.env`

```env
# Servidor
PORT=3000
NODE_ENV=development

# JWT
ACCESS_TOKEN_SECRET=tu_clave_secreta_super_segura
REFRESH_TOKEN_SECRET=tu_refresh_secreto
ACCESS_TOKEN_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d

# Base de Datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=tu_password
DB_NAME=miguita
```

La base de datos debe existir antes de levantar la app:

```sql
CREATE DATABASE miguita;
```

### Levantar el servidor

```bash
# Desarrollo (hot reload)
npm run start:dev

# Producción
npm run build
npm run start:prod
```

Servidor: `http://localhost:3000`  
Swagger: `http://localhost:3000/api`

Para endpoints protegidos, usar:

```text
Authorization: Bearer <access_token>
```

---

## 🧠 Conceptos clave

- **Usuario / Persona**: identidad básica para autenticación y perfil.
- **Cuenta**: Efectivo, banco, billetera, etc. Tiene `saldoActual` dinámico.
- **Movimiento**:
  - `INGRESO` / `EGRESO`: modifican saldo de la cuenta.
  - `SALDO_INICIAL`: se crea al definir saldo inicial de una cuenta.
  - `TRANSFERENCIA`: representada por el módulo de transferencias (no usa categoría).
- **Transferencia**: mueve dinero entre dos cuentas del mismo usuario, validando saldo suficiente.
- **Categoría**: tipo `INGRESO` o `EGRESO`. Se usa en movimientos y gastos fijos.
- **Gasto fijo**: gastos recurrentes (alquiler, servicios) + pagos mensuales (`pago-gasto-fijo`).
- **Presupuesto**: límite de gasto por **categoría y mes** (solo categorías de tipo EGRESO).
- **Dashboard**: endpoint único que devuelve resumen del mes (saldos, gastos, presupuestos y alertas).
- **Reportes**: vistas agregadas por categoría, cuenta, evolución y flujo.

La integridad de saldo se mantiene siempre a partir de los movimientos y transferencias, no se edita a mano.

---

## 📦 Módulos principales y endpoints

- **Auth** (`/auth`)
  - `POST /signup` – alta de usuario + login.
  - `POST /login` – login con usuario/contraseña.
  - `POST /refresh` – renueva access/refresh token.
  - `GET /me` – usuario actual.
  - `PATCH /change-password` – cambio de contraseña (requiere email verificado).
  - Verificación de email: `POST /verify-email`, `POST /send-verification-email`, etc.

- **Usuario / Persona** (`/usuario`, `/persona`)
  - CRUD básico, búsqueda paginada; usados por auth y perfil.

- **Cuenta** (`/cuenta`)
  - `POST /` – crear cuenta (opcional `saldoInicial`, genera movimiento `SALDO_INICIAL`).
  - `POST /bulk` – crear varias cuentas a la vez (valida duplicados por nombre).
  - `GET /list`, `GET /search`, `GET /:id` – listar/buscar/ver cuentas de un usuario.
  - `PATCH /:id`, `DELETE /:id` – actualizar o eliminar (no permite eliminar con movimientos/transferencias asociadas).

- **Movimiento** (`/movimiento`)
  - CRUD completo de movimientos (ingresos, egresos, saldo inicial).
  - Search paginado y versiones agrupadas para reportes.
  - Todas las operaciones actualizan `saldoActual` de la cuenta de forma transaccional.
  - Validaciones:
    - Categoría obligatoria para `INGRESO` y `EGRESO`.
    - Tipo de categoría debe coincidir con tipo de movimiento (INGRESO/EGRESO).
    - Permisos por usuario.

- **Transferencia** (`/transferencias`)
  - `POST /` – crear transferencia entre cuentas del mismo usuario.
  - Reglas: origen ≠ destino, saldo suficiente, actualización de ambos saldos en una transacción.

- **Categoría** (`/categoria`)
  - CRUD de categorías globales (`INGRESO` / `EGRESO`).

- **Gasto fijo / Pagos** (`/gasto-fijo`, `/pago-gasto-fijo`)
  - Definición de gastos recurrentes + pagos por mes/año.
  - Al registrar un pago, puede crear automáticamente un movimiento de `EGRESO` en la cuenta elegida.

- **Presupuesto** (`/presupuesto`)
  - `POST /` – crear presupuesto `{ categoriaId, mes, anio, monto }`.
  - `GET /?mes=&anio=` – listar presupuestos del mes.
  - `GET /:id`, `PATCH /:id`, `DELETE /:id` – CRUD.
  - Reglas:
    - Solo categorías tipo EGRESO.
    - Un presupuesto por (usuario, categoría, mes, año).

- **Dashboard** (`/dashboard`)
  - `GET /?mes=FEBRERO&anio=2026`
  - Devuelve en una sola llamada:
    - `saldoTotal`, `ingresosMes`, `egresosMes`, `balanceMes`.
    - `topCategoriasGasto`, `gastosPorCategoria`, `gastosPorCuenta`.
    - `ultimosMovimientos`.
    - `presupuestos`: `{ categoria, presupuesto, gastado, restante, porcentaje, estado }`.
    - `alertas` en base al estado de los presupuestos (OK, ALERTA, EXCEDIDO).

- **Reportes** (`/reportes`)
  - `GET /categorias?mes=&anio=` – gastos por categoría.
  - `GET /cuentas?mes=&anio=` – ingresos/egresos por cuenta (mes/año opcionales).
  - `GET /evolucion?anio=` – balance mensual del año.
  - `GET /flujo?mes=&anio=` – ingresos, egresos y balance (mes/año opcionales).

Todos estos módulos están documentados en Swagger con sus DTOs y ejemplos.

---

## 🛠️ Tecnologías y utilidades

- **NestJS** + **TypeORM** + **MySQL**.
- **JWT** (access + refresh) con expiraciones configurables.
- **Swagger** para documentación interactiva.
- **class-validator / class-transformer** en todos los DTOs.
- Servicios comunes:
  - `GetEntityService` – búsquedas reutilizables con manejo estándar de `NotFound`.
  - `ErrorHandlerService` – construcción uniforme de errores (`code`, `message`, `details`) y mapeo de errores de base de datos.

Con esto deberías tener una visión clara de qué hace la API MiGuita, cómo arrancarla y cuáles son los módulos clave para integrarla con tu frontend.
