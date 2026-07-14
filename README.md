# Suproval — Partes de Taller

Sistema web profesional para el registro y seguimiento de **partes de taller**
de Suproval (maquinaria agrícola e industrial).

Construido con **Next.js 14 (App Router) + TypeScript + Tailwind CSS** y
**Supabase** (Postgres + Auth) como backend. Preparado para desplegar en
**Vercel**.

---

## ✨ Características

- **Autenticación** por email y contraseña (Supabase Auth) con dos roles:
  - `admin`: ve y edita todo, y **gestiona usuarios**.
  - `mecanico`: crea y edita partes.
- **Rutas protegidas**: sin sesión se redirige a `/login`.
- **Dashboard** con:
  - Contadores: Total, Activos, Retrasados, Entregados.
  - **Alerta de retrasados** (partes con más de 5 días sin llegar a un estado
    final) con banner y badge rojo en la tabla.
  - Gráficos de partes **por estado** y **por delegación**.
  - Tabla con **búsqueda** (cliente / ID máquina), **filtros** (estado,
    delegación, rango de fechas) y **cambio de estado directo** desde la fila.
  - Badges de color por estado.
- **Formulario** de alta y edición, validado y **optimizado para móvil**.
- **Recordatorio diario a Make** (Vercel Cron): si algún parte lleva 10 o más
  días en `Parado/Sin piezas`, se envía un único aviso al webhook de Make.
- **Exportación** del listado filtrado a **Excel (.xlsx)** y **PDF**.
- Diseño corporativo (azul marino `#0D1B4B` y amarillo `#F5C800`),
  totalmente responsive (móvil primero).

---

## 🧱 Modelo de datos (`partes_taller`)

| Campo                | Tipo    | Notas                                             |
| -------------------- | ------- | ------------------------------------------------- |
| `fecha`              | date    | Por defecto hoy, editable                         |
| `serie`              | text    |                                                   |
| `cliente`            | text    | **Obligatorio**                                   |
| `telefono`           | text    | Validación de formato si se rellena               |
| `id_maquina`         | text    | Ej: `005588-001`                                  |
| `tipo_maquina`       | text    | Desplegable + valor libre                         |
| `estado_reparacion`  | text    | 7 estados predefinidos                            |
| `delegacion`         | text    | Suproval Cheste / Suproval Aldaia                 |
| `descripcion`        | text    |                                                   |
| `material_utilizado` | text    | Opcional                                          |
| `tiempo_trabajo`     | text    | Intervalos de 30 min (30 min … 10h), opcional     |
| `parado_desde`       | tstz    | Desde cuándo está en `Parado/Sin piezas` (trigger)|
| `created_by`         | uuid    | Usuario que lo creó                               |
| `created_at`         | tstz    |                                                   |
| `updated_at`         | tstz    | Se actualiza solo mediante trigger                |

Se activa **Row Level Security (RLS)**: solo usuarios autenticados pueden
leer/escribir; solo `admin` puede eliminar.

---

## 🚀 Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. Ve a **SQL Editor** y ejecuta el contenido de
   [`supabase/schema.sql`](./supabase/schema.sql). Esto crea las tablas
   `profiles` y `partes_taller`, los triggers y las políticas RLS.
3. Crea tu primer usuario en **Authentication → Users → Add user** (marca
   *Auto Confirm User*).
4. Conviértelo en administrador ejecutando en el SQL Editor:
   ```sql
   update public.profiles set rol = 'admin' where email = 'tu@correo.com';
   ```
5. (Opcional) Carga datos de ejemplo ejecutando
   [`supabase/seed.sql`](./supabase/seed.sql) — inserta 5 partes de prueba.

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y rellena tus claves:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/g3y641mo6f9r1ekdqix0k2t9s9bouypr
CRON_SECRET=un-valor-aleatorio-seguro
```

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`:
  **Settings → API** en Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: **Settings → API → service_role**. Se usa
  en el servidor (gestión de usuarios y el cron de recordatorios).
  **Nunca la expongas en el cliente.**
- `MAKE_WEBHOOK_URL`: URL del webhook de Make (recordatorio diario de
  partes parados).
- `CRON_SECRET`: secreto que protege la ruta del cron. Genera uno con
  `openssl rand -hex 32`. Vercel Cron lo envía automáticamente como
  `Authorization: Bearer <CRON_SECRET>`.

