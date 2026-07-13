describe('CP-H46 - Registrar evidencias de asistencia', () => {
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

  it('Debe guardar y permitir ver las evidencias técnicas asociadas a un registro de asistencia', () => {
    // 1. Initial State: Carlos is registered with QR method and technical evidence
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
              id_asistencia: 5001,
              id_sesion_formacion: 550,
              id_aprendiz: 12,
              estado_asistencia: 'PRESENTE',
              hora_registro: '07:05:00',
              metodo: 'QR',
              evidencias: [
                {
                  id_evidencia: 101,
                  id_asistencia: 5001,
                  metodo: 'QR',
                  latitud: 6.244,
                  longitud: -75.573,
                  precision: 10.0,
                  mocked: false,
                  device_uuid: 'sim-device-uuid-12345',
                  created_at: `${today}T07:05:00Z`
                }
              ],
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
    }).as('getInitialAttendances');

    cy.loginInstructor();
    cy.visit('/instructor/asistencia');

    cy.wait('@getGroups');
    cy.wait('@getInitialAttendances');

    // Close the warning modal conditionally (only if it is visible/active)
    cy.get('body').then(($body) => {
      if ($body.text().includes('Revisar luego')) {
        cy.contains('button', 'Revisar luego').click();
      }
    });

    // Verify Carlos Andrés exists in the table in Tiempo Real mode (where the actions eye icon is visible)
    cy.contains('Carlos Andrés Mendoza Pérez').should('exist');

    // Take screenshot of list showing Carlos Andrés registered and the "Eye" view-details button
    cy.screenshot('H46-instructor-ver-detalle');

    // Click the "Eye" icon to open the detail/evidence modal
    cy.get('button[aria-label="Ver asistencia de Carlos Andrés Mendoza Pérez"]').click();

    // Verify detail modal has opened
    cy.get('.asistencia-detalle-modal').should('be.visible');
    cy.contains('Detalle de asistencia').should('be.visible');
    cy.contains('Carlos Andrés Mendoza Pérez').should('be.visible');

    // Verify that the timeline shows the correct registration method ("QR") and status ("Presente")
    cy.get('.asistencia-da-dot.presente').should('exist');
    cy.get('.asistencia-da-metodo.qr').should('contain.text', 'QR');

    cy.screenshot('H46-bitacora-evidencias');
  });
});
