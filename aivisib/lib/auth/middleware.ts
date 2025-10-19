import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader, JWTPayload } from './jwt'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: AuthenticatedRequest) => {
    const authHeader = req.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    req.user = payload
    return handler(req)
  }
}

export function getUserFromRequest(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get('authorization')
  const token = getTokenFromHeader(authHeader)

  if (!token) {
    return null
  }

  return verifyToken(token)
}
