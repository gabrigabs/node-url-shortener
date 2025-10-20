import { validate } from 'class-validator';
import { CreateUrlDto } from '../../../src/my-urls/dtos/create-url.dto';

describe('CreateUrlDto', () => {
  describe('validação de campos', () => {
    describe('originalUrl', () => {
      it('deve aceitar URL HTTP válida', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'http://example.com';

        const errors = await validate(dto);
        const urlErrors = errors.filter((e) => e.property === 'originalUrl');

        expect(urlErrors).toHaveLength(0);
      });

      it('deve aceitar URL HTTPS válida', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'https://www.google.com/search?q=test';

        const errors = await validate(dto);
        const urlErrors = errors.filter((e) => e.property === 'originalUrl');

        expect(urlErrors).toHaveLength(0);
      });

      it('deve rejeitar URL sem protocolo', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'www.example.com';

        const errors = await validate(dto);
        const urlErrors = errors.filter((e) => e.property === 'originalUrl');

        expect(urlErrors.length).toBeGreaterThan(0);
        expect(urlErrors[0].constraints).toHaveProperty('isUrl');
      });

      it('deve rejeitar URL vazia', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = '';

        const errors = await validate(dto);
        const urlErrors = errors.filter((e) => e.property === 'originalUrl');

        expect(urlErrors.length).toBeGreaterThan(0);
        expect(urlErrors[0].constraints).toHaveProperty('isNotEmpty');
      });

      it('deve rejeitar URL com protocolo FTP', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'ftp://example.com';

        const errors = await validate(dto);
        const urlErrors = errors.filter((e) => e.property === 'originalUrl');

        expect(urlErrors.length).toBeGreaterThan(0);
      });
    });

    describe('customAlias', () => {
      it('deve aceitar alias válido', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'https://example.com';
        dto.customAlias = 'meu-link';

        const errors = await validate(dto);
        const aliasErrors = errors.filter((e) => e.property === 'customAlias');

        expect(aliasErrors).toHaveLength(0);
      });

      it('deve aceitar alias com números', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'https://example.com';
        dto.customAlias = 'link-123';

        const errors = await validate(dto);
        const aliasErrors = errors.filter((e) => e.property === 'customAlias');

        expect(aliasErrors).toHaveLength(0);
      });

      it('deve aceitar alias com underscores', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'https://example.com';
        dto.customAlias = 'meu_link_teste';

        const errors = await validate(dto);
        const aliasErrors = errors.filter((e) => e.property === 'customAlias');

        expect(aliasErrors).toHaveLength(0);
      });

      it('deve aceitar alias opcional undefined', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'https://example.com';

        const errors = await validate(dto);
        const aliasErrors = errors.filter((e) => e.property === 'customAlias');

        expect(aliasErrors).toHaveLength(0);
      });

      it('deve rejeitar alias muito curto', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'https://example.com';
        dto.customAlias = 'ab';

        const errors = await validate(dto);
        const aliasErrors = errors.filter((e) => e.property === 'customAlias');

        expect(aliasErrors.length).toBeGreaterThan(0);
        expect(aliasErrors[0].constraints).toHaveProperty('minLength');
      });

      it('deve rejeitar alias muito longo', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'https://example.com';
        dto.customAlias = 'a'.repeat(31);

        const errors = await validate(dto);
        const aliasErrors = errors.filter((e) => e.property === 'customAlias');

        expect(aliasErrors.length).toBeGreaterThan(0);
        expect(aliasErrors[0].constraints).toHaveProperty('maxLength');
      });

      it('deve rejeitar alias com caracteres especiais inválidos', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'https://example.com';
        dto.customAlias = 'meu@link!';

        const errors = await validate(dto);
        const aliasErrors = errors.filter((e) => e.property === 'customAlias');

        expect(aliasErrors.length).toBeGreaterThan(0);
        expect(aliasErrors[0].constraints).toHaveProperty('matches');
      });

      it('deve rejeitar alias com espaços', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'https://example.com';
        dto.customAlias = 'meu link';

        const errors = await validate(dto);
        const aliasErrors = errors.filter((e) => e.property === 'customAlias');

        expect(aliasErrors.length).toBeGreaterThan(0);
      });

      it('deve aceitar alias com 3 caracteres (mínimo válido)', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'https://example.com';
        dto.customAlias = 'abc';

        const errors = await validate(dto);
        const aliasErrors = errors.filter((e) => e.property === 'customAlias');

        expect(aliasErrors).toHaveLength(0);
      });

      it('deve aceitar alias com 30 caracteres (máximo válido)', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'https://example.com';
        dto.customAlias = 'a'.repeat(30);

        const errors = await validate(dto);
        const aliasErrors = errors.filter((e) => e.property === 'customAlias');

        expect(aliasErrors).toHaveLength(0);
      });

      it('deve aceitar alias com letras maiúsculas (case insensitive)', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'https://example.com';
        dto.customAlias = 'MeuLink';

        const errors = await validate(dto);
        const aliasErrors = errors.filter((e) => e.property === 'customAlias');

        expect(aliasErrors).toHaveLength(0);
      });
    });

    describe('validação completa', () => {
      it('deve validar DTO completo válido', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'https://www.example.com/page';
        dto.customAlias = 'my-custom-link';

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('deve validar DTO sem customAlias', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = 'https://www.example.com/page';

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('deve falhar com múltiplos erros', async () => {
        const dto = new CreateUrlDto();
        dto.originalUrl = '';
        dto.customAlias = 'x';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const hasUrlError = errors.some((e) => e.property === 'originalUrl');
        const hasAliasError = errors.some((e) => e.property === 'customAlias');

        expect(hasUrlError).toBe(true);
        expect(hasAliasError).toBe(true);
      });
    });
  });
});
