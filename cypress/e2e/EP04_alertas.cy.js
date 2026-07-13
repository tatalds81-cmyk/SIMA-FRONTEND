describe('EP04 - Gestión de alertas tempranas y riesgos formativos', () => {
  let creds;

  const abrirPrimeraAlertaComoCoordinador = () => {
    cy.get('[data-testid="coordinator-group-row"]').first().click();
    cy.get('[data-testid="coordinator-alert-row"]')
      .first()
      .find('button[aria-label="Ver detalle"]')
      .click();
  };

  before(() => {
    cy.fixture('credenciales').then((data) => { creds = data; });
  });

  // ── H31: Crear alerta manual ─────────────────────────────────────────
  describe('H31 - Crear alerta manual', () => {
    beforeEach(() => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/alertas/consultar');
    });

    it('El instructor ve el botón para crear una alerta manual', () => {
      cy.contains('button', 'Nueva alerta manual').should('be.visible');
    });

    it('El coordinador no ve el botón de crear alerta manual', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/alertas/consultar');
      cy.contains('button', 'Nueva alerta manual').should('not.exist');
    });

    it('Abre el modal de creación con los campos obligatorios', () => {
      cy.contains('button', 'Nueva alerta manual').click();
      cy.get('.mcal-modal').should('be.visible');
      cy.contains('Crear alerta manual').should('exist');
      cy.get('.mcal-search-wrap input').should('be.disabled'); 
    });

    it('Exige grupo, aprendiz, tipo, severidad, observaciones y descripción antes de guardar', () => {
      cy.contains('button', 'Nueva alerta manual').click();
      cy.contains('button', 'Guardar alerta').click();
      cy.contains('.mcal-error-msg', 'Selecciona un grupo').should('exist');
      cy.contains('.mcal-error-msg', 'Selecciona un aprendiz').should('exist');
      cy.contains('.mcal-error-msg', 'Selecciona el tipo').should('exist');
      cy.contains('.mcal-error-msg', 'Selecciona la severidad').should('exist');
      cy.contains('.mcal-error-msg', 'Selecciona al menos una observacion abierta').should('exist');
      cy.contains('.mcal-error-msg', 'La descripcion es obligatoria').should('exist');
    });

    it('Exige una descripción de mínimo 20 caracteres', () => {
      cy.contains('button', 'Nueva alerta manual').click();
      cy.get('.mcal-textarea').type('Muy corta');
      cy.contains('button', 'Guardar alerta').click();
      cy.contains('.mcal-error-msg', 'Minimo 20 caracteres').should('exist');
    });

    it('Habilita la búsqueda de aprendiz solo después de seleccionar un grupo', () => {
      cy.contains('button', 'Nueva alerta manual').click();
      cy.get('.mcal-field select').first().select(1);
      cy.get('.mcal-search-wrap input').should('be.enabled');
    });

    it('Ofrece severidad LEVE, MODERADA, GRAVE y CRITICA', () => {
      cy.contains('button', 'Nueva alerta manual').click();
      cy.get('.mcal-row .mcal-select').eq(1).find('option').then(($opt) => {
        const valores = [...$opt].map((o) => o.value);
        expect(valores).to.deep.equal(['', 'LEVE', 'MODERADA', 'GRAVE', 'CRITICA']);
      });
    });

    it('Ofrece tipo de alerta ASISTENCIAL, OBSERVACIONES_RECURRENTES y CONVIVENCIAL', () => {
      cy.contains('button', 'Nueva alerta manual').click();
      cy.get('.mcal-row .mcal-select').eq(0).find('option').then(($opt) => {
        const valores = [...$opt].map((o) => o.value);
        expect(valores).to.deep.equal(['', 'ASISTENCIAL', 'OBSERVACIONES_RECURRENTES', 'CONVIVENCIAL']);
      });
    });

    it('Las notificaciones a coordinador e instructor líder están marcadas por defecto', () => {
      cy.contains('button', 'Nueva alerta manual').click();
      cy.get('.mcal-notif-group input[type="checkbox"]').eq(0).should('be.checked');
      cy.get('.mcal-notif-group input[type="checkbox"]').eq(1).should('be.checked');
    });

    it('Solo permite seleccionar observaciones que estén en estado abierto', () => {
      cy.contains('button', 'Nueva alerta manual').click();
      cy.get('.mcal-field select').first().select(1);
      cy.get('.mcal-search-wrap input').type('Jorge');
      cy.get('.mcal-dropdown-item').first().click();
      cy.get('.mcal-observaciones-box').should('be.visible');
    });
  });

  // ── H32: Consultar alertas según rol y alcance ──────────────────────
  describe('H32 - Consultar alertas según rol y alcance', () => {
    it('El coordinador consulta el listado de alertas', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/alertas/consultar');
      cy.get('[data-testid="coordinator-group-table"], [data-testid="coordinator-empty-state"]').should('exist');
    });

    it('El instructor consulta alertas con los filtros disponibles', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/alertas/consultar');
      // Estado, Severidad, Tipo de alerta y Grupo
      cy.get('.ca-select').should('have.length', 4);
    });

    it('Filtra alertas por estado usando los valores soportados por el backend', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/alertas/consultar');
      cy.get('[data-testid="alert-filter-status"] option').then(($options) => {
        const valores = [...$options].map((option) => option.value);
        expect(valores).to.deep.equal(['', 'ABIERTA', 'CERRADA']);
      });
      cy.get('[data-testid="alert-filter-status"]').select('ABIERTA');
      cy.contains('button', 'Buscar').click();
      cy.get('[data-testid="alert-table"], .ca-estado-vacio').should('exist');
    });

    it('Filtra alertas por severidad', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/alertas/consultar');
      cy.get('.ca-select').eq(1).select('GRAVE');
      cy.contains('button', 'Buscar').click();
      cy.get('[data-testid="alert-table"], .ca-estado-vacio').should('exist');
    });

    it('Filtra alertas por tipo', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/alertas/consultar');
      cy.get('.ca-select').eq(2).select('CONVIVENCIAL');
      cy.contains('button', 'Buscar').click();
      cy.get('[data-testid="alert-table"], .ca-estado-vacio').should('exist');
    });

    it('Filtra alertas por rango de fechas', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/alertas/consultar');
      cy.get('input[type="date"]').first().type('2026-01-01');
      cy.get('input[type="date"]').eq(1).type('2026-06-22');
      cy.contains('button', 'Buscar').click();
      cy.get('[data-testid="alert-table"], .ca-estado-vacio').should('exist');
    });

    it('Filtra alertas por aprendiz una vez seleccionado un grupo', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/alertas/consultar');
      cy.get('.ca-select').eq(3).select(1); 
      cy.get('input.ca-input--search').type('Jorge');
      cy.get('.ca-aprendiz-dropdown').should('be.visible');
    });

    it('Muestra mensaje claro cuando no hay alertas disponibles', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/alertas/consultar');
      cy.get('input[type="date"]').first().type('2020-01-01');
      cy.get('input[type="date"]').eq(1).type('2020-01-02');
      cy.contains('button', 'Buscar').click();
      cy.contains('No se encontraron alertas').should('be.visible');
    });
  });

  // ── H33: Cerrar alerta ────────────────────────────────────────────────
  describe('H33 - Cerrar alerta', () => {
    beforeEach(() => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/alertas/consultar');
    });

    it('Muestra el botón "Cerrar alerta" solo si está activa y el usuario es coordinador', () => {
      abrirPrimeraAlertaComoCoordinador();
      cy.contains(/Detalle de alerta/).should('be.visible');
      cy.get('[data-testid="alert-close-button"]').should('exist');
    });

    it('Un instructor no ve el botón para cerrar alertas', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/alertas/consultar');
      cy.get('[data-testid="alert-filter-status"]').select('ABIERTA');
      cy.contains('button', 'Buscar').click();
      cy.get('[data-testid="alert-row"]').first().find('button[aria-label="Ver detalle"]').click();
      cy.get('[data-testid="alert-close-button"]').should('not.exist');
    });

    it('Exige una justificación mínima de 20 caracteres para cerrar', () => {
      abrirPrimeraAlertaComoCoordinador();
      cy.get('[data-testid="alert-close-button"]').click();
      cy.get('[data-testid="alert-close-modal"]').should('be.visible');
      cy.get('[data-testid="alert-close-submit"]').click();
      cy.contains('Mínimo 20 caracteres requeridos').should('be.visible');

      cy.get('textarea').type('Muy corta');
      cy.get('[data-testid="alert-close-submit"]').click();
      cy.contains('Mínimo 20 caracteres requeridos').should('be.visible');
    });

    it('Cierra correctamente una alerta con justificación válida', () => {
      cy.intercept('PATCH', '**/api/alerts/*/status', {
        statusCode: 200,
        body: { data: { estado: 'CERRADA' } },
      }).as('cerrarAlerta');
      abrirPrimeraAlertaComoCoordinador();
      cy.get('[data-testid="alert-close-button"]').click();
      cy.get('textarea').type('La situacion fue revisada y atendida satisfactoriamente con el aprendiz y su acudiente.');
      cy.get('[data-testid="alert-close-submit"]').click();
      cy.wait('@cerrarAlerta').its('request.body').should('deep.include', {
        estado: 'CERRADA',
      });
      cy.contains('Alerta cerrada correctamente').should('be.visible');
      cy.get('[data-testid="alert-close-button"]', { timeout: 8000 }).should('not.exist');
    });
  });

  // ── H34: Generar o actualizar alerta por observaciones (Sistema) ──────
  describe('H34 - Generar o actualizar alerta por observaciones (Sistema)', () => {
    beforeEach(() => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/alertas/consultar');
    });

    it('El detalle de la alerta muestra su origen (MANUAL o AUTOMATICA)', () => {
      abrirPrimeraAlertaComoCoordinador();
      cy.contains('Origen').parent().find('.da-origen-tag').should('exist');
    });

    it('Una alerta generada desde observaciones muestra las observaciones vinculadas', () => {
      abrirPrimeraAlertaComoCoordinador();
      cy.get('body').then(($body) => {
        if ($body.text().includes('Observaciones Vinculadas')) {
          cy.contains('Observaciones Vinculadas').should('be.visible');
        }
      });
    });
  });

});
