import { User as PrismaUser } from '../../../generated/prisma';

/**
 * Entidade de Usuário
 */
export class User implements PrismaUser {
  /**
   * Identificador único do usuário (UUID)
   */
  id: string;

  /**
   * Email único do usuário
   */
  email: string;

  /**
   * Senha do usuário
   */
  password: string;

  /**
   * Data de criação do registro
   */
  createdAt: Date;

  /**
   * Data da última atualização
   */
  updatedAt: Date;

  /**
   * Data do soft delete
   */
  deletedAt: Date | null;

  /**
   * Construtor da entidade User
   * @param partial - Dados parciais para inicializar a entidade
   */
  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }

  /**
   * Verifica se o usuário está deletado
   * @returns true se o usuário foi deletado, false caso contrário
   */
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  /**
   * Retorna dados do usuário sem informações sensíveis
   * @returns Objeto User sem a propriedade password
   */
  toSafeObject(): Omit<User, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = this;
    return new User(safeUser) as Omit<User, 'password'>;
  }
}
