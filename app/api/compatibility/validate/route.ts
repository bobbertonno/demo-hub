import { NextResponse } from 'next/server'
import { z } from 'zod'
import { enforceRateLimit, handle, readJson } from '@/lib/api/http'
import { validateManifestText } from '@/lib/compatibility/standard'

export const POST = handle(async (req: Request) => {
  enforceRateLimit(req, 'compat:validate', 30)
  const { manifest } = z.object({ manifest: z.string().max(200_000) }).parse(await readJson(req, 220_000))
  const { valid, errors } = validateManifestText(manifest)
  return NextResponse.json({ valid, errors })
})
