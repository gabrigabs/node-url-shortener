/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as request from 'supertest';
import { getApp, getPrisma } from '../setup/e2e-setup';

describe('URL E2E Tests (Shorten & Redirect)', () => {
  let app: any;
  let prisma: any;
  let authToken: string;
  let userId: string;

  beforeAll(() => {
    app = getApp();
    prisma = getPrisma();
  });

  describe('POST /shorten - Encurtamento de URLs', () => {
    describe('Usuário Anônimo', () => {
      it('deve encurtar uma URL com sucesso sem autenticação', async () => {
        const createUrlDto = {
          originalUrl: 'https://www.example.com/very-long-url',
        };

        const response = await request(app.getHttpServer())
          .post('/shorten')
          .send(createUrlDto)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('shortCode');
        expect(response.body).toHaveProperty('shortUrl');
        expect(response.body.originalUrl).toBe(createUrlDto.originalUrl);
        expect(response.body.shortCode).toHaveLength(6);
        expect(response.body.userId).toBeNull();
        expect(response.body.customAlias).toBeNull();
        expect(response.body.accessCount).toBe(0);
        expect(response.body.shortUrl).toMatch(
          /^http:\/\/localhost:3000\/[A-Za-z0-9]{6}$/,
        );
      });

      it('deve gerar shortCode único automaticamente', async () => {
        const createUrlDto = {
          originalUrl: 'https://www.example.com/page1',
        };

        const response1 = await request(app.getHttpServer())
          .post('/shorten')
          .send(createUrlDto)
          .expect(201);

        const response2 = await request(app.getHttpServer())
          .post('/shorten')
          .send({ originalUrl: 'https://www.example.com/page2' })
          .expect(201);

        expect(response1.body.shortCode).not.toBe(response2.body.shortCode);
      });

      it('deve rejeitar URL inválida', async () => {
        const createUrlDto = {
          originalUrl: 'not-a-valid-url',
        };

        const response = await request(app.getHttpServer())
          .post('/shorten')
          .send(createUrlDto)
          .expect(400);

        expect(response.body).toHaveProperty('message');
      });

      it('deve rejeitar customAlias para usuário não autenticado', async () => {
        const createUrlDto = {
          originalUrl: 'https://www.example.com/page',
          customAlias: 'my-alias',
        };

        const response = await request(app.getHttpServer())
          .post('/shorten')
          .send(createUrlDto)
          .expect(400);

        expect(response.body).toHaveProperty('message');
      });
    });

    describe('Usuário Autenticado', () => {
      beforeEach(async () => {
        const registerResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'urluser@test.com',
            password: 'password123',
          })
          .expect(201);

        authToken = registerResponse.body.access_token;
        userId = registerResponse.body.user.id;
      });

      it('deve encurtar URL com autenticação e associar ao usuário', async () => {
        const createUrlDto = {
          originalUrl: 'https://www.example.com/authenticated',
        };

        const response = await request(app.getHttpServer())
          .post('/shorten')
          .set('Authorization', `Bearer ${authToken}`)
          .send(createUrlDto)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('shortCode');
        expect(response.body.userId).toBe(userId);
        expect(response.body.originalUrl).toBe(createUrlDto.originalUrl);
      });

      it('deve criar URL com customAlias válido', async () => {
        const createUrlDto = {
          originalUrl: 'https://www.example.com/custom',
          customAlias: 'meu-link-customizado',
        };

        const response = await request(app.getHttpServer())
          .post('/shorten')
          .set('Authorization', `Bearer ${authToken}`)
          .send(createUrlDto)
          .expect(201);

        expect(response.body.customAlias).toBe(createUrlDto.customAlias);
        expect(response.body).toHaveProperty('shortUrl');
        expect(response.body.shortUrl).toBe(
          'http://localhost:3000/meu-link-customizado',
        );
        expect(response.body.shortCode).toBeDefined();
        expect(response.body.id).toBeDefined();
      });

      it('deve retornar erro ao usar customAlias duplicado', async () => {
        const createUrlDto = {
          originalUrl: 'https://www.example.com/page1',
          customAlias: 'alias-duplicado',
        };

        await request(app.getHttpServer())
          .post('/shorten')
          .set('Authorization', `Bearer ${authToken}`)
          .send(createUrlDto)
          .expect(201);

        const response = await request(app.getHttpServer())
          .post('/shorten')
          .set('Authorization', `Bearer ${authToken}`)
          .send(createUrlDto)
          .expect(409);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('uso');
      });

      it('deve rejeitar customAlias com caracteres inválidos', async () => {
        const createUrlDto = {
          originalUrl: 'https://www.example.com/page',
          customAlias: 'alias@invalido!',
        };

        const response = await request(app.getHttpServer())
          .post('/shorten')
          .set('Authorization', `Bearer ${authToken}`)
          .send(createUrlDto)
          .expect(400);

        expect(response.body).toHaveProperty('message');
      });

      it('deve rejeitar customAlias muito curto (< 3 caracteres)', async () => {
        const createUrlDto = {
          originalUrl: 'https://www.example.com/page',
          customAlias: 'ab',
        };

        const response = await request(app.getHttpServer())
          .post('/shorten')
          .set('Authorization', `Bearer ${authToken}`)
          .send(createUrlDto)
          .expect(400);

        expect(response.body).toHaveProperty('message');
      });

      it('deve rejeitar customAlias muito longo (> 30 caracteres)', async () => {
        const createUrlDto = {
          originalUrl: 'https://www.example.com/page',
          customAlias: 'a'.repeat(31),
        };

        const response = await request(app.getHttpServer())
          .post('/shorten')
          .set('Authorization', `Bearer ${authToken}`)
          .send(createUrlDto)
          .expect(400);

        expect(response.body).toHaveProperty('message');
      });

      it('deve permitir customAlias com hífens e underscores', async () => {
        const createUrlDto = {
          originalUrl: 'https://www.example.com/page',
          customAlias: 'meu-link_valido-123',
        };

        const response = await request(app.getHttpServer())
          .post('/shorten')
          .set('Authorization', `Bearer ${authToken}`)
          .send(createUrlDto)
          .expect(201);

        expect(response.body.customAlias).toBe(createUrlDto.customAlias);
      });
    });

    describe('Validações de URL', () => {
      it('deve rejeitar URL sem protocolo', async () => {
        const createUrlDto = {
          originalUrl: 'www.example.com',
        };

        const response = await request(app.getHttpServer())
          .post('/shorten')
          .send(createUrlDto)
          .expect(400);

        expect(response.body).toHaveProperty('message');
      });

      it('deve aceitar URLs com HTTPS', async () => {
        const createUrlDto = {
          originalUrl: 'https://www.secure-example.com',
        };

        const response = await request(app.getHttpServer())
          .post('/shorten')
          .send(createUrlDto)
          .expect(201);

        expect(response.body.originalUrl).toBe(createUrlDto.originalUrl);
      });

      it('deve aceitar URLs com HTTP', async () => {
        const createUrlDto = {
          originalUrl: 'http://www.example.com',
        };

        const response = await request(app.getHttpServer())
          .post('/shorten')
          .send(createUrlDto)
          .expect(201);

        expect(response.body.originalUrl).toBe(createUrlDto.originalUrl);
      });
    });
  });

  describe('GET /:code - Redirecionamento', () => {
    let shortCode: string;
    let customAlias: string;

    beforeEach(async () => {
      const response1 = await request(app.getHttpServer())
        .post('/shorten')
        .send({ originalUrl: 'https://www.redirect-target.com' })
        .expect(201);

      shortCode = response1.body.shortCode;

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'redirect-user@test.com',
          password: 'password123',
        })
        .expect(201);

      const token = registerResponse.body.access_token;

      const response2 = await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${token}`)
        .send({
          originalUrl: 'https://www.custom-redirect.com',
          customAlias: 'meu-redirect',
        })
        .expect(201);

      customAlias = response2.body.customAlias;
    });

    it('deve redirecionar corretamente via shortCode com HTTP 302', async () => {
      const response = await request(app.getHttpServer())
        .get(`/${shortCode}`)
        .expect(302);

      expect(response.headers.location).toBe('https://www.redirect-target.com');
    });

    it('deve redirecionar corretamente via customAlias com HTTP 302', async () => {
      const response = await request(app.getHttpServer())
        .get(`/${customAlias}`)
        .expect(302);

      expect(response.headers.location).toBe('https://www.custom-redirect.com');
    });

    it('deve incrementar contador de acessos após redirecionamento', async () => {
      await request(app.getHttpServer()).get(`/${shortCode}`).expect(302);

      await request(app.getHttpServer()).get(`/${shortCode}`).expect(302);

      const url = await prisma.url.findUnique({
        where: { shortCode },
      });

      expect(url.accessCount).toBeGreaterThanOrEqual(2);
    });

    it('deve retornar 404 para shortCode inexistente', async () => {
      const response = await request(app.getHttpServer())
        .get('/NOTFOUND123')
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('não encontrada');
    });

    it('deve retornar 404 ao acessar URL deletada', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'delete-user@test.com',
          password: 'password123',
        })
        .expect(201);

      const token = registerResponse.body.access_token;

      const createResponse = await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${token}`)
        .send({ originalUrl: 'https://www.to-delete.com' })
        .expect(201);

      const urlId = createResponse.body.id;
      const urlShortCode = createResponse.body.shortCode;

      await request(app.getHttpServer())
        .delete(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      const response = await request(app.getHttpServer())
        .get(`/${urlShortCode}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Fluxo Completo de Uso', () => {
    it('deve realizar fluxo completo: registro → criação → redirecionamento', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'fullflow@test.com',
          password: 'password123',
        })
        .expect(201);

      const token = registerResponse.body.access_token;
      expect(token).toBeTruthy();

      const createResponse = await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${token}`)
        .send({
          originalUrl: 'https://www.final-destination.com',
          customAlias: 'flow-test',
        })
        .expect(201);

      expect(createResponse.body.customAlias).toBe('flow-test');
      expect(createResponse.body.userId).toBe(registerResponse.body.user.id);

      const redirectResponse = await request(app.getHttpServer())
        .get('/flow-test')
        .expect(302);

      expect(redirectResponse.headers.location).toBe(
        'https://www.final-destination.com',
      );

      const urlData = await prisma.url.findUnique({
        where: { customAlias: 'flow-test' },
      });

      expect(urlData.accessCount).toBeGreaterThan(0);
    });
  });
});
