# Actualización — 2026-03-07

Este archivo es una guía en caso de ser requerida 

## Subir archivos 

```bash
scp -i wolfmedic.pem IMAGES/*.tar ubuntu@18.190.228.140:/home/ubuntu/goi-deploy/IMAGES/
scp -i wolfmedic.pem db/005_migration_2026_03_07.sql ubuntu@18.190.228.140:/home/ubuntu/goi-deploy/db/
```

##  Migrar BD

```bash
docker exec -i goi-db psql -U admiSim -d sim < /home/ubuntu/goi-deploy/db/005_migration_2026_03_07.sql
```

## 3. Cargar imágenes y recrear servicios

```bash
cd /home/ubuntu/goi-deploy
docker load -i IMAGES/auth-service.tar
docker load -i IMAGES/back-service.tar
docker load -i IMAGES/frontend.tar
docker compose -p deploy -f docker-compose.images.yml up -d --force-recreate --no-deps auth backend frontend
```

## 4. Verificar

```bash
docker compose -p deploy -f docker-compose.images.yml ps
curl -s http://localhost/api/health
curl -s http://localhost/auth/health
```
