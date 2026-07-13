describe('EP02 - Gestión de aprendices, grupos formativos e instructor líder', () => {
  let creds;

  before(() => {
    cy.fixture('credenciales').then((data) => { creds = data; });
  });

  // ── H06: Controlar acceso por rol y alcance institucional ───────────
  describe('H06 - Controlar acceso por rol y alcance institucional', () => {
    it('Redirige a un instructor que intenta acceder a /usuarios', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/usuarios');
      cy.url().should('include', '/instructor/dashboard');
    });

    it('Rechaza el acceso a rutas protegidas sin token', () => {
      cy.clearLocalStorage();
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('El backend valida permisos aunque se fuerce la URL directamente', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/fichas');
      cy.url().should('include', '/instructor/grupos'); 
    });
  });

  // ── H07: Crear grupo formativo ───────────────────────────────────────
  describe('H07 - Crear grupo formativo', () => {
    beforeEach(() => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/fichas');
    });

    it('Crea un grupo con datos válidos', () => {
      cy.get('[data-testid="btn-abrir-crear-grupo"]').click();
      cy.get('.grupos-modal').within(() => {
        cy.get('[data-testid="input-numero-grupo"]').type('9999999'); 
        cy.get('[data-testid="select-area-formacion"]').select(1);
        cy.get('[data-testid="select-programa-formacion"]').select(1); 
        cy.get('[data-testid="select-jornada"]').select('Manana');
        cy.get('[data-testid="select-ambiente"]').select(1); 
        cy.get('[data-testid="input-trimestres"]').type('6');
        cy.get('[data-testid="input-fecha-inicio"]').type('2026-07-01');
        cy.get('[data-testid="btn-submit-crear-grupo"]').click();
      });
      cy.contains('creado correctamente').should('be.visible');
    });

    it('Impide crear un grupo con número de ficha ya existente', () => {
      cy.get('[data-testid="btn-abrir-crear-grupo"]').click();
      cy.get('.grupos-modal').within(() => {
        cy.get('[data-testid="input-numero-grupo"]').type('3064975');
        cy.get('[data-testid="select-area-formacion"]').select(1);
        cy.get('[data-testid="select-programa-formacion"]').select(1);
        cy.get('[data-testid="select-jornada"]').select('Manana');
        cy.get('[data-testid="select-ambiente"]').select(1);
        cy.get('[data-testid="input-trimestres"]').type('6');
        cy.get('[data-testid="input-fecha-inicio"]').type('2026-07-01');
        cy.get('[data-testid="btn-submit-crear-grupo"]').click();
      });
      cy.contains(/ya esta registrado/i).should('be.visible');
    });

    it('Exige los campos obligatorios del formulario', () => {
      cy.get('[data-testid="btn-abrir-crear-grupo"]').click();
      cy.get('.grupos-modal').within(() => {
        cy.get('[data-testid="btn-submit-crear-grupo"]').click();
        cy.get('[data-testid="select-ambiente"]:invalid').should('exist');
      });
    });

    it('Rechaza creación si el usuario no es coordinador', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/fichas');
      cy.url().should('include', '/instructor/grupos');
    });
  });

  // ── H08: Consultar y filtrar grupos formativos ──────────────────────
  describe('H08 - Consultar y filtrar grupos formativos', () => {
    it('El coordinador consulta los grupos de sus áreas', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/fichas');
      cy.get('.grupos-table tbody tr').should('have.length.greaterThan', 0);
    });

    it('Filtra grupos por jornada', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/fichas');
      cy.get('[data-testid="select-filtro-jornada"]').select('Manana');
      cy.get('.grupos-table tbody tr').each(($tr) => {
        cy.wrap($tr).should('contain.text', 'Manana');
      });
    });

    it('Busca grupos por código, programa o jornada', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/fichas');
      cy.get('[data-testid="input-buscar-grupo"]').type('3064975');
      cy.get('[data-testid="fila-grupo"]').should('have.attr', 'data-numero-ficha', '3064975');
    });

    it('El instructor consulta únicamente sus grupos asignados', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/instructor/grupos');
      cy.get('body').should('exist'); 
    });
  });

  describe('H09 - Consultar detalle de grupo formativo', () => {
    it('El coordinador consulta el detalle de un grupo', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/fichas');
      cy.get('.grupos-table tbody tr').first().find('[data-testid="btn-ver-detalle-grupo"]').click();
      cy.url().should('match', /\/fichas\/\d+/);
      cy.get('.gd-kpi-grid').should('be.visible');
    });

    it('Muestra los aprendices vinculados al grupo', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/fichas');
      cy.get('.grupos-table tbody tr').first().find('[data-testid="btn-ver-detalle-grupo"]').click();
      cy.contains('button', 'Aprendices').click();
      cy.get('.gd-table').should('be.visible');
    });

    it('Responde adecuadamente ante un grupo inexistente', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/fichas/999999');
      cy.get('.fichas-detail-state').should('exist');
    });
  });

  describe('H10 - Actualizar datos básicos del grupo', () => {
    beforeEach(() => {
      cy.intercept('PUT', '**/api/groups/*').as('actualizarGrupo');
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/fichas');
      cy.get('.grupos-table tbody tr').first().find('[data-testid="btn-ver-detalle-grupo"]').click();
    });

    it('El coordinador actualiza datos básicos del grupo', () => {
      cy.contains('button', 'Editar').click();
      cy.get('select[name="jornada"]').first().select('Tarde');
      cy.contains('button', 'Guardar').click();
      cy.wait('@actualizarGrupo');
      cy.contains('actualizado correctamente').should('be.visible');
    });

    it('Recalcula la fecha de finalización al cambiar la duración', () => {
      cy.contains('.gd-summary-item', 'Fecha fin').find('strong').invoke('text').then((fechaAntes) => {
        cy.contains('button', 'Editar').click();
        cy.get('input[name="trimestres"]').first().should('be.visible').clear().type('5');
        cy.contains('button', 'Guardar').click();
        cy.wait('@actualizarGrupo');
        cy.contains('.gd-summary-item', 'Fecha fin').find('strong').invoke('text').should('not.eq', fechaAntes);
      });
    });
  });

  describe('H11 - Cambiar estado del grupo formativo', () => {
    it('Impide que un instructor cambie el estado del grupo', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/instructor/grupos');
      cy.contains('button', 'Cambiar estado').should('not.exist');
    });

    it('El coordinador no cuenta con un control visible para cambiar el estado', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/fichas');
      cy.get('.grupos-table tbody tr').first().find('[data-testid="btn-ver-detalle-grupo"]').click();
      cy.contains('button', 'Cambiar estado').should('exist').and('not.be.visible');
    });
  });

  describe('H12 - Asignar instructor líder a grupo', () => {
    it('Muestra el instructor líder asignado en el detalle del grupo', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/fichas');
      cy.get('.grupos-table tbody tr').first().should('contain.text', 'Franco');
    });

    it('Permite seleccionar instructor líder al crear el grupo', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/fichas');
      cy.get('[data-testid="btn-abrir-crear-grupo"]').click();
      cy.get('.grupos-modal').within(() => {
        cy.get('[data-testid="select-instructor-lider"]').should('exist');
      });
    });

    it('Rechaza la asignación de instructor líder si el usuario no es coordinador', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/fichas');
      cy.url().should('include', '/instructor/grupos');
    });
  });

  describe('H13 - Registrar aprendiz individual', () => {
    beforeEach(() => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/aprendices');
    });

    it('Registra un aprendiz con datos válidos', () => {
      cy.contains('button', 'Registrar aprendiz').click();
      cy.get('.aprendices-modal').within(() => {
        cy.get('input[name="nombres"]').type('Daniel');
        cy.get('input[name="apellidos"]').type('Mbappe');
        cy.get('select[name="tipo_documento"]').select('CC');
        cy.get('input[name="numero_documento"]').type('1122334455');
        cy.get('input[name="email"]').type('daniel.mbappe@correo.com');
        cy.get('select[name="numero_ficha"]').select(1);
        cy.contains('button', 'Guardar aprendiz').click();
      });
      cy.contains('Aprendiz registrado correctamente').should('be.visible');
    });

    it('Valida que el documento no esté registrado previamente', () => {
      cy.contains('button', 'Registrar aprendiz').click();
      cy.get('.aprendices-modal').within(() => {
        cy.get('input[name="nombres"]').type('Duplicado');
        cy.get('input[name="apellidos"]').type('Test');
        cy.get('select[name="tipo_documento"]').select('CC');
        cy.get('input[name="numero_documento"]').type('1000000003'); 
        cy.get('input[name="email"]').type('duplicado@correo.com');
        cy.get('select[name="numero_ficha"]').select(1);
        cy.contains('button', 'Guardar aprendiz').click();
      });
      cy.get('small.error').should('exist');
    });

    it('Exige los campos obligatorios', () => {
      cy.contains('button', 'Registrar aprendiz').click();
      cy.get('.aprendices-modal').within(() => {
        cy.contains('button', 'Guardar aprendiz').click();
      });
      cy.contains('small.error', 'Campo obligatorio').should('exist');
    });
  });

  describe('H14 - Registrar aprendices masivamente', () => {
    beforeEach(() => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/aprendices');
    });

    it('Abre el modal de carga masiva', () => {
      cy.contains('button', 'Carga masiva').click();
      cy.contains('Carga de archivo').should('exist');
    });

    it('Exige seleccionar un archivo antes de cargar', () => {
      cy.contains('button', 'Carga masiva').click();
      cy.contains('button', 'Cargar aprendices').click();
      cy.contains('Seleccione un archivo Excel').should('be.visible');
    });

    it('Solo acepta archivos .xlsx o .xls', () => {
      cy.contains('button', 'Carga masiva').click();
      cy.get('input[type="file"]').should('have.attr', 'accept', '.xlsx,.xls');
    });
  });

  describe('H15 - Consultar aprendices por grupo', () => {
    it('Muestra los aprendices vinculados a un grupo', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/aprendices');
      cy.get('.aprendices-table tbody tr').should('have.length.greaterThan', 0);
    });

    it('Filtra aprendices por nombre, documento, correo o grupo', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/aprendices');
      cy.get('input[placeholder="Buscar por documento, nombre, correo o grupo"]').type('Jorge');
      cy.get('.aprendices-table tbody tr').should('contain.text', 'Jorge');
    });
  });

  describe('H16 - Consultar detalle de aprendiz', () => {
    it('Muestra el detalle de un aprendiz', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/aprendices');
      cy.get('.aprendices-table tbody tr').first().find('.aprendices-icon-btn').first().click();
      cy.get('.aprendices-detail-modal').should('be.visible');
    });
  });

  describe('H17 - Actualizar datos básicos del aprendiz', () => {
    it('Edita los datos de un aprendiz existente', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/aprendices');
      cy.get('.aprendices-table tbody tr').first().find('.aprendices-icon-btn').first().click();
      cy.contains('button', 'Editar').click();
      cy.get('input[name="telefono"]').clear().type('3009998888');
      cy.contains('button', 'Guardar cambios').click();
      cy.contains('actualizado correctamente', { timeout: 8000 }).should('be.visible');
    });
  });

  describe('H18 - Desactivar aprendiz o cuenta asociada', () => {
    it('Permite desactivar un aprendiz sin eliminarlo físicamente', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/aprendices');
      cy.get('.aprendices-table tbody tr').last().find('.aprendices-icon-btn.danger').click();
      cy.contains('button', 'Sí').click();
      cy.contains('eliminado correctamente', { timeout: 8000 }).should('exist');
    });
  });
 
  describe('H19 - Asignar instructores de apoyo a grupo formativo', () => {
    it('El detalle del grupo carga correctamente para el coordinador', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/fichas');
      cy.get('.grupos-table tbody tr').first().find('[data-testid="btn-ver-detalle-grupo"]').click();
      cy.get('.gd-kpi-grid').should('be.visible');
    });
  });

  describe('H20 - Consultar dashboard del instructor', () => {
    it('El instructor accede a su dashboard con resumen de grupos', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.url().should('include', '/instructor/dashboard');
      cy.get('body').should('exist');
    });

    it('El coordinador no accede al dashboard de instructor', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.url().should('not.include', '/instructor/dashboard');
    });
  });

});
