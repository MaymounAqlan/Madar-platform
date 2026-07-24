import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { AuthService } from '../src/auth/auth.service';
// import { ApiResponse } from '../src/common/interceptors/transform.interceptor';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let sessionModel: any;
  let jwtService: JwtService;

  const mockUser = {
    _id: '650000000000000000000001',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    role: 'student',
    isActive: true,
    emailVerified: true,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockSessionModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock-jwt-token'),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: getModelToken('Session'), useValue: mockSessionModel },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken('User'));
    sessionModel = module.get(getModelToken('Session'));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens and user on valid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      
      mockUserModel.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockSessionModel.create.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw UnauthorizedException on invalid email', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.login({ email: 'wrong@example.com', password: 'pass' }))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login({ email: 'test@example.com', password: 'wrongpass' }))
        .rejects.toThrow('Invalid email or password');
    });
  });

  describe('register', () => {
    it('should create new user and return tokens', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        firstNameAr: 'جديد',
        lastName: 'User',
        lastNameAr: 'مستخدم',
        role: 'student' as any,
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      mockSessionModel.create.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw ConflictException on duplicate email', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(service.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        firstNameAr: 'اختبار',
        lastName: 'User',
        lastNameAr: 'اختبار',
        role: 'student' as any,
      })).rejects.toThrow();
    });
  });
});
