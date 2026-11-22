import { handler as a } from './a.tsx'
import { handler as b } from './b.tsx'

// Pages built by test agents. /experiments/a and /experiments/b
export const experimentPages: Record<string, (context: any) => Promise<Response>> = { a, b }
