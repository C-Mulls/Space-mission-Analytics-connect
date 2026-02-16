import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { GET, DELETE } from './route';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dataset: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((cb: (tx: unknown) => Promise<unknown>) => cb({
      aggregateCompany: { deleteMany: vi.fn() },
      aggregateYear: { deleteMany: vi.fn() },
      aggregateStatus: { deleteMany: vi.fn() },
      aggregateRocket: { deleteMany: vi.fn() },
      missionRow: { deleteMany: vi.fn() },
      tablePreference: { deleteMany: vi.fn() },
      dataset: { delete: vi.fn() },
    })),
  },
}));

const mockGetServerSession = vi.mocked(getServerSession);

describe('DELETE /api/datasets/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await DELETE(new Request('http://localhost'), { params: Promise.resolve({ id: 'ds-1' }) });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when dataset does not belong to user (enforces ownership)', async () => {
    const { prisma } = await import('@/lib/prisma');
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-a' }, expires: '' });
    vi.mocked(prisma.dataset.findFirst).mockResolvedValue(null);
    const res = await DELETE(new Request('http://localhost'), { params: Promise.resolve({ id: 'ds-other-user' }) });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Dataset not found');
    expect(prisma.dataset.findFirst).toHaveBeenCalledWith({
      where: { id: 'ds-other-user', userId: 'user-a' },
      select: { id: true },
    });
  });
});
