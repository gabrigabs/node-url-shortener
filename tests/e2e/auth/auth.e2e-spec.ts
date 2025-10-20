/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as request from 'supertest';
import { getApp } from '../setup/e2e-setup';

describe('Auth E2E Tests', () => {
  let app: any;

  beforeAll(() => {
    app = getApp();
  });

  describe('POST /auth/register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const registerDto = {
        email: 'newuser@test.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('deve retornar erro ao registrar com email duplicado', async () => {
      const registerDto = {
        email: 'duplicate@test.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('já cadastrado');
    });

    it('deve retornar erro ao registrar com email inválido', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar erro ao registrar com senha curta', async () => {
      const registerDto = {
        email: 'shortpass@test.com',
        password: '123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar erro ao registrar sem email', async () => {
      const registerDto = {
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar erro ao registrar sem senha', async () => {
      const registerDto = {
        email: 'nopass@test.com',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/login', () => {
    const testUser = {
      email: 'loginuser@test.com',
      password: 'password123',
    };

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send(testUser);
    });

    it('deve autenticar usuário e retornar token JWT válido', async () => {
      const loginDto = {
        email: testUser.email,
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.access_token).toBeTruthy();
      expect(typeof response.body.access_token).toBe('string');
    });

    it('deve retornar 401 para credenciais inválidas - senha incorreta', async () => {
      const loginDto = {
        email: testUser.email,
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Credenciais inválidas');
    });

    it('deve retornar 401 para email não cadastrado', async () => {
      const loginDto = {
        email: 'notregistered@test.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar erro ao fazer login com email inválido', async () => {
      const loginDto = {
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar erro ao fazer login sem senha', async () => {
      const loginDto = {
        email: testUser.email,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar erro ao fazer login sem email', async () => {
      const loginDto = {
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('JWT Token Validation', () => {
    it('deve gerar tokens diferentes para usuários diferentes', async () => {
      const user1 = {
        email: 'user1@test.com',
        password: 'password123',
      };

      const user2 = {
        email: 'user2@test.com',
        password: 'password123',
      };

      const response1 = await request(app.getHttpServer())
        .post('/auth/register')
        .send(user1)
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post('/auth/register')
        .send(user2)
        .expect(201);

      expect(response1.body.access_token).toBeTruthy();
      expect(response2.body.access_token).toBeTruthy();
      expect(response1.body.access_token).not.toBe(response2.body.access_token);
    });

    it('deve incluir informações do usuário na resposta de registro', async () => {
      const registerDto = {
        email: 'userinfo@test.com',
        password: 'password123456',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user.password).toBeUndefined();
    });
  });
});
