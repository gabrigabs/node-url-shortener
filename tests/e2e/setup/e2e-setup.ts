/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { PrismaModule } from '../../../src/prisma/prisma.module';
import { UserModule } from '../../../src/user/user.module';
import { AuthModule } from '../../../src/auth/auth.module';
import { UrlsModule } from '../../../src/urls/urls.module';
import { ShortenModule } from '../../../src/shorten/shorten.module';

jest.mock('bcrypt', () => ({
  hash: jest.fn((password: string) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((plain: string, hashed: string) => {
    if (hashed.startsWith('hashed_')) {
      return Promise.resolve(hashed === `hashed_${plain}`);
    }
    return Promise.resolve(true);
  }),
}));
import { MyUrlsModule } from '../../../src/my-urls/my-urls.module';
import { RedirectModule } from '../../../src/redirect/redirect.module';
import { GlobalExceptionFilter } from '../../../src/common/filters/global-exception.filter';
import { AppController } from '../../../src/app.controller';
import { AppService } from '../../../src/app.service';

let app: INestApplication;
let prisma: any;
let moduleFixture: TestingModule;

const createMockPrismaService = () => {
  const data = {
    users: new Map(),
    urls: new Map(),
  };

  return {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),

    user: {
      create: jest.fn((args) => {
        const user = {
          id: `user_${Date.now()}_${Math.random()}`,
          email: args.data.email,
          password: args.data.password,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };
        data.users.set(user.id, user);
        return Promise.resolve(user);
      }),
      findUnique: jest.fn((args) => {
        if (args.where.email) {
          const user = Array.from(data.users.values()).find(
            (u: any) => u.email === args.where.email,
          );
          return Promise.resolve(user || null);
        }
        if (args.where.id) {
          return Promise.resolve(data.users.get(args.where.id) || null);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn(() => Promise.resolve(Array.from(data.users.values()))),
      update: jest.fn((args) => {
        const user = data.users.get(args.where.id);
        if (user) {
          Object.assign(user, args.data, { updatedAt: new Date() });
          return Promise.resolve(user);
        }
        return Promise.reject(new Error('User not found'));
      }),
      delete: jest.fn((args) => {
        const user = data.users.get(args.where.id);
        if (user) {
          data.users.delete(args.where.id);
          return Promise.resolve(user);
        }
        return Promise.reject(new Error('User not found'));
      }),
      deleteMany: jest.fn(() => {
        const count = data.users.size;
        data.users.clear();
        return Promise.resolve({ count });
      }),
    },

    url: {
      create: jest.fn((args) => {
        const url = {
          id: `url_${Date.now()}_${Math.random()}`,
          originalUrl: args.data.originalUrl,
          shortCode: args.data.shortCode,
          customAlias: args.data.customAlias || null,
          userId: args.data.userId || null,
          accessCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };
        data.urls.set(url.id, url);
        return Promise.resolve(url);
      }),
      findUnique: jest.fn((args) => {
        if (args.where.id) {
          const url = data.urls.get(args.where.id);

          return Promise.resolve(url || null);
        }
        if (args.where.shortCode) {
          const url = Array.from(data.urls.values()).find(
            (u: any) => u.shortCode === args.where.shortCode && !u.deletedAt,
          );
          return Promise.resolve(url || null);
        }
        if (args.where.customAlias) {
          const url = Array.from(data.urls.values()).find(
            (u: any) =>
              u.customAlias === args.where.customAlias && !u.deletedAt,
          );
          return Promise.resolve(url || null);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn((args) => {
        let urls = Array.from(data.urls.values());

        if (args?.where?.userId) {
          urls = urls.filter((u: any) => u.userId === args.where.userId);
        }

        if (args?.where?.deletedAt === null) {
          urls = urls.filter((u: any) => !u.deletedAt);
        }

        return Promise.resolve(urls);
      }),
      update: jest.fn((args) => {
        const url = data.urls.get(args.where.id);
        if (url) {
          const updatedData = { ...args.data };
          if (args.data.accessCount?.increment) {
            updatedData.accessCount =
              url.accessCount + args.data.accessCount.increment;
          }
          Object.assign(url, updatedData, { updatedAt: new Date() });
          return Promise.resolve(url);
        }
        return Promise.reject(new Error('URL not found'));
      }),
      delete: jest.fn((args) => {
        const url = data.urls.get(args.where.id);
        if (url) {
          data.urls.delete(args.where.id);
          return Promise.resolve(url);
        }
        return Promise.reject(new Error('URL not found'));
      }),
      deleteMany: jest.fn(() => {
        const count = data.urls.size;
        data.urls.clear();
        return Promise.resolve({ count });
      }),
      count: jest.fn((args) => {
        let urls = Array.from(data.urls.values());

        if (args?.where?.shortCode) {
          urls = urls.filter((u: any) => u.shortCode === args.where.shortCode);
        }

        if (args?.where?.customAlias) {
          urls = urls.filter(
            (u: any) => u.customAlias === args.where.customAlias,
          );
        }

        if (!args?.where?.deletedAt) {
          urls = urls.filter((u: any) => !u.deletedAt);
        }

        return Promise.resolve(urls.length);
      }),
      findFirst: jest.fn((args) => {
        let urls = Array.from(data.urls.values());

        if (args?.where?.OR) {
          urls = urls.filter((u: any) => {
            return args.where.OR.some((condition: any) => {
              if (condition.shortCode) {
                return u.shortCode === condition.shortCode;
              }
              if (condition.customAlias) {
                return u.customAlias === condition.customAlias;
              }
              return false;
            });
          });
        }

        if (args?.where?.deletedAt === null) {
          urls = urls.filter((u: any) => !u.deletedAt);
        }

        return Promise.resolve(urls[0] || null);
      }),
    },
  };
};

beforeAll(async () => {
  process.env.DATABASE_URL = 'mock://localhost:5432/mock_db';
  process.env.JWT_SECRET = 'test-jwt-secret-e2e';
  process.env.BASE_URL = 'http://localhost:3000';
  process.env.PORT = '3000';
  process.env.NODE_ENV = 'test';

  const mockPrisma = createMockPrismaService();

  moduleFixture = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
      }),

      CacheModule.register({
        isGlobal: true,
        ttl: 0,
      }),

      WinstonModule.forRoot({
        transports: [
          new winston.transports.Console({
            level: 'error',
            silent: true,
          }),
        ],
      }),

      ThrottlerModule.forRoot([
        {
          ttl: 60000,
          limit: 1000,
        },
      ]),
      PrismaModule,
      UserModule,
      AuthModule,
      UrlsModule,
      ShortenModule,
      MyUrlsModule,
      RedirectModule,
    ],
    controllers: [AppController],
    providers: [
      AppService,
      {
        provide: APP_GUARD,
        useClass: ThrottlerGuard,
      },
      {
        provide: APP_FILTER,
        useClass: GlobalExceptionFilter,
      },
    ],
  })
    .overrideProvider(PrismaService)
    .useValue(mockPrisma)
    .compile();

  app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();

  prisma = app.get(PrismaService);
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
});

afterEach(async () => {
  if (prisma) {
    await prisma.url.deleteMany();
    await prisma.user.deleteMany();
  }
});

export { app, prisma, moduleFixture };
export const getApp = () => app;
export const getPrisma = () => prisma;
