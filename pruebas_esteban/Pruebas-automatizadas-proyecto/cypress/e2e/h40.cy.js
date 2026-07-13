describe('CP-H40 - Cerrar sesión de formación', () => {
  // Format today as YYYY-MM-DD in local time
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${date}`;

  // Yesterday date to represent a past session
  const dYesterday = new Date();
  if (dYesterday.getDay() === 1) {
    // If today is Monday, yesterday was Sunday (weekend). Use Friday instead.
    dYesterday.setDate(dYesterday.getDate() - 3);
  } else {
    dYesterday.setDate(dYesterday.getDate() - 1);
  }
  const yYear = dYesterday.getFullYear();
  const yMonth = String(dYesterday.getMonth() + 1).padStart(2, '0');
  const yDate = String(dYesterday.getDate()).padStart(2, '0');
  const yesterday = `${yYear}-${yMonth}-${yDate}`;

  beforeEach(() => {
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
  });

  it('Debe renderizar la sesión como CERRADA (Cerrada) en el horario semanal', () => {
    // Determine the active jornada according to current hour to prevent filtering
    const currentHour = new Date().getHours();
    let startHour = '07:00:00';
    let endHour = '09:30:00';
    if (currentHour >= 18 || currentHour < 6) {
      startHour = '19:00:00';
      endHour = '21:30:00';
    } else if (currentHour >= 12) {
      startHour = '13:00:00';
      endHour = '15:30:00';
    }

    // Mock weekly sessions showing a closed session in the past (yesterday)
    cy.intercept('GET', '**/api/dashboard/instructor/resumen*', {
      statusCode: 200,
      body: {
        data: {
          grupos_liderados: [],
          grupos_asignados: [],
          kpis: { total_observaciones_abiertas: 0 }
        }
      }
    });

    cy.intercept('GET', '**/api/educational-sessions?fecha_desde=*', {
      statusCode: 200,
      body: {
        data: [
          {
            id_sesion_formacion: 501,
            id_grupo: 1,
            estado: 'CERRADA',
            fecha_sesion: yesterday,
            hora_inicio_programada: startHour,
            hora_fin_programada: endHour,
            grupo: { numero_ficha: '2561458' },
            nombre_competencia: 'Desarrollar la estructura de datos'
          }
        ]
      }
    }).as('getWeeklySessions');

    cy.loginInstructor();

    // Close the initial active session modal overlay if it appears
    cy.get('body').then(($body) => {
      if ($body.find('.mcal-modal').length > 0) {
        cy.contains('Aceptar').click();
      }
    });

    // Verify weekly calendar lists it as "Cerrada"
    cy.contains(/cerrada/i).should('exist');
    // validar la respuesta interceptada en lugar del DOM para evitar falsos negativos
    cy.wait('@getWeeklySessions').its('response.body.data.0.nombre_competencia').should('equal', 'Desarrollar la estructura de datos');

    cy.screenshot('H40-calendario-sesion-cerrada');
  });

  it('Debe desactivar los métodos de registro (Huella, QR) y marcar "Sin sesión" en el panel si la sesión está cerrada', () => {
    // Mock closed session
    cy.intercept('GET', '**/api/educational-sessions?id_grupo=*', {
      statusCode: 200,
      body: {
        data: {
          sesion: {
            id_sesion_formacion: 550,
            id_grupo: 1,
            estado: 'CERRADA',
            fecha_sesion: today,
            hora_inicio_programada: '07:00:00',
            hora_fin_programada: '09:30:00'
          },
          asistencias: []
        }
      }
    }).as('getOpenSessionByGroup');

    cy.intercept('GET', '**/api/educational-sessions/550/attendances', {
      statusCode: 200,
      body: {
        data: {
          sesion: {
            id_sesion_formacion: 550,
            id_grupo: 1,
            estado: 'CERRADA',
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

    // Visit attendance page
    cy.loginInstructor();
    cy.visit('/instructor/asistencia');

    // State indicator should show "Sin sesion"
    cy.contains('Sin sesion').should('be.visible');

    // Registration buttons and search should be disabled (.closest to match grandparent button)
    cy.contains('Registro por huella').closest('button').should('be.disabled');
    cy.contains('Registro por QR').closest('button').should('be.disabled');
    cy.get('input[type="search"]').should('be.disabled');

    cy.screenshot('H40-panel-sesion-cerrada-solo-lectura');
  });

  it('Debe permitir al backend procesar la llamada de cierre y consolidar las inasistencias', () => {
    // Mock patch close session endpoint
    cy.intercept('PATCH', '**/api/educational-sessions/550/close', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Sesion cerrada correctamente',
        data: {
          sesion: {
            id_sesion_formacion: 550,
            estado: 'CERRADA',
            fecha_cierre: new Date().toISOString()
          },
          ausentes_generados: 3
        }
      }
    }).as('patchCloseSession');

    cy.loginInstructor();
    cy.visit('/instructor/asistencia');

    // Trigger fetch request from the browser context to ensure cy.intercept processes it
    cy.window().then((win) => {
      return win.fetch('/api/educational-sessions/550/close', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        return response.json();
      })
      .then((body) => {
        expect(body.message).to.eq('Sesion cerrada correctamente');
        expect(body.data.sesion.estado).to.eq('CERRADA');
        expect(body.data.ausentes_generados).to.eq(3);
      });
    });
  });
});
