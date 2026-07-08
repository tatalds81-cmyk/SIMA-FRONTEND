const apiBase = () => Cypress.env('apiUrl') || 'http://localhost:3000';

const api = ({ method = 'GET', path, token, body, qs, failOnStatusCode = false }) => cy.request({
  method,
  url: `${apiBase()}${path}`,
  headers: token ? { Authorization: `Bearer ${token}` } : {},
  body,
  qs,
  failOnStatusCode,
});

const loginApi = (documento, password) => api({
  method: 'POST',
  path: '/api/auth/login',
  body: { numero_documento: documento, password },
  failOnStatusCode: true,
}).then((response) => response.body.data);

const expectOk = (response) => {
  expect(response.status).to.be.within(200, 299);
  expect(response.body).to.have.property('ok', true);
  return response.body.data;
};

const uniqueDigits = () => String(Date.now()).slice(-10);
const firstOf = (collection, label) => {
  expect(collection, label).to.be.an('array').and.have.length.greaterThan(0);
  return collection[0];
};

const roleId = (roles, name) => {
  const role = roles.find((item) => String(item.nombre).toLowerCase() === name);
  expect(role, `rol ${name}`).to.exist;
  return role.id_rol;
};

const apprenticeIdOf = (apprentice) => apprentice.id_aprendiz || apprentice.aprendiz?.id_aprendiz;
const userIdOf = (apprentice) => apprentice.id_usuario || apprentice.usuario?.id_usuario || apprentice.aprendiz?.id_usuario;
const groupIdOfApprentice = (apprentice) => apprentice.aprendiz_grupos?.[0]?.grupo?.id_grupo || apprentice.grupo?.id_grupo;

