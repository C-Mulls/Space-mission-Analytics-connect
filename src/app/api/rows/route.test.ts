import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { GET } from './route';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dataset: { findFirst: vi.fn() },
    missionRow: { findMany: vi.fn(), count: vi.fn() },
  },
}));

const mockGetServerSession = vi.mocked(getServerSession);

describe('GET /api/rows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET(new Request('http://localhost/api/rows?datasetId=ds-1'));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when dataset does not belong to user (rejects access to another user dataset)', async () => {
    const { prisma } = await import('@/lib/prisma');
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-a' }, expires: '' });
    vi.mocked(prisma.dataset.findFirst).mockResolvedValue(null);
    const res = await GET(new Request('http://localhost/api/rows?datasetId=ds-other-user&page=1&pageSize=25'));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Dataset not found');
    expect(prisma.dataset.findFirst).toHaveBeenCalledWith({
      where: { id: 'ds-other-user', userId: 'user-a' },
      select: { id: true },
    });
  });
});
