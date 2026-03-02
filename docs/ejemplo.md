# Guía para el frontend – API MiGuita

Este archivo es una **guía rápida para el frontend**: qué flujos implementar, qué endpoints usar y qué datos enviar/esperar.

---

## 1. Visión general

La API expone estos módulos principales:

- **Auth**: registro, login, refresh, verificación de email.
- **Usuario / Persona**: datos de perfil.
- **Cuenta**: creación de cuentas y saldos iniciales.
- **Movimiento**: ingresos, egresos y ajustes de saldo.
- **Transferencia**: mover dinero entre cuentas.
- **Gasto fijo / Pago gasto fijo**: suscripciones y pagos mensuales.
- **Presupuesto**: límites de gasto por categoría y mes.
- **Dashboard**: resumen único para la home.
- **Reportes**: análisis por categoría, cuenta, evolución y flujo.

Todas las llamadas (excepto signup/login/refresh/verificación) requieren:

```text
Authorization: Bearer <access_token>
```

---

## 2. Flujo de autenticación

### 2.1 Registro y login

**Signup**

- `POST /auth/signup`
- Body (ejemplo mínimo):

```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "nombreUsuario": "juanperez",
  "contrasena": "mipassword123",
  "email": "juan@example.com"
}
```

- Respuesta:
  - `access_token`
  - `refresh_token`
  - `expires_in`
  - `usuario` (DTO completo)

> El frontend debe **guardar tokens** (por ejemplo en memoria + storage seguro) y usuario actual.

**Login**

- `POST /auth/login`
- Body típico:

```json
{
  "nombreUsuario": "juanperez",
  "contrasena": "mipassword123"
}
```

- Respuesta: igual que signup.

**Refresh token**

- `POST /auth/refresh`
- Body:

```json
{
  "refreshToken": "<refresh_token>"
}
```

- Devuelve nuevo par `access_token` + `refresh_token`.

> Estrategia en frontend: cuando una llamada responde **401** por token expirado, intentar **una vez** hacer refresh y reintentar la llamada original.

**Usuario actual**

- `GET /auth/me`  
  Usa el header `Authorization`.

### 2.2 Verificación de email y cambio de contraseña

- **Verificar email**: `POST /auth/verify-email` (id de usuario + código).
- **Reenviar código**: `POST /auth/send-verification-email`.
- **Cambiar contraseña** (flujo “olvidé mi contraseña”):
  - `PATCH /auth/change-password`
  - Body:

  ```json
  {
    "email": "juan@example.com",
    "contrasena": "Nueva123",
    "confirmarContrasena": "Nueva123"
  }
  ```

El backend:

- Valida que coincidan.
- Exige que el email esté verificado.

> Si la API devuelve error de “verificá tu correo primero”, el frontend debe mostrar UI para enviar/verificar código de email.

---

## 3. Onboarding financiero (primer uso)

Objetivo: que el usuario quede con **cuentas** y **saldos iniciales** correctamente registrados.

### 3.1 Crear cuentas con saldo inicial

Pantalla para que el usuario cargue cuentas iniciales, por ejemplo:

- Cuenta: “Efectivo”, tipo `EFECTIVO`, saldo inicial 15.000.
- Cuenta: “Mercado Pago”, tipo `BILLETERA`, saldo inicial 200.000.

Llamado recomendado (bulk):

- `POST /cuenta/bulk`

```json
{
  "cuentas": [
    { "nombre": "Efectivo", "tipo": "EFECTIVO", "saldoInicial": 15000 },
    { "nombre": "Mercado Pago", "tipo": "BILLETERA", "saldoInicial": 200000 }
  ]
}
```

La API:

- Crea las cuentas con `saldoActual = 0`.
- Crea movimientos de tipo `SALDO_INICIAL` por cada cuenta.
- Actualiza `saldoActual` en cada cuenta.

Listar cuentas para mostrar en el dashboard / selector:

- `GET /cuenta/list` – devuelve todas las cuentas del usuario, con `saldoActual`.

> En el frontend, asumí siempre que el **saldo de una cuenta viene de la API**; no lo recalcules manualmente.

---

## 4. Flujo diario: movimientos y transferencias

### 4.1 Crear un movimiento

