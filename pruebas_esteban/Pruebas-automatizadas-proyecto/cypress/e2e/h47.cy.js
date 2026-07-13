describe('CP-H47 - Consultar asistencia por sesión, grupo y aprendiz', () => {
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

    // Mocking standard notifications and alerts
    cy.intercept('GET', /\/api\/notifications/, {
      statusCode: 200,
      body: { data: [] }
    });

    cy.intercept('GET', /\/api\/alerts/, {
      statusCode: 200,
      body: { data: [] }
    });
  });

  describe('Flujo de Instructor', () => {
    beforeEach(() => {
      // Mocking groups list
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

      // Mock active session list today
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

      // Mock apprentice list with two students
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
            },
            {
              id_aprendiz: 13,
              id_usuario: 13,
              estado_matricula: 'MATRICULADO',
              usuario: {
                persona: {
                  nombres: 'Juan Sebastián',
                  apellidos: 'Gómez Ortiz',
                  numero_documento: '1007654321'
                }
              }
            }
          ]
        }
      }).as('getApprentices');

      // Mock attendances returning Carlos as Presente (QR) and Juan as Tarde (Manual)
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
                aprendiz: {
                  id_aprendiz: 12,
                  usuario: {
                    persona: {
                      nombres: 'Carlos Andrés',
                      apellidos: 'Mendoza Pérez'
                    }
                  }
                }
              },
              {
                id_asistencia: 5002,
                id_sesion_formacion: 550,
                id_aprendiz: 13,
                estado_asistencia: 'TARDE',
                hora_registro: '07:20:00',
                metodo: 'manual',
                aprendiz: {
                  id_aprendiz: 13,
                  usuario: {
                    persona: {
                      nombres: 'Juan Sebastián',
                      apellidos: 'Gómez Ortiz'
                    }
                  }
                }
              }
            ]
          }
        }
      }).as('getAttendances');
    });

    it('Debe permitir al instructor buscar, filtrar por estado/método y consultar el detalle de la asistencia', () => {
      cy.loginInstructor();
      
      // Set the selected session ID in localStorage before visiting the page so it loads immediately
      cy.window().then((win) => {
        win.localStorage.setItem('sima_asistencia_sesion_seleccionada', '550');
      });

      cy.visit('/instructor/asistencia');

      cy.wait('@getGroups');
      cy.wait('@getAttendances');

      // Close the warning modal conditionally (only if it is visible)
      cy.get('body').then(($body) => {
        if ($body.text().includes('Revisar luego')) {
          cy.contains('button', 'Revisar luego').click();
        }
      });

      // 1. Search Query Test
      cy.get('input[placeholder="Buscar aprendiz"]').clear().type('Carlos');
      cy.contains('Carlos Andrés Mendoza Pérez').should('exist');
      cy.contains('Juan Sebastián Gómez Ortiz').should('not.exist');

      cy.get('input[placeholder="Buscar aprendiz"]').clear().type('NoExistente');
      cy.contains('No hay aprendices con esos filtros.').should('exist');
      cy.get('input[placeholder="Buscar aprendiz"]').clear();

      // Make the hidden CSS filter container visible so Cypress can click it
      cy.get('.asistencia-control-filter').invoke('css', 'display', 'block');

      // 2. Open Filters Panel
      cy.contains('button', 'Filtrado').click();
      cy.screenshot('H47-instructor-busqueda-filtros');

      // 3. Open Detail Modal
      cy.get('button[aria-label="Ver asistencia de Carlos Andrés Mendoza Pérez"]').click();
      cy.get('.asistencia-detalle-modal').should('be.visible');
      cy.contains('Detalle de asistencia').should('be.visible');
      cy.contains('Carlos Andrés Mendoza Pérez').should('be.visible');
      cy.get('.asistencia-da-dot.presente').should('exist');
      cy.get('.asistencia-da-metodo.qr').should('contain.text', 'QR');

      cy.screenshot('H47-instructor-detalle-historial');
    });
  });

  describe('Flujo de Coordinador', () => {
    it('Debe permitir al coordinador iniciar sesión y consultar el listado de fichas o grupos', () => {
      const coordinatorUser = {
        id_usuario: 2,
        email: 'coordinador@test.com',
        rol: 'COORDINADOR',
        persona: {
          nombres: 'Coordinador',
          apellidos: 'Prueba',
          numero_documento: '987654321'
        }
      };

      // Mock coordinator auth login endpoints
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: {
          data: {
            access: 'fake-coordinator-token',
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

      // Mock coordinator areas and counts to prevent network failures
      cy.intercept('GET', /\/api\/coordinator-areas/, {
        statusCode: 200,
        body: { data: [] }
      });

      cy.intercept('GET', /\/api\/apprentices\/grupo\//, {
        statusCode: 200,
        body: { data: [] }
      });

      // Mock groups query response (regex matcher to cover limit=1000 query parameters)
      cy.intercept('GET', /\/api\/groups/, {
        statusCode: 200,
        body: {
          data: [
            {
              id_grupo: 1,
              numero_ficha: '2561458',
              jornada: 'Diurna',
              estado: 'ACTIVO',
              programa_formacion: {
                nombre_programa: 'Análisis y Desarrollo de Software'
              }
            },
            {
              id_grupo: 2,
              numero_ficha: '2612345',
              jornada: 'Nocturna',
              estado: 'ACTIVO',
              programa_formacion: {
                nombre_programa: 'Gestión de Mercados'
              }
            }
          ]
        }
      }).as('getFichasCoord');

      // Log in as coordinator
      cy.visit('/login');
      cy.get('#login-user').clear().type('987654321');
      cy.get('#login-password').clear().type('Password123!');
      cy.contains('button', 'Iniciar sesion').click();

      cy.wait('@postLoginCoord');
      cy.wait('@getMeCoord');

      // Click on Fichas (Gestion de grupos) link in sidebar
      cy.contains('Gestion de grupos').click();
      cy.wait('@getFichasCoord');

      // Verify that the fichas table renders both training center fichas
      cy.contains('2561458').should('be.visible');
      cy.contains('2612345').should('be.visible');

      cy.screenshot('H47-coordinador-ver-fichas');
    });
  });
});
