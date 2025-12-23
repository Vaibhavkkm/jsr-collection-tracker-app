/**
 * SQLite Database Service for Collection Tracker
 * Handles all database operations with offline-first approach
 */

import * as SQLite from 'expo-sqlite';
import { Person, Cycle, Collection, Withdrawal, CollectionStatus, Settings } from '../types';

const DB_NAME = 'collection_tracker.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize and get database instance
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!db) {
        db = await SQLite.openDatabaseAsync(DB_NAME);
        await initializeDatabase();
    }
    return db;
}

/**
 * Create all required tables if they don't exist
 */
async function initializeDatabase(): Promise<void> {
    if (!db) return;

    await db.execAsync(`
    -- Enable foreign keys
    PRAGMA foreign_keys = ON;

    -- People Table (Customers)
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      location TEXT,
      photo_path TEXT,
      default_amount REAL NOT NULL,
      frequency TEXT DEFAULT 'daily',
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Cycles Table (Collection Periods)
    CREATE TABLE IF NOT EXISTS cycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      total_amount REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      withdrawal_date TEXT,
      notes TEXT,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
    );

    -- Collections Table (Daily Entries)
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      cycle_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      amount REAL,
      status TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE CASCADE,
      UNIQUE(person_id, date)
    );

    -- Withdrawals Table
    CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      cycle_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT DEFAULT (datetime('now')),
      notes TEXT,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE CASCADE
    );

    -- Settings Table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_collections_date ON collections(date);
    CREATE INDEX IF NOT EXISTS idx_collections_person ON collections(person_id);
    CREATE INDEX IF NOT EXISTS idx_cycles_person ON cycles(person_id);
    CREATE INDEX IF NOT EXISTS idx_cycles_active ON cycles(is_active);
  `);
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ======================
// PEOPLE OPERATIONS
// ======================

/**
 * Add a new person
 */
export async function addPerson(person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
        `INSERT INTO people (name, phone, location, photo_path, default_amount, frequency, notes, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            person.name,
            person.phone || null,
            person.location || null,
            person.photoPath || null,
            person.defaultAmount,
            person.frequency || 'daily',
            person.notes || null,
            person.isActive ? 1 : 0,
        ]
    );

    // Create initial cycle for the person
    await createCycle(result.lastInsertRowId);

    return result.lastInsertRowId;
}

/**
 * Update an existing person
 */
export async function updatePerson(id: number, updates: Partial<Person>): Promise<void> {
    const database = await getDatabase();
    const setParts: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) { setParts.push('name = ?'); values.push(updates.name); }
    if (updates.phone !== undefined) { setParts.push('phone = ?'); values.push(updates.phone); }
    if (updates.location !== undefined) { setParts.push('location = ?'); values.push(updates.location); }
    if (updates.photoPath !== undefined) { setParts.push('photo_path = ?'); values.push(updates.photoPath); }
    if (updates.defaultAmount !== undefined) { setParts.push('default_amount = ?'); values.push(updates.defaultAmount); }
    if (updates.frequency !== undefined) { setParts.push('frequency = ?'); values.push(updates.frequency); }
    if (updates.notes !== undefined) { setParts.push('notes = ?'); values.push(updates.notes); }
    if (updates.isActive !== undefined) { setParts.push('is_active = ?'); values.push(updates.isActive ? 1 : 0); }

    setParts.push("updated_at = datetime('now')");
    values.push(id);

    await database.runAsync(
        `UPDATE people SET ${setParts.join(', ')} WHERE id = ?`,
        values
    );
}

/**
 * Get all active people
 */
export async function getAllPeople(): Promise<Person[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
        `SELECT id, name, phone, location, photo_path as photoPath, default_amount as defaultAmount,
            frequency, notes, is_active as isActive, created_at as createdAt, updated_at as updatedAt
     FROM people WHERE is_active = 1 ORDER BY name`
    );
    return rows as Person[];
}

/**
 * Get a person by ID
 */
export async function getPersonById(id: number): Promise<Person | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync(
        `SELECT id, name, phone, location, photo_path as photoPath, default_amount as defaultAmount,
            frequency, notes, is_active as isActive, created_at as createdAt, updated_at as updatedAt
     FROM people WHERE id = ?`,
        [id]
    );
    return row as Person | null;
}

/**
 * Soft delete a person (mark as inactive)
 */
export async function deletePerson(id: number): Promise<void> {
    const database = await getDatabase();
    await database.runAsync('UPDATE people SET is_active = 0 WHERE id = ?', [id]);
}

// ======================
// CYCLE OPERATIONS
// ======================

/**
 * Create a new cycle for a person
 */
export async function createCycle(personId: number): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
        `INSERT INTO cycles (person_id, start_date, is_active, total_amount)
     VALUES (?, ?, 1, 0)`,
        [personId, getTodayDate()]
    );
    return result.lastInsertRowId;
}

/**
 * Get active cycle for a person
 */
export async function getActiveCycle(personId: number): Promise<Cycle | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync(
        `SELECT id, person_id as personId, start_date as startDate, end_date as endDate,
            total_amount as totalAmount, is_active as isActive, withdrawal_date as withdrawalDate, notes
     FROM cycles WHERE person_id = ? AND is_active = 1`,
        [personId]
    );
    return row as Cycle | null;
}

/**
 * Close a cycle (for withdrawal)
 */
export async function closeCycle(cycleId: number): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
        `UPDATE cycles SET is_active = 0, end_date = ?, withdrawal_date = datetime('now')
     WHERE id = ?`,
        [getTodayDate(), cycleId]
    );
}

/**
 * Get all cycles for a person
 */
export async function getCyclesByPerson(personId: number): Promise<Cycle[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
        `SELECT id, person_id as personId, start_date as startDate, end_date as endDate,
            total_amount as totalAmount, is_active as isActive, withdrawal_date as withdrawalDate, notes
     FROM cycles WHERE person_id = ? ORDER BY start_date DESC`,
        [personId]
    );
    return rows as Cycle[];
}

/**
 * Update cycle data (for manual adjustment of historical data)
 */
export async function updateCycleData(
    cycleId: number,
    updates: { totalAmount?: number; startDate?: string }
): Promise<void> {
    const database = await getDatabase();
    const setParts: string[] = [];
    const values: any[] = [];

    if (updates.totalAmount !== undefined) {
        setParts.push('total_amount = ?');
        values.push(updates.totalAmount);
    }
    if (updates.startDate !== undefined) {
        setParts.push('start_date = ?');
        values.push(updates.startDate);
    }

    if (setParts.length === 0) return;

    values.push(cycleId);
    await database.runAsync(
        `UPDATE cycles SET ${setParts.join(', ')} WHERE id = ?`,
        values
    );
}

// ======================
// COLLECTION OPERATIONS
// ======================

/**
 * Record a collection (default amount or custom)
 */
export async function recordCollection(
    personId: number,
    amount: number,
    notes?: string
): Promise<void> {
    const database = await getDatabase();
    const today = getTodayDate();

    // Get or create active cycle
    let cycle = await getActiveCycle(personId);
    if (!cycle) {
        const cycleId = await createCycle(personId);
        cycle = { id: cycleId, personId, startDate: today, totalAmount: 0, isActive: true };
    }

    // Check if there's an existing collection for today (for undo/re-collect scenario)
    const existingCollection = await getTodayCollection(personId);
    const existingAmount = (existingCollection?.status === 'collected' && existingCollection.amount) || 0;

    // Insert or replace collection
    await database.runAsync(
        `INSERT OR REPLACE INTO collections (person_id, cycle_id, date, amount, status, notes)
     VALUES (?, ?, ?, ?, 'collected', ?)`,
        [personId, cycle.id, today, amount, notes || null]
    );

    // Update cycle total by adding the DIFFERENCE (preserves manual adjustments)
    const difference = amount - existingAmount;
    await database.runAsync(
        `UPDATE cycles SET total_amount = total_amount + ? WHERE id = ?`,
        [difference, cycle.id]
    );
}

/**
 * Skip collection for today
 */
export async function skipCollection(personId: number, notes?: string): Promise<void> {
    const database = await getDatabase();
    const today = getTodayDate();

    let cycle = await getActiveCycle(personId);
    if (!cycle) {
        const cycleId = await createCycle(personId);
        cycle = { id: cycleId, personId, startDate: today, totalAmount: 0, isActive: true };
    }

    await database.runAsync(
        `INSERT OR REPLACE INTO collections (person_id, cycle_id, date, amount, status, notes)
     VALUES (?, ?, ?, NULL, 'skipped', ?)`,
        [personId, cycle.id, today, notes || null]
    );
}

/**
 * Undo a collection (remove today's entry)
 */
export async function undoCollection(personId: number): Promise<void> {
    const database = await getDatabase();
    const today = getTodayDate();

    // Get the collection amount before deleting
    const existingCollection = await getTodayCollection(personId);
    const amountToSubtract = (existingCollection?.status === 'collected' && existingCollection.amount) || 0;

    await database.runAsync(
        'DELETE FROM collections WHERE person_id = ? AND date = ?',
        [personId, today]
    );

    // Subtract from cycle total (preserves manual adjustments)
    if (amountToSubtract > 0) {
        const cycle = await getActiveCycle(personId);
        if (cycle) {
            await database.runAsync(
                `UPDATE cycles SET total_amount = total_amount - ? WHERE id = ?`,
                [amountToSubtract, cycle.id]
            );
        }
    }
}

/**
 * Update cycle total based on collections
 */
async function updateCycleTotal(cycleId: number): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
        `UPDATE cycles SET total_amount = (
       SELECT COALESCE(SUM(amount), 0) FROM collections 
       WHERE cycle_id = ? AND status = 'collected'
     ) WHERE id = ?`,
        [cycleId, cycleId]
    );
}

/**
 * Get today's collection for a person
 */
export async function getTodayCollection(personId: number): Promise<Collection | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync(
        `SELECT id, person_id as personId, cycle_id as cycleId, date, amount, status, notes, created_at as createdAt
     FROM collections WHERE person_id = ? AND date = ?`,
        [personId, getTodayDate()]
    );
    return row as Collection | null;
}

/**
 * Get collections for a cycle
 */
export async function getCollectionsByCycle(cycleId: number): Promise<Collection[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
        `SELECT id, person_id as personId, cycle_id as cycleId, date, amount, status, notes, created_at as createdAt
     FROM collections WHERE cycle_id = ? ORDER BY date DESC`,
        [cycleId]
    );
    return rows as Collection[];
}

/**
 * Get collections for a person within a date range
 */
export async function getCollectionsByDateRange(
    personId: number,
    startDate: string,
    endDate: string
): Promise<Collection[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
        `SELECT id, person_id as personId, cycle_id as cycleId, date, amount, status, notes, created_at as createdAt
     FROM collections 
     WHERE person_id = ? AND date >= ? AND date <= ?
     ORDER BY date DESC`,
        [personId, startDate, endDate]
    );
    return rows as Collection[];
}

/**
 * Get ALL collections for a person (complete history)
 */
export async function getAllCollectionsForPerson(personId: number): Promise<Collection[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
        `SELECT id, person_id as personId, cycle_id as cycleId, date, amount, status, notes, created_at as createdAt
     FROM collections 
     WHERE person_id = ?
     ORDER BY date DESC`,
        [personId]
    );
    return rows as Collection[];
}

/**
 * Get total collected amount from cycle start to a specific date
 */
export async function getCollectionsTotalByDate(
    personId: number,
    startDate: string,
    endDate: string
): Promise<number> {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0) as total
     FROM collections 
     WHERE person_id = ? AND date >= ? AND date <= ? AND status = 'collected'`,
        [personId, startDate, endDate]
    );
    return result?.total || 0;
}

