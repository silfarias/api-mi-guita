# API MiGuita – Contexto para asistentes (ChatGPT / IA)

Este documento describe el estado actual de la API **MiGuita** (gestión de finanzas personales): entidades, relaciones, flujos de datos, endpoints y reglas de negocio. Sirve para que un asistente entienda el sistema y pueda aconsejar cómo seguir desarrollando.

---

## 1. Stack y estructura

- **Framework:** NestJS
- **ORM:** TypeORM
- **Base de datos:** MySQL
- **Auth:** JWT (access + refresh token), Passport
- **Documentación:** Swagger
- **Estructura:** Módulos por dominio bajo `src/schematics/` (auth, usuario, persona, cuenta, movimiento, categoria, transferencia, gasto-fijo, pagos-gasto-fijo, **presupuesto**, **dashboard**, **reportes**). Servicios comunes en `src/common/` (email, guards, DTOs, enums, errores).

Todas las rutas excepto `auth/signup`, `auth/login` y `auth/refresh` requieren **JWT** en header: `Authorization: Bearer <access_token>`.

---

## 2. BaseEntity (común a todas las entidades)

Todas las entidades extienden `BaseEntity`:

- `id` (PK, auto-increment)
- `createdAt` → columna `created_date`
- `updatedAt` → columna `updated_date`
- `deletedAt` → columna `deleted_date` (soft delete)

---

## 3. Entidades y relaciones

### 3.1 Usuario (`user_01_cab_usuario`)

- **Campos:** nombreUsuario, contrasena (hash), email, emailVerificado (boolean), codigoVerificacionEmail, codigoVerificacionExpiraEn, activo, ultimoAcceso, fotoPerfil (URL).
- **Relación 1:1** con **Persona** (FK `rela_user02`).
- **Relaciones 1:N:** cuentas, movimientos, transferencias, gastosFijos, pagosGastoFijo, resumenesMensuales, **presupuestos**.

### 3.2 Persona (`user_02_cab_persona`)

- **Campos:** nombre, apellido.
- **Relación 1:1** con Usuario (sin FK en esta tabla; la FK está en usuario).

Se crea una Persona por cada Usuario en el signup (nombre y apellido del registro).

---

### 3.3 Cuenta (`cta_01_cab_cuenta`)

- **Campos:** nombre, tipo (enum), saldoActual (decimal 10,2).
- **TipoCuentaEnum:** EFECTIVO | BANCO | BILLETERA.
- **Relación N:1** con Usuario (FK `rela01_user`).
- **Relaciones 1:N:** movimientos; transferenciasOrigen; transferenciasDestino.

**Reglas de saldo:**

- El saldo **no** se actualiza al editar la cuenta manualmente (PATCH); se actualiza solo cuando se crean/editan/eliminan **Movimientos** o **Transferencias**.
- **Al crear una cuenta** (POST `/cuenta` o POST `/cuenta/bulk`): el body lleva **`saldoInicial`** (opcional). La cuenta se persiste con **saldoActual = 0**. Si `saldoInicial > 0`, el **CuentaService** llama a **MovimientoService.createSaldoInicial()**, que crea un movimiento con `tipoMovimiento: SALDO_INICIAL`, `descripcion: 'Saldo inicial'`, `monto: saldoInicial`, y aplica ese monto al saldo de la cuenta. Así el saldo inicial queda registrado como movimiento y la cuenta queda con el saldo correcto. Es la única fuente de verdad para el saldo.

---

### 3.4 Movimiento (`mov_01_cab_movimiento`)

- **Campos:** tipoMovimiento (enum), descripcion, monto, fecha.
- **TipoMovimientoEnum:** INGRESO | EGRESO | TRANSFERENCIA | SALDO_INICIAL.
- **Relaciones N:1:** cuenta (FK `rela01_cta`), categoria (FK `rela01_cat`, opcional), usuario (FK `rela01_user`).
- **Relación 1:N:** pagosGastoFijo (un movimiento puede estar vinculado a un pago de gasto fijo).

**Reglas de saldo (en MovimientoService):**

