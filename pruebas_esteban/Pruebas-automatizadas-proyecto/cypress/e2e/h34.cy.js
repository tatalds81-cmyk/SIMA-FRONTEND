describe('CP-H34 - Generar o actualizar alerta por observaciones', () => {
  beforeEach(() => {
    // Clear storage to prevent state leakage from other tests
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    // Mock general notifications
    cy.intercept('GET', '**/api/notifications*', {
      statusCode: 200,
      body: { data: [] }
    });

    // Mock groups list
    cy.intercept('GET', '**/api/groups*', {
      statusCode: 200,
      body: {
        data: [
          {
            id_grupo: 1,
            numero_ficha: '2561458',
            programa_formacion: {
              nombre_programa: 'Análisis y Desarrollo de Software'
            }
          }
        ]
      }
    }).as('getGroups');
  });

  it('Debe listar la alerta automática de severidad MODERADA generada al acumularse 3 observaciones abiertas', () => {
    // Mock the alerts query to return a MODERADA automatic alert (origen: AUTOMATICA, type: OBSERVACIONES_RECURRENTES)
    cy.intercept('GET', '**/api/alerts*', {
      statusCode: 200,
      body: {
        data: {
          alerts: [
            {
              id_alerta: 201,
              tipo_alerta: 'OBSERVACIONES_RECURRENTES',
              estado: 'ABIERTA',
              severidad: 'MODERADA',
              descripcion: 'El aprendiz acumuló tres observaciones abiertas en los últimos 30 días.',
              fechaCreacion: '2026-07-09T08:00:00.000Z',
              aprendiz: {
                nombre: 'Carlos Andrés Mendoza Pérez',
                documento: '1001234567'
              },
              grupo: {
                codigo: '2561458'
              },
              responsable: {
                nombre: 'Sistema'
              },
              origen: 'AUTOMATICA'
            }
          ],
          total: 1
        }
      }
    }).as('getAutomaticAlertsModerada');

    cy.loginInstructor();
    cy.visit('/alertas/consultar');

    cy.wait('@getGroups');
    cy.wait('@getAutomaticAlertsModerada');

    // Verify properties of the generated alert in the table
    cy.contains('Carlos Andrés Mendoza Pérez').should('exist');
    cy.contains('2561458').should('exist');
    cy.contains('Observaciones recurrentes').should('exist');
    cy.contains('Moderada').should('exist');
    cy.contains('ABIERTA').should('exist');
    cy.contains('Sistema').should('exist');

    cy.screenshot('H34-alerta-automatica-moderada');
  });

  it('Debe listar la alerta automática de severidad GRAVE generada al registrarse una observación GRAVE abierta', () => {
    // Mock the alerts query to return a GRAVE automatic alert (origen: AUTOMATICA, type: OBSERVACIONES_RECURRENTES)
    cy.intercept('GET', '**/api/alerts*', {
      statusCode: 200,
      body: {
        data: {
          alerts: [
            {
              id_alerta: 202,
              tipo_alerta: 'OBSERVACIONES_RECURRENTES',
              estado: 'ABIERTA',
              severidad: 'GRAVE',
              descripcion: 'El aprendiz acumuló una observación grave abierta en los últimos 30 días.',
              fechaCreacion: '2026-07-09T09:30:00.000Z',
              aprendiz: {
                nombre: 'Ana Sofia Pérez Gómez',
                documento: '1002345678'
              },
              grupo: {
                codigo: '2561458'
              },
              responsable: {
                nombre: 'Sistema'
              },
              origen: 'AUTOMATICA'
            }
          ],
          total: 1
        }
      }
    }).as('getAutomaticAlertsGrave');

    cy.loginInstructor();
    cy.visit('/alertas/consultar');

    cy.wait('@getGroups');
    cy.wait('@getAutomaticAlertsGrave');

    // Verify properties of the generated alert in the table
    cy.contains('Ana Sofia Pérez Gómez').should('exist');
    cy.contains('2561458').should('exist');
    cy.contains('Observaciones recurrentes').should('exist');
    cy.contains('Grave').should('exist');
    cy.contains('ABIERTA').should('exist');
    cy.contains('Sistema').should('exist');

    cy.screenshot('H34-alerta-automatica-grave');
  });
});
