import { Url } from '../../../src/urls/entities/url.entity';

describe('Url Entity', () => {
  const mockDate = new Date('2025-01-01');

  describe('constructor', () => {
    it('deve criar uma URL com dados completos', () => {
      const urlData = {
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: 'custom',
        userId: 'user-uuid',
        accessCount: 5,
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      const url = new Url(urlData);

      expect(url.id).toBe(urlData.id);
      expect(url.originalUrl).toBe(urlData.originalUrl);
      expect(url.shortCode).toBe(urlData.shortCode);
      expect(url.customAlias).toBe(urlData.customAlias);
      expect(url.userId).toBe(urlData.userId);
      expect(url.accessCount).toBe(urlData.accessCount);
      expect(url.createdAt).toBe(mockDate);
      expect(url.updatedAt).toBe(mockDate);
      expect(url.deletedAt).toBeNull();
    });

    it('deve criar uma URL anônima', () => {
      const urlData = {
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId: null,
        accessCount: 0,
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      const url = new Url(urlData);

      expect(url.userId).toBeNull();
      expect(url.customAlias).toBeNull();
    });

    it('deve criar uma URL com dados parciais', () => {
      const urlData = {
        id: 'url-uuid',
        shortCode: 'abc123',
      };

      const url = new Url(urlData);

      expect(url.id).toBe(urlData.id);
      expect(url.shortCode).toBe(urlData.shortCode);
    });
  });

  describe('isDeleted', () => {
    it('deve retornar false quando deletedAt é null', () => {
      const url = new Url({
        id: 'url-uuid',
        deletedAt: null,
      });

      expect(url.isDeleted()).toBe(false);
    });

    it('deve retornar true quando deletedAt tem uma data', () => {
      const url = new Url({
        id: 'url-uuid',
        deletedAt: mockDate,
      });

      expect(url.isDeleted()).toBe(true);
    });
  });

  describe('belongsToUser', () => {
    it('deve retornar true quando userId corresponde', () => {
      const url = new Url({
        id: 'url-uuid',
        userId: 'user-uuid-123',
      });

      expect(url.belongsToUser('user-uuid-123')).toBe(true);
    });

    it('deve retornar false quando userId não corresponde', () => {
      const url = new Url({
        id: 'url-uuid',
        userId: 'user-uuid-123',
      });

      expect(url.belongsToUser('other-user-uuid')).toBe(false);
    });

    it('deve retornar false para URLs anônimas', () => {
      const url = new Url({
        id: 'url-uuid',
        userId: null,
      });

      expect(url.belongsToUser('user-uuid')).toBe(false);
    });
  });

  describe('getAccessCode', () => {
    it('deve retornar customAlias quando existe', () => {
      const url = new Url({
        id: 'url-uuid',
        shortCode: 'abc123',
        customAlias: 'my-custom-link',
      });

      expect(url.getAccessCode()).toBe('my-custom-link');
    });

    it('deve retornar shortCode quando customAlias é null', () => {
      const url = new Url({
        id: 'url-uuid',
        shortCode: 'abc123',
        customAlias: null,
      });

      expect(url.getAccessCode()).toBe('abc123');
    });

    it('deve retornar shortCode quando customAlias é undefined', () => {
      const url = new Url({
        id: 'url-uuid',
        shortCode: 'abc123',
      });

      expect(url.getAccessCode()).toBe('abc123');
    });
  });

  describe('isAnonymous', () => {
    it('deve retornar true quando userId é null', () => {
      const url = new Url({
        id: 'url-uuid',
        userId: null,
      });

      expect(url.isAnonymous()).toBe(true);
    });

    it('deve retornar false quando tem userId', () => {
      const url = new Url({
        id: 'url-uuid',
        userId: 'user-uuid-123',
      });

      expect(url.isAnonymous()).toBe(false);
    });
  });

  describe('cenários completos', () => {
    it('deve representar uma URL completa de usuário', () => {
      const url = new Url({
        id: 'url-uuid',
        originalUrl: 'https://example.com/very-long-url',
        shortCode: 'abc123',
        customAlias: 'my-link',
        userId: 'user-uuid',
        accessCount: 42,
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      });

      expect(url.isDeleted()).toBe(false);
      expect(url.isAnonymous()).toBe(false);
      expect(url.belongsToUser('user-uuid')).toBe(true);
      expect(url.getAccessCode()).toBe('my-link');
    });

    it('deve representar uma URL anônima deletada', () => {
      const url = new Url({
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode: 'xyz789',
        customAlias: null,
        userId: null,
        accessCount: 10,
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: mockDate,
      });

      expect(url.isDeleted()).toBe(true);
      expect(url.isAnonymous()).toBe(true);
      expect(url.getAccessCode()).toBe('xyz789');
    });
  });
});
