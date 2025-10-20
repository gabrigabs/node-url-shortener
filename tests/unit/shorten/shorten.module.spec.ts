import { ShortenModule } from '../../../src/shorten/shorten.module';

describe('ShortenModule', () => {
  it('deve estar definido', () => {
    expect(ShortenModule).toBeDefined();
  });

  it('deve ser uma classe', () => {
    expect(typeof ShortenModule).toBe('function');
  });

  it('deve ter o decorator @Module', () => {
    const metadata = Reflect.getMetadata('imports', ShortenModule) as unknown[];
    expect(metadata).toBeDefined();
  });
});
