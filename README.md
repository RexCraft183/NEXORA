# NEXØRA — primera versión con autenticación

Interfaz social móvil oscura con acentos lavanda/morado y acceso mediante Supabase Auth.

## Configuración obligatoria
1. Abre `supabase-config.js`.
2. Sustituye `PEGA_AQUI_TU_PROJECT_URL` por la Project URL de Supabase.
3. Sustituye `PEGA_AQUI_TU_PUBLISHABLE_KEY` por la Publishable key.
4. No pegues nunca una Secret key ni `service_role` en archivos públicos.
5. Sube todos los archivos al repositorio y publica con GitHub Pages.

## Incluye
- Inicio de sesión con correo y contraseña.
- Registro con nombre visible y nombre de usuario.
- Recuperación de contraseña por correo.
- Persistencia de sesión gestionada por Supabase.
- Cierre de sesión desde Perfil.
- Base visual de la aplicación original.

## Requisitos en Supabase
- Authentication > Providers > Email habilitado.
- Tabla `public.profiles` y trigger de creación automática configurados.
- Si está habilitada la confirmación de correo, el usuario deberá confirmar su dirección antes de iniciar sesión.

## Estado
Esta entrega implementa autenticación real. El feed, publicaciones, grupos y mensajes continúan siendo una interfaz local/prototipo y todavía no están sincronizados entre usuarios.
