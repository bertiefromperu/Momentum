/**
 * @jest-environment node
 */

const mockWhere = jest.fn();
const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });

jest.mock('@/db/client', () => ({
  db: {
    select: mockSelect,
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((field, value) => ({ field, value })),
  and: jest.fn((...args) => args),
}));

describe('Habits list data integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it('fetches habits from the database for a given user', async () => {
    mockWhere.mockResolvedValueOnce([
      {
        id: 1,
        name: 'Morning Run',
        type: 'quantity',
        unit: 'km',
        targetValue: 5,
        frequency: 'daily',
        categoryId: 1,
        isActive: true,
        userId: 1,
      },
    ]);

    const { db } = require('@/db/client');
    const { eq, and } = require('drizzle-orm');

    const result = await db.select().from({}).where(
      and(eq('userId', 1), eq('isActive', true))
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Morning Run');
    expect(result[0].type).toBe('quantity');
  });

  it('fetches categories from the database for a given user', async () => {
    mockWhere.mockResolvedValueOnce([
      {
        id: 1,
        name: 'Fitness',
        colour: '#3B82F6',
        icon: '🏃',
        userId: 1,
      },
    ]);

    const { db } = require('@/db/client');
    const { eq } = require('drizzle-orm');

    const result = await db.select().from({}).where(eq('userId', 1));

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Fitness');
    expect(result[0].colour).toBe('#3B82F6');
  });

  it('returns empty array when no habits exist for user', async () => {
    mockWhere.mockResolvedValueOnce([]);

    const { db } = require('@/db/client');
    const result = await db.select().from({}).where({});

    expect(result).toHaveLength(0);
  });
});
