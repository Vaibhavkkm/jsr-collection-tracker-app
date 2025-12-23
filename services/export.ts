/**
 * Export Service for Collection Tracker
 * Generates Excel and PDF reports, supports sharing
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import {
  getAllPeople,
  getCollectionsByDateRange,
  getWithdrawalsByPerson,
  getCyclesByPerson,
  getActiveCycle
} from './database';

// Get document directory path - use cache.uri from new API or fallback
const getDocDir = (): string => {
  // Use new SDK 54 API
  try {
    // @ts-ignore - Using dynamic access for SDK version compatibility
    const cacheDir = (FileSystem as any).Paths?.cache?.uri || FileSystem.cacheDirectory || '';
    return cacheDir;
  } catch {
    return '';
  }
};

// ======================
// EXCEL EXPORT (CSV FORMAT)
// ======================

/**
 * Generate Monthly Report as CSV (Pivot Table Format)
 * Rows: Dates, Columns: Person Names
 */
export async function generateMonthlyReportCSV(year: number, month: number): Promise<string> {
  const lastDay = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const people = await getAllPeople();

  // Build data structure: { date: { personId: amount } }
  const dataByDate: Record<string, Record<number, number>> = {};
  const personTotals: Record<number, number> = {};

  // Initialize person totals
  for (const person of people) {
    personTotals[person.id] = 0;
  }

  // Collect all data
  for (const person of people) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    const collections = await getCollectionsByDateRange(person.id, startDate, endDate);

    for (const col of collections) {
      if (!dataByDate[col.date]) {
        dataByDate[col.date] = {};
      }
      if (col.status === 'collected' && col.amount) {
        dataByDate[col.date][person.id] = col.amount;
        personTotals[person.id] += col.amount;
      }
    }
  }

  // Sort dates
  const dates = Object.keys(dataByDate).sort();

  // Build CSV
  let csvContent = `JSR - Daily Collection Report\n`;
  csvContent += `Period: ${monthName}\n`;
  csvContent += `Generated: ${new Date().toLocaleDateString('en-IN')}\n\n`;

  // Header row: Date, Person1, Person2, ..., Daily Total
  csvContent += `Date`;
  for (const person of people) {
    csvContent += `,${person.name}`;
  }
  csvContent += `,Daily Total\n`;

  // Data rows
  let grandTotal = 0;
  for (const date of dates) {
    // Format date as DD-MM-YYYY
    const [y, m, d] = date.split('-');
    csvContent += `${d}-${m}-${y}`;

    let dailyTotal = 0;
    for (const person of people) {
      const amount = dataByDate[date][person.id] || 0;
      csvContent += `,${amount > 0 ? amount : '-'}`;
      dailyTotal += amount;
    }
    csvContent += `,${dailyTotal}\n`;
    grandTotal += dailyTotal;
  }

  // Empty row
  csvContent += `\n`;

  // Totals row
  csvContent += `TOTAL`;
  for (const person of people) {
    csvContent += `,${personTotals[person.id]}`;
  }
  csvContent += `,${grandTotal}\n`;

  // Save to file
  const fileName = `JSR_Report_${monthName.replace(' ', '_')}.csv`;
  const filePath = `${getDocDir()}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, csvContent);

  return filePath;
}

/**
 * Generate Person-wise Report as CSV
 */
export async function generatePersonReportCSV(personId: number): Promise<string> {
  const people = await getAllPeople();
  const person = people.find(p => p.id === personId);
  if (!person) throw new Error('Person not found');

  const cycles = await getCyclesByPerson(personId);

  let csvContent = `JSR Person Report\n`;
  csvContent += `Name: ${person.name}\n`;
  csvContent += `Phone: ${person.phone || 'N/A'}\n`;
  csvContent += `Default Amount: ${person.defaultAmount}\n\n`;

  for (const cycle of cycles) {
    csvContent += `\nCycle: ${cycle.startDate} to ${cycle.endDate || 'Active'}\n`;
    csvContent += `Total: ${cycle.totalAmount}\n`;
    csvContent += 'Date,Amount,Status\n';

    const collections = await getCollectionsByDateRange(
      personId,
      cycle.startDate,
      cycle.endDate || new Date().toISOString().split('T')[0]
    );

    for (const col of collections) {
      csvContent += `${col.date},${col.amount || 0},${col.status}\n`;
    }
  }

  const fileName = `JSR_${person.name.replace(/\s+/g, '_')}_Report.csv`;
  const filePath = `${getDocDir()}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, csvContent);

  return filePath;
}

