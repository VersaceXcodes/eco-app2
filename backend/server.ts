import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';

dotenv.config();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error response utility
interface ErrorResponse {
  success: false;
  message: string;
  error_code?: string;
  details?: any;
  timestamp: string;
}

function createErrorResponse(
  message: string,
  error?: any,
  errorCode?: string
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errorCode) {
    response.error_code = errorCode;
  }

  if (error) {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return response;
}

// Database setup
const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432, JWT_SECRET = 'your-secret-key' } = process.env;

const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

const app = express();
const port = process.env.PORT || 3000;

// Storage setup
const storageDir = path.join(__dirname, 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, storageDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// Middleware
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files from storage
app.use('/storage', express.static(storageDir));

/*
 * Authentication middleware for protected routes
 * Verifies JWT token and loads user data into req.user
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(createErrorResponse('Access token required', null, 'AUTH_TOKEN_MISSING'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT id, email, password, created_at, is_active FROM users WHERE id = $1', [decoded.user_id]);
      
      if (result.rows.length === 0) {
        return res.status(401).json(createErrorResponse('Invalid token - user not found', null, 'AUTH_USER_NOT_FOUND'));
      }

      req.user = result.rows[0];
      next();
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(403).json(createErrorResponse('Invalid or expired token', error, 'AUTH_TOKEN_INVALID'));
  }
};

/*
 * User Registration endpoint
 * Creates a new user with basic profile information and eco-goals
 */
app.post('/api/users', async (req, res) => {
  try {
    const { email, password, name, location } = req.body;

    // Validation
    if (!email || !password || !name || !location) {
      return res.status(400).json(createErrorResponse('All fields (email, password, name, location) are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    if (password.length < 6) {
      return res.status(400).json(createErrorResponse('Password must be at least 6 characters long', null, 'PASSWORD_TOO_SHORT'));
    }

    const client = await pool.connect();
    
    try {
      // Check if user exists
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json(createErrorResponse('User with this email already exists', null, 'USER_ALREADY_EXISTS'));
      }

      // Create user (NO HASHING - store password directly for development)
      const userId = uuidv4();
      const result = await client.query(
        'INSERT INTO users (id, email, password, created_at, is_active) VALUES ($1, $2, $3, NOW(), true) RETURNING *',
        [userId, email.toLowerCase().trim(), password]
      );

      const user = result.rows[0];

      // Generate JWT
      const token = jwt.sign(
        { user_id: user.id, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      res.status(201).json({
        id: user.id,
        email: user.email,
        password: user.password,
        created_at: user.created_at,
        is_active: user.is_active,
        name: name,
        location: location,
        eco_goals: [],
        impact_score: 0,
        achievements: [],
        challenges: [],
        reports: [],
        auth_token: token
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * User Login endpoint
 * Authenticates user and returns JWT token
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(createErrorResponse('Email and password are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    
    try {
      // Find user (NO HASHING - direct password comparison for development)
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
      if (result.rows.length === 0) {
        return res.status(401).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
      }

      const user = result.rows[0];

      // Check password (direct comparison for development)
      if (password !== user.password) {
        return res.status(401).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
      }

      // Generate JWT
      const token = jwt.sign(
        { user_id: user.id, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      res.json({
        current_user: {
          id: user.id,
          email: user.email,
          password: user.password,
          created_at: user.created_at,
          is_active: user.is_active,
          name: user.name || '',
          location: user.location || '',
          eco_goals: [],
          impact_score: 0,
          achievements: [],
          challenges: [],
          reports: []
        },
        auth_token: token
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * User Signup endpoint (alias for registration)
 * Same functionality as POST /users
 */
app.post('/api/auth/signup', async (req, res) => {
  // Redirect to the main registration endpoint
  req.url = '/api/users';
  app._router.handle(req, res);
});

/*
 * Get User Profile endpoint
 * Retrieves user profile information with aggregated data
 */
app.get('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [user_id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
      }

      const user = result.rows[0];

      res.json({
        id: user.id,
        email: user.email,
        password: user.password,
        created_at: user.created_at,
        is_active: user.is_active,
        name: user.name || '',
        location: user.location || '',
        eco_goals: [],
        impact_score: 0,
        achievements: [],
        challenges: [],
        reports: []
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Update User Profile endpoint
 * Updates user profile information including eco-goals
 */
app.patch('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { name, location, eco_goals } = req.body;

    if (req.user.id !== user_id) {
      return res.status(403).json(createErrorResponse('You can only update your own profile', null, 'UNAUTHORIZED_UPDATE'));
    }

    const client = await pool.connect();
    
    try {
      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (location !== undefined) {
        updates.push(`location = $${paramCount++}`);
        values.push(location);
      }

      if (updates.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATE_FIELDS'));
      }

      values.push(user_id);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
      }

      const user = result.rows[0];

      res.json({
        id: user.id,
        email: user.email,
        password: user.password,
        created_at: user.created_at,
        is_active: user.is_active,
        name: user.name || '',
        location: user.location || '',
        eco_goals: eco_goals || [],
        impact_score: 0,
        achievements: [],
        challenges: [],
        reports: []
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Log Activity endpoint
 * Records an eco-action with impact points for a user
 */
app.post('/api/activities', authenticateToken, async (req, res) => {
  try {
    const { user_id, action_type, impact_points } = req.body;

    if (!user_id || !action_type || impact_points === undefined) {
      return res.status(400).json(createErrorResponse('user_id, action_type, and impact_points are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    if (typeof impact_points !== 'number' || impact_points < 0) {
      return res.status(400).json(createErrorResponse('impact_points must be a positive number', null, 'INVALID_IMPACT_POINTS'));
    }

    const activityId = uuidv4();
    const timestamp = new Date().toISOString();

    // For now, we'll return a mock response since we don't have the activities table schema
    // This would normally insert into an activities table
    
    res.status(201).json({
      id: activityId,
      user_id: user_id,
      action_type: action_type,
      timestamp: timestamp,
      impact_points: impact_points
    });
  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * List Challenges endpoint
 * Returns challenges filtered by location and project type
 */
app.get('/api/challenges', authenticateToken, async (req, res) => {
  try {
    const { location, project_type } = req.query;

    // Mock challenges data - in real implementation would query challenges table
    const mockChallenges = [
      {
        id: uuidv4(),
        title: "Beach Cleanup Challenge",
        description: "Join us in cleaning local beaches to protect marine life",
        start_date: "2024-01-15T09:00:00Z",
        end_date: "2024-01-31T18:00:00Z",
        goal: 100,
        participants: [req.user.id]
      },
      {
        id: uuidv4(),
        title: "Tree Planting Initiative",
        description: "Plant trees in urban areas to improve air quality",
        start_date: "2024-02-01T08:00:00Z",
        end_date: "2024-02-28T17:00:00Z",
        goal: 500,
        participants: []
      }
    ];

    let filteredChallenges = mockChallenges;

    if (location) {
      // Filter by location - in real implementation would use geospatial queries
      filteredChallenges = filteredChallenges.filter(challenge => 
        challenge.title.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (project_type) {
      // Filter by project type
      filteredChallenges = filteredChallenges.filter(challenge => {
        const title = challenge.title.toLowerCase();
        switch(project_type) {
          case 'cleanup':
            return title.includes('cleanup');
          case 'tree_planting':
            return title.includes('tree') || title.includes('plant');
          case 'education':
            return title.includes('education') || title.includes('learn');
          case 'awareness':
            return title.includes('awareness') || title.includes('campaign');
          default:
            return true;
        }
      });
    }

    res.json(filteredChallenges);
  } catch (error) {
    console.error('List challenges error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Create Challenge endpoint
 * Creates a new environmental challenge
 */
app.post('/api/challenges', authenticateToken, async (req, res) => {
  try {
    const { title, description, start_date, end_date, goal, participants } = req.body;

    if (!title || !description || !start_date || !end_date || !goal) {
      return res.status(400).json(createErrorResponse('title, description, start_date, end_date, and goal are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const challengeId = uuidv4();
    
    const newChallenge = {
      id: challengeId,
      title,
      description,
      start_date,
      end_date,
      goal,
      participants: participants || []
    };

    // In real implementation, would insert into challenges table
    
    res.status(201).json(newChallenge);
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Get Specific Challenge endpoint
 * Retrieves details for a specific challenge
 */
app.get('/api/challenges/:challenge_id', authenticateToken, async (req, res) => {
  try {
    const { challenge_id } = req.params;

    // Mock challenge data - in real implementation would query challenges table
    const mockChallenge = {
      id: challenge_id,
      title: "Beach Cleanup Challenge",
      description: "Join us in cleaning local beaches to protect marine life",
      start_date: "2024-01-15T09:00:00Z",
      end_date: "2024-01-31T18:00:00Z",
      goal: 100,
      participants: [req.user.id]
    };

    res.json(mockChallenge);
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Submit Issue Report endpoint
 * Allows users to report environmental issues with media uploads
 */
app.post('/api/issue-reports', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    const { user_id, location, description } = req.body;
    
    if (!user_id || !location || !description) {
      return res.status(400).json(createErrorResponse('user_id, location, and description are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const reportId = uuidv4();
    let media_url = '';
    
    if (req.file) {
      media_url = `/storage/${req.file.filename}`;
    }

    const newReport = {
      id: reportId,
      user_id,
      location,
      description,
      media_url,
      status: 'pending'
    };

    // In real implementation, would insert into reports table
    
    res.status(201).json(newReport);
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Get Issue Report endpoint
 * Retrieves details of a specific environmental issue report
 */
app.get('/api/issue-reports/:report_id', authenticateToken, async (req, res) => {
  try {
    const { report_id } = req.params;

    // Mock report data - in real implementation would query reports table
    const mockReport = {
      id: report_id,
      user_id: req.user.id,
      location: "Beach Park, Santa Monica",
      description: "Large amount of plastic waste washed up on shore",
      media_url: "https://picsum.photos/id/237/400/300",
      status: 'pending'
    };

    res.json(mockReport);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Get Dashboard endpoint
 * Returns user's impact dashboard with aggregated data
 */
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const { time_range } = req.query;

    // Mock dashboard data - in real implementation would aggregate from activities table
    let impact_score = 150;
    const achievements = ["Eco-Champion", "Tree Planter", "Waste Warrior"];

    // Adjust impact score based on time range
    switch(time_range) {
      case 'today':
        impact_score = 15;
        break;
      case 'this_week':
        impact_score = 75;
        break;
      case 'this_month':
        impact_score = 150;
        break;
      default:
        impact_score = 500; // All time
    }

    res.json({
      impact_score,
      achievements
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * List Educational Content endpoint
 * Returns educational resources filtered by category and level
 */
app.get('/api/education', authenticateToken, async (req, res) => {
  try {
    const { category, level } = req.query;

    // Mock educational content - in real implementation would query education table
    let mockContent = [
      {
        id: uuidv4(),
        title: "Understanding Climate Change",
        content: "A comprehensive guide to climate science and its impacts",
        category: "climate",
        level: "beginner"
      },
      {
        id: uuidv4(),
        title: "Advanced Waste Management Techniques",
        content: "Expert-level strategies for reducing waste in organizations",
        category: "waste",
        level: "expert"
      },
      {
        id: uuidv4(),
        title: "Biodiversity Conservation Basics",
        content: "Introduction to protecting local ecosystems and wildlife",
        category: "biodiversity",
        level: "beginner"
      }
    ];

    // Filter by category
    if (category) {
      mockContent = mockContent.filter(content => content.category === category);
    }

    // Filter by level
    if (level) {
      mockContent = mockContent.filter(content => content.level === level);
    }

    // Remove category and level from response as per API spec
    const responseContent = mockContent.map(content => ({
      id: content.id,
      title: content.title,
      content: content.content
    }));

    res.json(responseContent);
  } catch (error) {
    console.error('List education error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Get Profile Summary endpoint
 * Returns user's profile summary with eco-goals and impact score
 */
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    // Mock profile data - in real implementation would query user and related tables
    const profileSummary = {
      eco_goals: ["Reduce plastic use by 30%", "Plant 10 trees", "Use public transport daily"],
      impact_score: 285
    };

    res.json(profileSummary);
  } catch (error) {
    console.error('Get profile summary error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * List Marketplace Products endpoint
 * Returns eco-products filtered by category
 */
app.get('/api/marketplace', authenticateToken, async (req, res) => {
  try {
    const { product_category } = req.query;

    // Mock marketplace data - in real implementation would query products table
    let mockProducts = [
      {
        id: uuidv4(),
        name: "Bamboo Water Bottle",
        brand: "EcoBottle Co.",
        impact: 25,
        category: "reusable"
      },
      {
        id: uuidv4(),
        name: "Organic Cotton Tote Bag",
        brand: "GreenBags Ltd.",
        impact: 15,
        category: "reusable"
      },
      {
        id: uuidv4(),
        name: "Solar Phone Charger",
        brand: "SolarTech",
        impact: 50,
        category: "eco_brands"
      }
    ];

    // Filter by product category
    if (product_category) {
      mockProducts = mockProducts.filter(product => product.category === product_category);
    }

    // Remove category from response as per API spec
    const responseProducts = mockProducts.map(product => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      impact: product.impact
    }));

    res.json(responseProducts);
  } catch (error) {
    console.error('List marketplace products error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA catch-all: serve index.html for non-API routes only
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export { app, pool };

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`EcoTrack server running on port ${port} and listening on 0.0.0.0`);
});