- Al **crear** movimiento: se aplica delta al `saldoActual` de la cuenta según tipo (INGRESO/SALDO_INICIAL suman, EGRESO resta; TRANSFERENCIA no modifica saldo aquí porque las transferencias tienen su propia lógica).
- Al **actualizar**: se “revierte” el monto anterior en la cuenta anterior y se aplica el nuevo monto en la cuenta nueva (si cambió cuenta/tipo/monto).
- Al **eliminar** (soft delete): se revierte el monto en la cuenta.

**SALDO_INICIAL:** Los movimientos de saldo inicial se crean **automáticamente** al crear una cuenta con `saldoInicial > 0` (CuentaService → MovimientoService.createSaldoInicial). No llevan categoría (`categoria` = null); también se pueden crear manualmente por POST `/movimiento` con `tipoMovimiento: SALDO_INICIAL` (categoria opcional, normalmente null).

---

### 3.5 Categoria (`cat_01_cab_categoria`)

- **Campos:** nombre, descripcion, color, icono, tipo (enum), activo.
- **TipoCategoriaEnum:** INGRESO | EGRESO (para filtrar categorías de ingresos vs gastos).
- **Relaciones 1:N:** movimientos, gastosFijos, **presupuestos**.

Las categorías se pueden precargar con el script `scripts/insert-categorias.sql`. Son globales (no por usuario); cualquier usuario puede usarlas en movimientos y gastos fijos.

---

### 3.6 Transferencia (`tra_01_cab_transferencia`)

- **Campos:** monto, fecha.
- **Relaciones N:1:** cuentaOrigen (FK `rela01_cta_origen`), cuentaDestino (FK `rela01_cta_destino`), usuario (FK `rela01_user`).

**Regla:** Al crear una transferencia, en **TransferenciaService** se resta el monto de `cuentaOrigen.saldoActual` y se suma a `cuentaDestino.saldoActual`. Origen y destino deben ser distintas y ambas del mismo usuario.

---

### 3.7 GastoFijo (`gast_01_cab_gasto_fijo`)

- **Campos:** nombre, tipo (FIJO | VARIABLE), montoEstimado, diaVencimiento (date), activo, esDebitoAutomatico.
- **Relaciones N:1:** categoria, usuario.
- **Relación 1:N:** pagosGastoFijo.

Representa un gasto recurrente (ej. alquiler, servicios). Los pagos concretos por mes/año están en **PagoGastoFijo**.

---

### 3.8 PagoGastoFijo (`gast_02_rel_pago_gasto_fijo`)

- **Campos:** mes (MesEnum), anio (int), monto, pagado (boolean).
- **Relaciones N:1:** gastoFijo, movimiento (opcional; si se registra el pago con un movimiento), usuario.

Cada registro es “una cuota” de un gasto fijo para un mes/año. Se puede marcar como pagado y opcionalmente vincular a un **Movimiento** (el movimiento que representa ese pago en una cuenta).

**MesEnum:** ENERO, FEBRERO, … DICIEMBRE.

---

### 3.9 Presupuesto (`pres_01_cab_presupuesto`)

- **Campos:** monto (decimal 10,2), mes (MesEnum), anio (int).
- **Relaciones N:1:** categoria (FK `rela01_cat`), usuario (FK `rela01_user`).
- **Reglas:** Un presupuesto define cuánto se quiere gastar en una **categoría** en un **mes/año**. Solo se permite para categorías de tipo **EGRESO**. Constraint único: (usuario, categoria, mes, anio). Se usa en el **Dashboard** para mostrar estado (OK / ALERTA / EXCEDIDO) y alertas.

---

### 3.10 ResumenMensual (`res_01_cab_resumen_mensual`)

- **Campos:** mes (MesEnum), anio, saldoInicial, saldoFinal.
- **Relación N:1:** usuario.

**Estado:** Solo existe la entidad y la relación en Usuario. **No hay módulo ni controlador** en `app.module`; es decir, no hay endpoints CRUD ni lógica de negocio expuesta aún. Queda para implementar (p. ej. cálculo/guardado de resumen mensual por usuario).

---

## 4. Flujo de datos resumido

### 4.1 Onboarding (registro y cuentas iniciales)

