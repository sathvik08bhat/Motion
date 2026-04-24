import { db, type WorkspaceDatabase, type Column, type Row } from "../../data/db";

/**
 * Generates a unique ID for database entities.
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a new, structured database within the workspace.
 * 
 * @param name The display name of the database.
 * @param initialColumns An array of column definitions to bootstrap the schema.
 */
export async function createDatabase(
  name: string, 
  initialColumns: Omit<Column, "id">[]
): Promise<WorkspaceDatabase> {
  const columns: Column[] = initialColumns.map(col => ({
    ...col,
    id: generateId('col')
  }));

  const newDatabase: WorkspaceDatabase = {
    id: generateId('db'),
    name,
    columns,
    rows: []
  };

  await db.databases.add(newDatabase);
  return newDatabase;
}

/**
 * Retrieves a database by its ID.
 */
export async function getDatabase(dbId: string): Promise<WorkspaceDatabase | undefined> {
  return await db.databases.get(dbId);
}

/**
 * Adds a new column to an existing database schema.
 */
export async function addColumn(dbId: string, column: Omit<Column, "id">): Promise<Column> {
  const database = await getDatabase(dbId);
  if (!database) throw new Error("Database not found");

  const newColumn: Column = {
    ...column,
    id: generateId('col')
  };

  database.columns.push(newColumn);
  await db.databases.put(database);
  
  return newColumn;
}

/**
 * Adds a new row of data to the database.
 */
export async function addRow(dbId: string, initialValues: { [columnId: string]: any } = {}): Promise<Row> {
  const database = await getDatabase(dbId);
  if (!database) throw new Error("Database not found");

  const newRow: Row = {
    id: generateId('row'),
    values: initialValues
  };

  database.rows.push(newRow);
  await db.databases.put(database);

  return newRow;
}

/**
 * Updates a specific cell's value within a database row.
 */
export async function updateCell(dbId: string, rowId: string, columnId: string, value: any): Promise<void> {
  const database = await getDatabase(dbId);
  if (!database) throw new Error("Database not found");

  const row = database.rows.find(r => r.id === rowId);
  if (!row) throw new Error("Row not found");

  // Verify column exists
  const columnExists = database.columns.some(c => c.id === columnId);
  if (!columnExists) throw new Error("Column not found in database schema");

  row.values[columnId] = value;
  await db.databases.put(database);
}

/**
 * ==========================================
 * VIEWS & QUERYING
 * ==========================================
 */

export interface DatabaseViewOptions {
  filter?: {
    columnId: string;
    operator: "equals" | "contains" | "greater_than" | "less_than";
    value: any;
  };
}

/**
 * Table View (Basic)
 * Returns the raw database object, optionally filtering rows based on simple criteria.
 */
export async function getTableView(dbId: string, options?: DatabaseViewOptions): Promise<WorkspaceDatabase> {
  const database = await getDatabase(dbId);
  if (!database) throw new Error("Database not found");

  if (!options?.filter) {
    return database; // Return the full table view
  }

  // Apply simple row filtering
  const { columnId, operator, value } = options.filter;
  
  const filteredRows = database.rows.filter(row => {
    const cellValue = row.values[columnId];
    
    // Graceful handling of null/undefined
    if (cellValue === undefined || cellValue === null) return false;

    switch (operator) {
      case "equals":
        return cellValue === value;
      case "contains":
        return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
      case "greater_than":
        return Number(cellValue) > Number(value);
      case "less_than":
        return Number(cellValue) < Number(value);
      default:
        return true;
    }
  });

  return {
    ...database,
    rows: filteredRows
  };
}
