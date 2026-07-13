describe('CP-H42 - Registrar asistencia por código QR', () => {
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

    // 3. Mock active session list today (exclusive regex)
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

    // 4. Mock attendances list (exclusive regex)
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

    cy.intercept('GET', '**/api/apprentices/grupo/*', {
      statusCode: 200,
      body: {
        data: []
      }
    });
  });

  it('Debe generar e iniciar el registro por código QR, permitiendo agrandar y cerrar la vista fullscreen', () => {
    // Intercept QR generation call returning a token
    cy.intercept('POST', '**/api/educational-sessions/550/qr', {
      statusCode: 200,
      body: {
        success: true,
        qr_token: 'sima-qr-token-test-12345',
        id_sesion_formacion: 550,
        expira_en: new Date(Date.now() + 30000).toISOString()
      }
    }).as('postGenerateQr');

    cy.loginInstructor();
    cy.visit('/instructor/asistencia');

    // Wait for the button to be enabled before clicking
    cy.get('button.asistencia-method.qr').should('not.be.disabled').click();
    cy.wait('@postGenerateQr');

    // Verify QR card appears and shows the token information
    cy.get('.asistencia-qr-card').scrollIntoView().should('exist');
    cy.get('.asistencia-qr-card').within(() => {
      // use existence checks to avoid intermittent clipping/overflow visibility issues
      cy.contains('2561458').should('exist'); // Group code
      cy.contains('Token: sima-qr-token-test-12345').should('exist');
      cy.get('img[alt="Codigo QR para registrar asistencia"]').should('have.attr', 'src').and('contain', 'data:image');
    });

    cy.screenshot('H42-codigo-qr-generado-exitoso');

    // Click the QR image to expand to fullscreen
    cy.get('button.asistencia-qr-visual').click();

    // Verify fullscreen modal is present
    cy.get('.asistencia-qr-fullscreen').should('exist');
    cy.get('.asistencia-qr-fullscreen').within(() => {
      cy.get('button.asistencia-qr-close-full').should('exist');
    });

    cy.screenshot('H42-codigo-qr-fullscreen');

    // Close fullscreen view (target specifically by class to avoid text collision with active method button)
    cy.get('button.asistencia-qr-close-full').click({ force: true });
    cy.get('.asistencia-qr-fullscreen').should('not.exist');

    // Toggle close QR card by clicking the method button again (forced click to handle layout height changes)
    cy.get('button.asistencia-method.qr').click({ force: true });
    cy.get('.asistencia-qr-card').should('not.exist');
  });

  it('Debe mostrar error si el backend falla al generar el token QR', () => {
    // Intercept QR generation call returning an error
    cy.intercept('POST', '**/api/educational-sessions/550/qr', {
      statusCode: 500,
      body: {
        success: false,
        message: 'No fue posible generar el token QR en el servidor.'
      }
    }).as('postGenerateQrFail');

    cy.loginInstructor();
    cy.visit('/instructor/asistencia');

    // Click the QR button
    cy.get('button.asistencia-method.qr').should('not.be.disabled').click();
    cy.wait('@postGenerateQrFail');

    // Verify error banner is visible with the backend error message
    cy.contains('No fue posible generar el token QR en el servidor.').should('be.visible');

    cy.screenshot('H42-error-generacion-qr');
  });
});
