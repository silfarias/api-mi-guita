# Guía de uso del frontend – API MiGuita

Este documento explica **cómo debe usar el frontend** la API MiGuita: flujos principales, endpoints a llamar y qué esperar de cada uno.

---

## 1. Autenticación y sesión

### 1.1 Registro y login

- **Signup**
  - `POST /auth/signup`
  - Body típico:

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
    - `usuario`

- **Login**
  - `POST /auth/login`
  - Body según lo que use `UsuarioService.login` (usuario + contraseña o email + contraseña).
  - Respuesta: igual que signup.

El frontend debe **guardar** `access_token` y `refresh_token` (memoria + storage seguro) y usar siempre:

```text
Authorization: Bearer <access_token>
```

en todas las llamadas protegidas.

### 1.2 Refresh token

- `POST /auth/refresh`
- Body (ejemplo):

```json
{
  "refreshToken": "<refresh_token_actual>"
}
```

- Respuesta: nuevo `access_token` y `refresh_token`.

**Recomendación:** implementar un interceptor:

1. Si una llamada responde `401` por token expirado:
   - Llamar una vez a `/auth/refresh`.
   - Actualizar tokens y reintentar la llamada original.
2. Si el refresh falla, deslogear al usuario.

### 1.3 Usuario actual y verificación de email

- `GET /auth/me` – obtener usuario actual (para hidratar el estado global).
- `PATCH /auth/change-password` – cambio de contraseña (requiere email verificado).
- `POST /auth/verify-email` y `POST /auth/send-verification-email` – flujo de verificación de correo.

El frontend debe reaccionar a errores como “verificá tu correo primero” mostrando UI para reenviar y confirmar el código.

---

## 2. Onboarding financiero (primer ingreso)

Objetivo: dejar al usuario con **cuentas** y **saldos iniciales** ya cargados.

### 2.1 Crear cuentas con saldo inicial

Flujo sugerido:

1. Pantalla “Configurar mis cuentas” donde el usuario agrega:
   - `nombre` (Efectivo, Mercado Pago, Banco Nación, etc.).
   - `tipo` (`EFECTIVO`, `BANCO`, `BILLETERA`, …).
   - `saldoInicial`.

2. Enviar todas juntas a:

   - `POST /cuenta/bulk`

   ```json
   {
     "cuentas": [
       { "nombre": "Efectivo", "tipo": "EFECTIVO", "saldoInicial": 15000 },
       { "nombre": "Mercado Pago", "tipo": "BILLETERA", "saldoInicial": 200000 }
     ]
   }
   ```

3. La API:
   - Crea cada cuenta con `saldoActual = 0`.
   - Crea un movimiento `SALDO_INICIAL` por cada saldoInicial.
   - Actualiza el saldo de cada cuenta.

4. Luego, el frontend puede llamar:

   - `GET /cuenta/list` para mostrar todas las cuentas y sus saldos.

> El frontend **no calcula saldos**: siempre confía en `saldoActual` que viene de la API.

---

## 3. Movimientos y transferencias

### 3.1 Movimientos (ingresos y egresos)

Pantalla típica: “Agregar movimiento”.

Campos:

- `cuentaId`
- `tipoMovimiento`: `INGRESO` | `EGRESO`
- `descripcion`
- `monto`
- `fecha`
- `categoriaId` (obligatoria para INGRESO/EGRESO)

Endpoint:

- `POST /movimiento`

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

Reglas a respetar desde el frontend:

- Para `INGRESO` / `EGRESO` siempre pedir categoría.
- Usar categorías correctas:
  - Movimiento `INGRESO` → categoría tipo `INGRESO`.
  - Movimiento `EGRESO` → categoría tipo `EGRESO`.

Listar movimientos:

- `GET /movimiento/search?cuentaId=&categoriaId=&fechaDesde=&fechaHasta=&pageNumber=1&pageSize=10`

La API devuelve `PageDto`, así que el frontend debe manejar paginación (siguiente/anterior página).

### 3.2 Transferencias entre cuentas

Pantalla: “Transferir entre cuentas”.

Campos:

- `cuentaOrigenId`
- `cuentaDestinoId`
- `monto`
- `fecha` (opcional)

Endpoint:

- `POST /transferencias`

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

En caso de error, la respuesta incluye un `code` y un `message` legibles para mostrar en la UI.

Tras una transferencia exitosa, el frontend debería recargar:

- `GET /cuenta/list` o
- `GET /dashboard?mes=&anio=`  

para refrescar saldos y resumen.

---

## 4. Gastos fijos y pagos

### 4.1 Crear gastos fijos

Pantalla: “Gastos fijos”.

Campos:

- `nombre` (ej. Alquiler, Luz, Internet).
- `categoriaId` (tipo EGRESO).
- `montoEstimado`.
- `diaVencimiento` (1–31).

Endpoint:

- `POST /gasto-fijo`

La API no permite nombres duplicados para el mismo usuario.

### 4.2 Registrar pago de un gasto fijo

Flujo:

1. El usuario elige un gasto fijo y una cuenta de pago.
2. Opcionalmente elige mes y año, o se infiere el mes actual.
3. Endpoint:

   - `POST /pago-gasto-fijo`

   (El body real depende del DTO, pero conceptualmente incluye: `gastoFijoId`, `cuentaId`, `mes`, `anio`, `monto?`).

