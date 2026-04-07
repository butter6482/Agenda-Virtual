# Agenda Virtual

Sistema de agenda para salón de belleza. Permite gestionar citas, ver calendario mensual y diario, registrar propinas y generar cuadres diarios y semanales.

## Funcionalidades

- Login con credenciales
- Calendario mensual y vista por día
- Crear, editar y eliminar citas
- Registro de propinas por empleado
- Cuadre diario y semanal

## Requisitos

- Node.js 20+
- PostgreSQL

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="cadena-aleatoria-segura"
```

Genera `NEXTAUTH_SECRET` con:
```bash
openssl rand -base64 32
```

## Correr en local

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Build de producción

```bash
npm run build
npm start
```

## Migraciones Prisma

```bash
# Aplicar migraciones en producción
npx prisma migrate deploy

# Ver estado de la DB
npx prisma studio
```

## Deploy en Render

1. Conecta el repo en [render.com](https://render.com)
2. Render detecta el `Dockerfile` automáticamente
3. En **Environment Variables** configura:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` → URL pública de Render (ej: `https://agenda-virtual.onrender.com`)
   - `NEXTAUTH_SECRET` → valor generado con `openssl rand -base64 32`
4. Deploy

El contenedor corre `prisma migrate deploy` automáticamente al arrancar.
