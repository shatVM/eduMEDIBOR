// tests/unit/user.service.test.js
const UserService = require('../../services/user.service');
const postgresAdapter = require('../../database/adapters/postgres.adapter');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const syncService = require('../../services/sync.service');
const dbManager = require('../../database/manager');

// Mock all dependencies
jest.mock('../../database/adapters/postgres.adapter');
jest.mock('../../database/manager');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../services/sync.service');

describe('UserService', () => {
  let userService;
  let mockPostgresInstance;
  let mockUserModel;

  beforeEach(() => {
    userService = new UserService();
    
    // Setup mock for postgresAdapter.getInstance()
    mockPostgresInstance = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
    postgresAdapter.getInstance.mockReturnValue(mockPostgresInstance);
    
    mockUserModel = {
        findByEmail: jest.fn()
    };
    dbManager.get.mockReturnValue(mockUserModel);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    // ... (tests from user.service.create.test.js, adapted)
    it('should successfully create a new user', async () => {
        const userData = { email: 'test@example.com', password: 'password123', full_name: 'Test User' };
        const hashedPassword = 'hashedPassword123';
        const dbUser = { user_id: 'uuid-123', email: userData.email, first_name: 'Test', last_name: 'User', role: 'student', registration_date: new Date() };

        mockPostgresInstance.query
          .mockResolvedValueOnce({ rows: [] }) // getUserByEmail
          .mockResolvedValueOnce({ rows: [dbUser] }); // INSERT
        bcrypt.hash.mockResolvedValue(hashedPassword);
        syncService.syncOnCreate.mockResolvedValue(true);

        const result = await userService.create(userData);

        expect(mockPostgresInstance.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', [userData.email]);
        expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
        expect(mockPostgresInstance.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'), ['test@example.com', 'Test', 'User', 'hashedPassword123']);
        expect(syncService.syncOnCreate).toHaveBeenCalled();
        expect(result.role).toBe('student');
    });
    
    it('should throw an error if user already exists', async () => {
        const userData = { email: 'existing@example.com', password: 'password123', full_name: 'Existing User' };
        mockPostgresInstance.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
        await expect(userService.create(userData)).rejects.toThrow('User with this email already exists.');
    });

    it('should throw an error for missing required fields', async () => {
        await expect(userService.create({ email: 'test@test.com' })).rejects.toThrow('Email, password, and full name are required.');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user by ID', async () => {
      await userService.deleteUser('uuid-123');
      expect(mockPostgresInstance.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1', ['uuid-123']);
    });

    it('should throw an error if no ID is provided', async () => {
      await expect(userService.deleteUser(null)).rejects.toThrow('User ID is required for deletion.');
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user object if found', async () => {
        const mockUser = { id: 1, email: 'test@example.com' };
        mockPostgresInstance.query.mockResolvedValue({ rows: [mockUser] });
        const user = await userService.getUserByEmail('test@example.com');
        expect(user).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
        mockPostgresInstance.query.mockResolvedValue({ rows: [] });
        const user = await userService.getUserByEmail('notfound@example.com');
        expect(user).toBeNull();
    });
  });
  
  describe('login', () => {
    it('should return a token and user on successful login', async () => {
        const credentials = { email: 'test@example.com', password: 'password123' };
        const mockUser = { user_id: 'uuid-123', email: credentials.email, password_hash: 'hashed', role: 'student' };
        const token = 'jwt-token';
        
        mockUserModel.findByEmail.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue(token);

        const result = await userService.login(credentials);

        expect(mockUserModel.findByEmail).toHaveBeenCalledWith(credentials.email);
        expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, mockUser.password_hash);
        expect(jwt.sign).toHaveBeenCalledWith({ id: mockUser.user_id, role: mockUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        expect(result.token).toBe(token);
        expect(result.user.password_hash).toBeUndefined();
    });

    it('should throw an error for invalid credentials if user not found', async () => {
        mockUserModel.findByEmail.mockResolvedValue(null);
        await expect(userService.login({ email: 'wrong@test.com', password: '123' })).rejects.toThrow('Invalid email or password.');
    });

    it('should throw an error for invalid credentials if password doesn\'t match', async () => {
        const mockUser = { user_id: 'uuid-123', password_hash: 'hashed' };
        mockUserModel.findByEmail.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);
        await expect(userService.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow('Invalid email or password.');
    });
  });

  describe('updateUserProfile', () => {
      it('should correctly build and execute an update query', async () => {
          const updates = { full_name: 'New Name', city: 'New City' };
          await userService.updateUserProfile('uuid-123', updates);
          
          expect(mockPostgresInstance.query).toHaveBeenCalledWith(
              'UPDATE users SET full_name = $1, city = $2 WHERE id = $3',
              ['New Name', 'New City', 'uuid-123']
          );
      });

      it('should not run a query if data is empty', async () => {
          await userService.updateUserProfile('uuid-123', {});
          expect(mockPostgresInstance.query).not.toHaveBeenCalled();
      });
  });
});