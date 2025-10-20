import { RedirectModule } from '../../../src/redirect/redirect.module';

describe('RedirectModule', () => {
  it('deve estar definido', () => {
    expect(RedirectModule).toBeDefined();
  });

  it('deve ser uma classe', () => {
    expect(typeof RedirectModule).toBe('function');
  });

  it('deve ter o decorator @Module', () => {
    const metadata = Reflect.getMetadata(
      'imports',
      RedirectModule,
    ) as unknown[];
    expect(metadata).toBeDefined();
  });
});
