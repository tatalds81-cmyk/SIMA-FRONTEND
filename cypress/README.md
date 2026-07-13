# Pruebas Cypress Super Admin

Suite E2E/API para los casos EP07 del rol `SUPER_ADMIN`.

## Configuracion

1. Instalar dependencias:

```bash
npm install
```

2. Crear `cypress.env.json` a partir de `cypress.env.example.json`.

3. Reemplazar credenciales, ids semilla y rutas si el backend usa nombres distintos.

No subas `cypress.env.json`; contiene credenciales y datos del ambiente.

## Ejecucion

```bash
npm run test:superadmin
```

Para abrir el runner:

```bash
npm run cy:open
```

Estas pruebas crean y modifican usuarios, dispositivos, huellas, alertas y registros de auditoria. Ejecutalas solo en un ambiente de pruebas o QA.