1. **Registro:** Signup crea Persona + Usuario. Se envía email de verificación (código 6 dígitos); el usuario **puede usar la app sin verificar**. Login devuelve access_token, refresh_token y usuario.
2. **Crear cuentas:** El usuario crea sus cuentas (una a una o bulk) indicando **saldo inicial** por cuenta. Ejemplo body:
   - `POST /cuenta`: `{ "nombre": "Efectivo", "tipo": "EFECTIVO", "saldoInicial": 15000 }`
   - `POST /cuenta/bulk`: `{ "cuentas": [ { "nombre": "Efectivo", "tipo": "EFECTIVO", "saldoInicial": 15000 }, { "nombre": "Mercado Pago", "tipo": "BILLETERA", "saldoInicial": 200000 } ] }`
3. **Efecto:** Por cada cuenta con `saldoInicial > 0` se crea automáticamente un **Movimiento** con `tipoMovimiento: SALDO_INICIAL`, `descripcion: 'Saldo inicial'`, `monto: saldoInicial`, y se actualiza el `saldoActual` de la cuenta. Las cuentas se guardan primero con saldo 0; el movimiento es el que aplica el saldo. Así el historial de movimientos incluye el saldo inicial y el balance es consistente.

### 4.2 Uso normal de la app

- **Auth:** Refresh en `POST /auth/refresh`. Verificación de email: `POST /auth/verify-email` (código), `POST /auth/send-verification-email` (reenvío). “Olvidé mi contraseña” solo permitido si `emailVerificado === true`.
- **Cuentas:** Listado (GET list/search), crear (POST con saldoInicial), editar (PATCH; no se puede cambiar el saldo por aquí), eliminar (DELETE). El saldo actual se mantiene dinámicamente con movimientos y transferencias.
- **Movimientos:** Se crean sobre una cuenta con tipo (INGRESO, EGRESO, SALDO_INICIAL o TRANSFERENCIA), monto, fecha y opcionalmente categoría. Cada creación/edición/eliminación actualiza el `saldoActual` de la(s) cuenta(s) afectada(s).
- **Transferencias:** POST con cuentaOrigenId, cuentaDestinoId, monto, fecha. Resta en origen, suma en destino; ambas cuentas del mismo usuario.
- **Gastos fijos:** Definición de gastos recurrentes (categoría, monto estimado, día vencimiento). Pagos por mes/año en PagoGastoFijo; se puede marcar como pagado y asociar un Movimiento.
- **Categorías:** CRUD global (tipo INGRESO/EGRESO). Precarga con `scripts/insert-categorias.sql`.

---

## 5. Endpoints por módulo

| Módulo        | Prefijo              | Métodos principales |
|---------------|----------------------|----------------------|
| Auth          | `/auth`              | POST signup, login, refresh; GET me; POST verify-email, send-verification-email; POST logout; PATCH change-password |
| Usuario       | `/usuario`           | GET search, :id; POST; PATCH :id; DELETE :id (protegido por usuario) |
| Cuenta        | `/cuenta`            | GET list, search, :id; POST (body: nombre, tipo, **saldoInicial** opcional), POST **bulk** (body: cuentas[] con nombre, tipo, saldoInicial); PATCH :id; DELETE :id |
| Movimiento    | `/movimiento`        | GET search, agrupado, :id; POST; PATCH :id; DELETE :id |
| Categoria     | `/categoria`        | GET search, :id; POST; PATCH :id; DELETE :id |
| Transferencia | `/transferencias`   | POST (crear transferencia: cuentaOrigenId, cuentaDestinoId, monto, fecha) |
| Gasto fijo    | `/gasto-fijo`       | GET search, :id, etc.; POST (y bulk si existe); PATCH :id; DELETE :id |
| Pago gasto fijo | `/pago-gasto-fijo` | GET por-mes, search, :id; PATCH :id |
| **Presupuesto**  | `/presupuesto`     | GET (query: mes, anio), GET :id; POST (categoriaId, mes, anio, monto); PATCH :id; DELETE :id |
| **Dashboard**    | `/dashboard`       | GET (query: **mes**, **anio**) — un solo endpoint con saldo total, ingresos/egresos del mes, balance, gastos por categoría/cuenta, últimos movimientos, presupuestos con estado y alertas |
| **Reportes**     | `/reportes`        | GET **categorias** (mes, anio); GET **cuentas** (mes, anio opc.); GET **evolucion** (anio); GET **flujo** (mes, anio opc.) |

