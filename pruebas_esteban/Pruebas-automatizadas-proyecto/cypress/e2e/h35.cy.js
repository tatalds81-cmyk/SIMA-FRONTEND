describe('CP-H35 - Evaluar alerta por inasistencia', () => {
  beforeEach(() => {
    // 1. Interceptar endpoints del Dashboard para prevenir redirecciones 401 por logout
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

    // 2. Mockear Listado de Alertas
    cy.intercept('GET', '**/api/alerts*', (req) => {
      const { query } = req;
      
      const allAlerts = [
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
          id_alerta: 102,
          tipo_alerta: 'ASISTENCIAL',
          estado: 'ABIERTA',
          severidad: 'GRAVE',
          descripcion: 'El aprendiz acumuló 5 inasistencias en el trimestre sin justificación aprobada.',
          fecha_alerta: '2026-07-08T09:30:00.000Z',
          aprendiz: {
            usuario: {
              persona: {
                nombres: 'Carlos Andrés',
                apellidos: 'Ríos Castro',
                numero_documento: '1002345678'
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
        }
      ];

      // Simulación de filtros
      let filtered = allAlerts;
      if (query.severidad) {
        filtered = filtered.filter(a => a.severidad === query.severidad);
      }
      if (query.estado) {
        filtered = filtered.filter(a => a.estado === query.estado);
      }
      if (query.tipo_alerta) {
        filtered = filtered.filter(a => a.tipo_alerta === query.tipo_alerta);
      }

      req.reply({
        statusCode: 200,
        body: {
          data: {
            alerts: filtered,
            total: filtered.length
          }
        }
      });
    }).as('getAlertas');

    // 3. Mockear Detalle de una Alerta Específica
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
    }).as('getAlertaDetail');

    // 4. Mockear Listado de Grupos
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

  it('Debe mostrar la alerta de inasistencia cuando el aprendiz supera el umbral configurado (3 inasistencias consecutivas)', () => {
    cy.loginInstructor();
    cy.visit('/alertas/consultar');

    cy.wait('@getGroups');
    cy.wait('@getAlertas');

    cy.location('pathname').should('include', '/alertas');
    cy.get('h1.ca-page-title').should('contain.text', 'Consultar alertas');

    // Validar visualización de la alerta por 3 inasistencias
    cy.contains('Ana Sofia Pérez Gómez').should('be.visible');
    cy.contains('1001234567').should('be.visible');
    cy.contains('2561458').should('be.visible');
    cy.contains('Asistencial').should('be.visible');
    cy.contains('Moderada').should('be.visible');
    cy.contains('ABIERTA').should('be.visible');

    cy.screenshot('H35-alerta-asistencial-moderada');
  });

  it('Debe listar la alerta por 5 inasistencias acumuladas en el trimestre (Nivel Grave)', () => {
    cy.loginInstructor();
    cy.visit('/alertas/consultar');

    cy.wait('@getGroups');
    cy.wait('@getAlertas');

    // Validar visualización de la alerta por 5 inasistencias
    cy.contains('Carlos Andrés Ríos Castro').should('be.visible');
    cy.contains('1002345678').should('be.visible');
    cy.contains('Grave').should('be.visible');

    cy.screenshot('H35-alerta-asistencial-grave');
  });

  it('Debe filtrar las alertas por severidad y tipo de alerta', () => {
    cy.loginInstructor();
    cy.visit('/alertas/consultar');

    cy.wait('@getGroups');
    cy.wait('@getAlertas');

    // Seleccionar filtro de severidad: GRAVE (índice 1 en ConsultarAlertas.jsx)
    cy.get('select').eq(1).select('GRAVE');
    cy.contains('button', 'Buscar').click();
    cy.wait('@getAlertas');

    // Validar que solo se muestre la alerta Grave filtrada
    cy.contains('Carlos Andrés Ríos Castro').should('be.visible');
    cy.contains('Ana Sofia Pérez Gómez').should('not.exist');

    cy.screenshot('H35-alertas-filtradas-grave');
  });

  it('Debe abrir el modal con el detalle de la alerta al hacer clic en el botón de ver detalle', () => {
    cy.loginInstructor();
    cy.visit('/alertas/consultar');

    cy.wait('@getGroups');
    cy.wait('@getAlertas');

    // Hacer clic en el primer botón de ver detalle (Ana Sofia)
    cy.get('.ca-btn-accion').first().click();
    cy.wait('@getAlertaDetail');

    // Validar contenido del modal
    cy.get('.mcal-modal').should('exist');
    cy.get('.mcal-titulo').should('contain.text', 'Detalle de alerta #101');
    
    cy.get('.mcal-modal').within(() => {
      cy.contains('Ana Sofia Pérez Gómez').should('exist');
      cy.contains('1001234567').should('exist');
      cy.contains('El aprendiz acumuló 3 inasistencias consecutivas sin justificación aprobada.').should('exist');
      cy.contains('Sistema').should('exist');
    });

    cy.screenshot('H35-detalle-alerta-modal');
  });
});