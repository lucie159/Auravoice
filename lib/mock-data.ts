import type { Agent, ActiveCall, CallReport, EmotionType, EmotionData, User } from "./types"

export const MOCK_USERS: User[] = [
  {
    id: "user-admin-1",
    email: "edene.lucie@auravoice.com",
    name: "Edene Lucie",
    role: "admin",
    teamId: "team-1",
    avatar: "/professional-woman-supervisor.png",
  },
  {
    id: "user-agent-1",
    email: "ngako.audrey@auravoice.com",
    name: "Ngako Audrey",
    role: "agent",
    teamId: "team-1",
  },
  {
    id: "user-agent-2",
    email: "defogang.diovenil@auravoice.com",
    name: "Defogang Diovenil",
    role: "agent",
    teamId: "team-1",
  },
  {
    id: "user-agent-3",
    email: "eyenga.minkonda@auravoice.com",
    name: "Eyenga Minkonda",
    role: "agent",
    teamId: "team-1",
  },
  {
    id: "user-agent-4",
    email: "lowe.fred@auravoice.com",
    name: "Lowe Fred",
    role: "agent",
    teamId: "team-1",
  },
  {
    id: "user-agent-5",
    email: "tchomgang.larissa@auravoice.com",
    name: "Tchomgang Larissa",
    role: "agent",
    teamId: "team-1",
  },
  {
    id: "user-agent-6",
    email: "tamoka.russel@auravoice.com",
    name: "Tamoka Russel",
    role: "agent",
    teamId: "team-1",
  },
  {
    id: "user-agent-7",
    email: "matemb.augustin@auravoice.com",
    name: "Matemb Augustin",
    role: "agent",
    teamId: "team-1",
  },
]

// Passwords map - will be replaced by your PostgreSQL with hashed passwords
export const MOCK_PASSWORDS: Record<string, string> = {
  "edene.lucie@auravoice.com": "admin123",
  "ngako.audrey@auravoice.com": "agent123",
  "defogang.diovenil@auravoice.com": "agent123",
  "eyenga.minkonda@auravoice.com": "agent123",
  "lowe.fred@auravoice.com": "agent123",
  "tchomgang.larissa@auravoice.com": "agent123",
  "tamoka.russel@auravoice.com": "agent123",
  "matemb.augustin@auravoice.com": "agent123",
}

export const MOCK_AGENTS: Agent[] = MOCK_USERS.filter((u) => u.role === "agent").map((user, index) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: "agent" as const,
  teamId: user.teamId,
  status: index < 4 ? "on-call" : index < 6 ? "online" : "break",
}))

// Generate random emotion with weighted probability
function generateRandomEmotion(): EmotionType {
  const weights: [EmotionType, number][] = [
    ["calm", 40],
    ["joy", 20],
    ["anxiety", 15],
    ["anger", 10],
    ["sadness", 10],
    ["surprise", 5],
  ]

  const total = weights.reduce((sum, [, w]) => sum + w, 0)
  let random = Math.random() * total

  for (const [emotion, weight] of weights) {
    random -= weight
    if (random <= 0) return emotion
  }
  return "calm"
}

// Generate mock active calls
export function generateMockActiveCalls(): ActiveCall[] {
  return MOCK_AGENTS.filter((agent) => agent.status === "on-call").map((agent) => {
    const startTime = new Date(Date.now() - Math.random() * 600000)
    const emotion = generateRandomEmotion()
    const isAlert = emotion === "anger" && Math.random() > 0.5

    return {
      id: `call-${agent.id}`,
      agentId: agent.id,
      startTime,
      currentEmotion: {
        emotion,
        confidence: 70 + Math.random() * 30,
        timestamp: Date.now(),
      },
      emotionHistory: [],
      alertTriggered: isAlert,
      alertDuration: isAlert ? Math.floor(Math.random() * 60) + 30 : 0,
    }
  })
}

// Generate mock emotion timeline for a call
export function generateMockEmotionTimeline(durationSeconds: number): EmotionData[] {
  const data: EmotionData[] = []
  const interval = 3000

  for (let t = 0; t < durationSeconds * 1000; t += interval) {
    data.push({
      emotion: generateRandomEmotion(),
      confidence: 60 + Math.random() * 40,
      timestamp: t,
    })
  }

  return data
}

