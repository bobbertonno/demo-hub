import { NextResponse } from 'next/server'
import { STANDARD_VERSION, manifestJsonSchema } from '@/lib/compatibility/standard'

export const dynamic = 'force-static'

export function GET() {
  return new NextResponse(JSON.stringify(manifestJsonSchema(), null, 2), {
    headers: {
      'content-type': 'application/schema+json; charset=utf-8',
      'content-disposition': `attachment; filename="demo-hub-manifest-${STANDARD_VERSION}.schema.json"`,
    },
  })
}