/**
 * Generate Current Status Report (all pending amounts)
 */
export async function generateStatusReportCSV(): Promise<string> {
  const people = await getAllPeople();

  let csvContent = 'JSR Current Status Report\n';
  csvContent += `Date: ${new Date().toISOString().split('T')[0]}\n\n`;
  csvContent += 'Name,Phone,Default Amount,Current Cycle Total,Cycle Start Date\n';

  let grandTotal = 0;

  for (const person of people) {
    const cycle = await getActiveCycle(person.id);
    const cycleTotal = cycle?.totalAmount || 0;
    grandTotal += cycleTotal;

    csvContent += `${person.name},${person.phone || 'N/A'},${person.defaultAmount},${cycleTotal},${cycle?.startDate || 'N/A'}\n`;
  }

  csvContent += `\nGrand Total,,,${grandTotal},\n`;

  const fileName = `JSR_Status_${new Date().toISOString().split('T')[0]}.csv`;
  const filePath = `${getDocDir()}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, csvContent);

  return filePath;
}

// ======================
// PDF EXPORT
// ======================

/**
 * Generate Monthly Report as PDF (Pivot Table Format)
 * Rows: Dates, Columns: Person Names
 */
export async function generateMonthlyReportPDF(year: number, month: number): Promise<string> {
  const lastDay = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const people = await getAllPeople();

  // Build data structure: { date: { personId: amount } }
  const dataByDate: Record<string, Record<number, number>> = {};
  const personTotals: Record<number, number> = {};

  // Initialize person totals
  for (const person of people) {
    personTotals[person.id] = 0;
  }

  // Collect all data
  for (const person of people) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    const collections = await getCollectionsByDateRange(person.id, startDate, endDate);

    for (const col of collections) {
      if (!dataByDate[col.date]) {
        dataByDate[col.date] = {};
      }
      if (col.status === 'collected' && col.amount) {
        dataByDate[col.date][person.id] = col.amount;
        personTotals[person.id] += col.amount;
      }
    }
  }

  // Sort dates
  const dates = Object.keys(dataByDate).sort();

  // Build header row
  let headerCells = '<th>Date</th>';
  for (const person of people) {
    headerCells += `<th style="text-align: right;">${person.name}</th>`;
  }
  headerCells += '<th style="text-align: right;">Daily Total</th>';

  // Build data rows
  let dataRows = '';
  let grandTotal = 0;
  for (const date of dates) {
    const [y, m, d] = date.split('-');
    dataRows += `<tr><td>${d}-${m}-${y}</td>`;

    let dailyTotal = 0;
    for (const person of people) {
      const amount = dataByDate[date][person.id] || 0;
      dataRows += `<td style="text-align: right;">${amount > 0 ? '₹' + amount.toLocaleString('en-IN') : '-'}</td>`;
      dailyTotal += amount;
    }
    dataRows += `<td style="text-align: right; font-weight: 500;">₹${dailyTotal.toLocaleString('en-IN')}</td></tr>`;
    grandTotal += dailyTotal;
  }

  // Build totals row
  let totalsRow = '<tr class="total-row"><td><strong>TOTAL</strong></td>';
  for (const person of people) {
    totalsRow += `<td style="text-align: right;"><strong>₹${personTotals[person.id].toLocaleString('en-IN')}</strong></td>`;
  }
  totalsRow += `<td style="text-align: right;"><strong>₹${grandTotal.toLocaleString('en-IN')}</strong></td></tr>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Helvetica', sans-serif; padding: 15px; color: #333; font-size: 11px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { color: #d4af37; margin: 0; font-size: 20px; }
        .header p { color: #666; margin: 5px 0; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #1a1a2e; color: white; padding: 8px 5px; font-size: 10px; }
        td { padding: 6px 5px; border-bottom: 1px solid #ddd; font-size: 10px; }
        tr:nth-child(even) { background: #f9f9f9; }
        .total-row { background: #e8f5e9 !important; }
        .footer { margin-top: 20px; text-align: center; color: #999; font-size: 10px; }
        .summary { text-align: center; margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        .summary .value { font-size: 18px; font-weight: bold; color: #2563eb; }
        .summary .label { font-size: 10px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>JSR - Daily Collection Report</h1>
        <p>Period: ${monthName}</p>
        <p>Generated: ${new Date().toLocaleDateString('en-IN')}</p>
      </div>

      <div class="summary">
        <span class="value">₹${grandTotal.toLocaleString('en-IN')}</span>
        <span class="label"> Total Collected | ${people.length} People | ${dates.length} Days</span>
      </div>

      <table>
        <thead>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>
          ${dataRows}
          ${totalsRow}
        </tbody>
      </table>

      <div class="footer">
        <p>JSR Daily Collection Tracker</p>
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

/**
 * Generate Withdrawal Receipt PDF
 */
export async function generateWithdrawalReceiptPDF(
  personName: string,
  amount: number,
  startDate: string,
  endDate: string,
  totalDays: number
): Promise<string> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Helvetica', sans-serif; padding: 40px; }
        .receipt { max-width: 400px; margin: 0 auto; border: 2px solid #1a1a2e; border-radius: 12px; padding: 30px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { color: #d4af37; margin: 0; font-size: 20px; }
        .header h2 { color: #1a1a2e; margin: 10px 0 0; font-size: 28px; }
        .divider { border-top: 1px dashed #ccc; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { color: #666; }
        .value { font-weight: bold; }
        .amount { text-align: center; margin: 30px 0; }
        .amount .value { font-size: 36px; color: #00c853; }
        .amount .label { font-size: 14px; color: #666; }
        .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>JSR</h1>
          <h2>Withdrawal Receipt</h2>
        </div>
        
        <div class="divider"></div>
        
        <div class="row">
          <span class="label">Name:</span>
          <span class="value">${personName}</span>
        </div>
        <div class="row">
          <span class="label">Date:</span>
          <span class="value">${endDate}</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="amount">
          <div class="label">Amount Withdrawn</div>
          <div class="value">₹${amount.toLocaleString('en-IN')}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="row">
          <span class="label">Cycle Period:</span>
          <span class="value">${startDate} - ${endDate}</span>
        </div>
        <div class="row">
          <span class="label">Total Days:</span>
          <span class="value">${totalDays}</span>
        </div>
        
        <div class="footer">
          <p>New cycle started</p>
          <p>Thank you!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

// ======================
// SHARING
// ======================

/**
 * Share a file via system share sheet (WhatsApp, Email, etc.)
 */
export async function shareFile(filePath: string): Promise<boolean> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(filePath, {
    mimeType: filePath.endsWith('.pdf') ? 'application/pdf' : 'text/csv',
    dialogTitle: 'Share Report',
  });

  return true;
}

/**
 * Export and share monthly report
 */
export async function exportAndShareMonthlyReport(year: number, month: number, format: 'csv' | 'pdf' = 'csv'): Promise<void> {
  let filePath: string;

  if (format === 'pdf') {
    filePath = await generateMonthlyReportPDF(year, month);
  } else {
    filePath = await generateMonthlyReportCSV(year, month);
  }

  await shareFile(filePath);
}

/**
 * Export and share current status
 */
export async function exportAndShareStatusReport(): Promise<void> {
  const filePath = await generateStatusReportCSV();
  await shareFile(filePath);
}

// ======================
// BACKUP & RESTORE
// ======================

/**
 * Create a backup of the database
 */
export async function createBackup(): Promise<string> {
  const dbPath = `${getDocDir()}SQLite/collection_tracker.db`;
  const backupPath = `${getDocDir()}backup_${new Date().toISOString().split('T')[0]}.db`;

  const dbInfo = await FileSystem.getInfoAsync(dbPath);
  if (!dbInfo.exists) {
    throw new Error('Database not found');
  }

  await FileSystem.copyAsync({ from: dbPath, to: backupPath });

  return backupPath;
}

/**
 * Restore from a backup file
 */
export async function restoreBackup(backupPath: string): Promise<void> {
  const dbPath = `${getDocDir()}SQLite/collection_tracker.db`;

  const backupInfo = await FileSystem.getInfoAsync(backupPath);
  if (!backupInfo.exists) {
    throw new Error('Backup file not found');
  }

  // Create a safety backup first
  const safetyBackup = `${getDocDir()}safety_backup.db`;
  await FileSystem.copyAsync({ from: dbPath, to: safetyBackup });

  try {
    await FileSystem.copyAsync({ from: backupPath, to: dbPath });
  } catch (error) {
    // Restore from safety backup if restore fails
    await FileSystem.copyAsync({ from: safetyBackup, to: dbPath });
    throw error;
  }
}

/**
 * Get last backup date
 */
export async function getLastBackupDate(): Promise<string | null> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(getDocDir());
    if (!dirInfo.exists) return null;

    const files = await FileSystem.readDirectoryAsync(getDocDir());
    const backups = files.filter((f: string) => f.startsWith('backup_') && f.endsWith('.db'));

    if (backups.length === 0) return null;

    // Sort by date and get the latest
    backups.sort().reverse();
    const latestBackup = backups[0];
    const dateMatch = latestBackup.match(/backup_(\d{4}-\d{2}-\d{2})/);

    return dateMatch ? dateMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Export entire database as JSON (comprehensive backup)
 * Includes ALL data: people, cycles, collections, withdrawals
 */
export async function exportDatabaseAsJSON(): Promise<string> {
  const { getAllCollectionsForPerson } = await import('./database');
  const people = await getAllPeople();

  const allData: any = {
    exportDate: new Date().toISOString(),
    appVersion: '1.0.0',
    people: [],
  };

  for (const person of people) {
    const cycle = await getActiveCycle(person.id);
    const withdrawals = await getWithdrawalsByPerson(person.id);
    const cycles = await getCyclesByPerson(person.id);
    const collections = await getAllCollectionsForPerson(person.id);

    allData.people.push({
      ...person,
      activeCycle: cycle,
      cycles,
      withdrawals,
      collections, // ALL collection history!
    });
  }

  const jsonContent = JSON.stringify(allData, null, 2);
  const fileName = `JSR_Backup_${new Date().toISOString().split('T')[0]}.json`;
  const filePath = `${getDocDir()}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, jsonContent);

  return filePath;
}

/**
 * Export and share database as JSON
 */
export async function exportAndShareDatabaseBackup(): Promise<void> {
  const filePath = await exportDatabaseAsJSON();
  await shareFile(filePath);
}

/**
 * Import database from JSON backup
 * REPLACES all existing data with backup data
 */
export async function importDatabaseFromJSON(jsonContent: string): Promise<{ imported: number }> {
  try {
    const data = JSON.parse(jsonContent);

    if (!data.people || !Array.isArray(data.people)) {
      throw new Error('Invalid backup format');
    }

    // Import database functions
    const { getDatabase } = await import('./database');

    // CLEAR ALL EXISTING DATA FIRST
    const database = await getDatabase();
    await database.runAsync('DELETE FROM collections');
    await database.runAsync('DELETE FROM withdrawals');
    await database.runAsync('DELETE FROM cycles');
    await database.runAsync('DELETE FROM people');

    let imported = 0;

    for (const personData of data.people) {
      // Insert person directly
      const personResult = await database.runAsync(
        `INSERT INTO people (name, phone, location, photo_path, default_amount, frequency, notes, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          personData.name,
          personData.phone || null,
          personData.location || null,
          personData.photoPath || null,
          personData.defaultAmount || 0,
          personData.frequency || 'daily',
          personData.notes || null,
        ]
      );
      const newPersonId = personResult.lastInsertRowId;

      // Create the active cycle with correct data
      const cycleStartDate = personData.activeCycle?.startDate || new Date().toISOString().split('T')[0];
      const cycleTotal = personData.activeCycle?.totalAmount || 0;

      const cycleResult = await database.runAsync(
        `INSERT INTO cycles (person_id, start_date, total_amount, is_active)
         VALUES (?, ?, ?, 1)`,
        [newPersonId, cycleStartDate, cycleTotal]
      );
      const newCycleId = cycleResult.lastInsertRowId;

      // Import ALL collections
      if (personData.collections && Array.isArray(personData.collections)) {
        for (const collection of personData.collections) {
          await database.runAsync(
            `INSERT INTO collections (person_id, cycle_id, date, amount, status, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              newPersonId,
              newCycleId,
              collection.date,
              collection.amount || 0,
              collection.status || 'collected',
              collection.notes || null,
            ]
          );
        }
      }

      // Import ALL withdrawals
      if (personData.withdrawals && Array.isArray(personData.withdrawals)) {
        for (const withdrawal of personData.withdrawals) {
          await database.runAsync(
            `INSERT INTO withdrawals (person_id, cycle_id, amount, date, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [
              newPersonId,
              newCycleId,
              withdrawal.amount || 0,
              withdrawal.date || new Date().toISOString().split('T')[0],
              withdrawal.notes || null,
            ]
          );
        }
      }

      imported++;
    }

    return { imported };
  } catch (error) {
    console.error('Import error:', error);
    throw new Error('Failed to import backup: ' + (error as Error).message);
  }
}