// Generate mock call reports
export function generateMockCallReports(count = 20): CallReport[] {
  const reports: CallReport[] = []

  for (let i = 0; i < count; i++) {
    const agent = MOCK_AGENTS[Math.floor(Math.random() * MOCK_AGENTS.length)]
    const duration = 120 + Math.floor(Math.random() * 480)
    const clientEmotions = generateMockEmotionTimeline(duration)
    const agentEmotions = generateMockEmotionTimeline(duration)

    const emotionCounts: Record<EmotionType, number> = {
      joy: 0,
      anger: 0,
      sadness: 0,
      anxiety: 0,
      calm: 0,
      surprise: 0,
    }

    clientEmotions.forEach((e) => emotionCounts[e.emotion]++)
    const total = clientEmotions.length || 1

    const dominantEmotion = (Object.entries(emotionCounts) as [EmotionType, number][]).sort((a, b) => b[1] - a[1])[0][0]

    reports.push({
      id: `report-${i}`,
      agentId: agent.id,
      agentName: agent.name,
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      duration,
      clientEmotions,
      agentEmotions,
      dominantEmotion,
      stats: {
        angerPercentage: Math.round((emotionCounts.anger / total) * 100),
        joyPercentage: Math.round((emotionCounts.joy / total) * 100),
        calmPercentage: Math.round((emotionCounts.calm / total) * 100),
        anxietyPercentage: Math.round((emotionCounts.anxiety / total) * 100),
        surprisePercentage: Math.round((emotionCounts.surprise / total) * 100),
        sadnessPercentage: Math.round((emotionCounts.sadness / total) * 100),
        averageConfidence: clientEmotions.reduce((sum, e) => sum + e.confidence, 0) / total,
      },
    })
  }

  return reports.sort((a, b) => b.date.getTime() - a.date.getTime())
}

// API simulation - ready to be replaced by real PostgreSQL calls
export const api = {
  async login(email: string, password: string): Promise<User | null> {
    // TODO: Replace with real PostgreSQL query
    // const result = await db.query('SELECT * FROM users WHERE email = $1', [email])
    // Then verify password with bcrypt
    await new Promise((r) => setTimeout(r, 300))
    const user = MOCK_USERS.find((u) => u.email === email)
    const storedPassword = MOCK_PASSWORDS[email]

    if (user && storedPassword && storedPassword === password) {
      return user
    }
    return null
  },

  async register(
    email: string,
    password: string,
    name: string,
    role: "agent" | "admin",
  ): Promise<{ user?: User; error?: string }> {
    // TODO: Replace with real PostgreSQL insert
    // const hashedPassword = await bcrypt.hash(password, 10)
    // await db.query('INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)', [email, hashedPassword, name, role])
    await new Promise((r) => setTimeout(r, 300))

    if (MOCK_USERS.some((u) => u.email === email)) {
      return { error: "Cet email est déjà utilisé" }
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      role,
      teamId: "team-1",
    }

    MOCK_USERS.push(newUser)
    MOCK_PASSWORDS[email] = password

    return { user: newUser }
  },

  async getActiveCalls(): Promise<ActiveCall[]> {
    await new Promise((r) => setTimeout(r, 100))
    return generateMockActiveCalls()
  },

  async getReports(filters?: { agentId?: string; emotion?: EmotionType }): Promise<CallReport[]> {
    await new Promise((r) => setTimeout(r, 200))
    let reports = generateMockCallReports(30)

    if (filters?.agentId) {
      reports = reports.filter((r) => r.agentId === filters.agentId)
    }
    if (filters?.emotion) {
      reports = reports.filter((r) => r.dominantEmotion === filters.emotion)
    }

    return reports
  },

  async getAgents(): Promise<Agent[]> {
    await new Promise((r) => setTimeout(r, 100))
    return MOCK_AGENTS
  },

  async analyzeAudio(file: File): Promise<CallReport> {
    await new Promise((r) => setTimeout(r, 2000))
    const duration = 300 + Math.floor(Math.random() * 300)
    const clientEmotions = generateMockEmotionTimeline(duration)
    const agentEmotions = generateMockEmotionTimeline(duration)

    const emotionCounts: Record<EmotionType, number> = {
      joy: 0,
      anger: 0,
      sadness: 0,
      anxiety: 0,
      calm: 0,
      surprise: 0,
    }
    clientEmotions.forEach((e) => emotionCounts[e.emotion]++)
    const total = clientEmotions.length || 1

    const dominantEmotion = (Object.entries(emotionCounts) as [EmotionType, number][]).sort((a, b) => b[1] - a[1])[0][0]

    return {
      id: `report-new-${Date.now()}`,
      agentId: "user-agent-1",
      agentName: "Ngako Audrey",
      date: new Date(),
      duration,
      audioUrl: URL.createObjectURL(file),
      clientEmotions,
      agentEmotions,
      dominantEmotion,
      stats: {
        angerPercentage: Math.round((emotionCounts.anger / total) * 100),
        joyPercentage: Math.round((emotionCounts.joy / total) * 100),
        calmPercentage: Math.round((emotionCounts.calm / total) * 100),
        anxietyPercentage: Math.round((emotionCounts.anxiety / total) * 100),
        surprisePercentage: Math.round((emotionCounts.surprise / total) * 100),
        sadnessPercentage: Math.round((emotionCounts.sadness / total) * 100),
        averageConfidence: clientEmotions.reduce((sum, e) => sum + e.confidence, 0) / total,
      },
    }
  },
}
