import { MyUrlsModule } from '../../../src/my-urls/my-urls.module';

describe('MyUrlsModule', () => {
  it('deve estar definido', () => {
    expect(MyUrlsModule).toBeDefined();
  });

  it('deve ser uma classe', () => {
    expect(typeof MyUrlsModule).toBe('function');
  });

  it('deve ter o decorator @Module', () => {
    const metadata = Reflect.getMetadata('imports', MyUrlsModule) as unknown[];
    expect(metadata).toBeDefined();
  });
});
