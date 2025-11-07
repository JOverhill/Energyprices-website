import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const router = Router()

// TEMPORARY: In-memory user storage (replace with database later)
interface User {
  id: string
  email: string
  password: string
  name: string
}

const users: User[] = []

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' })
      return
    }

    // Check if user exists
    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' })
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user: User = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name
    }

    users.push(user)

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    )

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    // Find user
    const user = users.find(u => u.email === email)
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Verify token endpoint
router.get('/verify', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' })
      return
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string; email: string }

    const user = users.find(u => u.id === decoded.id)
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export { router as authRouter }
