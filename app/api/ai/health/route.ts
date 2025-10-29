import { NextResponse } from 'next/server';
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  const hasKey = !!process.env.OPENAI_API_KEY;
  return NextResponse.json(
    {
      ok: hasKey,
      message: hasKey
        ? '✅ Clé API OpenAI détectée, assistant prêt.'
        : '❌ Aucune clé OpenAI trouvée. Ajoutez OPENAI_API_KEY dans Vercel Settings > Environment Variables.',
    },
    { status: hasKey ? 200 : 500 }
  );
}
