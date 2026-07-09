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
- **Webhook a Make** al crear o actualizar un parte (no bloquea el guardado).
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
```

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`:
  **Settings → API** en Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: **Settings → API → service_role**. Solo se usa
  en el servidor (gestión de usuarios). **Nunca la expongas en el cliente.**
- `MAKE_WEBHOOK_URL`: URL del webhook de Make.

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
   `SUPABASE_SERVICE_ROLE_KEY`, `MAKE_WEBHOOK_URL`).
4. Deploy. Vercel detecta Next.js automáticamente.

---

## 🔌 Integración con Make (webhook)

Cada vez que se **crea** o **actualiza** un parte, el servidor envía un `POST`
a `MAKE_WEBHOOK_URL` con el JSON completo del parte más un campo `evento`
(`"creado"` o `"actualizado"`):

```json
{
  "evento": "creado",
  "id": "…",
  "fecha": "2026-07-09",
  "cliente": "Agrícola El Palmar S.L.",
  "estado_reparacion": "En reparación",
  "...": "..."
}
```

Si el webhook falla, **el parte se guarda igualmente** (el error solo se
registra en el log del servidor).

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
│   ├── webhook.ts             # Envío a Make
│   └── export.ts              # Exportación Excel / PDF
├── middleware.ts              # Protección de rutas
supabase/
├── schema.sql                 # Tablas + triggers + RLS
└── seed.sql                   # 5 partes de ejemplo
```

---

## 🎨 Colores corporativos

- Azul marino: `#0D1B4B`
- Amarillo: `#F5C800`

---

© Suproval — Maquinaria agrícola e industrial
