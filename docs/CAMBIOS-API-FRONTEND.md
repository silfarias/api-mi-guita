# Cambios de API para el Frontend

Documento con los cambios recientes en la API para que el frontend pueda implementar las pantallas y flujos correspondientes.

---

## 1. Gasto Fijo: campo `activo`

Se agregó el campo **`activo`** a la entidad Gasto Fijo. Permite activar/desactivar un gasto fijo por mes (por ejemplo, un gasto que se paga un mes y al siguiente no).

### Respuestas (GET)

En **todas las respuestas** donde se devuelve un gasto fijo, ahora viene el campo:

| Campo   | Tipo    | Descripción                                      |
|---------|---------|--------------------------------------------------|
| `activo` | boolean | Si el gasto fijo está activo para el usuario. Por defecto `true`. |

**Endpoints afectados:**

- `GET /gasto-fijo/search` → cada ítem en `data` tiene `activo`
- `GET /gasto-fijo/mis-gastos-fijos` → cada ítem en `gastosFijos` tiene `activo`
- `GET /gasto-fijo/:id` → el objeto devuelto tiene `activo`
- `POST /gasto-fijo` (respuesta) → el objeto creado tiene `activo` (siempre `true`)
- `PATCH /gasto-fijo/:id` (respuesta) → el objeto actualizado tiene `activo`
- Cualquier otro endpoint que devuelva `GastoFijoDTO` o listas de gastos fijos

### Creación (POST)

- **No** enviar `activo` en el body de `POST /gasto-fijo`.
- Los gastos fijos nuevos se crean siempre con `activo: true`.

### Edición (PATCH)

- **Sí** se puede enviar `activo` al editar:
  - `PATCH /gasto-fijo/:id`
  - Body (opcional): `{ "activo": false }` o `{ "activo": true }`

### Búsqueda (GET con query)

- En `GET /gasto-fijo/search` se puede filtrar por estado activo:
  - `?activo=true` → solo gastos fijos activos
  - `?activo=false` → solo gastos fijos inactivos
  - Sin `activo` → se devuelven todos

**Resumen frontend:**

- Tipar/interfaces: agregar `activo: boolean` en los tipos de Gasto Fijo que usen para respuestas.
- Creación: no incluir `activo` en el payload.
- Edición: permitir cambiar `activo` (checkbox/toggle) y enviarlo en el PATCH.
- Listados: opcionalmente filtrar por `activo` en la búsqueda y/o mostrar el estado en la tabla.

---

## 2. Nuevo endpoint: Pagos por información inicial (mes/año)

Endpoint para obtener la **info inicial de un mes** y **todos los gastos fijos del usuario** con su **pago de ese mes** (monto e indicador de pagado).

### Request

```
GET /gasto-fijo-pago/por-info-inicial?infoInicialId={id}
```

| Parámetro       | Tipo   | Requerido | Descripción                          |
|-----------------|--------|-----------|--------------------------------------|
| `infoInicialId` | number | **Sí**    | ID de la información inicial (mes/año). |

Headers: `Authorization: Bearer <token>` (usuario autenticado).

### Response: `PagosGastoFijoDTO`

```json
{
  "infoInicial": {
    "id": 1,
    "usuario": { ... },
    "anio": 2026,
    "mes": "FEBRERO",
    "mediosPago": [ ... ],
    "montoTotal": 76271.62
  },
  "pagos": [
    {
      "gastoFijo": {
        "id": 1,
        "nombre": "Internet/WiFi",
        "montoFijo": 27000,
        "activo": true,
        "categoria": { ... }
      },
      "pago": {
        "id": 1,
        "montoPago": 27000,
        "pagado": false
      }
    },
    {
      "gastoFijo": { ... },
      "pago": {
        "id": undefined,
        "montoPago": 0,
        "pagado": false
      }
    }
  ]
}
```

