import { ValidationArguments } from 'class-validator';
import { IsPublicUrlConstraint } from '../../../src/shorten/validators/is-public-url.validator';

describe('IsPublicUrlConstraint', () => {
  let validator: IsPublicUrlConstraint;

  beforeEach(() => {
    validator = new IsPublicUrlConstraint();
  });

  describe('validate', () => {
    describe('URLs válidas (públicas)', () => {
      it('deve aceitar URLs públicas válidas', () => {
        const validUrls = [
          'https://www.google.com',
          'https://example.com',
          'http://github.com',
          'https://api.openai.com/v1',
          'https://www.youtube.com/watch?v=123',
        ];

        validUrls.forEach((url) => {
          expect(validator.validate(url)).toBe(true);
        });
      });

      it('deve aceitar URLs com subdomínios públicos', () => {
        const validUrls = [
          'https://api.example.com',
          'https://cdn.example.com',
          'https://blog.mysite.org',
        ];

        validUrls.forEach((url) => {
          expect(validator.validate(url)).toBe(true);
        });
      });

      it('deve aceitar URLs com portas públicas', () => {
        const validUrls = [
          'https://example.com:8080',
          'http://api.example.com:3000',
        ];

        validUrls.forEach((url) => {
          expect(validator.validate(url)).toBe(true);
        });
      });
    });

    describe('URLs bloqueadas (localhost)', () => {
      it('deve bloquear localhost', () => {
        const blockedUrls = [
          'http://localhost',
          'http://localhost:3000',
          'https://localhost',
          'http://127.0.0.1',
          'http://127.0.0.1:8080',
          'https://127.0.0.1',
        ];

        blockedUrls.forEach((url) => {
          expect(validator.validate(url)).toBe(false);
        });
      });

      it('deve bloquear IPv6 localhost', () => {
        const blockedUrls = ['http://[::1]', 'https://[::1]:3000'];

        blockedUrls.forEach((url) => {
          expect(validator.validate(url)).toBe(false);
        });
      });
    });

    describe('URLs bloqueadas (IPs privados RFC 1918)', () => {
      it('deve bloquear range 10.0.0.0/8', () => {
        const blockedUrls = [
          'http://10.0.0.1',
          'http://10.1.1.1',
          'http://10.255.255.255',
          'https://10.10.10.10:8080',
        ];

        blockedUrls.forEach((url) => {
          expect(validator.validate(url)).toBe(false);
        });
      });

      it('deve bloquear range 172.16.0.0/12', () => {
        const blockedUrls = [
          'http://172.16.0.1',
          'http://172.20.1.1',
          'http://172.31.255.255',
          'https://172.25.10.10',
        ];

        blockedUrls.forEach((url) => {
          expect(validator.validate(url)).toBe(false);
        });
      });

      it('deve bloquear range 192.168.0.0/16', () => {
        const blockedUrls = [
          'http://192.168.0.1',
          'http://192.168.1.1',
          'http://192.168.255.255',
          'https://192.168.100.50',
        ];

        blockedUrls.forEach((url) => {
          expect(validator.validate(url)).toBe(false);
        });
      });
    });

    describe('URLs bloqueadas (outros IPs reservados)', () => {
      it('deve bloquear IPs link-local (169.254.0.0/16)', () => {
        const blockedUrls = [
          'http://169.254.0.1',
          'http://169.254.169.254',
          'http://169.254.255.255',
        ];

        blockedUrls.forEach((url) => {
          expect(validator.validate(url)).toBe(false);
        });
      });

      it('deve bloquear 0.0.0.0', () => {
        expect(validator.validate('http://0.0.0.0')).toBe(false);
        expect(validator.validate('http://0.0.0.0:3000')).toBe(false);
      });

      it('deve bloquear endereço de broadcast', () => {
        expect(validator.validate('http://255.255.255.255')).toBe(false);
      });
    });

    describe('URLs bloqueadas (domínios internos)', () => {
      it('deve bloquear domínios .local (mDNS)', () => {
        const blockedUrls = [
          'http://server.local',
          'http://mycomputer.local',
          'https://printer.local',
        ];

        blockedUrls.forEach((url) => {
          expect(validator.validate(url)).toBe(false);
        });
      });

      it('deve bloquear domínios internos comuns', () => {
        const blockedUrls = [
          'http://server.internal',
          'http://api.corp',
          'http://router.lan',
          'http://nas.home',
        ];

        blockedUrls.forEach((url) => {
          expect(validator.validate(url)).toBe(false);
        });
      });
    });

    describe('URLs inválidas', () => {
      it('deve aceitar (retornar true) para strings inválidas no catch', () => {
        const invalidUrls = ['not-a-url', 'just text', ''];

        invalidUrls.forEach((url) => {
          expect(validator.validate(url)).toBe(true);
        });
      });
    });

    describe('Edge cases', () => {
      it('deve ser case-insensitive para hostnames', () => {
        expect(validator.validate('http://LOCALHOST')).toBe(false);
        expect(validator.validate('http://LocalHost')).toBe(false);
        expect(validator.validate('http://SERVER.LOCAL')).toBe(false);
      });

      it('deve aceitar URLs com paths e query strings', () => {
        const validUrls = [
          'https://example.com/path/to/resource',
          'https://example.com?query=value',
          'https://example.com/path?query=value#anchor',
        ];

        validUrls.forEach((url) => {
          expect(validator.validate(url)).toBe(true);
        });
      });
    });
  });

  describe('defaultMessage', () => {
    it('deve retornar mensagem de erro apropriada', () => {
      const args = {
        property: 'originalUrl',
      } as ValidationArguments;

      const message = validator.defaultMessage(args);

      expect(message).toBe(
        'originalUrl deve ser uma URL pública válida (não pode ser localhost, IP privado ou domínio interno)',
      );
    });

    it('deve incluir o nome da propriedade na mensagem', () => {
      const args = {
        property: 'url',
      } as ValidationArguments;

      const message = validator.defaultMessage(args);

      expect(message).toContain('url');
      expect(message).toContain('deve ser uma URL pública válida');
    });
  });
});
