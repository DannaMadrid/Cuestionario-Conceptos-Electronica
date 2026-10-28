# ElectroLab: guía de configuración

## 1. Supabase
1. Crea un proyecto en supabase.com.
2. SQL Editor: ejecuta `supabase/schema.sql` (crea la tabla y activa RLS).
3. Authentication > Sign In / Providers: activa **Allow anonymous sign-ins**. Se recomienda activar CAPTCHA para limitar abusos.
4. Authentication > Users > Add user: crea la cuenta de la docente (correo, contraseña, auto-confirmar).
5. SQL Editor: `update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || '{"role":"admin"}' where email='CORREO_DOCENTE';`
6. Project Settings > API: copia URL, `anon` y `service_role`.

## 2. Vercel
Variables en Project Settings > Environment Variables (ver `.env.example`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (esta última solo aquí).
Despliega con `git push` o `npx vercel --prod` desde esta carpeta (sin comando de compilación). El panel queda en `/admin`.

## 3. Pruebas locales
`npm i -g vercel`, copia `.env.example` a `.env.local` con tus valores y ejecuta `vercel dev`.

## 4. Probar la privacidad
- Responde en una ventana normal y otra de incógnito. En cada una, «Ver mis intentos» muestra solo los suyos.
- En la consola del navegador, `from("resultados").insert/update` debe fallar (sin permisos).
- Sin sesión de administradora, `/admin` no muestra datos; con una cuenta anónima, la tabla sale vacía.

## Limitaciones
- El nombre no verifica identidad: cualquiera puede escribir el de otra persona. La separación se basa en la sesión del navegador, no en el nombre.
- Si el estudiante borra los datos del navegador, pierde acceso a «mis intentos» (la docente sí los sigue viendo).
- Las pistas del escape room las reporta el cliente (afectan como máximo 0,12 puntos).
