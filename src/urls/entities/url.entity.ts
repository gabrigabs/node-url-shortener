import { Url as PrismaUrl } from '../../../generated/prisma';

/**
 * Entidade Url
 */
export class Url implements PrismaUrl {
  /**
   * Identificador único da URL (UUID)
   */
  id: string;

  /**
   * URL original completa
   */
  originalUrl: string;

  /**
   * Código curto gerado (6 caracteres)
   */
  shortCode: string;

  /**
   * Alias personalizado opcional (até 30 caracteres)
   */
  customAlias: string | null;

  /**
   * ID do usuário proprietário (UUID)
   */
  userId: string | null;

  /**
   * Contador de acessos à URL
   */
  accessCount: number;

  /**
   * Data de criação do registro
   */
  createdAt: Date;

  /**
   * Data da última atualização
   */
  updatedAt: Date;

  /**
   * Data de exclusão lógica (soft delete)
   */
  deletedAt: Date | null;

  /**
   * Construtor da entidade Url
   * @param partial - Dados parciais para inicializar a entidade
   */
  constructor(partial: Partial<Url>) {
    Object.assign(this, partial);
  }

  /**
   * Verifica se a URL está deletada (soft delete)
   * @returns true se a URL foi deletada, false caso contrário
   */
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  /**
   * Verifica se a URL pertence a um usuário específico
   * @param userId - ID do usuário para verificar
   * @returns true se a URL pertence ao usuário, false caso contrário
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Obtém o código de acesso (customAlias ou shortCode)
   * @returns Alias personalizado se existir, senão retorna o shortCode
   */
  getAccessCode(): string {
    return this.customAlias || this.shortCode;
  }

  /**
   * Verifica se a URL é anônima (sem proprietário)
   * @returns true se a URL não tem userId, false caso contrário
   */
  isAnonymous(): boolean {
    return this.userId === null;
  }
}