El usuario elige:

- Cuenta
- Tipo: `INGRESO` | `EGRESO`
- Categoría
- Fecha
- Monto
- Descripción

Endpoint:

- `POST /movimiento`

Body (ejemplo):

```json
{
  "cuentaId": 1,
  "tipoMovimiento": "EGRESO",
  "descripcion": "Supermercado",
  "monto": 15000,
  "fecha": "2026-03-10",
  "categoriaId": 3
}
```

Reglas importantes a respetar desde el frontend:

- Para `INGRESO` / `EGRESO` la **categoría es obligatoria**.
- La categoría debe ser del tipo correcto:
  - Movimiento `INGRESO` → categoría tipo `INGRESO`.
  - Movimiento `EGRESO` → categoría tipo `EGRESO`.
- Para `SALDO_INICIAL` o `TRANSFERENCIA` la categoría es opcional / no aplica (normalmente los maneja la API).

Listar movimientos:

- `GET /movimiento/search` con filtros (cuenta, categoría, fechaDesde/fechaHasta, etc.).

La API devuelve `PageDto`: necesitás manejar `pageNumber`, `pageSize` y mostrar paginación.

### 4.2 Transferencias entre cuentas

Flujo UI típico:

1. Selección:
   - Cuenta origen
   - Cuenta destino
   - Monto
   - Fecha (opcional)
2. Endpoint:
   - `POST /transferencias`

Body:

```json
{
  "cuentaOrigenId": 1,
  "cuentaDestinoId": 2,
  "monto": 5000,
  "fecha": "2026-03-12"
}
```

La API valida:

- Origen ≠ destino.
- Ambas cuentas pertenecen al usuario.
- Saldo suficiente en origen.

El frontend debe:

- Manejar errores de tipo:
  - “La cuenta origen y destino no pueden ser la misma”.
  - “Saldo insuficiente en la cuenta origen”.
- Actualizar la vista de saldos recargando `GET /cuenta/list` o el dashboard.

---

## 5. Gastos fijos y pagos

### 5.1 Crear gastos fijos

El usuario define:

- Nombre (ej. “Alquiler”).
- Categoría (de tipo `EGRESO`).
- Monto estimado.
- Día de vencimiento (1–31).

Endpoint:

- `POST /gasto-fijo`

Regla: no permite nombres duplicados para el mismo usuario.

> El backend además puede crear automáticamente el registro de pago (`pago-gasto-fijo`) para el mes actual.

### 5.2 Registrar un pago de gasto fijo

Seleccionar:

- Gasto fijo.
- Cuenta desde la que se paga.
- Mes / año (si la UI permite elegir otros meses).
- Monto (si no se indica, se usa el estimado).

Endpoint:

- `POST /pago-gasto-fijo`

La API:

- Valida que el gasto fijo sea del usuario.
- Valida que no exista ya un pago para ese gasto/mes/año.
- Crea un movimiento `EGRESO` en la cuenta elegida.
- Asocia ese movimiento al pago.

Para mostrar pagos del mes:

- `GET /pago-gasto-fijo/pagos-por-mes?anio=2026&mes=FEBRERO` (según cómo esté nombrado en tu controller).

El frontend puede renderizar:

- Lista de gastos fijos activos.
- Pagados / pendientes.
- Enlaces a detalle.

---

## 6. Presupuestos y control de gasto

### 6.1 Crear/editar presupuestos

UI: pantalla “Presupuestos” por categoría.

**Crear**:

- `POST /presupuesto`

```json
{
  "categoriaId": 3,
  "mes": "FEBRERO",
  "anio": 2026,
  "monto": 80000
}
```

Reglas:

- Categoría debe ser tipo `EGRESO`.
- No puede existir ya un presupuesto para ese (usuario, categoría, mes, año).

**Listar**:

- `GET /presupuesto?mes=FEBRERO&anio=2026`

**Editar**:

- `PATCH /presupuesto/:id` – permite cambiar monto y eventualmente mes/año.

El frontend debería:

- Mostrar para cada categoría:
  - Presupuesto configurado o botón “Agregar” si no existe.
  - Link para editar/eliminar.

---

## 7. Dashboard (pantalla principal)

### 7.1 Endpoint único

