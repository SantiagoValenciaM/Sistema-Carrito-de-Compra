# 🛒 Tienda Online con Autenticación JWT

Este proyecto es una **aplicación web de tienda en línea** que permite a los usuarios **registrarse, iniciar sesión, buscar productos, realizar pedidos y consultar su historial**. Está dividido en dos partes: el cliente (frontend) y la API (backend), con **protección mediante tokens JWT**.

## 📁 Estructura del Proyecto

- `public/index.html` — Página principal de acceso (login)
- `public/` — Contiene todas las vistas (panel de administradores, tienda, pedidos)
- `routes/` — Contiene las rutas del backend (Node.js + Express)
- `db/` — Archivo(s) para conexión y consultas a la base de datos MySQL
- `middleware/` — Contiene las validaciones de clientes y administradores

---

## 🔐 Funcionalidades del Cliente

✅ Registrarse  
✅ Iniciar sesión  
✅ Buscar productos por nombre  
✅ Ver todos los productos disponibles  
✅ Crear un nuevo pedido con uno o más productos  
✅ Consultar su historial de pedidos

---

## 🔐 Funcionalidades del Administrador

El sistema debe contar con un **usuario administrador predefinido** en la base de datos, que puede autenticarse y acceder a funcionalidades especiales.

Una vez autenticado con su token JWT, el administrador puede:

✅ Ver todos los usuarios registrados  
✅ Ver todos los productos disponibles  
✅ Modificar productos existentes (`PUT`)  
✅ Agregar nuevos productos (`POST`)

---

## ⚙️ Tecnologías Usadas

- **Frontend:** HTML, CSS y JavaScript puro
- **Backend:** Node.js + Express
- **Base de Datos:** MySQL
- **Autenticación:** JWT (JSON Web Tokens)

---

## 🚀 Instrucciones para Ejecutar

### 1. Clonar el repositorio

```git bash
git clone https://github.com/SantiagoValenciaM/Sistema-Carrito-de-Compra.git
cd [nombre-de-tu-repositorio]
```

### 2. Instalar dependencias del backend

```git bash
npm install
```

### 3. Configurar la base de datos
- Asegúrate de tener MySQL corriendo y crea la base de datos correspondiente con las tablas requeridas
- Agrega un archivo .env con tus credenciales

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=nombre_de_la_base_de_datos
JWT_SECRET=una_clave_secreta
```

### 4. Ejecuta el servidor

```git bash
node index.js
```

---

### 📌 Notas Finales
- El sistema requiere autenticación para todas las rutas protegidas.
- Si no se envía un token válido, se responderá con error de autenticación.
- El token se guarda automáticamente en localStorage del navegador una vez iniciado sesión.

---

## Autor
- Desarrollado por Santiago Valencia M.
- https://github.com/SantiagoValenciaM/
