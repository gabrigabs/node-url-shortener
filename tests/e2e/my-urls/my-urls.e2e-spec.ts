/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as request from 'supertest';
import { getApp, getPrisma } from '../setup/e2e-setup';

describe('My URLs E2E Tests', () => {
  let app: any;
  let prisma: any;
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  beforeAll(() => {
    app = getApp();
    prisma = getPrisma();
  });

  beforeEach(async () => {
    const user1Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user1@test.com',
        password: 'password123',
      })
      .expect(201);

    user1Token = user1Response.body.access_token;
    user1Id = user1Response.body.user.id;

    const user2Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user2@test.com',
        password: 'password123',
      })
      .expect(201);

    user2Token = user2Response.body.access_token;
    user2Id = user2Response.body.user.id;
  });

  describe('GET /my-urls - Listar URLs do usuário', () => {
    it('deve retornar lista vazia quando usuário não tem URLs', async () => {
      const response = await request(app.getHttpServer())
        .get('/my-urls')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body).toEqual([]);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve listar apenas URLs do usuário autenticado', async () => {
      await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ originalUrl: 'https://www.user1-url1.com' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ originalUrl: 'https://www.user1-url2.com' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ originalUrl: 'https://www.user2-url1.com' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/my-urls')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].userId).toBe(user1Id);
      expect(response.body[1].userId).toBe(user1Id);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app.getHttpServer())
        .get('/my-urls')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar URLs com todas as propriedades necessárias', async () => {
      await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          originalUrl: 'https://www.complete-url.com',
          customAlias: 'test-alias',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/my-urls')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('originalUrl');
      expect(response.body[0]).toHaveProperty('shortCode');
      expect(response.body[0]).toHaveProperty('customAlias');
      expect(response.body[0]).toHaveProperty('accessCount');
      expect(response.body[0]).toHaveProperty('userId');
      expect(response.body[0]).toHaveProperty('createdAt');
      expect(response.body[0]).toHaveProperty('updatedAt');
      expect(response.body[0]).toHaveProperty('deletedAt');
    });

    it('não deve listar URLs deletadas (soft delete)', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ originalUrl: 'https://www.to-delete.com' })
        .expect(201);

      const urlId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);

      const response = await request(app.getHttpServer())
        .get('/my-urls')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /my-urls/:id - Buscar URL específica', () => {
    let urlId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ originalUrl: 'https://www.specific-url.com' })
        .expect(201);

      urlId = createResponse.body.id;
    });

    it('deve retornar URL específica do usuário', async () => {
      const response = await request(app.getHttpServer())
        .get(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.id).toBe(urlId);
      expect(response.body.originalUrl).toBe('https://www.specific-url.com');
      expect(response.body.userId).toBe(user1Id);
    });

    it('deve retornar 403 ao tentar acessar URL de outro usuário', async () => {
      const response = await request(app.getHttpServer())
        .get(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('não pertence');
    });

    it('deve retornar 404 para URL inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/my-urls/${fakeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar 401 sem autenticação', async () => {
      await request(app.getHttpServer()).get(`/my-urls/${urlId}`).expect(401);
    });
  });

  describe('PUT /my-urls/:id - Atualizar URL', () => {
    let urlId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ originalUrl: 'https://www.original-url.com' })
        .expect(201);

      urlId = createResponse.body.id;
    });

    it('deve atualizar URL do próprio usuário com sucesso', async () => {
      const updateDto = {
        originalUrl: 'https://www.updated-url.com',
      };

      const response = await request(app.getHttpServer())
        .put(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.id).toBe(urlId);
      expect(response.body.originalUrl).toBe(updateDto.originalUrl);
      expect(response.body.updatedAt).toBeDefined();
    });

    it('deve retornar 403 ou 404 ao tentar atualizar URL de outro usuário', async () => {
      const updateDto = {
        originalUrl: 'https://www.hacked-url.com',
      };

      const response = await request(app.getHttpServer())
        .put(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send(updateDto);

      expect([403, 404]).toContain(response.status);

      const checkUrl = await prisma.url.findUnique({
        where: { id: urlId },
      });
      expect(checkUrl.originalUrl).toBe('https://www.original-url.com');
    });

    it('deve retornar erro ao atualizar com URL inválida', async () => {
      const updateDto = {
        originalUrl: 'invalid-url',
      };

      const response = await request(app.getHttpServer())
        .put(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar 404 ao atualizar URL inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateDto = {
        originalUrl: 'https://www.new-url.com',
      };

      const response = await request(app.getHttpServer())
        .put(`/my-urls/${fakeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateDto)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar 401 sem autenticação', async () => {
      const updateDto = {
        originalUrl: 'https://www.new-url.com',
      };

      await request(app.getHttpServer())
        .put(`/my-urls/${urlId}`)
        .send(updateDto)
        .expect(401);
    });

    it('deve preservar shortCode e customAlias após atualização', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          originalUrl: 'https://www.before-update.com',
          customAlias: 'my-permanent-alias',
        })
        .expect(201);

      const urlIdWithAlias = createResponse.body.id;
      const originalShortCode = createResponse.body.shortCode;
      const originalAlias = createResponse.body.customAlias;

      const updateDto = {
        originalUrl: 'https://www.after-update.com',
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`/my-urls/${urlIdWithAlias}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateDto)
        .expect(200);

      expect(updateResponse.body.originalUrl).toBe(updateDto.originalUrl);
      expect(updateResponse.body.shortCode).toBe(originalShortCode);
      expect(updateResponse.body.customAlias).toBe(originalAlias);
    });
  });

  describe('DELETE /my-urls/:id - Deletar URL (soft delete)', () => {
    let urlId: string;
    let shortCode: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ originalUrl: 'https://www.to-delete.com' })
        .expect(201);

      urlId = createResponse.body.id;
      shortCode = createResponse.body.shortCode;
    });

    it('deve realizar soft delete da URL com sucesso', async () => {
      await request(app.getHttpServer())
        .delete(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);

      const url = await prisma.url.findUnique({
        where: { id: urlId },
      });

      expect(url.deletedAt).not.toBeNull();
    });

    it('deve retornar 403 ou 404 ao tentar deletar URL de outro usuário', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect([403, 404]).toContain(response.status);

      const url = await prisma.url.findUnique({
        where: { id: urlId },
      });

      expect(url.deletedAt).toBeNull();
    });

    it('URL deletada não deve aparecer na listagem', async () => {
      await request(app.getHttpServer())
        .delete(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);

      const response = await request(app.getHttpServer())
        .get('/my-urls')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('URL deletada não deve redirecionar (404)', async () => {
      await request(app.getHttpServer())
        .delete(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);

      const response = await request(app.getHttpServer())
        .get(`/${shortCode}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar 404 ao deletar URL inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .delete(`/my-urls/${fakeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar 401 sem autenticação', async () => {
      await request(app.getHttpServer())
        .delete(`/my-urls/${urlId}`)
        .expect(401);
    });

    it('deve retornar erro ao tentar deletar URL já deletada', async () => {
      await request(app.getHttpServer())
        .delete(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);

      const response = await request(app.getHttpServer())
        .delete(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect([400, 404]).toContain(response.status);
    });
  });

  describe('Fluxo Completo de Gerenciamento', () => {
    it('deve realizar CRUD completo de URLs', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          originalUrl: 'https://www.crud-test.com',
          customAlias: 'crud-test',
        })
        .expect(201);

      const urlId = createResponse.body.id;
      expect(createResponse.body.customAlias).toBe('crud-test');

      const listResponse = await request(app.getHttpServer())
        .get('/my-urls')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].id).toBe(urlId);

      const getResponse = await request(app.getHttpServer())
        .get(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(getResponse.body.id).toBe(urlId);

      const updateResponse = await request(app.getHttpServer())
        .put(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ originalUrl: 'https://www.crud-test-updated.com' })
        .expect(200);

      expect(updateResponse.body.originalUrl).toBe(
        'https://www.crud-test-updated.com',
      );

      const redirectResponse = await request(app.getHttpServer())
        .get('/crud-test')
        .expect(302);

      expect(redirectResponse.headers.location).toBe(
        'https://www.crud-test-updated.com',
      );

      await request(app.getHttpServer())
        .delete(`/my-urls/${urlId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);

      const finalListResponse = await request(app.getHttpServer())
        .get('/my-urls')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(finalListResponse.body).toEqual([]);

      await request(app.getHttpServer()).get('/crud-test').expect(404);
    });
  });

  describe('Isolamento e Segurança', () => {
    it('usuários diferentes não devem ter acesso às URLs uns dos outros', async () => {
      const user1Url1 = await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ originalUrl: 'https://www.user1-private1.com' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ originalUrl: 'https://www.user1-private2.com' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/shorten')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ originalUrl: 'https://www.user2-private1.com' })
        .expect(201);

      const user1List = await request(app.getHttpServer())
        .get('/my-urls')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(user1List.body).toHaveLength(2);
      expect(user1List.body.every((url: any) => url.userId === user1Id)).toBe(
        true,
      );

      const user2List = await request(app.getHttpServer())
        .get('/my-urls')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(user2List.body).toHaveLength(1);
      expect(user2List.body[0].userId).toBe(user2Id);

      await request(app.getHttpServer())
        .get(`/my-urls/${user1Url1.body.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      await request(app.getHttpServer())
        .put(`/my-urls/${user1Url1.body.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ originalUrl: 'https://www.hacked.com' })
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/my-urls/${user1Url1.body.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });
  });
});
