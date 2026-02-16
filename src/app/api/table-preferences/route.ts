import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  tablePreferencesGetSchema,
  tablePreferencesPutSchema,
} from '@/lib/validate';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = tablePreferencesGetSchema.safeParse({
    datasetId: searchParams.get('datasetId') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dataset = await prisma.dataset.findFirst({
    where: { id: parsed.data.datasetId, userId: session.user.id },
    select: { id: true },
  });
  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  const pref = await prisma.tablePreference.findUnique({
    where: {
      userId_datasetId: { userId: session.user.id, datasetId: parsed.data.datasetId },
    },
  });

  if (!pref) {
    return NextResponse.json({
      columnOrder: [],
      columnSizing: {},
      columnVisibility: {},
    });
  }

  return NextResponse.json({
    columnOrder: (pref.columnOrder as string[]) ?? [],
    columnSizing: (pref.columnSizing as Record<string, number>) ?? {},
    columnVisibility: (pref.columnVisibility as Record<string, boolean>) ?? {},
  });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = tablePreferencesPutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dataset = await prisma.dataset.findFirst({
    where: { id: parsed.data.datasetId, userId: session.user.id },
    select: { id: true },
  });
  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  const update: { columnOrder?: string[]; columnSizing?: Record<string, number>; columnVisibility?: Record<string, boolean> } = {};
  if (parsed.data.columnOrder !== undefined) update.columnOrder = parsed.data.columnOrder;
  if (parsed.data.columnSizing !== undefined) update.columnSizing = parsed.data.columnSizing;
  if (parsed.data.columnVisibility !== undefined) update.columnVisibility = parsed.data.columnVisibility;

  await prisma.tablePreference.upsert({
    where: {
      userId_datasetId: { userId: session.user.id, datasetId: parsed.data.datasetId },
    },
    create: {
      userId: session.user.id,
      datasetId: parsed.data.datasetId,
      columnOrder: update.columnOrder ?? [],
      columnSizing: update.columnSizing ?? {},
      columnVisibility: update.columnVisibility ?? {},
    },
    update,
  });

  return NextResponse.json({ ok: true });
}
