describe('CP-H53 - Justificar inasistencia', () => {
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

    // 4. Mock active session today
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
  });

  it('Debe reflejar en la asistencia del instructor el cambio de estado a JUSTIFICADA y detallar el origen móvil tras aprobarse el soporte', () => {
    // Mock attendances returning Carlos as JUSTIFICADA (metodo: JUSTIFICACION_MOVIL)
    // representing the final state after the apprentice uploads and justification is approved (CA-H53-06, 07)
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
              estado_asistencia: 'JUSTIFICADA',
              hora_registro: '09:30:00',
              metodo: 'JUSTIFICACION_MOVIL',
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
    }).as('getJustifiedAttendances');

    cy.loginInstructor();
    
    // Set the selected session ID in localStorage before visiting the page so it loads immediately
    cy.window().then((win) => {
      win.localStorage.setItem('sima_asistencia_sesion_seleccionada', '550');
    });

    cy.visit('/instructor/asistencia');

    cy.wait('@getGroups');
    cy.wait('@getJustifiedAttendances');

    // Close the warning modal if present
    cy.get('body').then(($body) => {
      if ($body.text().includes('Revisar luego')) {
        cy.contains('button', 'Revisar luego').click();
      }
    });

    // 1. Verify Carlos Andrés shows status "Justificada" in the attendance table
    cy.contains('Carlos Andrés Mendoza Pérez').should('exist');
    cy.get('.asistencia-status').should('contain.text', 'Justificada');
    cy.contains('JUSTIFICACION_MOVIL').should('exist');

    // 2. Open Detail Modal and verify the audit timeline has "Justificada" and method
    cy.get('button[aria-label="Ver asistencia de Carlos Andrés Mendoza Pérez"]').click();
    cy.get('.asistencia-detalle-modal').should('be.visible');
    cy.contains('Detalle de asistencia').should('be.visible');
    
    // Verify that the timeline lists the "Justificada" status and the "JUSTIFICACION_MOVIL" origin
    cy.get('.asistencia-da-dot.justificado').should('exist');
    cy.get('.asistencia-da-metodo.justificacion_movil').should('contain.text', 'JUSTIFICACION_MOVIL');

    cy.screenshot('H53-asistencia-justificada-aprendiz');
  });
});
