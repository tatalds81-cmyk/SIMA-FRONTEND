describe('CP-H36 - Notificar alertas a usuarios responsables', () => {
  beforeEach(() => {
    // 1. Mocking Dashboard endpoints to prevent 401 logout redirects
    cy.intercept('GET', '**/api/educational-sessions*', {
      statusCode: 200,
      body: {
        data: []
      }
    }).as('getEducationalSessions');

    cy.intercept('GET', '**/api/dashboard/instructor/resumen*', {
      statusCode: 200,
      body: {
        data: {
          grupos_liderados: [],
          grupos_asignados: [],
          kpis: {
            total_observaciones_abiertas: 0
          }
        }
      }
    }).as('getResumen');

    // 2. Mocking Notifications list endpoint
    cy.intercept('GET', '**/api/notifications', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              mensaje: 'Nueva alerta por 3 inasistencias consecutivas para Ana Sofia Pérez Gómez',
              fecha: '2026-07-08T08:05:00.000Z',
              leida: false,
              tipo: 'AUTOMATICA',
              alertaId: 101
            },
            {
              id: 2,
              mensaje: 'Alerta por 5 inasistencias acumuladas registrada para Carlos Andrés Ríos Castro',
              fecha: '2026-07-08T09:35:00.000Z',
              leida: true,
              tipo: 'SISTEMA',
              alertaId: 102
            }
          ]
        }
      });
    }).as('getNotificationsList');

    // 3. Mocking marking single notification as read
    cy.intercept('PATCH', '**/api/notifications/1/read', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('patchReadSingle');

    // 4. Mocking marking all notifications as read
    cy.intercept('PATCH', '**/api/notifications/read-all', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('patchReadAll');

    // 5. Mocking associated alert detail query for navigation
    cy.intercept('GET', '**/api/alerts/101', {
      statusCode: 200,
      body: {
        data: {
          id_alerta: 101,
          tipo_alerta: 'ASISTENCIAL',
          estado: 'ABIERTA',
          severidad: 'MODERADA',
          descripcion: 'El aprendiz acumuló 3 inasistencias consecutivas sin justificación aprobada.',
          fecha_alerta: '2026-07-08T08:00:00.000Z',
          aprendiz: {
            usuario: {
              persona: {
                nombres: 'Ana Sofia',
                apellidos: 'Pérez Gómez',
                numero_documento: '1001234567'
              }
            }
          },
          grupo: {
            numero_ficha: '2561458',
            nombre: 'Grupo ADSO A'
          },
          usuario_creador: {
            id_usuario: 2,
            email: 'sistema@sima.sena.edu.co',
            persona: {
              nombres: 'Sistema',
              apellidos: 'Monitoreo'
            }
          },
          alerta_observaciones: []
        }
      }
    }).as('getAlertDetail');
  });

  it('Debe mostrar el listado de notificaciones indicando cuáles están sin leer', () => {
    cy.loginInstructor();
    cy.visit('/notificaciones');

    cy.wait('@getNotificationsList');

    // Verify title and description
    cy.get('h1').should('contain.text', 'Notificaciones');
    cy.contains('Gestiona los avisos y alertas de seguimiento (1 sin leer)').should('be.visible');

    // Verify the unread notification (has class 'unread' and displays 'Nuevo' badge)
    cy.get('.nt-item.unread').should('exist');
    cy.contains('Nueva alerta por 3 inasistencias consecutivas para Ana Sofia Pérez Gómez').should('be.visible');
    cy.contains('Nuevo').should('be.visible');

    // Verify the read notification (does not have class 'unread' and does not display 'Nuevo' badge)
    cy.contains('Alerta por 5 inasistencias acumuladas registrada para Carlos Andrés Ríos Castro').should('be.visible');
    cy.get('.nt-item').eq(1).should('not.have.class', 'unread');

    cy.screenshot('H36-listado-notificaciones');
  });

  it('Debe permitir marcar todas las notificaciones como leídas', () => {
    cy.loginInstructor();
    cy.visit('/notificaciones');

    cy.wait('@getNotificationsList');

    // Verify "Marcar todas como leídas" button is active and click it
    cy.get('.nt-btn-secondary').should('not.be.disabled').click();
    cy.wait('@patchReadAll');

    // Verify that the count changes to 0 and all items lose the unread/Nuevo styling
    cy.contains('Gestiona los avisos y alertas de seguimiento (0 sin leer)').should('be.visible');
    cy.get('.nt-item.unread').should('not.exist');
    cy.contains('Nuevo').should('not.exist');

    cy.screenshot('H36-marcar-todas-leidas');
  });

  it('Debe marcar una notificación como leída al hacer clic en ella y redirigir al detalle de la alerta', () => {
    cy.loginInstructor();
    cy.visit('/notificaciones');

    cy.wait('@getNotificationsList');

    // Click on the unread notification (Ana Sofia)
    cy.contains('Nueva alerta por 3 inasistencias consecutivas para Ana Sofia Pérez Gómez').click();
    cy.wait('@patchReadSingle');
    cy.wait('@getAlertDetail');

    // Check that we navigate to the alert detail view
    cy.location('pathname').should('include', '/alertas/101');
    cy.contains('Detalle de alerta #101').should('be.visible');
    cy.contains('Ana Sofia Pérez Gómez').should('be.visible');

    cy.screenshot('H36-detalle-alerta-redirigido');
  });
});
