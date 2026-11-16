import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getInitialSeedData } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'store.json');

class Database {
  constructor() {
    this.data = { members: [], loans: [] };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.reset();
      }
    } catch (err) {
      console.warn('Could not read existing store.json, resetting to seed data:', err.message);
      this.reset();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save store.json:', err.message);
    }
  }

  reset() {
    this.data = getInitialSeedData();
    this.save();
    return this.data;
  }

  // Member operations
  getMembers() {
    return this.data.members;
  }

  getMemberById(id) {
    return this.data.members.find(m => m.id === id);
  }

  getMemberByEmployeeId(empId) {
    return this.data.members.find(m => m.employeeId.toLowerCase() === empId.toLowerCase());
  }

  addMember(memberData) {
    const nextNum = this.data.members.length + 101;
    const newMember = {
      id: `MBR-${nextNum}`,
      name: memberData.name.trim(),
      employeeId: memberData.employeeId.trim().toUpperCase(),
      monthlySalary: Math.round(Number(memberData.monthlySalary)),
      createdAt: new Date().toISOString()
    };
    this.data.members.push(newMember);
    this.save();
    return newMember;
  }

  // Loan operations
  getLoans() {
    return this.data.loans;
  }

  getLoanById(id) {
    return this.data.loans.find(l => l.id === id);
  }

  getLoansByMemberId(memberId) {
    return this.data.loans.filter(l => l.memberId === memberId);
  }

  addLoan(loanData) {
    const nextNum = String(this.data.loans.length + 1).padStart(3, '0');
    const newLoan = {
      id: `LN-2026-${nextNum}`,
      ...loanData,
      createdAt: new Date().toISOString()
    };
    this.data.loans.push(newLoan);
    this.save();
    return newLoan;
  }

  updateLoan(id, updates) {
    const index = this.data.loans.findIndex(l => l.id === id);
    if (index === -1) return null;

    this.data.loans[index] = {
      ...this.data.loans[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.loans[index];
  }
}

export const db = new Database();
