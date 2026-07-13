describe('EP03 - Gestión de observaciones formativas de aprendices', () => {
  let creds;

  before(() => {
    cy.fixture('credenciales').then((data) => { creds = data; });
  });

  // ── H25: Registrar observación académica o convivencial ────────────
  describe('H25 - Registrar observación académica o convivencial', () => {
    beforeEach(() => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/instructor/observaciones');
      cy.get('.obs-filters select').first().select(1);
    });

    it('Registra una observación con descripción válida y queda en estado ABIERTA', () => {
      const descripcionUnica = `Seguimiento academico registrado en la corrida ${Date.now()} durante la practica.`;
      cy.contains('button', 'Registrar observación').click();
      cy.get('.modal-card').within(() => {
        cy.contains('button', 'Seleccione un aprendiz').click();
        cy.get('.multi-select-option').first().click();
        cy.get('select').eq(1).select('ACADEMICA');
        cy.get('select').eq(2).select('LEVE');
        cy.get('textarea').type(descripcionUnica);
        cy.contains('button', 'Guardar observación').click();
      });
      cy.get('.obs-filters select').eq(4).select('ABIERTA');
      cy.contains('button', 'Buscar').click();
      cy.get('.obs-table').should('contain.text', descripcionUnica.slice(0, 80));
    });

    it('Impide guardar con descripción menor a 20 caracteres', () => {
      cy.contains('button', 'Registrar observación').click();
      cy.get('.modal-card').within(() => {
        cy.contains('button', 'Seleccione un aprendiz').click();
        cy.get('.multi-select-option').first().click();
        cy.get('textarea').type('Muy corta');
      });
      cy.on('window:alert', (texto) => {
        expect(texto).to.match(/m[ií]nimo 20 caracteres/i);
      });
      cy.contains('button', 'Guardar observación').click();
    });

    it('Exige seleccionar un aprendiz antes de guardar', () => {
      cy.contains('button', 'Registrar observación').click();
      cy.get('.modal-card').within(() => {
        cy.get('textarea').type('Descripcion suficientemente larga para superar la validacion minima.');
      });
      cy.on('window:alert', (texto) => {
        expect(texto).to.match(/selecciona un aprendiz/i);
      });
      cy.contains('button', 'Guardar observación').click();
    });

    it('Limita el tipo y la severidad a los valores válidos del formulario', () => {
      cy.contains('button', 'Registrar observación').click();
      cy.get('.modal-card').within(() => {
        cy.get('select').eq(1).find('option').then(($opt) => {
          const valores = [...$opt].map((o) => o.value);
          expect(valores).to.deep.equal(['ACADEMICA', 'CONVIVENCIAL']);
        });
        cy.get('select').eq(2).find('option').then(($opt) => {
          const valores = [...$opt].map((o) => o.value);
          expect(valores).to.deep.equal(['LEVE', 'MODERADA', 'GRAVE']);
        });
      });
    });

    it('El coordinador no ve la opción de registrar observación', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/instructor/observaciones');
      cy.contains('button', 'Registrar observación').should('not.exist');
    });
  });

  // ── H26: Consultar observaciones por grupo formativo ────────────────
  describe('H26 - Consultar observaciones por grupo formativo', () => {
    it('Muestra las observaciones registradas al seleccionar una ficha', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/instructor/observaciones');
      cy.get('.obs-filters select').first().select(1);
      cy.get('.obs-table').should('be.visible');
    });

    it('Filtra observaciones por severidad', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/instructor/observaciones');
      cy.get('.obs-filters select').first().select(1);
      cy.get('.obs-filters select').eq(3).select('GRAVE');
      cy.contains('button', 'Buscar').click();
      cy.get('.obs-table').should('be.visible');
    });

    it('Filtra observaciones por tipo (académica/convivencial)', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/instructor/observaciones');
      cy.get('.obs-filters select').first().select(1);
      cy.get('.obs-filters select').eq(2).select('CONVIVENCIAL');
      cy.contains('button', 'Buscar').click();
      cy.get('.obs-table').should('be.visible');
    });

    it('Muestra mensaje claro cuando el rango de fechas no tiene observaciones', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/instructor/observaciones');
      cy.get('.obs-filters select').first().select(1);
      cy.get('.obs-filters-dates input[type="date"]').first().type('2020-01-01');
      cy.get('.obs-filters-dates input[type="date"]').eq(1).type('2020-01-02');
      cy.contains('button', 'Buscar').click();
      cy.contains('No hay observaciones registradas para este grupo').should('be.visible');
    });

    it('El coordinador ya puede consultar observaciones (defecto de acceso corregido)', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/instructor/observaciones');
      cy.get('.obs-filters select').first().select(1);
      cy.get('.obs-table').should('be.visible');
    });
  });

  // ── H27: Consultar historial de observaciones del aprendiz ──────────
  describe('H27 - Consultar historial de observaciones del aprendiz', () => {
    beforeEach(() => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/instructor/observaciones');
      cy.get('.obs-filters select').first().select(1);
    });

    it('Abre el historial de observaciones de un aprendiz desde la tabla', () => {
      cy.get('.obs-table tbody tr').first().find('.obs-icon-btn').first().click();
      cy.get('.modal-card').should('contain.text', 'Historial de observaciones');
    });

    it('Muestra observaciones o el mensaje de historial vacío', () => {
      cy.get('.obs-table tbody tr').first().find('.obs-icon-btn').first().click();
      cy.get('.historial-item, .obs-empty-historial').should('exist');
    });
  });

  // ── H28: Editar observación abierta ─────────────────────────────────
  describe('H28 - Editar observación abierta', () => {
    beforeEach(() => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/instructor/observaciones');
      cy.get('.obs-filters select').first().select(1);
    });

    it('Permite editar una observación en estado ABIERTA', () => {
      cy.get('.obs-filters select').eq(4).select('ABIERTA');
      cy.contains('button', 'Buscar').click();
      cy.get('.obs-table tbody tr').first().find('.obs-action-edit').click();
      cy.get('.modal-card').should('contain.text', 'Editar observación');
    });

    it('No permite editar una observación CERRADA', () => {
      cy.get('.obs-filters select').eq(4).select('CERRADA');
      cy.contains('button', 'Buscar').click();
      cy.get('.obs-table tbody tr').each(($fila) => {
        cy.wrap($fila).find('.obs-action-edit').should('not.exist');
      });
    });

    it('Guarda los cambios de una observación editada', () => {
      cy.get('.obs-filters select').eq(4).select('ABIERTA');
      cy.contains('button', 'Buscar').click();
      cy.get('.obs-table tbody tr').first().find('.obs-action-edit').click();
      cy.get('textarea').clear().type('Descripcion actualizada con informacion complementaria relevante.');
      cy.contains('button', 'Actualizar').click();
      cy.get('.modal-overlay').should('not.exist');
    });

    it('No permite cambiar el aprendiz asociado durante la edición', () => {
      cy.get('.obs-filters select').eq(4).select('ABIERTA');
      cy.contains('button', 'Buscar').click();
      cy.get('.obs-table tbody tr').first().find('.obs-action-edit').click();
      cy.get('.modal-card select').first().should('be.disabled');
    });
  });

  // ── H29: Cerrar observación automáticamente al asociarse a alerta ───
  describe('H29 - Cerrar observación automáticamente al asociarse a alerta', () => {
    it('Las observaciones CERRADAS no muestran acción de edición en el listado', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/instructor/observaciones');
      cy.get('.obs-filters select').first().select(1);
      cy.get('.obs-filters select').eq(4).select('CERRADA');
      cy.contains('button', 'Buscar').click();
      cy.get('.obs-table tbody tr').each(($fila) => {
        cy.wrap($fila).find('.obs-action-edit').should('not.exist');
      });
    });
  });

  // ── H30: Notificar observación a usuarios responsables ──────────────
  describe('H30 - Notificar observación a usuarios responsables', () => {
    beforeEach(() => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/instructor/observaciones');
      cy.get('.obs-filters select').first().select(1);
    });

    it('Muestra la opción de notificar al registrar una observación nueva', () => {
      cy.contains('button', 'Registrar observación').click();
      cy.get('.obs-notif-lider input[type="checkbox"]').should('exist');
    });

    it('La opción de notificar no aparece al editar una observación existente', () => {
      cy.get('.obs-filters select').eq(4).select('ABIERTA');
      cy.contains('button', 'Buscar').click();
      cy.get('.obs-table tbody tr').first().find('.obs-action-edit').click();
      cy.get('.obs-notif-lider').should('not.exist');
    });

    it('Permite registrar sin marcar la opción de notificar', () => {
      cy.contains('button', 'Registrar observación').click();
      cy.get('.obs-notif-lider input[type="checkbox"]').should('not.be.checked');
    });
  });

});
