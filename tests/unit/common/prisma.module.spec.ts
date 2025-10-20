import { PrismaModule } from '../../../src/prisma/prisma.module';

describe('PrismaModule', () => {
  it('deve estar definido', () => {
    expect(PrismaModule).toBeDefined();
  });

  it('deve ser uma classe', () => {
    expect(typeof PrismaModule).toBe('function');
  });

  it('deve ter metadados de módulo', () => {
    const providers = Reflect.getMetadata(
      'providers',
      PrismaModule,
    ) as unknown[];
    expect(providers).toBeDefined();
    expect(Array.isArray(providers)).toBe(true);
  });
});
