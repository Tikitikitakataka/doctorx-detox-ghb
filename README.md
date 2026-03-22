# Monitor WBTC/ETH (Uniswap v3 Arbitrum)

Mini app web/PWA para Android que revisa cada 30 minutos el par **WBTC/ETH** y lanza notificaciones cuando el precio sale de los límites configurados.

## Cómo probarla en local

1. Abre una terminal en este proyecto.
2. Ejecuta un servidor estático:

   ```bash
   python3 -m http.server 4173
   ```

3. Entra en `http://localhost:4173` desde tu navegador.
4. Escribe límite inferior y superior.
5. Pulsa **Iniciar monitor**.
6. Cuando el navegador pregunte permiso de notificaciones, acepta.

> Nota: para que la instalación PWA funcione en móvil, necesitas HTTPS (o localhost en entorno local).

## Instalar en Android como aplicación

### Opción 1 (más simple): hosting HTTPS

1. Sube estos archivos a cualquier hosting con HTTPS (Netlify, Vercel, GitHub Pages + dominio HTTPS, etc.).
2. Abre la URL desde Chrome en Android.
3. Pulsa el botón **Instalar app** dentro de la página (si aparece), o usa el menú de Chrome → **Instalar aplicación / Añadir a pantalla de inicio**.
4. Acepta instalación.

### Opción 2: empaquetar como APK con TWA (avanzado)

- Puedes convertir esta PWA a APK con **Bubblewrap** (Trusted Web Activity).
- Requisitos: tener la web publicada con HTTPS y pasar validaciones de PWA.

## Limitaciones importantes (Android)

- Las notificaciones dependen de permisos y del navegador/sistema.
- En PWA, los `setInterval` largos pueden pausarse cuando la app está en segundo plano.
- Si quieres alertas 100% fiables en background real, conviene una app nativa (Kotlin) con `WorkManager` y push/local notifications.
