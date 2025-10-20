import { ExecutionContext } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../../../src/auth/guards/optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;

  beforeEach(() => {
    guard = new OptionalJwtAuthGuard();
  });

  describe('handleRequest', () => {
    it('deve retornar user quando autenticação for bem-sucedida', () => {
      const mockUser = { id: 'user-uuid', email: 'test@example.com' };

      const result = guard.handleRequest(null, mockUser) as
        | typeof mockUser
        | null;

      expect(result).toEqual(mockUser);
    });

    it('deve retornar null quando não há usuário', () => {
      const result = guard.handleRequest(null, null) as null;

      expect(result).toBeNull();
    });

    it('deve retornar null quando há erro na autenticação', () => {
      const mockError = new Error('Invalid token');
      const mockUser = { id: 'user-uuid', email: 'test@example.com' };

      const result = guard.handleRequest(mockError, mockUser) as null;

      expect(result).toBeNull();
    });

    it('deve retornar null quando usuário é undefined', () => {
      const result = guard.handleRequest(null, undefined) as null;

      expect(result).toBeNull();
    });
  });

  describe('canActivate', () => {
    it('deve chamar super.canActivate', () => {
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ headers: {} }),
        }),
        getType: jest.fn().mockReturnValue('http'),
      } as unknown as ExecutionContext;

      const superSpy = jest
        .spyOn(
          Object.getPrototypeOf(OptionalJwtAuthGuard.prototype),
          'canActivate',
        )
        .mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(superSpy).toHaveBeenCalledWith(context);
      expect(result).toBe(true);

      superSpy.mockRestore();
    });
  });
});
