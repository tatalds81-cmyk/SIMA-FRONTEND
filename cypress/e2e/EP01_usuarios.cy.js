describe('EP01 - Gestión de usuarios, autenticación y control de acceso por roles', () => {
  let creds;

  before(() => {
    cy.fixture('credenciales').then((data) => { creds = data; });
  });

  describe('H01 - Crear usuario institucional', () => {
    beforeEach(() => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/usuarios');
    });

    it('Crea un usuario con datos válidos', () => {
      const sufijo = Date.now().toString().slice(-9); 
      cy.get('[data-testid="users-create-button"]').click();
      cy.get('.usuarios-modal').within(() => {
        cy.get('input[placeholder="Ej. Maria"]').type('James');
        cy.get('input[placeholder="Ej. Torres"]').type('David');
        cy.get('select').eq(0).select('CC');
        cy.get('input[placeholder="Numero de cedula"]').type(`1${sufijo}`);
        cy.get('input[placeholder="usuario@misena.edu.co"]').type(`james.david.${sufijo}@misena.edu.co`);
        cy.get('input[placeholder="Numero de celular"]').should('be.enabled').type('3001234567');
        cy.get('select').eq(1).select('instructor');
        cy.contains('button', 'Guardar usuario').click();
      });
      cy.contains('Usuario creado correctamente').should('be.visible');
    });

    it('Impide crear usuario con documento ya registrado', () => {
      cy.get('[data-testid="users-create-button"]').click();
      cy.get('.usuarios-modal').within(() => {
        cy.get('input[placeholder="Ej. Maria"]').type('Otro');
        cy.get('input[placeholder="Ej. Torres"]').type('Usuario');
        cy.get('select').eq(0).select('CC');
        cy.get('input[placeholder="Numero de cedula"]').type('1000000001'); 
        cy.get('input[placeholder="usuario@misena.edu.co"]').type('otro@misena.edu.co');
        cy.get('input[placeholder="Numero de celular"]').type('3009999999');
        cy.get('select').eq(1).select('instructor');
        cy.contains('button', 'Guardar usuario').click();
      });
      cy.get('.usuarios-alert.info').should('be.visible');
    });

    it('Impide crear usuario con correo ya registrado', () => {
      cy.get('[data-testid="users-create-button"]').click();
      cy.get('.usuarios-modal').within(() => {
        cy.get('input[placeholder="Ej. Maria"]').type('Correo');
        cy.get('input[placeholder="Ej. Torres"]').type('Duplicado');
        cy.get('select').eq(0).select('CC');
        cy.get('input[placeholder="Numero de cedula"]').type('1099999999');
        cy.get('input[placeholder="usuario@misena.edu.co"]').type('coordinador@sena.edu.co'); 
        cy.get('input[placeholder="Numero de celular"]').type('3007777777');
        cy.get('select').eq(1).select('instructor');
        cy.contains('button', 'Guardar usuario').click();
      });
      cy.get('.usuarios-alert.info').should('be.visible');
    });

    it('Exige campos obligatorios antes de permitir el registro', () => {
      cy.get('[data-testid="users-create-button"]').click();
      cy.get('.usuarios-modal').within(() => {
        cy.contains('button', 'Guardar usuario').click();
      });
      cy.get('input[placeholder="Ej. Maria"]:invalid').should('exist');
    });

    it('El formulario del coordinador solo ofrece los roles instructor y aprendiz', () => {
      cy.get('[data-testid="users-create-button"]').click();
      cy.get('.usuarios-modal').within(() => {
        cy.get('select').eq(1).find('option').then(($options) => {
          const valores = [...$options].map((o) => o.textContent.trim().toLowerCase());
          expect(valores).to.include('instructor');
          expect(valores).to.include('aprendiz');
          expect(valores).not.to.include('coordinador');
        });
      });
    });
  });

  describe('H02 - Consultar y filtrar usuarios', () => {
    beforeEach(() => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/usuarios');
    });

    it('Muestra el listado de usuarios registrados', () => {
      cy.get('[data-testid="users-table"]').should('be.visible');
      cy.get('[data-testid="users-row"]').should('have.length.greaterThan', 0);
    });

    it('Filtra usuarios por nombre, documento o correo', () => {
      cy.get('input[placeholder="Buscar por nombre, documento o correo"]').type('Franco{enter}');
      cy.get('[data-testid="users-table"] tbody tr').should('contain.text', 'Franco');
    });

    it('Muestra mensaje vacío cuando no hay coincidencias', () => {
      cy.get('input[placeholder="Buscar por nombre, documento o correo"]').type('xxxNoExisteXXX{enter}');
      cy.contains('No hay usuarios para mostrar').should('be.visible');
    });

    it('Filtra usuarios por estado', () => {
      cy.get('[data-testid="users-filter-status"]').select('ACTIVO');
      cy.get('[data-testid="users-table"] tbody tr').each(($tr) => {
        cy.wrap($tr).find('[data-testid="users-status-badge"]').should('contain.text', 'ACTIVO');
      });
    });

    it('Restringe el listado general de usuarios a usuarios sin rol de coordinador', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.visit('/usuarios');
      cy.url().should('not.include', '/usuarios'); 
    });
  });

  describe('H03 - Actualizar o desactivar usuario institucional', () => {
    beforeEach(() => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/usuarios');
    });

    it('Edita los datos permitidos de un usuario existente', () => {
      cy.get('input[placeholder="Buscar por nombre, documento o correo"]').type('Franco{enter}');
      cy.get('[data-testid="users-table"] tbody tr').first().find('[data-testid="users-edit-button"]').click();
      cy.contains('button', 'Editar').click();
      cy.get('.usuarios-detail-field input[name="apellidos"]').clear().type('Ortiz');
      cy.get('[data-testid="users-save-button"]').click();
      cy.contains('Usuario actualizado correctamente').should('be.visible');
    });

    it('Muestra la información actualizada después de guardar', () => {
      cy.get('input[placeholder="Buscar por nombre, documento o correo"]').type('Franco{enter}');
      cy.get('[data-testid="users-table"] tbody tr').first().find('[data-testid="users-edit-button"]').click();
      cy.get('.usuarios-detail-modal').should('be.visible');
      cy.get('.usuarios-detail-main').should('contain.text', 'Ortiz');
    });

    it('Elimina/desactiva un usuario existente', () => {
      cy.on('window:confirm', () => true);
      cy.get('[data-testid="users-table"] tbody tr').last().find('.usuarios-icon-btn.danger').click();
      cy.contains('Usuario eliminado correctamente').should('be.visible');
    });
  });

  describe('H04 - Iniciar sesión con documento y contraseña', () => {
    it('Inicia sesión correctamente con credenciales válidas', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.window().its('localStorage.access').should('exist');
    });

    it('Rechaza el inicio de sesión con contraseña incorrecta', () => {
      cy.visit('/login');
      cy.get('#login-user').clear().type(creds.coordinador.documento);
      cy.get('#login-password').clear().type('ClaveIncorrecta999');
      cy.contains('button', 'Iniciar sesion').click();
      cy.url().should('include', '/login');
      cy.get('.login-sima-message').should('be.visible');
    });

    it('Redirige según el rol del usuario autenticado', () => {
      cy.loginComo(creds.instructor.documento, creds.instructor.password);
      cy.url().should('include', '/instructor/dashboard');
    });
  });

  describe('H05 - Consultar perfil autenticado', () => {
    it('El usuario autenticado consulta su propio perfil con su rol real', () => {
      cy.loginComo(creds.coordinador.documento, creds.coordinador.password);
      cy.visit('/perfil');
      cy.get('.perfil-page, [class*="perfil"]').should('exist');
      cy.contains(/coordinador/i).should('exist');
    });

    it('Rechaza el acceso al perfil sin token válido', () => {
      cy.clearLocalStorage();
      cy.visit('/perfil');
      cy.url().should('include', '/login');
    });
  });

});
