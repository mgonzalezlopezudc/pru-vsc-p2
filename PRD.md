# Product Requirements Document (PRD)

## 1. Resumen

Construir y mantener una aplicación web Flask + Jinja2 para visualizar tiendas, baldas, productos e inventario a partir de `data/seed.json`, con foco en navegación simple, consistencia de datos y soporte básico multi-idioma.

## 2. Problema

El equipo necesita una forma clara y trazable de inspeccionar el modelo de datos operativo (tiendas, baldas, productos e inventario), detectar inconsistencias y validar disponibilidad por contexto (tienda, balda y producto) sin depender de herramientas externas.

## 3. Objetivos de Producto

- Permitir exploración rápida de entidades y relaciones del dominio.
- Facilitar diagnóstico de integridad de datos mediante warnings visibles.
- Ofrecer una experiencia visual clara con imágenes de tiendas y productos.
- Soportar internacionalización básica en UI (`es` por defecto, `en` opcional).

## 4. No Objetivos (MVP)

- Edición/CRUD desde interfaz.
- Persistencia distinta al seed JSON.
- Integraciones externas o backend adicional en esta fase.

## 5. Usuarios y Casos de Uso

### 5.1 Usuarios objetivo
- Equipo funcional/negocio que consulta disponibilidad.
- Equipo técnico que valida consistencia del seed y relaciones.

### 5.2 Casos de uso clave
- Ver todas las tiendas y productos desde inicio.
- Inspeccionar una tienda con sus baldas e inventario relacionado.
- Inspeccionar un producto con su disponibilidad por tienda/balda.
- Revisar inventario global consolidado.
- Detectar warnings de integridad cuando existan inconsistencias.

## 6. Alcance Funcional

### 6.1 Entidades en alcance
- `Store`
- `Shelf`
- `Product`
- `InventoryItem`

### 6.2 Pantallas y rutas
- `GET /`
  - Lista de tiendas y productos con enlaces a detalle.
- `GET /stores/<id>`
  - Datos de tienda, tabla de baldas, tabla de inventario y mapa.
- `GET /products/<id>`
  - Datos de producto y disponibilidad por tienda/balda.
- `GET /inventory`
  - Tabla global de inventario cruzado.

### 6.3 Idioma
- Parámetro opcional en todas las rutas: `?lang=es|en`
- Comportamiento esperado: actualización de idioma de UI y persistencia en sesión.

### 6.4 Mapa
- Render de geolocalización de tienda con GeoJSON Point usando Leaflet + OpenStreetMap.

## 7. Requisitos de Datos e Integridad

### 7.1 Cardinalidad mínima del seed
- 4 tiendas.
- 4 baldas por tienda (16 baldas).
- 10 productos.
- Al menos 2 productos por balda.
- Referencia actual esperada: 32 `InventoryItem` (2 por balda).

### 7.2 Reglas de validación
- `stockCount >= 0`
- `shelfCount >= 0`
- `shelfCount <= stockCount`
- Suma de `shelfCount` por balda `<= maxCapacity`
- `refStore`, `refShelf`, `refProduct` resolubles

### 7.3 Requisitos de imágenes
- `Store.image` y `Product.image` deben existir y ser URL válida.
- Si falla la carga remota, la UI debe mostrar fallback local.

## 8. Requisitos de UX/UI

- Renderizado SSR con Jinja2.
- Navegación mínima: Inicio + Inventario global.
- Tarjetas y vistas de detalle con imágenes representativas.
- Tablas legibles para datos de inventario.
- Warnings visibles cuando existan inconsistencias válidas por reglas.
- Diseño responsive básico (desktop-first).

## 9. Requisitos Técnicos

- Python 3.10+
- Flask 3.1.0
- Jinja2
- Leaflet + OpenStreetMap tiles
- Fuente de datos: `data/seed.json`

## 10. Criterios de Aceptación

- `flask --app app run` inicia sin errores.
- Las rutas `/`, `/stores/<id>`, `/products/<id>`, `/inventory` responden correctamente.
- Se cumple cardinalidad mínima del seed.
- La navegación entre vistas funciona mediante enlaces.
- El mapa se renderiza con GeoJSON válido.
- Las validaciones de integridad se ejecutan y reportan inconsistencias.
- El fallback de imágenes se activa cuando falla una imagen remota.

## 11. Métricas de Éxito (MVP)

- 100% de rutas principales disponibles en revisión manual.
- 100% de entidades mínimas del seed presentes según cardinalidad objetivo.
- 0 errores bloqueantes en carga de páginas principales.
- Warnings de integridad visibles y comprensibles para datos inválidos.

## 12. Riesgos y Supuestos

### Supuestos
- El seed mantiene estructura compatible con el modelo documentado.
- Las URLs remotas de imágenes pueden ser inestables, por eso se requiere fallback.

### Riesgos
- Datos del seed inconsistentes pueden degradar la experiencia visual.
- Cambios de esquema sin ajuste en repositorio/rutas pueden romper vistas.

## 13. Dependencias

- `data/seed.json` válido y actualizado.
- Recursos de red para tiles de mapa e imágenes remotas.

## 14. Fuera de Alcance Futuro (referencia)

- CRUD completo con persistencia.
- Backend externo/API.
- Fuente de datos alternativa (SQLite/API) en esta fase.
