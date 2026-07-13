describe('CP-H52 - Definir lista base de aprendices de la sesión', () => {
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

    // 1. Mocking standard auth
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

    // 3. Mock apprentice list for the group (freeze base list context)
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

  it('Debe inicializar la lista base de aprendices en PENDIENTE ("Sin registro"), y consolidar a inasistentes al cerrar la sesión', () => {
    // PHASE 1: Session is open, Carlos has no attendance yet (PENDIENTE)
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
    }).as('getOpenSession');

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
          asistencias: [] // Empty means Carlos is in the PENDIENTE state (Sin registro)
        }
      }
    }).as('getInitialAttendances');

    cy.loginInstructor();
    
    // Set the selected session ID in localStorage before visiting the page so it loads immediately
    cy.window().then((win) => {
      win.localStorage.setItem('sima_asistencia_sesion_seleccionada', '550');
    });

    cy.visit('/instructor/asistencia');

    cy.wait('@getGroups');
    cy.wait('@getInitialAttendances');

    // Close the warning modal (triggered because Carlos is pending)
    cy.contains('button', 'Revisar luego').click();

    // Verify session state pill shows "Activa" in Phase 1
    cy.get('.asistencia-pill').should('contain.text', 'Activa');

    // Switch to Manual Mode to see the full list base
    cy.get('button.asistencia-manual-toggle').click();

    // Verify Carlos Andrés is in the table, marked as "Sin registro" (technical state PENDIENTE)
    cy.contains('Carlos Andrés Mendoza Pérez').should('exist');
    cy.get('.asistencia-status').should('contain.text', 'Sin registro');

    cy.screenshot('H52-sesion-abierta-aprendices-pendientes');

    // PHASE 2: Session closes, Carlos's remaining PENDIENTE record is consolidated to INASISTENTE
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
    }).as('getClosedSession');

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
              id_asistencia: 5001,
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
    }).as('getClosedAttendances');

    // Re-populate localStorage before reload
    cy.window().then((win) => {
      win.localStorage.setItem('sima_asistencia_sesion_seleccionada', '550');
    });

    // Reload the page to reflect the session closure and consolidation
    cy.reload();

    cy.wait('@getClosedAttendances');

    // Switch to Manual Mode to inspect the consolidated record of the closed session
    cy.get('button.asistencia-manual-toggle').click();

    // Verify Carlos Andrés is marked as "Inasistente" (method "Automatico")
    cy.contains('Carlos Andrés Mendoza Pérez').should('exist');
    cy.get('.asistencia-status').should('contain.text', 'Inasistente');
    cy.contains('Automatico').should('exist');

    cy.screenshot('H52-sesion-cerrada-inasistencias-consolidadas');
  });
});
