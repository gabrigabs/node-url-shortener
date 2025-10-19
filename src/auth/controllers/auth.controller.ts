import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { RegisterAuthDto } from '../dtos/register-auth.dto';
import { LoginAuthDto } from '../dtos/login-auth.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { ErrorResponseDto } from '../../common/dtos/response.dto';

/**
 * Controller de autenticação
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint de registro de novo usuário
   * @param registerDto - Dados de registro (email e senha)
   * @returns Token JWT e dados do usuário
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiBody({ type: RegisterAuthDto })
  @ApiResponse({
    status: 201,
    description: 'Usuário registrado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email já cadastrado',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
    type: ErrorResponseDto,
  })
  async register(
    @Body() registerDto: RegisterAuthDto,
  ): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Endpoint de login (autenticação)
   * @param loginDto - Credenciais (email e senha)
   * @returns Token JWT e dados do usuário
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer login' })
  @ApiBody({ type: LoginAuthDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
    type: ErrorResponseDto,
  })
  async login(@Body() loginDto: LoginAuthDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }
}
