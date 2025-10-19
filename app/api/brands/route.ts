import { NextResponse } from 'next/server'
import { createBrand, getBrandById, getBrandsByUserId } from '@/lib/supabase/queries'
import { CreateBrandSchema } from '@/lib/validation/brand'
import { AppError, formatErrorResponse } from '@/lib/utils/errors'
import { ApiErrorCode } from '@/types/api'
import { getUserFromRequest } from '@/lib/auth/middleware'

export async function POST(request: Request) {
  try {
    // Check authentication
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('[POST /api/brands] Request body:', body)

    // Validate
    const validated = CreateBrandSchema.parse(body)
    console.log('[POST /api/brands] Validation passed:', validated)

    // Add user_id to the brand
    const brandWithUser = {
      ...validated,
      user_id: user.userId,
    }

    // Create brand
    const brand = await createBrand(brandWithUser)

    return NextResponse.json(brand, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/brands] Error:', error)

    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        formatErrorResponse(
          new AppError(409, 'A brand with this domain already exists', ApiErrorCode.DUPLICATE_DOMAIN)
        ),
        { status: 409 }
      )
    }

    return NextResponse.json(formatErrorResponse(error), { status: 400 })
  }
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // If id is provided, get single brand
    if (id) {
      const brand = await getBrandById(id)

      // Verify the brand belongs to the user
      if (brand.user_id !== user.userId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      return NextResponse.json(brand)
    }

    // Otherwise, get all brands for the user
    const brands = await getBrandsByUserId(user.userId)
    return NextResponse.json(brands)
  } catch (error) {
    return NextResponse.json(formatErrorResponse(error), { status: 400 })
  }
}
