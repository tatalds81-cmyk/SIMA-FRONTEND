describe('CP-H45 - Registrar asistencia manual por instructor responsable', () => {
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

  it('Debe permitir al instructor ingresar y guardar la asistencia manual de un aprendiz como Presente o Tarde', () => {
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

    // Click to enter manual mode
    cy.contains('button', 'Manual').click();

    // Verify Carlos is in the list
    cy.contains('Carlos Andrés Mendoza Pérez').should('exist');

    // Verify dropdown exists and does NOT contain "Justificada" as a registrable option
    cy.get('select').last().within(() => {
      cy.get('option').should('have.length', 4); // Sin registro, Presente, Inasistente, Tarde
      cy.get('option').contains('Justificada').should('not.exist');
    });

    cy.screenshot('H45-instructor-modo-manual');

    // Select "Tarde" in the dropdown for Carlos
    cy.get('select').last().select('TARDE');

    // 2. Intercept save endpoint and updated attendances list returning Carlos as TARDE
    cy.intercept('POST', /\/api\/attendances\/manual/, {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id_asistencia: 4001,
          id_sesion_formacion: 550,
          id_aprendiz: 12,
          estado_asistencia: 'TARDE',
          hora_registro: '07:15:00',
          metodo: 'manual'
        }
      }
    }).as('postManualRegister');

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
              id_asistencia: 4001,
              id_sesion_formacion: 550,
              id_aprendiz: 12,
              estado_asistencia: 'TARDE',
              hora_registro: '07:15:00',
              metodo: 'manual',
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

    // Click on "Finalizar edicion" to save manual changes
    cy.contains('button', 'Finalizar edicion').click();
    cy.wait('@postManualRegister');
    cy.wait('@getUpdatedAttendances');

    // Verify Carlos Andrés is registered as "Tarde" and the method is marked as "Manual"
    cy.contains('Carlos Andrés Mendoza Pérez').should('exist');
    cy.get('.asistencia-status').should('contain.text', 'Tarde');
    cy.contains('Manual').should('exist');

    cy.screenshot('H45-asistencia-manual-guardada');
  });
});
