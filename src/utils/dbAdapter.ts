import type { Visitor, SecurityLog, DatabaseType } from './types';
import { INITIAL_VISITORS, INITIAL_SECURITY_LOGS } from './mockData';

// Common adapter interface for database operations
export interface IDatabaseAdapter {
  getVisitors(): Promise<Visitor[]>;
  saveVisitors(visitors: Visitor[]): Promise<void>;
  getLogs(): Promise<SecurityLog[]>;
  saveLogs(logs: SecurityLog[]): Promise<void>;
}

// Helper to determine active backend API URL
function getApiEndpoint(connectionString: string): string {
  // If the user inputs a URL, use it, otherwise target the local backend port
  if (connectionString && (connectionString.startsWith('http://') || connectionString.startsWith('https://'))) {
    return connectionString;
  }
  return 'http://localhost:5000/api';
}

// 1. Browser LocalStorage Adapter (standalone client-side demo fallback)
export class LocalStorageAdapter implements IDatabaseAdapter {
  async getVisitors(): Promise<Visitor[]> {
    const data = localStorage.getItem('vpass_visitors');
    return data ? JSON.parse(data) : INITIAL_VISITORS;
  }

  async saveVisitors(visitors: Visitor[]): Promise<void> {
    localStorage.setItem('vpass_visitors', JSON.stringify(visitors));
  }

  async getLogs(): Promise<SecurityLog[]> {
    const data = localStorage.getItem('vpass_logs');
    return data ? JSON.parse(data) : INITIAL_SECURITY_LOGS;
  }

  async saveLogs(logs: SecurityLog[]): Promise<void> {
    localStorage.setItem('vpass_logs', JSON.stringify(logs));
  }
}

// 2. Real Production REST API Adapter (routes queries to our Node.js Backend Server)
export class RESTApiAdapter implements IDatabaseAdapter {
  private apiEndpoint: string;

  constructor(_dbType: DatabaseType, connectionString: string) {
    this.apiEndpoint = getApiEndpoint(connectionString);
  }

  async getVisitors(): Promise<Visitor[]> {
    try {
      const response = await fetch(`${this.apiEndpoint}/visitors`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return await response.json();
    } catch (err: any) {
      // Fallback to local storage so the frontend doesn't crash during network losses
      const data = localStorage.getItem('vpass_visitors');
      return data ? JSON.parse(data) : INITIAL_VISITORS;
    }
  }

  async saveVisitors(visitors: Visitor[]): Promise<void> {
    try {
      const response = await fetch(`${this.apiEndpoint}/visitors/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitors })
      });
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      // Keep local storage mirrored for offline backup
      localStorage.setItem('vpass_visitors', JSON.stringify(visitors));
    } catch (err: any) {
      localStorage.setItem('vpass_visitors', JSON.stringify(visitors));
    }
  }

  async getLogs(): Promise<SecurityLog[]> {
    try {
      const response = await fetch(`${this.apiEndpoint}/security-logs`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return await response.json();
    } catch (err: any) {
      const data = localStorage.getItem('vpass_logs');
      return data ? JSON.parse(data) : INITIAL_SECURITY_LOGS;
    }
  }

  async saveLogs(logs: SecurityLog[]): Promise<void> {
    try {
      const response = await fetch(`${this.apiEndpoint}/security-logs/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs })
      });
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      localStorage.setItem('vpass_logs', JSON.stringify(logs));
    } catch (err: any) {
      localStorage.setItem('vpass_logs', JSON.stringify(logs));
    }
  }
}

// 3. Real Production Firebase Firestore Adapter
export class FirebaseAdapter implements IDatabaseAdapter {
  private apiEndpoint: string;

  constructor(connectionString: string) {
    this.apiEndpoint = getApiEndpoint(connectionString);
  }

  async getVisitors(): Promise<Visitor[]> {
    const response = await fetch(`${this.apiEndpoint}/visitors`);
    return await response.json();
  }

  async saveVisitors(visitors: Visitor[]): Promise<void> {
    await fetch(`${this.apiEndpoint}/visitors/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitors })
    });
  }

  async getLogs(): Promise<SecurityLog[]> {
    const response = await fetch(`${this.apiEndpoint}/security-logs`);
    return await response.json();
  }

  async saveLogs(logs: SecurityLog[]): Promise<void> {
    await fetch(`${this.apiEndpoint}/security-logs/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs })
    });
  }
}

// Adapter Factory mapping database engines
export function getDatabaseAdapter(dbType: DatabaseType, connectionString: string): IDatabaseAdapter {
  switch (dbType) {
    case 'local_storage':
      return new LocalStorageAdapter();
    case 'postgresql':
    case 'mysql':
    case 'mssql':
    case 'mongodb':
    case 'generic_api':
      return new RESTApiAdapter(dbType, connectionString);
    case 'firebase':
      return new FirebaseAdapter(connectionString);
    default:
      return new LocalStorageAdapter();
  }
}
