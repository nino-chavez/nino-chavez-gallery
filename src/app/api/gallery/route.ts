import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

export async function GET() {
  try {
    const contextPath = resolve(process.cwd(), 'gallery-context.json');
    const data = await readFile(contextPath, 'utf-8');
    const context = JSON.parse(data);

    return NextResponse.json(context);
  } catch (error) {
    console.error('Error reading gallery context:', error);
    return NextResponse.json(
      { error: 'Failed to load gallery context' },
      { status: 500 }
    );
  }
}
