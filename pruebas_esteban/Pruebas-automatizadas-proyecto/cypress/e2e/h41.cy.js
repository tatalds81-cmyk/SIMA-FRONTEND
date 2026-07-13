describe('CP-H41 - Registrar asistencia por huella digital', () => {
  // Format today as YYYY-MM-DD in local time
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${date}`;

  beforeEach(() => {
    // Clear storage to prevent state leakage from other tests
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    // 1. Mocking standard auth endpoints
    cy.intercept('GET', '**/api/notifications*', {
      statusCode: 200,
      body: { data: [] }
    });

    cy.intercept('GET', '**/api/alerts*', {
      statusCode: 200,
      body: { data: [] }
    });

    // 2. Mocking groups list
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

    // 3. Mock active session list today (exclusive regex: matches when '?' immediately follows 'educational-sessions')
    cy.intercept('GET', /\/api\/educational-sessions\?/, {
      statusCode: 200,
      body: {
        data: {
          sesiones: [
            {
              id_sesion_formacion: 550,
              id_grupo: 1,
              estado: 'ABIERTA',
              fecha_sesion: today,
              hora_inicio_programada: '07:00:00',
              hora_fin_programada: '09:30:00'
            }
          ],
          total: 1
        }
      }
    }).as('getOpenSessions');

    // 4. Mock attendances list (exclusive regex: matches '/api/educational-sessions/<id>/attendances')
    cy.intercept('GET', /\/api\/educational-sessions\/\d+\/attendances/, {
      statusCode: 200,
      body: {
        data: {
          sesion: {
            id_sesion_formacion: 550,
            id_grupo: 1,
            estado: 'ABIERTA',
            fecha_sesion: today
          },
          asistencias: [
            {
              id_asistencia: 1001,
              id_aprendiz: 12,
              estado_asistencia: 'PRESENTE',
              hora_registro: '07:15:00',
              metodo: 'HUELLA',
              aprendiz: {
                usuario: {
                  persona: {
                    nombres: 'Carlos Andrés',
                    apellidos: 'Mendoza Pérez'
                  }
                }
              }
            }
          ]
        }
      }
    }).as('getAttendances');

    cy.intercept('GET', '**/api/apprentices/grupo/*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 12,
            nombre: 'Carlos Andrés Mendoza Pérez',
            estado: 'ACTIVO'
          }
        ]
      }
    });
  });

  it('Debe registrar asistencia exitosamente por huella digital cuando la huella coincide', () => {
    // Intercept local BioMini service returning success
    cy.intercept('POST', 'http://127.0.0.1:8765/attendance/match', {
      statusCode: 200,
      body: {
        match_status: 'MATCH_OK',
        id_usuario: 12,
        backend_response: {
          mensaje: 'Asistencia registrada por huella.',
          data: {
            asistencia_registrada: true
          }
        }
      }
    }).as('postBiominiMatchSuccess');

    cy.loginInstructor();
    cy.visit('/instructor/asistencia');

    // Wait for the button to be enabled before clicking (avoids race condition clicks on disabled buttons)
    cy.get('button.asistencia-method.huella').should('not.be.disabled').click();

    // Verify modal transitions to success state
    cy.get('.asistencia-fingerprint-modal').should('be.visible');
    cy.wait('@postBiominiMatchSuccess');

    cy.get('.asistencia-fingerprint-modal').within(() => {
      cy.contains('Asistencia registrada').should('be.visible');
      cy.contains('Asistencia registrada por huella. Usuario identificado: 12.').should('be.visible');
    });

    cy.screenshot('H41-registro-huella-exitoso');
  });

  it('Debe mostrar error en el modal si la huella no es identificada', () => {
    // Intercept local BioMini service returning no match
    cy.intercept('POST', 'http://127.0.0.1:8765/attendance/match', {
      statusCode: 200,
      body: {
        match_status: 'MATCH_FAIL',
        backend_response: {
          mensaje: 'Huella no identificada.',
          data: {
            asistencia_registrada: false
          }
        }
      }
    }).as('postBiominiMatchFail');

    cy.loginInstructor();
    cy.visit('/instructor/asistencia');

    // Wait for the button to be enabled before clicking
    cy.get('button.asistencia-method.huella').should('not.be.disabled').click();
    cy.wait('@postBiominiMatchFail');

    // Verify modal transitions to fail state
    cy.get('.asistencia-fingerprint-modal').within(() => {
      cy.contains('Huella no identificada').should('be.visible');
      cy.get('p').contains('Huella no identificada.').should('be.visible');
      cy.contains('Reintentar lectura').should('be.visible');
    });

    cy.screenshot('H41-registro-huella-no-identificada');
  });

  it('Debe mostrar error en el modal si el servicio local de BioMini no responde', () => {
    // Intercept local BioMini service returning error
    cy.intercept('POST', 'http://127.0.0.1:8765/attendance/match', {
      forceNetworkError: true
    }).as('postBiominiMatchError');

    cy.loginInstructor();
    cy.visit('/instructor/asistencia');

    // Wait for the button to be enabled before clicking
    cy.get('button.asistencia-method.huella').should('not.be.disabled').click();
    cy.wait('@postBiominiMatchError');

    // Verify modal transitions to error state
    cy.get('.asistencia-fingerprint-modal').within(() => {
      cy.contains('Error de lectura').should('be.visible');
      cy.contains('Failed to fetch').should('be.visible'); // Browser's native network error message
      cy.contains('Reintentar lectura').should('be.visible');
    });

    cy.screenshot('H41-registro-huella-error-conexion');
  });
});
