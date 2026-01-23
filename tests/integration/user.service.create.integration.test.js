// tests/integration/user.service.create.integration.test.js
const userService = require('../../services/user.service');
const postgresAdapter = require('../../database/adapters/postgres.adapter');
const bcrypt = require('bcrypt');
const syncService = require('../../services/sync.service');

// Mock syncService
jest.mock('../../services/sync.service');

describe('UserService - Create Integration Test', () => {
  let db;
  const testUser = {
    email: `testuser-${Date.now()}@example.com`,
    password: 'mySecretPassword123',
    full_name: 'Real DB Test User',
  };
  let createdUserId;

  beforeAll(async () => {
    // Establish connection to the real database
    await postgresAdapter.connect();
    db = postgresAdapter.getInstance();
  });

  afterAll(async () => {
    // Clean up created user and close connection
    if (createdUserId) {
      try {
        await db.query('DELETE FROM users WHERE user_id = $1', [createdUserId]);
        console.log(`Cleaned up user with ID: ${createdUserId}`);
      } catch (e) {
        console.error('Error during cleanup:', e);
      }
    }
    await postgresAdapter.disconnect();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  })

  it('should create a new user in the real database and call sync service', async () => {
    // --- Act ---
    const createdUser = await userService.create(testUser);
    createdUserId = createdUser.id; // Save ID for cleanup

    // --- Assert ---

    // 1. Check the object returned by the service
    expect(createdUser).toBeDefined();
    expect(createdUser.id).toBeDefined(); // Should be a UUID
    expect(createdUser.email).toBe(testUser.email);
    expect(createdUser.full_name).toBe(testUser.full_name);
    expect(createdUser.role).toBe('student'); // Default role from DB schema
    expect(createdUser.password_hash).toBeUndefined();

    // 2. Check the data directly in the database
    const dbUserRes = await db.query('SELECT * FROM users WHERE user_id = $1', [createdUserId]);
    const dbUser = dbUserRes.rows[0];

    expect(dbUser).toBeDefined();
    expect(dbUser.email).toBe(testUser.email);
    expect(dbUser.first_name).toBe('Real');
    expect(dbUser.last_name).toBe('DB Test User');

    // 3. Check that the password in the database is a hash
    expect(dbUser.password_hash).toBeDefined();
    expect(dbUser.password_hash).not.toBe(testUser.password);
    
    const isMatch = await bcrypt.compare(testUser.password, dbUser.password_hash);
    expect(isMatch).toBe(true);
    
    // 4. Check if sync service was called
    expect(syncService.syncOnCreate).toHaveBeenCalledTimes(1);
    expect(syncService.syncOnCreate).toHaveBeenCalledWith('users', createdUser);
  });

  it('should throw an error when trying to create a user with an existing email', async () => {
    // Attempt to register the same user again
    await expect(userService.create(testUser)).rejects.toThrow('User with this email already exists.');
  });
});