// ======================
// WITHDRAWAL OPERATIONS
// ======================

/**
 * Process a withdrawal (close cycle, start new one)
 */
export async function processWithdrawal(personId: number, notes?: string): Promise<number> {
    const database = await getDatabase();

    const cycle = await getActiveCycle(personId);
    if (!cycle) throw new Error('No active cycle found');

    // Record withdrawal
    const result = await database.runAsync(
        `INSERT INTO withdrawals (person_id, cycle_id, amount, notes)
     VALUES (?, ?, ?, ?)`,
        [personId, cycle.id, cycle.totalAmount, notes || null]
    );

    // Close current cycle
    await closeCycle(cycle.id);

    // Start new cycle
    await createCycle(personId);

    return result.lastInsertRowId;
}

/**
 * Process a PARTIAL withdrawal (deduct amount but keep cycle active)
 * Used when person withdraws only till a specific date, not full cycle
 */
export async function processPartialWithdrawal(
    personId: number,
    amount: number,
    notes?: string
): Promise<number> {
    const database = await getDatabase();

    const cycle = await getActiveCycle(personId);
    if (!cycle) throw new Error('No active cycle found');

    if (amount > cycle.totalAmount) {
        throw new Error('Withdrawal amount exceeds cycle total');
    }

    // Record the partial withdrawal
    const result = await database.runAsync(
        `INSERT INTO withdrawals (person_id, cycle_id, amount, notes)
     VALUES (?, ?, ?, ?)`,
        [personId, cycle.id, amount, notes || 'Partial withdrawal']
    );

    // Deduct from cycle total (cycle remains active)
    await database.runAsync(
        `UPDATE cycles SET total_amount = total_amount - ? WHERE id = ?`,
        [amount, cycle.id]
    );

    return result.lastInsertRowId;
}