La API:

- Valida que el gasto fijo sea del usuario.
- Evita pagos duplicados para el mismo mes/año.
- Crea un movimiento `EGRESO` en la cuenta elegida y lo asocia al pago.

Para mostrar pagos del mes:

- `GET /pago-gasto-fijo/pagos-por-mes?anio=2026&mes=FEBRERO`

El frontend puede renderizar:

- Lista de gastos fijos activos.
- Si están pagados o no.
- Acciones para pagar/editar/eliminar.

---

## 5. Presupuestos

### 5.1 Crear y listar presupuestos

Pantalla: “Presupuestos” (por categoría).

Crear:

- `POST /presupuesto`

```json
{
  "categoriaId": 3,
  "mes": "FEBRERO",
  "anio": 2026,
  "monto": 80000
}
```

Listar:

- `GET /presupuesto?mes=FEBRERO&anio=2026`

Editar:

- `PATCH /presupuesto/:id`

Eliminar:

- `DELETE /presupuesto/:id`

Reglas:

- Solo se aceptan categorías tipo EGRESO.
- Un presupuesto por (usuario, categoría, mes, año).

El frontend debe:

- Mostrar mensaje claro cuando la API devuelva “ya existe un presupuesto para esta categoría”.
- Usar la lista de presupuestos para enriquecer el dashboard (aunque el dashboard ya trae su propia vista agregada).

---

## 6. Dashboard (home de la app)

### 6.1 Endpoint único

- `GET /dashboard?mes=FEBRERO&anio=2026`

Respuesta (forma simplificada):

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

### 6.2 Cómo usarlo en el frontend

- **Header**:
  - Mostrar `saldoTotal`, `ingresosMes`, `egresosMes`, `balanceMes`.

- **Gráficos**:
  - `gastosPorCategoria` y `gastosPorCuenta` → gráficos de torta/barras.

- **Últimos movimientos**:
  - Lista simple con `descripcion`, `monto`, `tipo`, `fecha`.

- **Presupuestos**:
  - Barra de progreso:
    - `presupuesto` vs `gastado`.
    - Mostrar `restante`.
    - Color según `estado`:
      - `OK` → verde.
      - `ALERTA` → amarillo.
      - `EXCEDIDO` → rojo.

- **Alertas**:
  - Renderizar `alertas` como cards o banners (“Te estás acercando al límite…”).

El objetivo es que **la home solo haga 1 request**: `GET /dashboard`.

---

## 7. Reportes

### 7.1 Reporte por categoría

- `GET /reportes/categorias?mes=FEBRERO&anio=2026`
- Uso: gráfico de gastos por categoría para el mes.

### 7.2 Reporte por cuenta

- `GET /reportes/cuentas?mes=FEBRERO&anio=2026`
- Respuesta: `{ cuenta, ingresos, egresos }[]`.
- Uso: gráfico comparativo por cuenta (quién gana/gasta más).

### 7.3 Evolución mensual

- `GET /reportes/evolucion?anio=2026`
- Respuesta: `{ mes: "ENERO", balance: 200000 }[]`.
- Uso: gráfico de línea con el balance por mes.

### 7.4 Flujo de dinero

- `GET /reportes/flujo?mes=FEBRERO&anio=2026`
- Respuesta: `{ ingresos, egresos, balance }`.
- Uso: widget de resumen del mes o para un gráfico de flujo de caja.

---

## 8. Manejo de errores en la UI

La API utiliza un formato estándar de errores con un diccionario de códigos (`ERRORS`).

Ejemplo típico:

```json
{
  "statusCode": 400,
  "message": {
    "code": "VA01",
    "message": "Datos de entrada no válidos.",
    "details": "{\"nombresDuplicados\":[\"Efectivo\"]}"
  }
}
```

Recomendación:

- Tomar `response.data.message.message` como texto principal para el usuario.
- Usar `message.code` si querés personalizar algunos casos (ej. `DB04` = duplicados).
- Si `details` es JSON serializado, se puede intentar `JSON.parse` para mostrar información más específica (ej. nombres duplicados).

---

## 9. Resumen mental para implementar el frontend

- **Auth**:
  - Guardar tokens, refrescar en 401, usar `/auth/me` para hidratar estado.
- **Onboarding**:
  - `POST /cuenta/bulk` + `GET /cuenta/list`.
- **Uso diario**:
  - `POST /movimiento` para ingresos/egresos.
  - `POST /transferencias` para mover dinero entre cuentas.
- **Gastos fijos y pagos**:
  - `POST /gasto-fijo` para definir.
  - `POST /pago-gasto-fijo` + `GET /pago-gasto-fijo/pagos-por-mes`.
- **Presupuestos y control**:
  - `POST /presupuesto`, `GET /presupuesto`, `PATCH/DELETE /presupuesto/:id`.
- **Home/Dashboard**:
  - `GET /dashboard?mes=&anio=` como única llamada principal.
- **Reportes**:
  - `/reportes/categorias`, `/reportes/cuentas`, `/reportes/evolucion`, `/reportes/flujo`.

Con este archivo, el frontend tiene una hoja de ruta clara de **qué endpoints usar y en qué momentos** para construir toda la experiencia de MiGuita.