### 3. Ejecutar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Se te redirigirá a
`/login`; entra con el usuario que creaste.

### 4. Desplegar en Vercel

1. Sube este repositorio a GitHub.
2. En [vercel.com](https://vercel.com) importa el repositorio.
3. En **Settings → Environment Variables** añade las mismas variables del
   `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `MAKE_WEBHOOK_URL`, `CRON_SECRET`).
4. Deploy. Vercel detecta Next.js automáticamente y programa el cron
   definido en [`vercel.json`](./vercel.json).

---

## ⏰ Recordatorio diario de partes parados (Vercel Cron + Make)

Un **cron de Vercel** (ver [`vercel.json`](./vercel.json), una ejecución
diaria — compatible con el plan Hobby) llama cada mañana a
`/api/cron/recordatorio-parados`. La ruta:

1. Comprueba la cabecera `Authorization: Bearer <CRON_SECRET>`; si no
   coincide responde `401`.
2. Busca partes con `estado_reparacion = 'Parado/Sin piezas'` y
   `parado_desde` de hace **10 días o más**. La columna `parado_desde` se
   mantiene por trigger en Supabase (ver
   [`supabase/migracion_parado_desde.sql`](./supabase/migracion_parado_desde.sql)):
   se fija al entrar en el estado y se limpia al salir, por lo que **no se
   reinicia** al editar otros campos.
3. Si hay al menos uno, envía **un único** `POST` a `MAKE_WEBHOOK_URL`:

```json
{
  "evento": "recordatorio_parados",
  "total": 2,
  "partes": [
    {
      "id": "…",
      "cliente": "Agrícola El Palmar S.L.",
      "id_maquina": "005588-001",
      "tipo_maquina": "Tractor",
      "descripcion": "…",
      "delegacion": "Suproval Cheste",
      "fecha": "2026-06-15",
      "parado_desde": "2026-06-20T09:12:00.000Z",
      "dias_parado": 20
    }
  ]
}
```

4. Si no hay ninguno, no envía nada a Make. En todos los casos la ruta
   devuelve un resumen JSON:
   - Éxito con envío: `{ "ok": true, "encontrados": N, "enviado": true }`
   - Sin partes que avisar: `{ "ok": true, "encontrados": 0, "enviado": false }`
   - Error controlado: `{ "ok": false, "paso": "<dónde falló>", "error": "…" }`
     (el detalle completo queda en los logs de Vercel).

> **Importante:** el cron usa la `SUPABASE_SERVICE_ROLE_KEY`, y el rol
> `service_role` necesita privilegios SQL sobre las tablas además de
> saltarse RLS. Si ves `permission denied for table partes_taller`
> (código 42501), ejecuta
> [`supabase/fix_permisos_service_role.sql`](./supabase/fix_permisos_service_role.sql)
> en el SQL Editor de Supabase.

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── (app)/                 # Área autenticada (layout con Header)
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── partes/nuevo/      # Alta de parte
│   │   ├── partes/[id]/       # Edición de parte
│   │   └── usuarios/          # Gestión de usuarios (admin)
│   ├── api/cron/
│   │   └── recordatorio-parados/  # Cron diario: aviso a Make de parados
│   ├── actions/               # Server Actions (partes, auth, usuarios)
│   ├── login/                 # Página de login
│   ├── layout.tsx
│   └── page.tsx               # Redirige a /dashboard
├── components/                # Componentes de UI
├── lib/
│   ├── supabase/              # Clientes de Supabase (browser/server/mw)
│   ├── constants.ts           # Estados, tipos, delegaciones, tiempos…
│   ├── types.ts
│   ├── partes-utils.ts        # Lógica de retrasos y resúmenes
│   └── export.ts              # Exportación Excel / PDF
├── middleware.ts              # Protección de rutas
supabase/
├── schema.sql                 # Tablas + triggers + RLS
├── migracion_parado_desde.sql # Migración: columna + trigger parado_desde
└── seed.sql                   # 5 partes de ejemplo
vercel.json                    # Cron diario de Vercel
```

---

## 🎨 Colores corporativos

- Azul marino: `#0D1B4B`
- Amarillo: `#F5C800`

---

© Suproval — Maquinaria agrícola e industrial
