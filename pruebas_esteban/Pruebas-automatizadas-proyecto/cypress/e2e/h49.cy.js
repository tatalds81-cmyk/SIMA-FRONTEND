describe('CP-H49 - Cancelar sesión de formación', () => {
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

    // 1. Mocking standard auth and layouts
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

    // 4. Mock active session
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

    // 5. Mock attendances
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
    }).as('getAttendances');
  });

  it('Debe permitir al instructor abrir el panel de cancelación, validar la longitud mínima de caracteres, y cancelar la sesión', () => {
    cy.loginInstructor();
    
    // Set the selected session ID in localStorage before visiting the page so it loads immediately
    cy.window().then((win) => {
      win.localStorage.setItem('sima_asistencia_sesion_seleccionada', '550');
    });

    cy.visit('/instructor/asistencia');

    cy.wait('@getGroups');
    cy.wait('@getAttendances');

    // Close the warning modal (which is guaranteed to display since Carlos is pending)
    cy.contains('button', 'Revisar luego').click();

    // 1. Enter Manual Mode
    cy.get('button.asistencia-manual-toggle').click();

    // 2. Open Manual Edit Modal for Carlos Andrés
    cy.contains('button', 'Editar').click();
    cy.get('.asistencia-manual-modal').should('be.visible');

    // 3. Open Cancellation Panel inside the modal
    cy.contains('button', 'Cancelada').click();
    cy.get('.asistencia-manual-cancel-panel').scrollIntoView().should('be.visible');

    // 4. Test Motivo Length Validation (< 20 characters)
    cy.get('#motivo-cancelacion-manual').scrollIntoView().type('Corta');
    cy.contains('button', 'Cerrar sesion').click();

    // Verify error toast/alert is displayed
    cy.get('.grupos-alert.danger').should('contain.text', 'El motivo de cancelacion debe tener minimo 20 caracteres.');
    cy.screenshot('H49-cancellation-validation-error');

    // 5. Submit Valid Motivo (>= 20 characters)
    cy.get('#motivo-cancelacion-manual').scrollIntoView().clear().type('Sesion cancelada por suspension de actividades en el centro de formacion.');
    cy.contains('button', 'Cerrar sesion').click();

    // Verify modal closes and success toast is displayed
    cy.get('.asistencia-manual-modal').should('not.exist');
    cy.get('.grupos-alert.info').should('contain.text', 'Sesion cancelada en la vista. Falta conectar endpoint para persistir la cancelacion.');

    // Verify that the session state pill now displays "Sin sesion"
    cy.get('.asistencia-pill').should('contain.text', 'Sin sesion');
    cy.screenshot('H49-session-cancelled-successfully');
  });
});
