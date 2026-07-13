describe('CP-H44 - Registrar asistencia mediante lector IoT de huella', () => {
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

    // 3. Mock active session list today
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

    // 4. Mock apprentice list for the group
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

  it('Debe registrar la asistencia del aprendiz por huella digital mediante el lector IoT del ambiente', () => {
    // 1. Initial State: Carlos is unregistered
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
          asistencias: []
        }
      }
    }).as('getInitialAttendances');

    cy.loginInstructor();
    cy.visit('/instructor/asistencia');

    cy.wait('@getGroups');
    cy.wait('@getInitialAttendances');

    // Close the warning modal that pops up on page load due to pending apprentices
    cy.contains('button', 'Revisar luego').click();

    // Verify initial layout is displayed
    cy.contains('Control de Asistencia de Aprendices').should('be.visible');
    cy.screenshot('H44-instructor-esperando-marcas-iot');

    // 2. Simulated State: Apprentice Carlos Andrés puts his finger on the standalone IoT reader.
    // The backend registers the event and we mock the updated attendances list returning "Huella" method
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
              id_asistencia: 3001,
              id_sesion_formacion: 550,
              id_aprendiz: 12,
              estado_asistencia: 'PRESENTE',
              hora_registro: '07:08:00',
              metodo: 'huella',
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
    }).as('getUpdatedAttendances');

    // Reload the page to fetch the updated attendance list
    cy.reload();

    cy.wait('@getUpdatedAttendances');

    // Switch to Manual mode to see the complete list of apprentices and bypass filtering
    cy.contains('button', 'Manual').click();

    // Verify Carlos Andrés now shows as "Presente" with method "Huella"
    cy.contains('Carlos Andrés Mendoza Pérez').should('exist');
    cy.get('select').should('have.value', 'PRESENTE');
    cy.contains('Huella').should('exist');

    cy.screenshot('H44-aprendiz-asistencia-registrada-iot');
  });
});
