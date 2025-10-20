import { UrlsModule } from '../../../src/urls/urls.module';

describe('UrlsModule', () => {
  it('deve estar definido', () => {
    expect(UrlsModule).toBeDefined();
  });

  it('deve ser uma classe', () => {
    expect(typeof UrlsModule).toBe('function');
  });

  it('deve ter o decorator @Module', () => {
    const metadata = Reflect.getMetadata('imports', UrlsModule) as unknown[];
    expect(metadata).toBeDefined();
  });
});
