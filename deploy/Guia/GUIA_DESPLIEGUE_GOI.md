# 🚀 GOI SIM-ODONT — Guía de Despliegue en Servidor

> **Última actualización**: 2026-03-03

---

```

**Opción A — Archivo único (recomendado):** Subir solo `goi-images.tar` (contiene las 3 imágenes).
**Opción B — Archivos separados:** Subir los 3 archivos de `images/` individualmente.

---



```bash
# Ejemplo con SCP desde el equipo de desarrollo
scp -i clave.pem goi-images.tar docker-compose.images.yml .env.example usuario@IP_SERVIDOR:/home/ubuntu/goi-deploy/
scp -i clave.pem db/sim_full_dump.sql usuario@IP_SERVIDOR:/home/ubuntu/goi-deploy/db/
```

---



```bash
# En el servidor
cd /home/ubuntu
mkdir -p goi-deploy/db
```

---


```bash
# Cargar imagen combinada (Opción A - recomendado)
docker load -i goi-images.tar

# — O cargar individualmente (Opción B) —
# docker load -i auth-service.tar
# docker load -i back-service.tar
# docker load -i frontend.tar

# Verificar que se cargaron correctamente
docker images | grep goi
```

**Resultado esperado:**

```
goi-auth       latest    ...    ~200MB
goi-backend    latest    ...    ~200MB
goi-frontend   latest    ...    ~50MB
```

---

## 🔐 Paso 4: Configurar Variables de Entorno

```bash
cd /home/ubuntu/goi-deploy
cp .env.example .env
nano .env
```

**Completar estos valores en `.env`:**

```env
# Contraseña de la base de datos 
POSTGRES_PASSWORD=PONER_AQUI_CONTRASENA

# Clave JWT (mínimo 32 caracteres)
# Generar con: openssl rand -base64 48
JWT_SECRET=PONER_AQUI_CLAVE_JWT

# Clave Fernet (exactamente 32 bytes en base64)
# Generar con: python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
JWT_FERNET_KEY=PONER_AQUI_CLAVE_FERNET

# URL pública del servidor 


# Nivel de logging
LOG_LEVEL=WARNING
```

> 

---



```bash
cd /home/ubuntu/goi-deploy
docker compose -f docker-compose.images.yml up -d
```

> No se necesita `docker build` — las imágenes ya vienen pre-construidas.

---





```bash
docker compose -f docker-compose.images.yml ps
```

**Resultado esperado:**

```
NAME           IMAGE            STATUS
goi-db         postgres:15      Up (healthy)
goi-auth       goi-auth         Up
goi-backend    goi-backend      Up
goi-frontend   goi-frontend     Up
```

> 

### 

```bash
# Frontend (debe devolver HTML)
curl -s http://localhost | head -5

# Backend health check
curl -s http://localhost/api/health
# Esperado: {"status":"ok","service":"backend"}

# Auth health check
curl -s http://localhost/auth/health
# Esperado: {"status":"ok","service":"auth-service"}
```

### 

Ir a `http://IP_DEL_SERVIDOR` o el dominio configurado.

---

## 🔄 Actualizaciones Futuras

Cuando Desarrollo entregue nuevas imágenes:

```bash
cd /home/ubuntu/goi-deploy

# 1. Cargar nuevas imágenes
docker load -i goi-images.tar

# 2. Recrear los servicios con la imagen nueva
docker compose -f docker-compose.images.yml up -d --force-recreate --no-deps auth backend frontend
```

> **⚠️ Los datos de PostgreSQL se persisten en el volumen `pgdata` y NO se pierden al actualizar. Solo se borran si se ejecuta `down -v`.**

---

## 🔧 Troubleshooting

| Problema                                  | Solución                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------- |
| `goi-auth` o `goi-backend` en `unhealthy` | Esperar 30s. Si persiste: `docker compose -f docker-compose.images.yml logs auth` |
| Error de BD al iniciar                    | Verificar `POSTGRES_PASSWORD` en `.env`                                           |
| Frontend muestra página en blanco         | Hacer hard refresh (Ctrl+Shift+R)                                                 |
| Puerto 80 ocupado                         | Verificar con `sudo netstat -tlnp                                                 | grep :80` y detener el proceso que lo ocupa |

### Comandos Útiles

```bash
# Ver logs de todos los servicios
docker compose -f docker-compose.images.yml logs -f

# Ver logs de un servicio específico
docker compose -f docker-compose.images.yml logs -f backend

# Reiniciar un servicio
docker compose -f docker-compose.images.yml restart auth

# Detener todo (conserva datos de BD)
docker compose -f docker-compose.images.yml down

# Detener todo Y borrar datos de BD ⚠️
docker compose -f docker-compose.images.yml down -v
```

---


```