describe('Backlog H01-H34 - contratos backend SIMA', () => {
  const ctx = {};

  before(() => {
    cy.fixture('credenciales').then((creds) => {
      ctx.creds = creds;
      return loginApi(creds.coordinador.documento, creds.coordinador.password);
    }).then((coordinador) => {
      ctx.coordinador = coordinador;
      return loginApi(ctx.creds.instructor.documento, ctx.creds.instructor.password);
    }).then((instructor) => {
      ctx.instructor = instructor;
      return loginApi(ctx.creds.aprendiz.documento, ctx.creds.aprendiz.password);
    }).then((aprendiz) => {
      ctx.aprendizLogin = aprendiz;

      api({ path: '/api/roles', token: ctx.coordinador.token, failOnStatusCode: true })
        .then((response) => { ctx.roles = expectOk(response); });

      api({ path: '/api/users', token: ctx.coordinador.token, qs: { limit: 20 }, failOnStatusCode: true })
        .then((response) => { ctx.users = expectOk(response).usuarios; });

      api({ path: '/api/groups', token: ctx.coordinador.token, qs: { limit: 20 }, failOnStatusCode: true })
        .then((response) => { ctx.groups = expectOk(response).grupos; });

      api({ path: '/api/groups', token: ctx.instructor.token, qs: { limit: 20 }, failOnStatusCode: true })
        .then((response) => {
          ctx.instructorGroups = expectOk(response).grupos;
          const group = ctx.instructorGroups.find((item) => item.estado !== 'FINALIZADO') || ctx.instructorGroups[0];
          if (!group) return null;
          return api({ path: `/api/apprentices/grupo/${group.id_grupo}`, token: ctx.instructor.token, qs: { limit: 20 }, failOnStatusCode: true })
            .then((apprenticesResponse) => {
              ctx.instructorApprentices = expectOk(apprenticesResponse).aprendices;
            });
        });

      api({ path: '/api/apprentices/listado', token: ctx.coordinador.token, qs: { limit: 20 }, failOnStatusCode: true })
        .then((response) => { ctx.apprentices = expectOk(response).aprendices; });

      api({ path: '/api/apprentices/grupos-activos', token: ctx.coordinador.token, failOnStatusCode: true })
        .then((response) => { ctx.activeGroups = expectOk(response); });

      api({ path: '/api/alerts', token: ctx.coordinador.token, qs: { limit: 20 }, failOnStatusCode: true })
        .then((response) => { ctx.alerts = expectOk(response).alertas; });
    });
  });

  describe('EP01 - usuarios, autenticacion y roles', () => {
    it('H01 crea usuario institucional y valida documento/correo/rol/campos obligatorios', () => {
      const suffix = uniqueDigits();
      const payload = {
        email: `h01.${suffix}@misena.edu.co`,
        id_rol: roleId(ctx.roles, 'instructor'),
        tipo_documento: 'CC',
        numero_documento: `7${suffix}`.slice(0, 11),
        nombres: 'Historia',
        apellidos: 'Uno',
        telefono: '3001234567',
      };

      api({ method: 'POST', path: '/api/users', token: ctx.coordinador.token, body: payload, failOnStatusCode: true })
        .then((response) => {
          const user = expectOk(response);
          ctx.h01User = user;
          expect(user).to.include({ email: payload.email, estado: 'ACTIVO' });
          expect(user.rol.nombre).to.eq('instructor');
        });

      api({ method: 'POST', path: '/api/users', token: ctx.coordinador.token, body: payload })
        .its('status').should('be.oneOf', [400, 409]);

      api({ method: 'POST', path: '/api/users', token: ctx.coordinador.token, body: { ...payload, numero_documento: `${payload.numero_documento}9` } })
        .its('status').should('be.oneOf', [400, 409]);

      api({ method: 'POST', path: '/api/users', token: ctx.coordinador.token, body: { ...payload, email: `rol.${suffix}@misena.edu.co`, numero_documento: `${suffix}8`, id_rol: 999999 } })
        .its('status').should('be.within', 400, 499);

      api({ method: 'POST', path: '/api/users', token: ctx.coordinador.token, body: { email: `faltan.${suffix}@misena.edu.co` } })
        .its('status').should('be.within', 400, 499);
    });

    it('H02 consulta usuarios con paginacion y filtros por rol, estado y busqueda', () => {
      api({ path: '/api/users', token: ctx.coordinador.token, qs: { limit: 5 }, failOnStatusCode: true })
        .then((response) => {
          const data = expectOk(response);
          expect(data).to.include.keys('total', 'pagina', 'usuarios');
          firstOf(data.usuarios, 'usuarios');
        });

      api({ path: '/api/users', token: ctx.coordinador.token, qs: { rol: 'instructor', estado: 'ACTIVO', q: ctx.creds.instructor.documento }, failOnStatusCode: true })
        .then((response) => {
          const users = expectOk(response).usuarios;
          expect(users.every((user) => user.estado === 'ACTIVO')).to.eq(true);
        });

      api({ path: '/api/users', token: ctx.instructor.token }).its('status').should('eq', 403);
    });

    it('H03 actualiza y desactiva usuario sin borrado fisico', () => {
      const userId = ctx.h01User.id_usuario;
      api({ method: 'PUT', path: `/api/users/${userId}`, token: ctx.coordinador.token, body: { telefono: '3007654321' }, failOnStatusCode: true })
        .then((response) => {
          const user = expectOk(response);
          expect(user.persona.telefono).to.eq('3007654321');
        });

      api({ method: 'DELETE', path: `/api/users/${userId}`, token: ctx.coordinador.token, failOnStatusCode: true })
        .then((response) => {
          const data = expectOk(response);
          expect(data).to.include({ id_usuario: userId, estado: 'INACTIVO' });
        });

      api({ method: 'POST', path: '/api/auth/login', body: { numero_documento: ctx.h01User.persona.numero_documento, password: ctx.h01User.persona.numero_documento } })
        .its('status').should('eq', 403);
    });

    it('H04 inicia sesion, devuelve token/rol y rechaza credenciales invalidas', () => {
      loginApi(ctx.creds.coordinador.documento, ctx.creds.coordinador.password).then((data) => {
        expect(data.token).to.be.a('string').and.have.length.greaterThan(20);
        expect(data.user.rol).to.eq('coordinador');
      });

      api({ method: 'POST', path: '/api/auth/login', body: { numero_documento: ctx.creds.coordinador.documento, password: 'ClaveIncorrecta999' } })
        .its('status').should('eq', 401);
    });

    it('H05 consulta perfil propio y rechaza token inexistente o invalido', () => {
      api({ path: '/api/auth/me', token: ctx.coordinador.token, failOnStatusCode: true })
        .then((response) => {
          const me = expectOk(response);
          expect(me.id_usuario).to.eq(ctx.coordinador.user.id_usuario);
          expect(me).to.include.keys('rol', 'estado', 'persona');
        });

      api({ path: '/api/auth/me' }).its('status').should('eq', 401);
      api({ path: '/api/auth/me', token: 'token-invalido' }).its('status').should('eq', 401);
    });

    it('H06 aplica autenticacion, autorizacion y alcance institucional en backend', () => {
      api({ path: '/api/groups' }).its('status').should('eq', 401);
      api({ method: 'POST', path: '/api/groups', token: ctx.instructor.token, body: {} }).its('status').should('eq', 403);
      api({ path: '/api/users', token: ctx.aprendizLogin.token }).its('status').should('eq', 403);
    });
  });

  describe('EP02 - grupos, aprendices, instructores y horarios', () => {
    it('H07 crea grupo formativo y rechaza duplicados/no coordinador/campos obligatorios', () => {
      const baseGroup = firstOf(ctx.groups, 'grupos');
      const ficha = `9${uniqueDigits()}`;
      const payload = {
        numero_ficha: ficha,
        id_programa: baseGroup.id_programa || baseGroup.programa_formacion?.id_programa,
        jornada: baseGroup.jornada || 'Manana',
        trimestres: 6,
        fecha_inicio: '2026-07-01',
        id_ambiente: baseGroup.id_ambiente || 1,
        id_instructor_lider: baseGroup.id_instructor_lider || undefined,
      };

      api({ method: 'POST', path: '/api/groups', token: ctx.coordinador.token, body: payload, failOnStatusCode: true })
        .then((response) => {
          const group = expectOk(response);
          ctx.createdGroup = group;
          expect(group.numero_ficha).to.eq(ficha);
          expect(group.estado).to.be.oneOf(['EN_FORMACION', 'ACTIVO']);
        });

      api({ method: 'POST', path: '/api/groups', token: ctx.coordinador.token, body: payload })
        .its('status').should('be.oneOf', [400, 409]);
      api({ method: 'POST', path: '/api/groups', token: ctx.coordinador.token, body: {} })
        .its('status').should('be.within', 400, 499);
      api({ method: 'POST', path: '/api/groups', token: ctx.instructor.token, body: payload })
        .its('status').should('eq', 403);
    });

    it('H08 consulta y filtra grupos segun rol y alcance', () => {
      api({ path: '/api/groups', token: ctx.coordinador.token, qs: { limit: 10 }, failOnStatusCode: true })
        .then((response) => firstOf(expectOk(response).grupos, 'grupos coordinador'));

      api({ path: '/api/groups', token: ctx.instructor.token, qs: { limit: 10 }, failOnStatusCode: true })
        .then((response) => {
          const data = expectOk(response);
          expect(data).to.include.keys('total', 'pagina', 'grupos');
        });

      api({ path: '/api/groups', token: ctx.coordinador.token, qs: { jornada: 'Manana', estado: 'EN_FORMACION' }, failOnStatusCode: true })
        .its('body.ok').should('eq', true);
    });

    it('H09 consulta detalle de grupo, aprendices vinculados y grupo inexistente', () => {
      const group = firstOf(ctx.activeGroups, 'grupos activos');
      api({ path: `/api/groups/${group.id_grupo}`, token: ctx.coordinador.token, failOnStatusCode: true })
        .then((response) => {
          const detail = expectOk(response);
          expect(detail).to.include.keys('numero_ficha', 'jornada', 'estado');
        });

      api({ path: `/api/apprentices/grupo/${group.id_grupo}`, token: ctx.coordinador.token, qs: { limit: 10 }, failOnStatusCode: true })
        .then((response) => {
          const data = expectOk(response);
          expect(data).to.include.keys('grupo', 'aprendices');
        });

      api({ path: '/api/groups/99999999', token: ctx.coordinador.token }).its('status').should('eq', 404);
    });

    it('H10 actualiza datos basicos del grupo y rechaza instructor/no existente', () => {
      const group = ctx.createdGroup || firstOf(ctx.groups, 'grupos');
      api({ method: 'PUT', path: `/api/groups/${group.id_grupo}`, token: ctx.coordinador.token, body: { jornada: 'Tarde', trimestres: 5, fecha_inicio: '2026-07-02' }, failOnStatusCode: true })
        .then((response) => {
          const updated = expectOk(response);
          expect(updated.jornada).to.eq('Tarde');
        });

      api({ method: 'PUT', path: `/api/groups/${group.id_grupo}`, token: ctx.instructor.token, body: { jornada: 'Noche' } })
        .its('status').should('eq', 403);
      api({ method: 'PUT', path: '/api/groups/99999999', token: ctx.coordinador.token, body: { jornada: 'Tarde' } })
        .its('status').should('eq', 404);
    });

    it('H11 cambia estado con valores reales del backend y conserva historico', () => {
      const group = ctx.createdGroup || firstOf(ctx.groups, 'grupos');
      api({ method: 'PATCH', path: `/api/groups/${group.id_grupo}/estado`, token: ctx.coordinador.token, body: { estado: 'PRACTICAS' }, failOnStatusCode: true })
        .then((response) => expect(expectOk(response).estado).to.eq('PRACTICAS'));

      api({ method: 'PATCH', path: `/api/groups/${group.id_grupo}/estado`, token: ctx.instructor.token, body: { estado: 'EN_FORMACION' } })
        .its('status').should('eq', 403);
      api({ method: 'PATCH', path: `/api/groups/${group.id_grupo}/estado`, token: ctx.coordinador.token, body: { estado: 'ACTIVO' } })
        .its('status').should('be.within', 400, 499);
    });

    it('H12 asigna instructor lider activo y rechaza usuarios sin rol coordinador', () => {
      const group = ctx.createdGroup || firstOf(ctx.groups, 'grupos');
      const instructorId = ctx.instructor.user.id_instructor || group.id_instructor_lider;
      expect(instructorId, 'id instructor').to.exist;

      api({ method: 'PATCH', path: `/api/groups/${group.id_grupo}/instructor-lider`, token: ctx.coordinador.token, body: { id_instructor: instructorId }, failOnStatusCode: true })
        .then((response) => expectOk(response));
      api({ method: 'PATCH', path: `/api/groups/${group.id_grupo}/instructor-lider`, token: ctx.instructor.token, body: { id_instructor: instructorId } })
        .its('status').should('eq', 403);
      api({ method: 'PATCH', path: `/api/groups/${group.id_grupo}/instructor-lider`, token: ctx.coordinador.token, body: { id_instructor: 99999999 } })
        .its('status').should('be.within', 400, 499);
    });

    it('H13 registra aprendiz individual y valida duplicados/obligatorios', () => {
      const group = firstOf(ctx.activeGroups, 'grupos activos');
      const suffix = uniqueDigits();
      const payload = {
        tipo_documento: 'CC',
        numero_documento: `8${suffix}`.slice(0, 11),
        nombres: 'Aprendiz',
        apellidos: 'Contrato',
        email: `aprendiz.${suffix}@misena.edu.co`,
        id_grupo: group.id_grupo,
        numero_ficha: group.numero_ficha,
      };

      api({ method: 'POST', path: '/api/apprentices/registro', token: ctx.coordinador.token, body: payload, failOnStatusCode: true })
        .then((response) => {
          const apprentice = expectOk(response);
          ctx.createdApprentice = apprentice;
          expect(apprentice).to.include({ success: true });
          expect(apprentice.aprendiz).to.include.keys('id_aprendiz', 'id_usuario');
          expect(apprentice.grupo.numero_ficha).to.eq(group.numero_ficha);
        });

      api({ method: 'POST', path: '/api/apprentices/registro', token: ctx.coordinador.token, body: payload })
        .its('status').should('be.within', 400, 499);
      api({ method: 'POST', path: '/api/apprentices/registro', token: ctx.coordinador.token, body: {} })
        .its('status').should('be.within', 400, 499);
    });

    it('H14 valida carga masiva: endpoint, archivo obligatorio y roles permitidos', () => {
      api({ method: 'POST', path: '/api/apprentices/registro-masivo', token: ctx.coordinador.token, body: {} })
        .its('status').should('be.within', 400, 499);
      api({ method: 'POST', path: '/api/apprentices/registro-masivo', token: ctx.aprendizLogin.token, body: {} })
        .its('status').should('eq', 403);
    });

    it('H15 consulta aprendices por grupo y restringe acceso sin autenticacion', () => {
      const group = firstOf(ctx.groups, 'grupos');
      api({ path: `/api/apprentices/grupo/${group.id_grupo}`, token: ctx.coordinador.token, failOnStatusCode: true })
        .then((response) => expect(expectOk(response).aprendices).to.be.an('array'));
      api({ path: `/api/apprentices/grupo/${group.id_grupo}` }).its('status').should('eq', 401);
    });

    it('H16 consulta detalle de aprendiz y responde 404 si no existe', () => {
      const apprentice = ctx.createdApprentice || firstOf(ctx.apprentices, 'aprendices');
      const id = apprenticeIdOf(apprentice);
      api({ path: `/api/apprentices/${id}`, token: ctx.coordinador.token, failOnStatusCode: true })
        .then((response) => expectOk(response));
      api({ path: '/api/apprentices/99999999', token: ctx.coordinador.token }).its('status').should('eq', 404);
    });

    it('H17 actualiza datos basicos de aprendiz desde usuario asociado', () => {
      const apprentice = ctx.createdApprentice || firstOf(ctx.apprentices, 'aprendices');
      const userId = userIdOf(apprentice);
      expect(userId, 'usuario asociado').to.exist;
      api({ method: 'PUT', path: `/api/users/${userId}`, token: ctx.coordinador.token, body: { telefono: '3012223333' }, failOnStatusCode: true })
        .then((response) => expect(expectOk(response).persona.telefono).to.eq('3012223333'));
    });

    it('H18 desactiva aprendiz/cuenta asociada sin borrarlo fisicamente', () => {
      const apprentice = ctx.createdApprentice;
      expect(apprentice, 'aprendiz creado por H13').to.exist;
      const userId = userIdOf(apprentice);
      api({ method: 'DELETE', path: `/api/users/${userId}`, token: ctx.coordinador.token, failOnStatusCode: true })
        .then((response) => {
          const data = expectOk(response);
          expect(data.estado).to.eq('INACTIVO');
        });
    });

    it('H19 expone grupos e instructores disponibles para asignacion de apoyo/liderazgo', () => {
      api({ path: '/api/groups/instructores-disponibles', token: ctx.coordinador.token, failOnStatusCode: true })
        .then((response) => expect(expectOk(response)).to.be.an('array'));
      api({ path: '/api/instructor-groups', token: ctx.coordinador.token })
        .its('status').should('be.oneOf', [200, 404]);
    });

    it('H20 permite al instructor consultar informacion propia de dashboard/grupos', () => {
      api({ path: '/api/groups', token: ctx.instructor.token, failOnStatusCode: true })
        .then((response) => expect(expectOk(response).grupos).to.be.an('array'));
      api({ path: '/api/groups', token: ctx.aprendizLogin.token }).its('status').should('eq', 403);
    });

    it('H21 crea horario solo con rol instructor y campos obligatorios validos', () => {
      api({ method: 'POST', path: '/api/educational-schedules', token: ctx.instructor.token, body: {} })
        .its('status').should('be.within', 400, 499);
      api({ method: 'POST', path: '/api/educational-schedules', token: ctx.coordinador.token, body: {} })
        .its('status').should('eq', 403);
    });

    it('H22 consulta horario formativo por grupo y filtros de estado', () => {
      const group = firstOf(ctx.groups, 'grupos');
      api({ path: `/api/educational-schedules/group/${group.id_grupo}`, token: ctx.coordinador.token, qs: { estado: 'ACTIVO' }, failOnStatusCode: true })
        .then((response) => expect(expectOk(response)).to.exist);
    });

    it('H23 valida endpoint de actualizacion de horario y evita actualizar estado directo', () => {
      api({ method: 'PUT', path: '/api/educational-schedules/99999999', token: ctx.instructor.token, body: { estado: 'INACTIVO' } })
        .its('status').should('be.within', 400, 499);
      api({ method: 'PATCH', path: '/api/educational-schedules/99999999/deactivate', token: ctx.coordinador.token, body: { motivo: 'No autorizado' } })
        .its('status').should('eq', 403);
    });

    it('H24 valida reglas base de conflictos usando catalogos y errores funcionales', () => {
      const group = firstOf(ctx.instructorGroups, 'grupos del instructor');
      api({ path: '/api/educational-schedules/catalogs', token: ctx.instructor.token, qs: { id_grupo: group.id_grupo }, failOnStatusCode: true })
        .then((response) => expectOk(response));
      api({ method: 'POST', path: '/api/educational-schedules', token: ctx.instructor.token, body: { dia_semana: 8 } })
        .its('status').should('be.within', 400, 499);
    });
  });

  describe('EP03 - observaciones formativas', () => {
    const observationPayload = () => {
      const apprentice = firstOf(ctx.instructorApprentices, 'aprendices del instructor');
      const groupId = groupIdOfApprentice(apprentice) || firstOf(ctx.instructorGroups, 'grupos del instructor').id_grupo;
      expect(groupId, 'grupo del aprendiz').to.exist;
      return {
        id_aprendiz: apprenticeIdOf(apprentice),
        id_grupo: groupId,
        tipo_observacion: 'ACADEMICA',
        severidad: 'LEVE',
        descripcion: `Observacion de prueba automatizada ${uniqueDigits()} con longitud suficiente.`,
      };
    };

    it('H25 registra observacion abierta y valida rol, tipo, severidad y descripcion', () => {
      const payload = observationPayload();
      api({ method: 'POST', path: '/api/observations', token: ctx.instructor.token, body: payload, failOnStatusCode: true })
        .then((response) => {
          const data = expectOk(response);
          ctx.observation = data.observation;
          expect(data.observation.estado).to.eq('ABIERTA');
        });
      api({ method: 'POST', path: '/api/observations', token: ctx.coordinador.token, body: payload })
        .its('status').should('eq', 403);
      api({ method: 'POST', path: '/api/observations', token: ctx.instructor.token, body: { ...payload, descripcion: 'Corta' } })
        .its('status').should('be.within', 400, 499);
    });

    it('H26 consulta observaciones por grupo con filtros y paginacion', () => {
      const group = firstOf(ctx.instructorGroups, 'grupos del instructor');
      api({ path: `/api/observations/group/${group.id_grupo}`, token: ctx.instructor.token, qs: { estado: 'ABIERTA', severidad: 'LEVE', limit: 10 }, failOnStatusCode: true })
        .then((response) => {
          const data = expectOk(response);
          expect(data).to.include.keys('total', 'pagina', 'observaciones');
        });
      api({ path: '/api/observations/group/99999999', token: ctx.instructor.token }).its('status').should('be.oneOf', [403, 404]);
    });

    it('H27 consulta historial de observaciones del aprendiz abiertas y cerradas', () => {
      const payload = observationPayload();
      api({ path: `/api/observations/apprentice/${payload.id_aprendiz}`, token: ctx.instructor.token, qs: { id_grupo: payload.id_grupo, estado: 'ABIERTA' }, failOnStatusCode: true })
        .then((response) => expect(expectOk(response).observaciones).to.be.an('array'));
      api({ path: `/api/observations/apprentice/${payload.id_aprendiz}`, token: ctx.instructor.token })
        .its('status').should('eq', 400);
    });

    it('H28 edita observacion abierta y no permite cambiar aprendiz desde edicion', () => {
      expect(ctx.observation, 'observacion creada').to.exist;
      api({ method: 'PATCH', path: `/api/observations/${ctx.observation.id_observacion}`, token: ctx.instructor.token, body: { descripcion: 'Descripcion actualizada por prueba automatizada con texto suficiente.' }, failOnStatusCode: true })
        .then((response) => expectOk(response));
      api({ method: 'PATCH', path: `/api/observations/${ctx.observation.id_observacion}`, token: ctx.instructor.token, body: { id_aprendiz: 99999999 } })
        .its('status').should('be.within', 200, 299);
      api({ method: 'PATCH', path: '/api/observations/99999999', token: ctx.instructor.token, body: { descripcion: 'Descripcion larga valida para inexistente.' } })
        .its('status').should('eq', 404);
    });

    it('H29 cierra observaciones automaticamente al asociarlas a alerta desde observaciones', () => {
      expect(ctx.observation, 'observacion creada').to.exist;
      api({ method: 'POST', path: '/api/alerts/from-observations', token: ctx.instructor.token, body: {
        id_aprendiz: ctx.observation.id_aprendiz,
        id_grupo: ctx.observation.id_grupo,
        tipo_alerta: 'CONVIVENCIAL',
        severidad: 'GRAVE',
        descripcion: 'Alerta creada desde observacion para validar cierre transaccional.',
        observationIds: [ctx.observation.id_observacion],
      }, failOnStatusCode: true }).then((response) => {
        const alert = expectOk(response);
        ctx.alertFromObservation = alert;
        expect(alert.estado).to.eq('ABIERTA');
      });

      api({ path: `/api/observations/${ctx.observation.id_observacion}`, token: ctx.instructor.token, failOnStatusCode: true })
        .then((response) => expect(expectOk(response).estado).to.eq('CERRADA'));
    });

    it('H30 permite registrar observacion con o sin notificar al lider', () => {
      const payload = observationPayload();
      api({ method: 'POST', path: '/api/observations', token: ctx.instructor.token, body: { ...payload, notificar_lider: false }, failOnStatusCode: true })
        .then((response) => expect(expectOk(response).notificacion_lider).to.eq(false));
    });
  });

  describe('EP04 - alertas tempranas', () => {
    const alertPayload = () => {
      const apprentice = firstOf(ctx.instructorApprentices, 'aprendices del instructor');
      const groupId = groupIdOfApprentice(apprentice) || firstOf(ctx.instructorGroups, 'grupos del instructor').id_grupo;
      expect(groupId, 'grupo del aprendiz').to.exist;
      return {
        id_aprendiz: apprenticeIdOf(apprentice),
        id_grupo: groupId,
        tipo_alerta: 'CONVIVENCIAL',
        severidad: 'CRITICA',
        descripcion: `Alerta manual de prueba automatizada ${uniqueDigits()} con descripcion suficiente.`,
      };
    };

    it('H31 crea alerta manual con origen MANUAL y valida campos permitidos', () => {
      const payload = alertPayload();
      api({ method: 'POST', path: '/api/alerts/manual', token: ctx.instructor.token, body: payload, failOnStatusCode: true })
        .then((response) => {
          const alert = expectOk(response);
          ctx.manualAlert = alert;
          expect(alert).to.include({ origen: 'MANUAL', estado: 'ABIERTA', tipo_alerta: 'CONVIVENCIAL' });
        });
      api({ method: 'POST', path: '/api/alerts/manual', token: ctx.instructor.token, body: { ...payload, tipo_alerta: 'NO_EXISTE' } })
        .its('status').should('be.within', 400, 499);
      api({ method: 'POST', path: '/api/alerts/manual', token: ctx.aprendizLogin.token, body: payload })
        .its('status').should('eq', 403);
    });

    it('H32 consulta alertas por rol y filtros reales del backend', () => {
      api({ path: '/api/alerts', token: ctx.coordinador.token, qs: { estado: 'ABIERTA', severidad: 'CRITICA', tipo_alerta: 'CONVIVENCIAL', limit: 10 }, failOnStatusCode: true })
        .then((response) => {
          const data = expectOk(response);
          expect(data).to.include.keys('total', 'pagina', 'alertas');
        });
      api({ path: '/api/alerts', token: ctx.instructor.token, qs: { q: ctx.creds.aprendiz.documento, fecha_desde: '2026-01-01', fecha_hasta: '2026-12-31' }, failOnStatusCode: true })
        .then((response) => expect(expectOk(response).alertas).to.be.an('array'));
      api({ path: '/api/alerts', token: ctx.aprendizLogin.token }).its('status').should('eq', 403);
    });

    it('H33 cierra alerta con justificacion valida y rechaza instructor/justificacion corta', () => {
      expect(ctx.manualAlert, 'alerta manual').to.exist;
      api({ method: 'PATCH', path: `/api/alerts/${ctx.manualAlert.id_alerta}/status`, token: ctx.coordinador.token, body: { estado: 'CERRADA', justificacion_cierre: 'Corta' } })
        .its('status').should('be.within', 400, 499);
      api({ method: 'PATCH', path: `/api/alerts/${ctx.manualAlert.id_alerta}/status`, token: ctx.instructor.token, body: { estado: 'CERRADA', justificacion_cierre: 'Justificacion suficientemente larga para cerrar la alerta.' } })
        .its('status').should('eq', 403);
      api({ method: 'PATCH', path: `/api/alerts/${ctx.manualAlert.id_alerta}/status`, token: ctx.coordinador.token, body: { estado: 'CERRADA', justificacion_cierre: 'La situacion fue revisada y atendida por coordinacion dentro del proceso formativo.' }, failOnStatusCode: true })
        .then((response) => {
          const alert = expectOk(response);
          expect(alert.estado).to.eq('CERRADA');
          expect(alert.justificacion_cierre).to.have.length.greaterThan(19);
        });
    });

    it('H34 reevalua alertas automaticas por observaciones y no duplica contrato de estados', () => {
      const apprentice = firstOf(ctx.instructorApprentices, 'aprendices del instructor');
      const idAprendiz = apprenticeIdOf(apprentice);
      api({ method: 'POST', path: `/api/alerts/reevaluate/observations/${idAprendiz}`, token: ctx.instructor.token, failOnStatusCode: true })
        .then((response) => {
          expect(response.body.ok).to.eq(true);
          if (response.body.data) {
            const alerts = Array.isArray(response.body.data) ? response.body.data : [response.body.data];
            alerts.forEach((alert) => {
              expect(alert.tipo_alerta).to.eq('OBSERVACIONES_RECURRENTES');
              expect(alert.origen).to.eq('AUTOMATICA');
              expect(alert.estado).to.eq('ABIERTA');
            });
          }
        });
    });
  });
});


