import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Validador customizado para verificar se a URL é pública
 * Bloqueia URLs localhost e IPs privados para prevenir SSRF attacks
 */
@ValidatorConstraint({ name: 'isPublicUrl', async: false })
export class IsPublicUrlConstraint implements ValidatorConstraintInterface {
  /**
   * Valida se a URL é pública e não aponta para recursos internos
   * @param url - URL a ser validada
   * @returns true se a URL for pública, false caso contrário
   */
  validate(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      // Bloqueia localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return false;
      }

      // Bloqueia IPv6 localhost
      if (hostname === '::1' || hostname === '[::1]') {
        return false;
      }

      // Bloqueia IPs privados (RFC 1918)
      // 10.0.0.0 - 10.255.255.255
      if (hostname.startsWith('10.')) {
        return false;
      }

      // 172.16.0.0 - 172.31.255.255
      if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) {
        return false;
      }

      // 192.168.0.0 - 192.168.255.255
      if (hostname.startsWith('192.168.')) {
        return false;
      }

      // Bloqueia link-local (169.254.0.0/16)
      if (hostname.startsWith('169.254.')) {
        return false;
      }

      // Bloqueia 0.0.0.0
      if (hostname === '0.0.0.0') {
        return false;
      }

      // Bloqueia endereços de broadcast
      if (hostname === '255.255.255.255') {
        return false;
      }

      // Bloqueia domínios .local (mDNS)
      if (hostname.endsWith('.local')) {
        return false;
      }

      // Bloqueia domínios internos comuns
      const internalDomains = ['.internal', '.corp', '.lan', '.home'];
      if (internalDomains.some((domain) => hostname.endsWith(domain))) {
        return false;
      }

      return true;
    } catch {
      return true;
    }
  }

  /**
   * Mensagem de erro customizada
   * @param args - Argumentos de validação
   * @returns Mensagem de erro
   */
  defaultMessage(args: ValidationArguments): string {
    return `${args.property} deve ser uma URL pública válida (não pode ser localhost, IP privado ou domínio interno)`;
  }
}
