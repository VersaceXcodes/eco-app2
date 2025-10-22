// tests/unit/user.spec.js
import { pool } from '../server.ts';
import { createUser } from '../controllers/userController';

jest.mock('../database', () => ({
  query: jest.fn(),
}));

describe('User Management', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test('createUser should insert new user with default is_active', async () => {
    const mockUser = { email: 'test@example.com', password: 'password123', name: 'Test User', location: 'NYC' };
    pool.query.mockReturnValueOnce({ rows: [{ id: 'test123' }] });

    const result = await createUser(mockUser);
    expect(result).toEqual(expect.objectContaining({ id: 'test123' }));
    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO users (email, password, name, location, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['test@example.com', 'password123', 'Test User', 'NYC', true]
    );
  });

  test('updateUser should update profile fields', async () => {
    const mockUser = { id: 'test123', name: 'Old Name', location: 'OLD' };
    pool.query.mockReturnValueOnce({ rowCount: 1 });

    await updateUser('test123', { name: 'New Name', location: 'NYC' });
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE users SET name = $2, location = $3 WHERE id = $1',
      ['test123', 'New Name', 'NYC']
    );
  });
});

// tests/integration/auth.spec.js
import request from 'supertest';
import { app } from '../server.ts';

describe('Authentication', () => {
  test('POST /auth/login should return JWT token', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('auth_token');
  });

  test('POST /auth/login should fail with invalid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'invalid@example.com', password: 'wrong' });

    expect(response.statusCode).toBe(401);
  });
});

// tests/integration/activities.spec.js
describe('Activity Logging', () => {
  test('POST /activities should create new activity', async () => {
    const response = await request(app)
      .post('/activities')
      .set('Authorization', 'Bearer test_token')
      .send({ user_id: 'test123', action_type: 'recycled', impact_points: 5 });

    expect(response.statusCode).toBe(201);
    expect(response.body.impact_points).toBe(5);
  });

  test('POST /activities should reject negative impact points', async () => {
    const response = await request(app)
      .post('/activities')
      .set('Authorization', 'Bearer test_token')
      .send({ user_id: 'test123', action_type: 'recycled', impact_points: -5 });

    expect(response.statusCode).toBe(400);
  });
});

// tests/database/challenges.spec.js
describe('Challenges CRUD', () => {
  beforeEach(async () => {
    // Setup test database with transactions
  });

  test('GET /challenges should filter by location', async () => {
    const response = await request(app)
      .get('/challenges')
      .query({ location: 'NYC' });

    expect(response.body).toHaveLength(1); // Assuming one challenge in NYC
  });

  test('POST /challenges should create challenge with participants', async () => {
    const response = await request(app)
      .post('/challenges')
      .set('Authorization', 'Bearer test_token')
      .send({ 
        title: 'Tree Planting', 
        goal: 100, 
        participants: ['user1', 'user2'] 
      });

    expect(response.body.goal).toBe(100);
    expect(response.body.participants).toEqual(expect.arrayContaining(['user1', 'user2']));
  });
});

// tests/database/reports.spec.js
describe('Issue Reporting', () => {
  test('POST /issue-reports should create pending report', async () => {
    const response = await request(app)
      .post('/issue-reports')
      .set('Authorization', 'Bearer test_token')
      .send({ 
        user_id: 'test123', 
        location: 'NYC', 
        description: 'Pollution', 
        media_url: 'http://example.com/image.jpg' 
      });

    expect(response.body.status).toBe('pending');
  });

  test('GET /issue-reports/{id} should return verified report', async () => {
    const response = await request(app)
      .get('/issue-reports/123')
      .set('Authorization', 'Bearer test_token');

    expect(response.body.status).toBe('verified');
  });
});