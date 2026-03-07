import type { CellFormat } from "@/types";

export interface TemplateData {
  columnWidths: Record<string, number>;
  cells: Record<string, { raw: string; format?: Partial<CellFormat> }>;
}

export const TEMPLATE_REGISTRY: Record<string, TemplateData> = {
  "Monthly Budget": {
    columnWidths: { A: 160, B: 120, C: 120 },
    cells: {
      "A1": { raw: "MONTHLY BUDGET", format: { bold: true, fontSize: 16, textColor: "#10B981" } },
      
      "A3": { raw: "INCOME", format: { bold: true, bgColor: "#10B98125" } },
      "B3": { raw: "Expected", format: { bold: true, align: "right" } },
      "C3": { raw: "Actual", format: { bold: true, align: "right" } },
      
      "A4": { raw: "Primary Salary" },
      "B4": { raw: "4000" },
      "C4": { raw: "4000" },
      
      "A5": { raw: "Side Hustle" },
      "B5": { raw: "500" },
      "C5": { raw: "650" },
      
      "A6": { raw: "Total Income", format: { bold: true } },
      "B6": { raw: "=B4+B5", format: { bold: true, align: "right" } },
      "C6": { raw: "=C4+C5", format: { bold: true, align: "right" } },

      // Expenses Section
      "A8": { raw: "EXPENSES", format: { bold: true, bgColor: "#EF444425" } },
      "B8": { raw: "Planned", format: { bold: true, align: "right" } },
      "C8": { raw: "Actual", format: { bold: true, align: "right" } },
      
      "A9": { raw: "Rent/Mortgage" },
      "B9": { raw: "1500" },
      "C9": { raw: "1500" },
      
      "A10": { raw: "Groceries" },
      "B10": { raw: "400" },
      "C10": { raw: "450" },
      
      "A11": { raw: "Utilities" },
      "B11": { raw: "200" },
      "C11": { raw: "180" },

      "A12": { raw: "Total Expenses", format: { bold: true } },
      "B12": { raw: "=B9+B10+B11", format: { bold: true, align: "right" } },
      "C12": { raw: "=C9+C10+C11", format: { bold: true, align: "right" } },

      // Summary
      "A14": { raw: "NET SAVINGS", format: { bold: true, fontSize: 14, textColor: "#3B82F6" } },
      "C14": { raw: "=C6-C12", format: { bold: true, fontSize: 14, align: "right" } },
    },
  },
  
  "Project Tracker": {
    columnWidths: { A: 200, B: 120, C: 120, D: 150 },
    cells: {
      "A1": { raw: "PROJECT TRACKER", format: { bold: true, fontSize: 16, textColor: "#F59E0B" } },
      
      "A3": { raw: "Task Name", format: { bold: true, bgColor: "#F59E0B25" } },
      "B3": { raw: "Status", format: { bold: true, bgColor: "#F59E0B25" } },
      "C3": { raw: "Priority", format: { bold: true, bgColor: "#F59E0B25" } },
      "D3": { raw: "Due Date", format: { bold: true, bgColor: "#F59E0B25" } },
      
      "A4": { raw: "Design UI Mockups" },
      "B4": { raw: "In Progress", format: { textColor: "#3B82F6", bold: true } },
      "C4": { raw: "High", format: { textColor: "#EF4444", bold: true } },
      "D4": { raw: "Oct 15" },
      
      "A5": { raw: "Setup Firebase Auth" },
      "B5": { raw: "Completed", format: { textColor: "#10B981", bold: true } },
      "C5": { raw: "High", format: { textColor: "#EF4444", bold: true } },
      "D5": { raw: "Oct 10" },
      
      "A6": { raw: "Write Documentation" },
      "B6": { raw: "Not Started", format: { textColor: "#6B7280" } },
      "C6": { raw: "Low" },
      "D6": { raw: "Oct 25" },
    }
  },

  "Habit Planner": {
    columnWidths: { A: 180, B: 45, C: 45, D: 45, E: 45, F: 45, G: 45, H: 45, I: 100 },
    cells: {
      "A1": { raw: "WEEKLY HABITS", format: { bold: true, fontSize: 16, textColor: "#EF4444" } },
      "A3": { raw: "Habit", format: { bold: true, bgColor: "#EF444425" } },
      "B3": { raw: "M", format: { bold: true, align: "center", bgColor: "#EF444425" } },
      "C3": { raw: "T", format: { bold: true, align: "center", bgColor: "#EF444425" } },
      "D3": { raw: "W", format: { bold: true, align: "center", bgColor: "#EF444425" } },
      "E3": { raw: "T", format: { bold: true, align: "center", bgColor: "#EF444425" } },
      "F3": { raw: "F", format: { bold: true, align: "center", bgColor: "#EF444425" } },
      "G3": { raw: "S", format: { bold: true, align: "center", bgColor: "#EF444425" } },
      "H3": { raw: "S", format: { bold: true, align: "center", bgColor: "#EF444425" } },
      "I3": { raw: "Goal", format: { bold: true, align: "center", bgColor: "#EF444425" } },
      "A4": { raw: "Morning Workout" },
      "B4": { raw: "x", format: { align: "center", textColor: "#10B981", bold: true } },
      "C4": { raw: "x", format: { align: "center", textColor: "#10B981", bold: true } },
      "D4": { raw: "-", format: { align: "center", textColor: "#EF4444" } },
      "I4": { raw: "5 Days", format: { align: "center", textColor: "#6B7280" } },
      "A5": { raw: "Read 20 Pages" },
      "B5": { raw: "x", format: { align: "center", textColor: "#10B981", bold: true } },
      "C5": { raw: "-", format: { align: "center", textColor: "#EF4444" } },
      "D5": { raw: "x", format: { align: "center", textColor: "#10B981", bold: true } },
      "I5": { raw: "7 Days", format: { align: "center", textColor: "#6B7280" } },
      "A6": { raw: "Drink 2L Water" },
      "B6": { raw: "x", format: { align: "center", textColor: "#10B981", bold: true } },
      "C6": { raw: "x", format: { align: "center", textColor: "#10B981", bold: true } },
      "D6": { raw: "x", format: { align: "center", textColor: "#10B981", bold: true } },
      "I6": { raw: "7 Days", format: { align: "center", textColor: "#6B7280" } },
    }
  }
};