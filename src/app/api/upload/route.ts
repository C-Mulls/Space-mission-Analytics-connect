import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseAndValidateCsv, MAX_CSV_BYTES } from '@/lib/csv';

export const runtime = 'nodejs';

const MAX_FILE_BYTES = MAX_CSV_BYTES;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Content-Type must be multipart/form-data' },
      { status: 400 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'Missing or invalid file. Use field name "file".' },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      {
        error: `File too large. Maximum size is ${MAX_FILE_BYTES / 1024 / 1024}MB.`,
      },
      { status: 400 }
    );
  }

  const name = formData.get('name');
  const datasetName =
    typeof name === 'string' && name.trim()
      ? name.trim().slice(0, 255)
      : file.name.replace(/\.[^/.]+$/, '') || 'Unnamed dataset';

  let csvText: string;
  try {
    csvText = await file.text();
  } catch {
    return NextResponse.json(
      { error: 'Could not read file as text' },
      { status: 400 }
    );
  }

  const { rows, droppedRowCount, errors } = parseAndValidateCsv(csvText);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: errors.join('; '), errors },
      { status: 400 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'No valid rows after parsing (check date format YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  const dates = rows.map((r) => r.date.getTime());
  const dateMin = new Date(Math.min(...dates));
  const dateMax = new Date(Math.max(...dates));

  try {
    const dataset = await prisma.dataset.create({
      data: {
        userId: session.user.id,
        name: datasetName,
        originalFileName: file.name,
        rowCount: rows.length,
        droppedRowCount,
        dateMin,
        dateMax,
      },
    });

    await prisma.missionRow.createMany({
      data: rows.map((r) => ({
        datasetId: dataset.id,
        company: r.company.slice(0, 500),
        location: r.location.slice(0, 500),
        date: r.date,
        time: r.time.slice(0, 100),
        rocket: r.rocket.slice(0, 500),
        mission: r.mission.slice(0, 500),
        rocketStatus: r.rocketStatus.slice(0, 100),
        price: r.price != null ? r.price : null,
        missionStatus: r.missionStatus.slice(0, 100),
      })),
    });

    const companyCounts = new Map<string, { total: number; success: number }>();
    for (const r of rows) {
      const key = r.company;
      const cur = companyCounts.get(key) ?? { total: 0, success: 0 };
      cur.total += 1;
      if (r.missionStatus === 'Success') cur.success += 1;
      companyCounts.set(key, cur);
    }
    await prisma.aggregateCompany.createMany({
      data: Array.from(companyCounts.entries()).map(([company, v]) => ({
        datasetId: dataset.id,
        company: company.slice(0, 500),
        missionCount: v.total,
        successCount: v.success,
      })),
    });

    const yearCounts = new Map<number, { total: number; success: number }>();
    for (const r of rows) {
      const y = r.date.getFullYear();
      const cur = yearCounts.get(y) ?? { total: 0, success: 0 };
      cur.total += 1;
      if (r.missionStatus === 'Success') cur.success += 1;
      yearCounts.set(y, cur);
    }
    await prisma.aggregateYear.createMany({
      data: Array.from(yearCounts.entries()).map(([year, v]) => ({
        datasetId: dataset.id,
        year,
        missionCount: v.total,
        successCount: v.success,
      })),
    });

    const statusCounts = new Map<string, number>();
    for (const r of rows) {
      const s = r.missionStatus;
      statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
    }
    await prisma.aggregateStatus.createMany({
      data: Array.from(statusCounts.entries()).map(([status, missionCount]) => ({
        datasetId: dataset.id,
        status: status.slice(0, 100),
        missionCount,
      })),
    });

    const rocketCounts = new Map<string, number>();
    for (const r of rows) {
      const rk = r.rocket || '';
      if (rk.toLowerCase() !== 'nan') rocketCounts.set(rk, (rocketCounts.get(rk) ?? 0) + 1);
    }
    await prisma.aggregateRocket.createMany({
      data: Array.from(rocketCounts.entries()).map(([rocket, missionCount]) => ({
        datasetId: dataset.id,
        rocket: rocket.slice(0, 500),
        missionCount,
      })),
    });
  } catch (e) {
    console.error('Upload DB error:', e);
    return NextResponse.json(
      { error: 'Failed to save dataset' },
      { status: 500 }
    );
  }

  const created = await prisma.dataset.findFirst({
    where: { userId: session.user.id },
    orderBy: { uploadedAt: 'desc' },
  });

  return NextResponse.json({
    id: created?.id,
    name: datasetName,
    rowCount: rows.length,
    droppedRowCount,
  });
}