/**
 * Get withdrawals for a person
 */
export async function getWithdrawalsByPerson(personId: number): Promise<Withdrawal[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
        `SELECT id, person_id as personId, cycle_id as cycleId, amount, date, notes
     FROM withdrawals WHERE person_id = ? ORDER BY date DESC`,
        [personId]
    );
    return rows as Withdrawal[];
}

// ======================
// DASHBOARD DATA
// ======================

/**
 * Get all people with today's status for dashboard
 */
export async function getPeopleWithTodayStatus(): Promise<any[]> {
    const database = await getDatabase();
    const today = getTodayDate();

    const rows = await database.getAllAsync(`
    SELECT 
      p.id, p.name, p.phone, p.location, p.photo_path as photoPath,
      p.default_amount as defaultAmount, p.frequency, p.notes,
      COALESCE(c.status, 'pending') as todayStatus,
      c.amount as todayAmount,
      COALESCE(cy.total_amount, 0) as cycleTotal,
      cy.id as cycleId
    FROM people p
    LEFT JOIN collections c ON p.id = c.person_id AND c.date = ?
    LEFT JOIN cycles cy ON p.id = cy.person_id AND cy.is_active = 1
    WHERE p.is_active = 1
    ORDER BY 
      CASE COALESCE(c.status, 'pending')
        WHEN 'pending' THEN 0
        WHEN 'collected' THEN 1
        WHEN 'skipped' THEN 2
      END,
      p.name
  `, [today]);

    return rows;
}

