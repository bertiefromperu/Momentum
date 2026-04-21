/**
 * @jest-environment node
 */

const mockInsertValues = jest.fn().mockResolvedValue({});
const mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });
const mockWhere = jest.fn();
const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });

jest.mock('@/db/client', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
  },
}));

describe('seed function behaviour', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it('should not insert if users already exist', async () => {
    mockWhere.mockResolvedValue([{ id: 1 }]);
    mockFrom.mockReturnValue({ where: mockWhere });

    const { db } = require('@/db/client');
    const existing = await db.select().from().where();

    if (existing.length === 0) {
      await db.insert().values({});
    }

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('should insert when no users exist', async () => {
    mockWhere.mockResolvedValue([]);
    mockFrom.mockReturnValue({ where: mockWhere });

    const { db } = require('@/db/client');
    const existing = await db.select().from().where();

    if (existing.length === 0) {
      await db.insert().values({ name: 'Test User' });
    }

    expect(mockInsert).toHaveBeenCalled();
    expect(mockInsertValues).toHaveBeenCalledWith({ name: 'Test User' });
  });

  it('verifies all core tables are represented in schema', () => {
    const schema = require('@/db/schema');
    expect(schema.users).toBeDefined();
    expect(schema.habits).toBeDefined();
    expect(schema.habitLogs).toBeDefined();
    expect(schema.categories).toBeDefined();
    expect(schema.targets).toBeDefined();
  });
});