- `GET /dashboard?mes=FEBRERO&anio=2026`

Respuesta (resumen simplificado):

```json
{
  "saldoTotal": 350000,
  "ingresosMes": 500000,
  "egresosMes": 150000,
  "balanceMes": 350000,
  "topCategoriasGasto": [{ "categoria": "Alimentación", "total": 50000 }],
  "gastosPorCategoria": [{ "categoria": "Transporte", "total": 20000 }],
  "gastosPorCuenta": [{ "cuenta": "Efectivo", "total": 30000 }],
  "ultimosMovimientos": [
    {
      "descripcion": "Supermercado",
      "monto": 15000,
      "tipo": "EGRESO",
      "fecha": "2026-02-25"
    }
  ],
  "presupuestos": [
    {
      "categoria": "Alimentación",
      "presupuesto": 80000,
      "gastado": 50000,
      "restante": 30000,
      "porcentaje": 62.5,
      "estado": "OK"
    }
  ],
  "alertas": ["Te estás acercando al límite en Alimentación"]
}
```

### 7.2 Qué hacer en el frontend con esto

- **Header**:
  - Mostrar `saldoTotal`, `ingresosMes`, `egresosMes`, `balanceMes`.
- **Gráficos**:
  - Pie/bar por `gastosPorCategoria`.
  - Pie/bar por `gastosPorCuenta`.
- **Lista de últimos movimientos**:
  - Usar `ultimosMovimientos`.
- **Sección de presupuestos**:
  - Barra de progreso con `presupuesto`, `gastado`, `restante`, `porcentaje`.
  - Color según `estado`:
    - `OK` → verde.
    - `ALERTA` → amarillo.
    - `EXCEDIDO` → rojo.
- **Alertas**:
  - Mostrar `alertas` como tarjetas/notificaciones (“Te estás acercando al límite…”).

> La idea es que el frontend **no haga más de una llamada** para la home: solo `GET /dashboard`.

---

## 8. Reportes (vista analítica)

### 8.1 Reporte por categoría

- `GET /reportes/categorias?mes=FEBRERO&anio=2026`
- Uso:
  - Gráfico de barras o torta con gasto total por categoría ese mes.

### 8.2 Reporte por cuenta

- `GET /reportes/cuentas?mes=FEBRERO&anio=2026` (o sin mes/año para histórico).
- Respuesta: `{ cuenta, ingresos, egresos }[]`.
- Uso:
  - Comparar cuánto se mueve por cuenta.

### 8.3 Evolución mensual

- `GET /reportes/evolucion?anio=2026`
- Respuesta: `{ mes: "ENERO", balance: 200000 }[]`.
- Uso:
  - Gráfico de línea/área con el balance por mes.

### 8.4 Flujo de dinero

- `GET /reportes/flujo?mes=FEBRERO&anio=2026`
- Respuesta: `{ ingresos, egresos, balance }`.
- Uso:
  - Widget de resumen, o para mostrar un gráfico de flujo de caja.

---

## 9. Manejo de errores en el frontend

La API usa un formato estándar:

```json
{
  "statusCode": 400,
  "message": {
    "code": "VA01",
    "message": "Datos de entrada no válidos.",
    "details": "{...}"
  }
}
```

Recomendación en frontend:

- Parsear `error.response.data.message`.
- Mostrar `message.message` al usuario.
- Usar `code` para lógicas especiales (ej. `DB04` = registro duplicado).
- `details` suele ser JSON string; se puede parsear cuando interese.

---

## 10. Resumen para el frontend

- **Home** → `GET /dashboard`.
- **Listas y detalles** → usar los endpoints específicos (`/cuenta`, `/movimiento`, `/gasto-fijo`, `/presupuesto`, `/reportes/*`).
- **Creación de datos**:
  - Onboarding → `POST /cuenta/bulk`.
  - Nuevos movimientos → `POST /movimiento`.
  - Transferencias → `POST /transferencias`.
  - Presupuestos → `POST /presupuesto` + `GET /presupuesto`.
- **Autenticación**:
  - Guardar `access_token` + `refresh_token`.
  - Interceptor para refrescar token en 401.
- **Errores**:
  - Leer `message.code` y `message.message` para feedback claro.
