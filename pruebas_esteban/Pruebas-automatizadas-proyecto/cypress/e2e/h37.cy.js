describe('CP-H37 - Conservar historial de alertas', () => {
  beforeEach(() => {
    // 1. Mocking Dashboard endpoints to prevent 401 logout redirects
    cy.intercept('GET', '**/api/educational-sessions*', {
      statusCode: 200,
      body: {
        data: []
      }
    }).as('getEducationalSessions');

    cy.intercept('GET', '**/api/notifications*', {
      statusCode: 200,
      body: {
        data: []
      }
    }).as('getNotifications');

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

    // 2. Mocking Alerts List including both open and closed (historic) alerts
    cy.intercept('GET', '**/api/alerts*', {
      statusCode: 200,
      body: {
        data: {
          alerts: [
            {
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
              }
            },
            {
              id_alerta: 99,
              tipo_alerta: 'CONVIVENCIAL',
              estado: 'CERRADA',
              severidad: 'GRAVE',
              descripcion: 'Incumplimiento reiterado de normas de convivencia en el ambiente.',
              fecha_alerta: '2026-06-25T14:20:00.000Z',
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
                id_usuario: 3,
                email: 'coordinador@test.com',
                persona: {
                  nombres: 'Coordinador',
                  apellidos: 'Académico'
                }
              }
            }
          ],
          total: 2
        }
      }
    }).as('getAlertsHistory');

    // 3. Mocking Detail of a Closed (historic) Alert
    cy.intercept('GET', '**/api/alerts/99', {
      statusCode: 200,
      body: {
        data: {
          id_alerta: 99,
          tipo_alerta: 'CONVIVENCIAL',
          estado: 'CERRADA',
          severidad: 'GRAVE',
          descripcion: 'Incumplimiento reiterado de normas de convivencia en el ambiente.',
          fecha_alerta: '2026-06-25T14:20:00.000Z',
          fecha_cierre: '2026-06-28T16:00:00.000Z',
          justificacion_cierre: 'Se dialogó con el aprendiz y se firmó acta de compromiso académico.',
          cerrada_por: 3,
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
            id_usuario: 3,
            email: 'coordinador@test.com',
            persona: {
              nombres: 'Coordinador',
              apellidos: 'Académico'
                }
              },
          responsableNombre: 'Coordinador Académico',
          alerta_observaciones: []
        }
      }
    }).as('getClosedAlertDetail');

    // 4. Mocking Groups
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

  it('Debe mostrar en la tabla tanto las alertas abiertas como las cerradas para reflejar el historial del aprendiz', () => {
    cy.loginInstructor();
    cy.visit('/alertas/consultar');

    cy.wait('@getGroups');
    cy.wait('@getAlertsHistory');

    // Verify both alerts exist in the list
    cy.contains('Ana Sofia Pérez Gómez').should('be.visible');
    
    // Active alert
    cy.contains('Asistencial').should('be.visible');
    cy.contains('Moderada').should('be.visible');
    cy.contains('ABIERTA').should('be.visible');

    // Closed (historic) alert
    cy.contains('Convivencial').should('be.visible');
    cy.contains('Grave').should('be.visible');
    cy.contains('CERRADA').should('be.visible');

    cy.screenshot('H37-listado-historial-alertas');
  });

  it('Debe abrir el detalle de una alerta cerrada y mostrar la justificación de cierre e historial en la línea de tiempo', () => {
    cy.loginInstructor();
    cy.visit('/alertas/consultar');

    cy.wait('@getGroups');
    cy.wait('@getAlertsHistory');

    // Click on the second alert (closed one, id 99) ver detalle button
    cy.get('.ca-btn-accion').eq(1).click();
    cy.wait('@getClosedAlertDetail');

    // Verify the detail modal structure
    cy.get('.mcal-modal').should('exist');
    cy.get('.mcal-titulo').should('contain.text', 'Detalle de alerta #99');

    cy.get('.mcal-modal').within(() => {
      // General Info (case-insensitive regex checks)
      cy.contains(/Ana Sofia Pérez Gómez/i).should('exist');
      cy.contains(/convivencial/i).should('exist');
      cy.contains(/cerrada/i).should('exist');
      cy.contains(/Incumplimiento reiterado de normas de convivencia en el ambiente/i).should('exist');
      
      // Historial / Timeline
      cy.contains(/Se dialogó con el aprendiz y se firmó acta de compromiso académico/i).should('exist');
      cy.contains(/Cerrada por: ID Usuario 3/i).should('exist');
      cy.contains(/abierta/i).should('exist');
      cy.contains(/Estado inicial de la alerta/i).should('exist');
    });

    cy.screenshot('H37-detalle-alerta-cerrada-historial');
  });
});
