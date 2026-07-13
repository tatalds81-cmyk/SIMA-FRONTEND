describe('CP-H50 - Corregir asistencia de forma controlada', () => {
  // Format today as YYYY-MM-DD in local time
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${date}`;

  // Format 8 days ago as YYYY-MM-DD in local time
  const d8 = new Date();
  d8.setDate(d8.getDate() - 8);
  const year8 = d8.getFullYear();
  const month8 = String(d8.getMonth() + 1).padStart(2, '0');
  const date8 = String(d8.getDate()).padStart(2, '0');
  const day8 = `${year8}-${month8}-${date8}`;

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
  });

  it('Debe permitir la corrección si es dentro de los 7 días y el motivo es válido, e impedirla si se supera el plazo', () => {
    // SCENARIO 1: Session is closed but dated TODAY (within 7 days)
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
    }).as('getClosedSessionToday');

    // Mock initial attendances where Carlos is INASISTENTE (ID 5001)
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
    }).as('getAttendancesToday');

    cy.loginInstructor();
    
    // Set the selected session ID in localStorage before visiting the page so it loads immediately
    cy.window().then((win) => {
      win.localStorage.setItem('sima_asistencia_sesion_seleccionada', '550');
    });

    cy.visit('/instructor/asistencia');

    cy.wait('@getGroups');
    cy.wait('@getAttendancesToday');

    // 1. Enter Manual Mode
    cy.get('button.asistencia-manual-toggle').click();

    // 2. Open Manual Edit Modal for Carlos Andrés
    cy.contains('button', 'Editar').click();
    cy.get('.asistencia-manual-modal').should('be.visible');

    // 3. Test Motivo Length Validation (< 20 characters)
    cy.get('#descripcion-manual').type('Corta');
    cy.contains('button', 'Guardar cambio').click();

    // Verify error toast/alert is displayed
    cy.get('.grupos-alert.danger').should('contain.text', 'El motivo de la correccion debe tener minimo 20 caracteres.');

    // 4. Submit Valid Correction (>= 20 characters)
    // Mock the correction endpoint
    cy.intercept('PATCH', '**/api/attendances/5001/correction', {
      statusCode: 200,
      body: {
        status: 'success',
        message: 'Asistencia corregida correctamente.'
      }
    }).as('patchCorrection');

    // Intercept subsequent refetch to show Carlos as PRESENTE
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
              estado_asistencia: 'PRESENTE',
              hora_registro: '09:30:00',
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

    cy.get('#descripcion-manual').clear().type('Correccion por error involuntario del registro QR del aprendiz.');
    cy.get('#estado-manual').select('PRESENTE');
    cy.contains('button', 'Guardar cambio').click();

    cy.wait('@patchCorrection');
    cy.wait('@getUpdatedAttendances');

    // Verify modal closes and Carlos shows as Presente in the table
    cy.get('.asistencia-manual-modal').should('not.exist');
    cy.get('.asistencia-status').should('contain.text', 'Presente');
    cy.screenshot('H50-correction-success');

    // SCENARIO 2: Session is closed and dated 8 DAYS AGO (exceeds 7-day limit)
    // Set the selected session ID in localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('sima_asistencia_sesion_seleccionada', '550');
    });

    cy.intercept('GET', /\/api\/educational-sessions\?/, {
      statusCode: 200,
      body: {
        data: {
          sesiones: [
            {
              id_sesion_formacion: 550,
              id_grupo: 1,
              estado: 'CERRADA',
              fecha_sesion: day8,
              hora_inicio_programada: '07:00:00',
              hora_fin_programada: '09:30:00'
            }
          ],
          total: 1
        }
      }
    }).as('getOldClosedSession');

    cy.intercept('GET', /\/api\/educational-sessions\/\d+\/attendances/, {
      statusCode: 200,
      body: {
        data: {
          sesion: {
            id_sesion_formacion: 550,
            id_grupo: 1,
            estado: 'CERRADA',
            fecha_sesion: day8
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
    }).as('getOldAttendances');

    // Reload page to fetch the 8-days-old closed session
    cy.reload();

    cy.wait('@getGroups');
    cy.wait('@getOldClosedSession');
    cy.wait('@getOldAttendances');

    // 1. Enter Manual Mode
    cy.get('button.asistencia-manual-toggle').click();

    // 2. Click "Editar"
    cy.contains('button', 'Editar').click();

    // Verify modal does NOT open, and error banner is displayed
    cy.get('.asistencia-manual-modal').should('not.exist');
    cy.get('.grupos-alert.danger').should('contain.text', 'No es posible corregir asistencias de sesiones cerradas hace mas de 7 dias.');
    cy.screenshot('H50-correction-blocked-over-7-days');
  });
});
