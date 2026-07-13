describe('CP-H32 - Consultar alertas según rol y alcance', () => {
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

    // Mock groups list (assigned groups for the instructor/coordinator)
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

    // Mock apprentices list for group 1 (used in search drop-down)
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
  });

  it('Debe permitir al instructor consultar y filtrar sus alertas con diferentes criterios', () => {
    // Mock the initial get alert call with mock entries
    cy.intercept('GET', '**/api/alerts*', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          data: {
            alerts: [
              {
                id_alerta: 101,
                tipo_alerta: 'ASISTENCIAL',
                estado: 'ABIERTA',
                severidad: 'MODERADA',
                descripcion: 'Inasistencias consecutivas.',
                fechaCreacion: '2026-07-08T08:00:00.000Z',
                aprendiz: {
                  nombre: 'Carlos Andrés Mendoza Pérez',
                  documento: '1001234567'
                },
                grupo: {
                  codigo: '2561458'
                },
                responsable: {
                  nombre: 'Sistema'
                }
              }
            ],
            total: 1,
            pagina: 1,
            total_paginas: 1
          }
        }
      });
    }).as('getAlertsList');

    cy.loginInstructor();
    
    cy.window().then((win) => {
      win.localStorage.setItem('rol', 'INSTRUCTOR_LIDER');
    });

    cy.visit('/alertas/consultar');

    cy.wait('@getGroups');
    cy.wait('@getAlertsList');

    // 1. Verify list elements are visible
    cy.contains('Carlos Andrés Mendoza Pérez').should('exist');
    cy.contains('2561458').should('exist');
    cy.contains('Asistencial').should('exist');
    cy.contains('Moderada').should('exist');
    cy.contains('ABIERTA').should('exist');
    cy.contains('Sistema').should('exist');

    // 2. Apply Filters and check API query parameters
    cy.intercept('GET', '**/api/alerts*', (req) => {
      const { query } = req;
      expect(query.id_grupo).to.eq('1');
      expect(query.id_aprendiz).to.eq('12');
      expect(query.estado).to.eq('ABIERTA');
      expect(query.severidad).to.eq('MODERADA');
      expect(query.tipo_alerta).to.eq('ASISTENCIAL');
      expect(query.fecha_desde).to.eq('2026-07-01');
      expect(query.fecha_hasta).to.eq('2026-07-10');

      req.reply({
        statusCode: 200,
        body: {
          data: {
            alerts: [
              {
                id_alerta: 101,
                tipo_alerta: 'ASISTENCIAL',
                estado: 'ABIERTA',
                severidad: 'MODERADA',
                descripcion: 'Inasistencias consecutivas.',
                fechaCreacion: '2026-07-08T08:00:00.000Z',
                aprendiz: {
                  nombre: 'Carlos Andrés Mendoza Pérez',
                  documento: '1001234567'
                },
                grupo: {
                  codigo: '2561458'
                },
                responsable: {
                  nombre: 'Sistema'
                }
              }
            ],
            total: 1
          }
        }
      });
    }).as('getFilteredAlerts');

    // Select Group
    cy.get('select.ca-select').eq(3).select('1'); // Group selector (4th select index 3)
    cy.wait('@getApprentices');

    // Select Apprentice
    cy.get('input.ca-input--search').type('Carlos');
    cy.get('.ca-aprendiz-option').first().click();

    // Select Status, Severity, Type
    cy.get('select.ca-select').eq(0).select('ABIERTA');    // Estado (index 0)
    cy.get('select.ca-select').eq(1).select('MODERADA');   // Severidad (index 1)
    cy.get('select.ca-select').eq(2).select('ASISTENCIAL'); // Tipo (index 2)

    // Select Dates
    cy.get('input[type="date"]').eq(0).type('2026-07-01'); // Desde
    cy.get('input[type="date"]').eq(1).type('2026-07-10'); // Hasta

    // Submit search
    cy.contains('button', 'Buscar').click();
    cy.wait('@getFilteredAlerts');

    cy.contains('Carlos Andrés Mendoza Pérez').should('exist');
    cy.screenshot('H32-alertas-filtradas-instructor');
  });

  it('Debe mostrar un mensaje claro cuando no existan alertas registradas', () => {
    cy.intercept('GET', '**/api/alerts*', {
      statusCode: 200,
      body: {
        data: {
          alerts: [],
          total: 0
        }
      }
    }).as('getEmptyAlerts');

    cy.loginInstructor();
    cy.visit('/alertas/consultar');

    cy.wait('@getGroups');
    cy.wait('@getEmptyAlerts');

    // Check empty state message
    cy.contains('No se encontraron alertas').should('exist');
    cy.contains('Prueba ajustando los filtros aplicados').should('exist');
    cy.screenshot('H32-alertas-estado-vacio');
  });

  it('Debe permitir al Coordinador ver las alertas bajo su alcance', () => {
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

    // Mock initial coordinator dashboard alerts summary (limit 50)
    cy.intercept('GET', '**/api/alerts?limit=50', {
      statusCode: 200,
      body: {
        data: {
          alerts: [
            {
              id_alerta: 105,
              tipo_alerta: 'CONVIVENCIAL',
              estado: 'ABIERTA',
              severidad: 'GRAVE',
              descripcion: 'Comportamiento indebido.',
              fechaCreacion: '2026-07-08T10:00:00.000Z',
              aprendizNombre: 'Juan Pérez',
              aprendizDocumento: '9876543210',
              grupo: {
                id_grupo: 1,
                numero_ficha: '2561458',
                codigo: '2561458'
              },
              responsableNombre: 'Instructor Prueba'
            }
          ],
          total: 1
        }
      }
    }).as('getCoordinatorAlertsSummary');

    // Mock group detailed alerts query when coordinator selects a group
    cy.intercept('GET', '**/api/alerts?id_grupo=*', {
      statusCode: 200,
      body: {
        data: {
          alerts: [
            {
              id_alerta: 105,
              tipo_alerta: 'CONVIVENCIAL',
              estado: 'ABIERTA',
              severidad: 'GRAVE',
              descripcion: 'Comportamiento indebido.',
              fechaCreacion: '2026-07-08T10:00:00.000Z',
              aprendizNombre: 'Juan Pérez',
              aprendizDocumento: '9876543210',
              grupo: {
                codigo: '2561458'
              },
              responsableNombre: 'Instructor Prueba'
            }
          ],
          total: 1
        }
      }
    }).as('getCoordinatorGroupAlerts');

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
    cy.wait('@getCoordinatorAlertsSummary');

    // Verify Ficha 2561458 summary is loaded
    cy.contains('2561458').should('exist');

    // Click "Ver aprendices" to load detailed group alerts list
    cy.contains('button', 'Ver aprendices').click();
    cy.wait('@getCoordinatorGroupAlerts');

    // Confirm that the coordinator can query alerts under their scope
    cy.contains('Juan Pérez').should('exist');
    cy.contains('2561458').should('exist');
    cy.contains('Convivencial').should('exist');
    cy.contains('Grave').should('exist');
    cy.screenshot('H32-alertas-vista-coordinador');
  });
});
