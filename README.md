# CarbonHub — Proyecto Frontend

Aplicación web para gestión de huella de carbono, construida con Angular y consumiendo la API REST del backend de CarbonHub.

---

## Requisitos previos

- **Node.js** `v24.17.0`
- **npm** `11.13.0` (definido como `packageManager` en `package.json`)
- **Angular CLI** `22.0.5` (se instala automáticamente vía `devDependencies`, pero puedes instalarlo global con `npm install -g @angular/cli` si prefieres correr `ng` directamente)
- El [backend de CarbonHub](https://github.com/Alli293/piedpiper-backend) corriendo localmente (ver su propio README) si vas a probar funcionalidades que dependen de la API

> 💡 Si trabajás en Windows, se recomienda usar **nvm-windows** para manejar versiones de Node sin conflictos.

---

## Configuración del entorno

### 1. Clonar el repositorio

```bash
git clone https://github.com/Alli293/piedpiper-frontend.git
cd piedpiper-frontend
```

> ⚠️ **Importante (Windows + Google Drive/OneDrive):** si tu carpeta de proyectos está sincronizada con Google Drive o OneDrive, clona el repo **fuera** de esa carpeta sincronizada (por ejemplo en `C:\Users\<usuario>\Documents\Angular\`). La sincronización interfiere con `node_modules` y puede causar errores difíciles de diagnosticar.

### 2. Instalar dependencias

```bash
npm install
```

Esto instala Angular, Prettier, y el resto de dependencias del proyecto con las versiones exactas definidas en `package-lock.json`.

---

## Correr el proyecto localmente

```bash
npm start
```

Una vez levantado el servidor, abre el navegador en:

```
http://localhost:4200/
```

La aplicación se recarga automáticamente cada vez que modificas un archivo fuente.

---

## Formato de código (Prettier)

El proyecto usa [Prettier](https://prettier.io/) para mantener un formato consistente (indentación de 2 espacios, comillas simples en TS/JS, ancho máximo de línea de 100 caracteres, etc.) en toda la base de código.

### Configuración recomendada del editor (VSCode)

Este repo incluye `.vscode/settings.json` y `.vscode/extensions.json` con la configuración necesaria. Al abrir el proyecto en VSCode:

1. Te va a salir una notificación sugiriendo instalar las extensiones recomendadas (**Prettier** y **Angular Language Service**). Acepta la instalación.
2. Con eso, el formato se aplica automáticamente cada vez que guardas un archivo (`Ctrl+S` / `Cmd+S`).

### Formatear manualmente desde la terminal

Si preferís no depender del editor, o querés formatear todo el proyecto de una vez:

```bash
npm run format
```

Para solo **verificar** si hay archivos mal formateados sin modificarlos (útil antes de un commit o en CI):

```bash
npm run format:check
```

---

## Generación de código (scaffolding)

Angular CLI incluye herramientas para generar código automáticamente. Por ejemplo, para generar un nuevo componente:

```bash
ng generate component nombre-del-componente
```

Para ver todos los schematics disponibles (`component`, `directive`, `pipe`, etc.):

```bash
ng generate --help
```

---

## Build

Para compilar el proyecto para producción:

```bash
ng build
```

Los artefactos compilados quedan en la carpeta `dist/`. Por defecto, el build de producción viene optimizado para performance.

---

## Testing

### Pruebas unitarias

El proyecto usa [Vitest](https://vitest.dev/) como test runner (opción por defecto de Angular CLI):

```bash
ng test -- --watch=false
```

Esto corre los tests una sola vez (sin watch) usando el motor de Vitest, con salida en terminal (no abre navegador).

---

## Estructura del proyecto

```
src/
 └── app/              # Componentes, servicios, módulos de la aplicación
.vscode/               # Configuración compartida del editor (formato, extensiones)
.prettierrc            # Reglas de formato de código
```

---

## Notas importantes

- No subir archivos de configuración con credenciales reales al repositorio.
- Antes de levantar el frontend, asegurate de que el backend esté corriendo (ver [README del backend](https://github.com/Alli293/piedpiper-backend)).
- Si ves errores relacionados con módulos de `node_modules` (por ejemplo `ERR_MODULE_NOT_FOUND`), probá reinstalando las dependencias:
  ```bash
  rm -rf node_modules
  npm ci
  ```
- Corré `npm run format:check` antes de hacer push para evitar conflictos de formato en los PRs.

---

## Recursos adicionales

Para más información sobre Angular CLI, incluyendo referencia detallada de comandos, visitá la [documentación oficial de Angular CLI](https://angular.dev/tools/cli).
