describe('CP-H31 - Crear alerta manual', () => {
  beforeEach(() => {
    // Clear storage to prevent state leakage from other tests
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    // Mock general notifications
    cy.intercept('GET', '**/api/notifications*', {
      statusCode: 200,
      body: { data: [] }
    });

    // Mock initial alerts list
    cy.intercept('GET', '**/api/alerts*', {
      statusCode: 200,
      body: {
        data: {
          alerts: [],
          total: 0
        }
      }
    }).as('getInitialAlerts');

    // Mock groups list
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

    // Mock apprentices list for group 1
    cy.intercept('GET', '**/api/apprentices/grupo/1*', {
      statusCode: 200,
      body: {
        data: {
          aprendices: [
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
      }
    }).as('getApprentices');

    // Mock open observations for apprentice 12
    cy.intercept('GET', '**/api/observations/apprentice/12*', {
      statusCode: 200,
      body: {
        data: [
          {
            id_observacion: 901,
            tipo_observacion: 'ACADEMICA',
            severidad: 'LEVE',
            descripcion: 'El aprendiz no entregó la actividad de diseño de interfaces.',
            createdAt: '2026-07-10T14:00:00.000Z',
            autor: 'Instructor Prueba'
          }
        ]
      }
    }).as('getObservations');
  });

  it('Debe validar campos obligatorios y permitir la creación exitosa de una alerta manual con severidad CRITICA por un Instructor', () => {
    cy.loginInstructor();
    
    // Set role to INSTRUCTOR_LIDER to enable creation button
    cy.window().then((win) => {
      win.localStorage.setItem('rol', 'INSTRUCTOR_LIDER');
    });

    cy.visit('/alertas/consultar');

    cy.wait('@getGroups');
    cy.wait('@getInitialAlerts');

    // 1. Open the manual alert modal
    cy.contains('button', 'Nueva alerta manual').click();
    cy.get('.mcal-modal').should('exist');

    // 2. Submit form empty to test validations
    cy.get('.mcal-btn-enviar').click();
    cy.contains('Selecciona un grupo').should('exist');
    cy.contains('Selecciona un aprendiz').should('exist');
    cy.contains('Selecciona el tipo').should('exist');
    cy.contains('Selecciona la severidad').should('exist');
    cy.contains('La descripcion es obligatoria').should('exist');

    // 3. Fill Group
    cy.get('select.mcal-select').first().select('1'); // Selects group 1
    cy.wait('@getApprentices');

    // 4. Search and Select Apprentice
    cy.get('input.mcal-input').first().type('Carlos');
    cy.get('.mcal-dropdown-item').first().click();
    cy.wait('@getObservations');

    // 5. Select Observation checkbox (using force: true for styled hidden inputs)
    cy.get('.mcal-observacion-item input[type="checkbox"]').first().check({ force: true });

    // 6. Select Type and Severity (Testing CRITICA severity support)
    cy.get('select.mcal-select').eq(1).select('OBSERVACIONES_RECURRENTES');
    cy.get('select.mcal-select').eq(2).select('CRITICA');

    // 7. Test Description Length validation (< 20 characters)
    cy.get('textarea.mcal-textarea').type('Corta');
    cy.get('.mcal-btn-enviar').click();
    cy.contains('Minimo 20 caracteres').should('exist');

    // 8. Submit successfully (>= 20 characters)
    cy.intercept('POST', '**/api/alerts/from-observations', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id_alerta: 1001,
          tipo_alerta: 'OBSERVACIONES_RECURRENTES',
          severidad: 'CRITICA',
          estado: 'ABIERTA'
        }
      }
    }).as('postCreateAlert');

    cy.get('textarea.mcal-textarea').clear().type('El aprendiz muestra bajo rendimiento recurrente y desacato a las entregas académicas.');
    cy.get('.mcal-btn-enviar').click();

    cy.wait('@postCreateAlert');
    cy.contains('Alerta registrada correctamente').should('exist');

    // Wait for modal to close automatically after success timeout
    cy.get('.mcal-modal').should('not.exist');
    cy.screenshot('H31-alerta-manual-creada-exito');
  });

  it('Debe ocultar el botón de nueva alerta manual a usuarios con rol de Coordinador', () => {
    const coordinatorUser = {
      id_usuario: 2,
      email: 'coordinator@test.com',
      rol: 'COORDINADOR',
      persona: {
        nombres: 'Coordinador',
        apellidos: 'Prueba',
        numero_documento: '987654321'
      }
    };

    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        data: {
          access: 'fake-coord-token',
          user: coordinatorUser,
          rol: 'COORDINADOR'
        }
      }
    }).as('postLoginCoord');

    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: {
        data: coordinatorUser
      }
    }).as('getMeCoord');

    cy.visit('/login');
    cy.get('#login-user').clear().type('987654321');
    cy.get('#login-password').clear().type('Password123!');
    cy.contains('button', 'Iniciar sesion').click();
    cy.wait('@postLoginCoord');
    cy.wait('@getMeCoord');
    
    cy.window().then((win) => {
      win.localStorage.setItem('rol', 'COORDINADOR');
    });

    cy.visit('/alertas/consultar');

    cy.wait('@getGroups');
    cy.wait('@getInitialAlerts');

    // Verify that the Coordinator cannot see the manual creation button
    cy.contains('button', 'Nueva alerta manual').should('not.exist');
    cy.screenshot('H31-nueva-alerta-bloqueada-coordinador');
  });
});