/**
 * Get dashboard summary
 */
export async function getDashboardSummary(): Promise<{
    todayCollected: number;
    todayCount: number;
    pendingCount: number;
    pendingEstimate: number;
    monthTotal: number;
}> {
    const database = await getDatabase();
    const today = getTodayDate();
    const month = getCurrentMonth();

    // Today's totals
    const todayResult = await database.getFirstAsync(`
    SELECT 
      COALESCE(SUM(amount), 0) as collected,
      COUNT(*) as count
    FROM collections 
    WHERE date = ? AND status = 'collected'
  `, [today]) as any;

    // Pending count and estimate
    const pendingResult = await database.getFirstAsync(`
    SELECT 
      COUNT(*) as count,
      COALESCE(SUM(p.default_amount), 0) as estimate
    FROM people p
    LEFT JOIN collections c ON p.id = c.person_id AND c.date = ?
    WHERE p.is_active = 1 AND c.id IS NULL
  `, [today]) as any;

    // Month total
    const monthResult = await database.getFirstAsync(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM collections 
    WHERE strftime('%Y-%m', date) = ? AND status = 'collected'
  `, [month]) as any;

    return {
        todayCollected: todayResult?.collected || 0,
        todayCount: todayResult?.count || 0,
        pendingCount: pendingResult?.count || 0,
        pendingEstimate: pendingResult?.estimate || 0,
        monthTotal: monthResult?.total || 0,
    };
}

// ======================
// SETTINGS
// ======================

/**
 * Get a setting value
 */
export async function getSetting(key: string): Promise<string | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync(
        'SELECT value FROM settings WHERE key = ?',
        [key]
    ) as any;
    return row?.value || null;
}

/**
 * Set a setting value
 */
export async function setSetting(key: string, value: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value]
    );
}

/**
 * Get all settings
 */
export async function getAllSettings(): Promise<Record<string, string>> {
    const database = await getDatabase();
    const rows = await database.getAllAsync('SELECT key, value FROM settings') as any[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
        settings[row.key] = row.value;
    }
    return settings;
}
