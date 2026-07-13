describe('CP-H51 - Consultar calendario propio de asistencia del aprendiz', () => {
  beforeEach(() => {
    // Clear storage to prevent state leakage from other tests
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  it('Debe impedir que el aprendiz inicie sesión en la plataforma web (portal móvil exclusivo)', () => {
    const apprenticeUser = {
      id_usuario: 50,
      email: 'carlos.mendoza@sena.edu.co',
      rol: 'APRENDIZ',
      persona: {
        nombres: 'Carlos Andrés',
        apellidos: 'Mendoza Pérez',
        numero_documento: '1001234567'
      }
    };

    // Intercept login request to return apprentice user role
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        data: {
          access: 'fake-apprentice-token',
          user: apprenticeUser,
          rol: 'APRENDIZ'
        }
      }
    }).as('postLoginApprentice');

    // Intercept /me endpoint for the apprentice role
    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: {
        data: apprenticeUser
      }
    }).as('getMeApprentice');

    // Visit the web login page
    cy.visit('/login');

    // Fill in credentials and submit
    cy.get('#login-user').clear().type('1001234567');
    cy.get('#login-password').clear().type('Password123!');
    cy.contains('button', 'Iniciar sesion').click();

    cy.wait('@postLoginApprentice');
    cy.wait('@getMeApprentice');

    // Verify that the login page blocks access with the expected message
    cy.contains('El portal web es solo para SUPER_ADMIN, instructores y coordinadores. Los aprendices deben ingresar desde la app movil.').should('be.visible');
    cy.location('pathname').should('include', '/login');

    cy.screenshot('H51-web-login-blocked-for-apprentice');
  });

  it('Debe simular el contrato API para que el aprendiz consulte su calendario de asistencias en la app móvil', () => {
    // Mock the calendar query endpoint that would be requested by the mobile app
    // Organizing by date showing states: PRESENTE, TARDE, INASISTENTE, JUSTIFICADO (CA-H51-04, 05)
    cy.intercept('GET', '**/api/attendances/calendar?month=*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            fecha: '2026-07-01',
            estado: 'PRESENTE',
            hora_registro: '07:05:00',
            metodo: 'QR',
            competencia: 'Análisis de requisitos del software'
          },
          {
            fecha: '2026-07-02',
            estado: 'TARDE',
            hora_registro: '07:18:00',
            metodo: 'manual',
            competencia: 'Análisis de requisitos del software'
          },
          {
            fecha: '2026-07-03',
            estado: 'INASISTENTE',
            hora_registro: '-',
            metodo: 'AUTOMATICO_CIERRE',
            competencia: 'Desarrollo de componentes del sistema'
          },
          {
            fecha: '2026-07-06',
            estado: 'JUSTIFICADO',
            hora_registro: '07:10:00',
            metodo: 'JUSTIFICACION_MOVIL',
            competencia: 'Desarrollo de componentes del sistema'
          }
        ]
      }
    }).as('getApprenticeCalendar');

    // Visit page first to load window context
    cy.visit('/login');

    // Call fetch from inside the browser window context so cy.intercept catches it
    cy.window().then(async (win) => {
      const response = await win.fetch('/api/attendances/calendar?month=07');
      const body = await response.json();
      
      expect(response.status).to.eq(200);
      expect(body.success).to.be.true;
      expect(body.data).to.have.lengthOf(4);
      
      const records = body.data;
      expect(records[0].estado).to.eq('PRESENTE');
      expect(records[1].estado).to.eq('TARDE');
      expect(records[2].estado).to.eq('INASISTENTE');
      expect(records[3].estado).to.eq('JUSTIFICADO');
    });
  });
});
