# Embroidery Jobwork Management System

A premium full-stack solution for managing embroidery firms, tracking production (Inward/Outward), and generating financial reports.

---

## 🛠 System Architecture
- **Frontend**: React (Vite) + Material UI (MUI).
- **Backend**: Node.js + Express + MongoDB (Mongoose).
- **Communication**: REST API with JWT Authentication.

---

## 🔄 Operational Workflow
The system centralizes all production tracking through **Job Cards**:

1.  **Setup**: Define your **Firm**, then add **Parties (Veparis)**, **Brokers**, and **Designs**.
2.  **Job Card Creation**: Generate a Job Card for a Design x Party pair. 
    - The system calculates the `total_amount` based on the Design's stitches and rate.
    - These values are "frozen" in the Job Card, so future rate changes don't affect existing records.
3.  **Inward Movement**: Log an **Inward Challan** when physical goods arrive from the Party.
4.  **Production**: Track the progress via the **Pending Stock** report.
5.  **Outward Movement**: Log an **Outward Challan** when finished work is delivered.
6.  **Auto-Status**: 
    - `PENDING`: Created, no inward goods yet.
    - `IN_PROCESS`: Some goods received via Inward Challan.
    - `COMPLETED`: All inward goods have been sent back via Outward Challan.

---

## 🧮 Core Calculations

### 1. Job Card Values
- **Rate Per Piece**: `(Design Stitch Count / 1000) * Rate Per 1000`
- **Total Job Value**: `Rate Per Piece * Total Pieces`
- **Broker Commission**: `Total Job Value * (Broker Commission % / 100)`

### 2. Inventory Logic
- **Pending Pieces**: `Current Inward Pieces - Current Outward Pieces`
- **Availability Guard**: You cannot log more Outward pieces than you have Inward.

---

## 🔗 Model Relationships
- **Firm**: The top-level scope. All other data belongs to a firm.
- **Party**: One Party → Many Designs → Many Job Cards.
- **Broker**: Optional link in a Job Card for commission tracking.
- **Job Card**: Links Party, Design, and Broker. Contains a frozen snapshot of Design rates.
- **Challan**: Linked 1:Many to a Job Card (tracks incremental inward/outward).

---

## 📡 Key API Endpoints

### 🔐 Auth & Identity
- `POST /api/auth/login`: Admin/Staff login.
- `GET /api/company`: List/Manage Firms.

### 🏗 Master Data
- `GET /api/vepari`: Manage Parties.
- `GET /api/broker`: Manage Brokers.
- `GET /api/design`: Manage Embroidery Designs.

### 🧵 Operations
- `POST /api/jobcard`: Generate a new Job Card.
- `GET /api/jobcard`: List job cards with filtering.
- `POST /api/jobcard/:id/inward`: Log inward material.
- `POST /api/jobcard/:id/outward`: Log finished delivery.

### 📊 Business Intelligence
- `GET /api/report/pending-stock`: Live production inventory.
- `GET /api/report/broker-commission`: Commission payouts.
- `GET /api/report/vepari-ledger`: Transaction history per client.
- `GET /api/report/production-summary`: High-level revenue and piece stats.

---

## ✨ Features
- **Global Date Format**: Standardized `DD-MM-YY` across the system.
- **Interactive Details**: Full detail popups for Firms, Parties, Brokers, Designs, and Job Cards.
- **Premium UI**: Tonal status badges, glassmorphism design, and logos in firm selectors.
- **Exports**: One-click **Export to CSV** for all financial reports (optimized for Excel with UTF-8 BOM).
