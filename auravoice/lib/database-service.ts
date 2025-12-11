/**
 * AuraVoice Database Service
 *
 * This service abstracts all database operations.
 * Replace the mock API calls with actual database queries.
 *
 * Supported databases:
 * - PostgreSQL (recommended with Supabase or Neon)
 * - MySQL
 * - MongoDB
 */

import type { Agent, ActiveCall, CallReport, EmotionType, User } from "./types"

// Database client configuration
// Uncomment and configure based on your database choice:

// For PostgreSQL with pg:
import { Pool } from "pg"
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// For Supabase:
// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// For Neon/PostgreSQL:
// import { neon } from '@neondatabase/serverless'
// const sql = neon(process.env.DATABASE_URL!)

const MOCK_USERS: User[] = [
  {
    id: "user-1",
    email: "admin@auravoice.com",
    name: "Admin User",
    role: "admin",
    teamId: "team-1",
    avatar: "/professional-woman-supervisor.png",
  },
  {
    id: "user-2",
    email: "agent@auravoice.com",
    name: "Agent User",
    role: "agent",
    teamId: "team-1",
    avatar: "/professional-man-agent.png",
  },
]

const MOCK_PASSWORDS: Record<string, string> = {
  "admin@auravoice.com": "admin123",
  "agent@auravoice.com": "agent123",
}

/**
 * Database service interface
 * All methods return promises for async operations
 */
export const db = {
  // ==================
  // USER OPERATIONS
  // ==================

  /**
   * Authenticate a user by email and password
   *
   * INTEGRATION INSTRUCTIONS FOR YOUR POSTGRESQL:
   * \`\`\`
   * const result = await pool.query(
   *   'SELECT id, email, name, role, team_id, avatar FROM users WHERE email = $1',
   *   [email]
   * )
   *
   * if (result.rows.length === 0) return null
   * const user = result.rows[0]
   *
   * // Compare password with bcrypt
   * const isValid = await bcrypt.compare(password, user.password_hash)
   * if (!isValid) return null
   *
   * return {
   *   id: user.id,
   *   email: user.email,
   *   name: user.name,
   *   role: user.role,
   *   teamId: user.team_id,
   *   avatar: user.avatar
   * }
   * \`\`\`
   */
  async authenticateUser(email: string, password: string): Promise<User | null> {
    console.log("[DB] Authenticating user:", email)

    // TODO: Replace with actual database query
    // ========================================

    // Mock implementation - simulates database lookup
    const user = MOCK_USERS.find((u) => u.email === email)
    const storedPassword = MOCK_PASSWORDS[email]

    if (user && storedPassword && storedPassword === password) {
      return user
    }
    return null
  },

  /**
   * Register a new user
   *
   * INTEGRATION INSTRUCTIONS FOR YOUR POSTGRESQL:
   * \`\`\`
   * // Check if email already exists
   * const existing = await pool.query(
   *   'SELECT id FROM users WHERE email = $1',
   *   [email]
   * )
   * if (existing.rows.length > 0) return { error: 'EMAIL_EXISTS' }
   *
   * // Hash password with bcrypt
   * const passwordHash = await bcrypt.hash(password, 10)
   *
   * // Insert new user
   * const result = await pool.query(
   *   `INSERT INTO users (email, name, password_hash, role, team_id)
   *    VALUES ($1, $2, $3, $4, $5)
   *    RETURNING id, email, name, role, team_id`,
   *   [email, name, passwordHash, role, teamId]
   * )
   *
   * return { user: result.rows[0] }
   * \`\`\`
   */
  async registerUser(
    email: string,
    password: string,
    name: string,
    role: "agent" | "admin",
  ): Promise<{ user?: User; error?: string }> {
    console.log("[DB] Registering user:", email, "with role:", role)

    // TODO: Replace with actual database query
    // ========================================

    // Mock implementation - simulates database insert
    const existingUser = MOCK_USERS.find((u) => u.email === email)
    if (existingUser) {
      return { error: "EMAIL_EXISTS" }
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      role,
      teamId: "team-1", // Default team
    }

    // In real implementation, this would be a database INSERT
    MOCK_USERS.push(newUser)
    MOCK_PASSWORDS[email] = password

    return { user: newUser }
  },

  /**
   * Check if email already exists
   */
  async emailExists(email: string): Promise<boolean> {
    console.log("[DB] Checking if email exists:", email)

    // TODO: Replace with actual database query
    // const result = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    // return result.rows.length > 0

    return MOCK_USERS.some((u) => u.email === email)
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    console.log("[DB] Getting user by ID:", userId)

    // TODO: Replace with actual database query
    // const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
    // return result.rows[0] || null

    return MOCK_USERS.find((u) => u.id === userId) || null
  },

  /**
   * Get all agents in a team
   */
  async getAgentsByTeamId(teamId: string): Promise<Agent[]> {
    console.log("[DB] Getting agents for team:", teamId)
    // TODO: Replace with actual database query
    return []
  },

  // ==================
  // ACTIVE CALLS (Real-time)
  // ==================

  async getActiveCalls(teamId: string): Promise<ActiveCall[]> {
    console.log("[DB] Getting active calls for team:", teamId)
    return []
  },

  async createActiveCall(agentId: string, callSid?: string): Promise<ActiveCall> {
    console.log("[DB] Creating active call for agent:", agentId)
    const call: ActiveCall = {
      id: `call-${Date.now()}`,
      agentId,
      startTime: new Date(),
      currentEmotion: { emotion: "calm", confidence: 100, timestamp: Date.now() },
      emotionHistory: [],
      alertTriggered: false,
      alertDuration: 0,
    }
    return call
  },

  async updateActiveCallEmotion(
    callId: string,
    emotion: EmotionType,
    confidence: number,
    alertTriggered?: boolean,
  ): Promise<void> {
    console.log("[DB] Updating call emotion:", callId, emotion)
  },

  async endActiveCall(callId: string): Promise<void> {
    console.log("[DB] Ending active call:", callId)
  },

  // ==================
  // CALL REPORTS
  // ==================

  async createCallReport(reportData: Omit<CallReport, "id">): Promise<string> {
    console.log("[DB] Creating call report for agent:", reportData.agentId)
    return `report-${Date.now()}`
  },

  async getCallReports(filters?: {
    agentId?: string
    teamId?: string
    emotion?: EmotionType
    dateFrom?: Date
    dateTo?: Date
    limit?: number
    offset?: number
  }): Promise<CallReport[]> {
    console.log("[DB] Getting call reports with filters:", filters)
    return []
  },

  async getCallReportById(reportId: string): Promise<CallReport | null> {
    console.log("[DB] Getting call report:", reportId)
    return null
  },

  async deleteCallReport(reportId: string): Promise<void> {
    console.log("[DB] Deleting call report:", reportId)
  },

  // ==================
  // FILE STORAGE
  // ==================

  async uploadAudioFile(file: File, userId: string): Promise<string> {
    console.log("[DB] Uploading audio file:", file.name)
    return URL.createObjectURL(file)
  },

  async deleteAudioFile(fileUrl: string): Promise<void> {
    console.log("[DB] Deleting audio file:", fileUrl)
  },
}
