describe('CP-H48 - Cerrar sesión y consolidar inasistencias', () => {
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
    cy.intercept('GET', /\/api\/notifications/, {
      statusCode: 200,
      body: { data: [] }
    });

    cy.intercept('GET', /\/api\/alerts/, {
      statusCode: 200,
      body: { data: [] }
    });

    // 2. Mocking groups list
    cy.intercept('GET', /\/api\/groups/, {
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

    // 3. Mock apprentice list for the group
    cy.intercept('GET', /\/api\/apprentices\/grupo\//, {
      statusCode: 200,
      body: {
        data: [
          {
            id_aprendiz: 12,
            id_usuario: 12,
            estado_matricula: 'MATRICULADO',
            usuario: {
              persona: {
                nombres: 'Carlos Andrés',
                apellidos: 'Mendoza Pérez',
                numero_documento: '1001234567'
              }
            }
          }
        ]
      }
    }).as('getApprentices');
  });

  it('Debe reflejar la sesión cerrada y el marcado automático de inasistencias para aprendices sin registro', () => {
    // PHASE 1: Active Session showing the apprentice auto-marked as INASISTENTE
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
    }).as('getOpenSessions1');

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
              id_asistencia: 6001,
              id_sesion_formacion: 550,
              id_aprendiz: 12,
              estado_asistencia: 'INASISTENTE',
              hora_registro: '09:30:00',
              metodo: 'AUTOMATICO_CIERRE',
              aprendiz: {
                id_aprendiz: 12,
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
    }).as('getAttendances1');

    cy.loginInstructor();
    
    // Set the selected session ID in localStorage before visiting the page so it loads immediately
    cy.window().then((win) => {
      win.localStorage.setItem('sima_asistencia_sesion_seleccionada', '550');
    });

    cy.visit('/instructor/asistencia');

    cy.wait('@getGroups');
    cy.wait('@getAttendances1');

    // Verify session state pill shows "Activa" in Phase 1
    cy.get('.asistencia-pill').should('contain.text', 'Activa');

    // Verify that Carlos Andrés is visible in the table, marked as Inasistente with method Automatico
    cy.contains('Carlos Andrés Mendoza Pérez').should('exist');
    cy.get('.asistencia-status').should('contain.text', 'Inasistente');
    cy.contains('Automatico').should('exist');

    cy.screenshot('H48-sesion-activa-auto-inasistencia');

    // PHASE 2: Simulate Session Auto-Closure
    // Intercept to return session state as CERRADA
    cy.intercept('GET', /\/api\/educational-sessions\?/, {
      statusCode: 200,
      body: {
        data: {
          sesiones: [
            {
              id_sesion_formacion: 550,
              id_grupo: 1,
              estado: 'CERRADA',
              fecha_sesion: today,
              hora_inicio_programada: '07:00:00',
              hora_fin_programada: '09:30:00'
            }
          ],
          total: 1
        }
      }
    }).as('getOpenSessions2');

    cy.intercept('GET', /\/api\/educational-sessions\/\d+\/attendances/, {
      statusCode: 200,
      body: {
        data: {
          sesion: {
            id_sesion_formacion: 550,
            id_grupo: 1,
            estado: 'CERRADA',
            fecha_sesion: today
          },
          asistencias: [
            {
              id_asistencia: 6001,
              id_sesion_formacion: 550,
              id_aprendiz: 12,
              estado_asistencia: 'INASISTENTE',
              hora_registro: '09:30:00',
              metodo: 'AUTOMATICO_CIERRE',
              aprendiz: {
                id_aprendiz: 12,
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
    }).as('getClosedAttendances2');

    // Re-populate localStorage before reload since it was cleared by the component cleanup
    cy.window().then((win) => {
      win.localStorage.setItem('sima_asistencia_sesion_seleccionada', '550');
    });

    // Reload the page to reflect the session closure
    cy.reload();

    cy.wait('@getClosedAttendances2');

    // Verify session state pill now shows "Sin sesion"
    cy.get('.asistencia-pill').should('contain.text', 'Sin sesion');

    // Verify that the search input is disabled
    cy.get('input[type="search"]').should('be.disabled');
    
    // Verify that the manual toggle button is NOT disabled since the session object is loaded
    cy.get('button.asistencia-manual-toggle').should('not.be.disabled');

    // La sesión cerrada conserva el consolidado para consulta y corrección controlada.
    cy.get('button.asistencia-manual-toggle').click();
    cy.contains('Carlos Andrés Mendoza Pérez').should('exist');
    cy.get('.asistencia-status').should('contain.text', 'Inasistente');
    cy.contains('Automatico').should('exist');

    cy.screenshot('H48-sesion-autocerrada-inasistencias');
  });
});