- **`infoInicial`**: mes/año y datos asociados.
- **`pagos`**: un elemento por cada gasto fijo (activo) del usuario.  
  - **`gastoFijo`**: datos del gasto fijo (incluye `activo`).  
  - **`pago`**:
  - `id`: presente si ya existe registro de pago para ese mes; puede ser `undefined` si aún no se creó.
  - `montoPago`: monto del pago (0 si no se ha definido).
  - `pagado`: si está marcado como pagado.

**Uso en frontend:**

- Pantalla “Gastos fijos del mes”: al elegir un mes (info inicial), llamar a este endpoint con su `id`.
- Mostrar lista: cada fila = gasto fijo + su `pago` (monto, pagado, y si tiene `id` para editar).
- Para marcar como pagado o cambiar monto: usar `PATCH /gasto-fijo-pago/:id` con el `pago.id` cuando exista.

---

## 3. Cambio en `GET /gasto-fijo/mis-gastos-fijos`

Este endpoint **ya no devuelve** el array `pagos` dentro de cada gasto fijo.

### Antes

Cada ítem en `gastosFijos` tenía:

- `id`, `nombre`, `monto`, `categoria`, **`pagos`** (array de pagos por mes).

### Ahora

Cada ítem en `gastosFijos` tiene solo:

- `id`, `nombre`, `montoFijo`, **`activo`**, `categoria`.
- **No** viene el array `pagos`.

Para ver los **pagos de un mes concreto** hay que usar el nuevo endpoint:

`GET /gasto-fijo-pago/por-info-inicial?infoInicialId={id}`

**Resumen frontend:**

- Dejar de esperar `pagos` en la respuesta de `mis-gastos-fijos`.
- Si la pantalla “Mis gastos fijos” necesita pagos por mes, usar “por-info-inicial” con el `infoInicialId` del mes seleccionado.

---

## 4. Edición de un pago (marcar como pagado)

Comportamiento del backend al **marcar un pago como pagado** (`PATCH /gasto-fijo-pago/:id` con `pagado: true`):

- Si el **gasto fijo** tiene **`montoFijo` > 0** y el pago tiene **`montoPago` en 0**, el backend usa automáticamente `montoFijo` como `montoPago`.
- Si el gasto fijo **no** tiene monto fijo (o es 0) y el pago está en 0, el backend **exige** que el frontend envíe **`montoPago`** en el body; si no, responde error.

**Recomendación frontend:**

- Al marcar “Pagado”:
  - Si el gasto fijo tiene `montoFijo` y el pago tiene `montoPago === 0`, se puede enviar solo `{ "pagado": true }`.
  - Si no hay monto fijo o el pago está en 0, mostrar un input para que el usuario ingrese el monto y enviar por ejemplo `{ "pagado": true, "montoPago": 15000 }`.

---

## 5. Paginación por defecto

- Los listados paginados usan por defecto **`pageSize: 10`** y **`pageNumber: 1`** cuando no se envían.
- Se puede seguir enviando `pageSize` y `pageNumber` en query para cambiar la página o el tamaño (por ejemplo `?pageSize=20&pageNumber=2`).

---

## Resumen de endpoints tocados

| Método | Ruta | Cambio |
|--------|------|--------|
| GET | `/gasto-fijo/search` | Respuesta con `activo`; query opcional `activo` (true/false). |
| GET | `/gasto-fijo/mis-gastos-fijos` | Respuesta sin `pagos`; cada gasto con `activo`. |
| GET | `/gasto-fijo/:id` | Respuesta con `activo`. |
| POST | `/gasto-fijo` | No enviar `activo`; respuesta con `activo: true`. |
| PATCH | `/gasto-fijo/:id` | Body puede incluir `activo` (opcional). |
| GET | `/gasto-fijo-pago/por-info-inicial` | **Nuevo.** Query obligatorio `infoInicialId`. Respuesta: `infoInicial` + `pagos[]` (gastoFijo + pago con `id?`, montoPago, pagado). |
| PATCH | `/gasto-fijo-pago/:id` | Sin cambio de contrato; al marcar pagado, enviar `montoPago` si el gasto no tiene monto fijo. |

Si necesitan ejemplos de tipos TypeScript/Interfaces o de llamadas (fetch/axios), se pueden añadir en una siguiente versión de este documento.
