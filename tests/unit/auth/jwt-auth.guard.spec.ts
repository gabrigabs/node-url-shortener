import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe('canActivate', () => {
    it('deve ser definido', () => {
      expect(guard).toBeDefined();
    });

    it('deve chamar super.canActivate', () => {
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ headers: {} }),
        }),
        getType: jest.fn().mockReturnValue('http'),
      } as unknown as ExecutionContext;

      const superSpy = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(superSpy).toHaveBeenCalledWith(context);
      expect(result).toBe(true);

      superSpy.mockRestore();
    });
  });
});
