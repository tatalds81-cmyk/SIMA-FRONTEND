describe('CP-H39 - Abrir o iniciar sesión de formación manualmente', () => {
  // Format today as YYYY-MM-DD in local time
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${date}`;

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

  it('Debe mostrar la ventana emergente de sesión activa y permitir abrir la sesión manualmente dentro del rango de tiempo permitido', () => {
    // Session starting 5 minutes ago (within the 10 minutes tolerance)
    const nowTime = new Date();
    const mockStart = new Date(nowTime.getTime() - 5 * 60 * 1000); 
    const mockEnd = new Date(nowTime.getTime() + 120 * 60 * 1000); 
    const startStr = mockStart.toTimeString().split(' ')[0].slice(0, 5);
    const endStr = mockEnd.toTimeString().split(' ')[0].slice(0, 5);

    // Mock dashboard resume
    cy.intercept('GET', '**/api/dashboard/instructor/resumen*', {
      statusCode: 200,
      body: {
        data: {
          grupos_liderados: [
            {
              id_grupo: 1,
              numero_ficha: '2561458',
              programa_formacion: { nombre_programa: 'Análisis y Desarrollo de Software' }
            }
          ],
          grupos_asignados: [],
          kpis: { total_observaciones_abiertas: 0 }
        }
      }
    }).as('getResumen');

    // Mock scheduled sessions for today
    cy.intercept('GET', '**/api/educational-sessions?fecha_desde=*', {
      statusCode: 200,
      body: {
        data: [
          {
            id_sesion_formacion: 550,
            id_grupo: 1,
            estado: 'PROGRAMADA',
            fecha_sesion: today,
            hora_inicio_programada: startStr,
            hora_fin_programada: endStr,
            grupo: { numero_ficha: '2561458' },
            nombre_competencia: 'Desarrollar la estructura de datos'
          }
        ]
      }
    }).as('getWeeklySessions');

    // Mock schedule for the group
    const numeroDiaHoy = new Date().getDay();
    const diasSemanaES = ["", "lunes", "martes", "miercoles", "jueves", "viernes", ""];
    const diaHoy = diasSemanaES[numeroDiaHoy] || "lunes";

    cy.intercept('GET', '**/api/educational-schedules/group/*', {
      statusCode: 200,
      body: {
        data: [
          {
            id_horario: 10,
            id_grupo_trimestre: 101,
            id_instructor: 77,
            dia_semana: diaHoy,
            hora_inicio: startStr,
            hora_fin: endStr,
            bloque_jornada: { nombre_bloque: 'Bloque 1' }
          }
        ]
      }
    }).as('getSchedules');

    cy.intercept('GET', '**/api/instructor-groups/grupo/*', {
      statusCode: 200,
      body: { data: [] }
    });

    // Mock opening manual session endpoints
    cy.intercept('GET', '**/api/educational-sessions?id_grupo=*', {
      statusCode: 200,
      body: {
        data: []
      }
    }).as('getOpenSessionByGroup');

    cy.intercept('PATCH', '**/api/educational-sessions/550/open', {
      statusCode: 200,
      body: {
        data: {
          id_sesion_formacion: 550,
          id_grupo: 1,
          estado: 'ABIERTA',
          fecha_sesion: today,
          hora_inicio_programada: startStr,
          hora_fin_programada: endStr
        }
      }
    }).as('patchOpenSession');

    cy.intercept('GET', '**/api/educational-sessions/550/attendances', {
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

    // Visit dashboard
    cy.loginInstructor();

    // The modal overlay should appear automatically
    cy.get('.asistencia-session-overlay').should('be.visible');
    cy.contains('Ficha 2561458').should('be.visible');
    cy.contains('Ir a asistencia').should('be.visible');

    // Click "Ir a asistencia" to open session manually
    cy.contains('Ir a asistencia').click();

    // Verify open session call and navigation
    cy.wait('@patchOpenSession');
    cy.location('pathname').should('include', '/instructor/asistencia');

    cy.screenshot('H39-apertura-manual-exitosa');
  });

  it('No debe mostrar la ventana emergente de sesión activa si la sesión se encuentra fuera del rango de tolerancia', () => {
    // Session starting 2 hours in the future (outside the 10 min tolerance)
    const nowTime = new Date();
    const mockStart = new Date(nowTime.getTime() + 120 * 60 * 1000); 
    const mockEnd = new Date(nowTime.getTime() + 240 * 60 * 1000); 
    const startStr = mockStart.toTimeString().split(' ')[0].slice(0, 5);
    const endStr = mockEnd.toTimeString().split(' ')[0].slice(0, 5);

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
            id_sesion_formacion: 551,
            id_grupo: 1,
            estado: 'PROGRAMADA',
            fecha_sesion: today,
            hora_inicio_programada: startStr,
            hora_fin_programada: endStr,
            grupo: { numero_ficha: '2561458' },
            nombre_competencia: 'Desarrollar la estructura de datos'
          }
        ]
      }
    }).as('getWeeklySessionsFuture');

    cy.loginInstructor();

    // Active session modal should NOT be visible
    cy.get('.asistencia-session-overlay').should('not.exist');
    cy.get('.dashboard-welcome').should('be.visible');

    cy.screenshot('H39-sesion-fuera-tolerancia-no-modal');
  });
});