Todos los anteriores (salvo auth público) usan `JwtAuthGuard` y reciben `req.user.id` como usuario autenticado.

---

## 6. Enums de referencia

- **TipoCategoriaEnum:** INGRESO, EGRESO  
- **TipoMovimientoEnum:** INGRESO, EGRESO, TRANSFERENCIA, SALDO_INICIAL  
- **TipoCuentaEnum:** EFECTIVO, BANCO, BILLETERA  
- **TipoGastoFijoEnum:** FIJO, VARIABLE  
- **MesEnum:** ENERO … DICIEMBRE  

---

## 7. Convenciones de código

- **Mappers:** Métodos async: `entity2DTO`, `page2Dto`, `createDTO2Entity`, `updateDTO2Entity`. Los servicios usan `await` al llamarlos.
- **Repositorios:** Por entidad en `repository/`; los servicios inyectan el repositorio y, cuando aplica, GetEntityService / ErrorHandlerService.
- **DTOs:** Request DTOs con class-validator; DTOs de respuesta con class-transformer `@Expose()` y `excludeExtraneousValues: true`.
- **Errores:** Códigos y mensajes centralizados en `src/common/errors/errors-codes.ts`; ErrorHandlerService para lanzar excepciones HTTP consistentes.

---

## 8. Qué falta o se puede mejorar (para que el asistente aconseje)

- **ResumenMensual:** Sin módulo ni endpoints; falta definir cómo se calcula/guarda saldoInicial y saldoFinal por usuario/mes/año (y si se genera automático o manual).
- **Validaciones de negocio:** Por ejemplo, no permitir monto negativo en transferencias; o no permitir eliminar una cuenta con movimientos/transferencias (o definir si se reasignan/eliminan en cascada).
- **Categoría en movimientos:** La categoría es opcional; se podría exigir para INGRESO/EGRESO y validar que el tipo de categoría coincida con el tipo de movimiento. Los movimientos SALDO_INICIAL se guardan con categoria = null.
- **Pagos de gastos fijos:** Clarificar si los PagoGastoFijo se generan automáticamente por mes/año para cada GastoFijo activo o se crean bajo demanda; y si al vincular un Movimiento se actualiza o no el saldo (hoy el movimiento ya actualiza saldo por su lado).
- **Dashboard y reportes:** Implementados: **GET /dashboard?mes=&anio=** (resumen en un endpoint), **Presupuesto** CRUD, **GET /reportes/categorias**, **/reportes/cuentas**, **/reportes/evolucion**, **/reportes/flujo**. Posibles mejoras: alertas más inteligentes, comparación mensual, predicciones, endpoint de IA para análisis.
- **Filtros por fecha:** En movimientos/cuentas, filtros por rango de fechas y por tipo de movimiento para listados y reportes.

**Scripts SQL útiles:** `scripts/insert-categorias.sql` (precarga categorías con tipo INGRESO/EGRESO). `scripts/truncate-cuentas-y-dependentes.sql` (vacía cuentas, movimientos y transferencias y reinicia auto-increment; útil para rehacer onboarding).

---

## 9. Cómo usar este documento con ChatGPT

Podés pegar este README (o secciones relevantes) en ChatGPT y pedir, por ejemplo:

- “Dado este contexto, ¿cómo implementarías el módulo ResumenMensual y qué endpoints propondrías?”
- “¿Cómo validar que la categoría de un movimiento sea del mismo tipo (INGRESO/EGRESO) que el movimiento?”
- “Propón un diseño de reportes (endpoints y DTOs) para la API MiGuita.”
- “Revisá el flujo de saldos entre Cuenta, Movimiento y Transferencia y decime si ves riesgos de consistencia.”
- “El onboarding crea cuentas con saldoInicial y genera movimientos SALDO_INICIAL; ¿cómo mostraría esto en un dashboard?”

Actualizá este documento cuando agregues entidades, módulos o reglas de negocio importantes para mantener el contexto al día.
