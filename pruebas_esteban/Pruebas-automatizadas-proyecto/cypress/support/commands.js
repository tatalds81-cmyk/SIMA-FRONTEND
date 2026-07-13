Cypress.Commands.add('loginInstructor', () => {
  const instructorUser = {
    id_usuario: 1,
    email: 'instructor@test.com',
    rol: 'INSTRUCTOR',
    persona: {
      nombres: 'Instructor',
      apellidos: 'Prueba',
      numero_documento: '123456789'
    },
    instructor: {
      id_instructor: 77
    }
  };

  cy.intercept('POST', '**/api/auth/login', {
    statusCode: 200,
    body: {
      data: {
        access: 'fake-token',
        user: instructorUser,
        rol: 'INSTRUCTOR'
      }
    }
  }).as('postLogin');

  cy.intercept('GET', '**/api/auth/me', {
    statusCode: 200,
    body: {
      data: instructorUser
    }
  }).as('getMe');

  cy.visit('/login');
  cy.get('#login-user').clear().type('123456789');
  cy.get('#login-password').clear().type('Password123!');
  cy.contains('button', 'Iniciar sesion').click();
  cy.wait('@postLogin');
  cy.wait('@getMe');
  cy.location('pathname').should('include', '/instructor/dashboard');
});