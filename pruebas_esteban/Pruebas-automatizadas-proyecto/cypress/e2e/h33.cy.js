describe('CP-H33 - Cerrar alerta', () => {
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

    // Mock groups list for the coordinator
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

  it('Debe permitir al Coordinador ver el detalle y cerrar una alerta activa tras ingresar una justificación de mínimo 20 caracteres', () => {
    const coordinatorUser = {
      id_usuario: 2,
      email: 'coordinator@test.com',
      rol: 'COORDINADOR',
      persona: {
        nombres: 'Coordinador',
        apellidos: 'Prueba',
        numero_documento: '987654321'
      }
    };

    // 1. Mock Coordinator Login
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        data: {
          access: 'fake-coord-token',
          user: coordinatorUser,
          rol: 'COORDINADOR'
        }
      }
    }).as('postLoginCoord');

    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: {
        data: coordinatorUser
      }
    }).as('getMeCoord');

    // 2. Mock initial coordinator dashboard alerts summary (limit 50)
    cy.intercept('GET', '**/api/alerts?limit=50', {
      statusCode: 200,
      body: {
        data: {
          alerts: [
            {
              id_alerta: 105,
              tipo_alerta: 'CONVIVENCIAL',
              estado: 'ABIERTA',
              severidad: 'GRAVE',
              descripcion: 'Comportamiento indebido.',
              fechaCreacion: '2026-07-08T10:00:00.000Z',
              aprendizNombre: 'Juan Pérez',
              aprendizDocumento: '9876543210',
              grupo: {
                id_grupo: 1,
                numero_ficha: '2561458',
                codigo: '2561458'
              },
              responsableNombre: 'Instructor Prueba'
            }
          ],
          total: 1
        }
      }
    }).as('getCoordinatorAlertsSummary');

    // 3. Mock group detailed alerts list
    cy.intercept('GET', '**/api/alerts?id_grupo=*', {
      statusCode: 200,
      body: {
        data: {
          alerts: [
            {
              id_alerta: 105,
              tipo_alerta: 'CONVIVENCIAL',
              estado: 'ABIERTA',
              severidad: 'GRAVE',
              descripcion: 'Comportamiento indebido.',
              fechaCreacion: '2026-07-08T10:00:00.000Z',
              aprendizNombre: 'Juan Pérez',
              aprendizDocumento: '9876543210',
              grupo: {
                codigo: '2561458'
              },
              responsableNombre: 'Instructor Prueba'
            }
          ],
          total: 1
        }
      }
    }).as('getCoordinatorGroupAlerts');

    // 4. Mock Single Alert detail query
    cy.intercept('GET', '**/api/alerts/105', {
      statusCode: 200,
      body: {
        data: {
          id: 105,
          id_alerta: 105,
          tipoAlerta: 'CONVIVENCIAL',
          estado: 'ABIERTA',
          severidad: 'GRAVE',
          descripcion: 'Comportamiento indebido.',
          fechaCreacion: '2026-07-08T10:00:00.000Z',
          aprendizNombre: 'Juan Pérez',
          aprendizDocumento: '9876543210',
          grupoCodigo: '2561458',
          responsableNombre: 'Instructor Prueba'
        }
      }
    }).as('getSingleAlertDetail');

    // Visit and Login
    cy.visit('/login');
    cy.get('#login-user').clear().type('987654321');
    cy.get('#login-password').clear().type('Password123!');
    cy.contains('button', 'Iniciar sesion').click();
    cy.wait('@postLoginCoord');
    cy.wait('@getMeCoord');

    cy.window().then((win) => {
      win.localStorage.setItem('rol', 'COORDINADOR');
    });

    cy.visit('/alertas/consultar');
    cy.wait('@getGroups');
    cy.wait('@getCoordinatorAlertsSummary');

    // Go to group detailed list
    cy.contains('button', 'Ver aprendices').click();
    cy.wait('@getCoordinatorGroupAlerts');

    // Click "Revisar y Cerrar" button in Action column to open detailed view modal
    cy.contains('button', 'Revisar y Cerrar').click();
    cy.wait('@getSingleAlertDetail');

    // Check detail view is open
    cy.get('.mcal-modal').should('exist');
    cy.contains('Detalle de alerta #105').should('exist');

    // Click Cerrar Alerta inside the detailed view
    cy.get('button[data-testid="alert-close-button"]').click();
    
    // Check Close Confirmation Modal is open
    cy.get('div[data-testid="alert-close-modal"]').should('exist');

    // 5. Verify validation error (< 20 characters)
    cy.get('div[data-testid="alert-close-modal"] textarea').type('Corta');
    cy.get('button[data-testid="alert-close-submit"]').click();
    cy.contains('Mínimo 20 caracteres requeridos').should('exist');

    // Mock successful close PATCH call
    cy.intercept('PATCH', '**/api/alerts/105/status', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 105,
          id_alerta: 105,
          estado: 'CERRADA'
        }
      }
    }).as('patchCloseAlert');

    // 6. Enter valid justification and submit
    cy.get('div[data-testid="alert-close-modal"] textarea').clear().type('El aprendiz presento las excusas medicas correspondientes y el caso fue archivado.');
    cy.get('button[data-testid="alert-close-submit"]').click();

    cy.wait('@patchCloseAlert');

    // Closing modal closes, detailed view shows CERRADA
    cy.get('div[data-testid="alert-close-modal"]').should('not.exist');
    cy.get('.mcal-modal').should('exist').and('contain.text', 'CERRADA');

    // Close detailed modal manually
    cy.get('.mcal-modal button.mcal-btn-close').click();
    cy.get('.mcal-modal').should('not.exist');

    // 7. Mock updated alerts list to show CERRADA on reload
    cy.intercept('GET', '**/api/alerts?id_grupo=*', {
      statusCode: 200,
      body: {
        data: {
          alerts: [
            {
              id_alerta: 105,
              tipo_alerta: 'CONVIVENCIAL',
              estado: 'CERRADA',
              severidad: 'GRAVE',
              descripcion: 'Comportamiento indebido.',
              fechaCreacion: '2026-07-08T10:00:00.000Z',
              aprendizNombre: 'Juan Pérez',
              aprendizDocumento: '9876543210',
              grupo: {
                codigo: '2561458'
              },
              responsableNombre: 'Instructor Prueba'
            }
          ],
          total: 1
        }
      }
    }).as('getClosedGroupAlerts');

    // Reload page to reflect the new state in list
    cy.reload();
    cy.wait('@getGroups');
    cy.wait('@getCoordinatorAlertsSummary');

    cy.contains('button', 'Ver aprendices').click();
    cy.wait('@getClosedGroupAlerts');

    // Toggle closed alerts history view to display the CERRADA alert
    cy.contains('button', 'Historial de cerradas').click();

    // Verify correct history view labels and buttons are loaded
    cy.contains('Historial de alertas cerradas').should('exist');
    cy.contains('Juan Pérez').should('exist');
    cy.contains('button', 'Ver detalle').should('exist');
    cy.contains('button', 'Revisar y Cerrar').should('not.exist');

    cy.screenshot('H33-alerta-cerrada-exito');
  });
});
