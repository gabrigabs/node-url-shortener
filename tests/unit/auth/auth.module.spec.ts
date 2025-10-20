import { AuthModule } from '../../../src/auth/auth.module';

describe('AuthModule', () => {
  it('deve estar definido', () => {
    expect(AuthModule).toBeDefined();
  });

  it('deve ser uma classe', () => {
    expect(typeof AuthModule).toBe('function');
  });

  it('deve ter o decorator @Module', () => {
    const metadata = Reflect.getMetadata('imports', AuthModule) as unknown[];
    expect(metadata).toBeDefined();
  });
});
