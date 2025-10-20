import { UserModule } from '../../../src/user/user.module';

describe('UserModule', () => {
  it('deve estar definido', () => {
    expect(UserModule).toBeDefined();
  });

  it('deve ser uma classe', () => {
    expect(typeof UserModule).toBe('function');
  });

  it('deve ter metadados de módulo', () => {
    const providers = Reflect.getMetadata('providers', UserModule) as unknown[];
    expect(providers).toBeDefined();
    expect(Array.isArray(providers)).toBe(true);
  });
});
