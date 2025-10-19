import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hashPassword, validatePassword } from '@/lib/auth/password'
import { generateToken } from '@/lib/auth/jwt'
import { z } from 'zod'

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validated = RegisterSchema.parse(body)

    // Validate password strength
    const passwordCheck = validatePassword(validated.password)
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.error },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validated.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password)

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: validated.email,
        password_hash: passwordHash,
      })
      .select('id, email, created_at')
      .single()

    if (error) {
      console.error('[POST /api/auth/register] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        token,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[POST /api/auth/register] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
