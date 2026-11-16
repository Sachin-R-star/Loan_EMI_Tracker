import { Router } from 'express';

const router = Router();

// Staff users with mock credentials
const USERS = [
  {
    id: 'USR-01',
    username: 'staff',
    password: 'password123',
    name: 'Rohit Sharma (Loan Officer)',
    role: 'Loan Officer'
  },
  {
    id: 'USR-02',
    username: 'admin',
    password: 'admin123',
    name: 'Sneha Rao (Branch Manager)',
    role: 'Branch Manager'
  }
];

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = USERS.find(
    u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  return res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    },
    token: `mock-jwt-token-${user.id}-${Date.now()}`
  });
});

export default router;
