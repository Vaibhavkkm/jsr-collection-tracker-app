# 📱 Daily Collection Tracker

A premium, offline-first mobile application designed for seamless daily money collection management. Built with a focus on simplicity, accuracy, and a high-end user experience.

> **Note:** This project was created to explore application design using **"vibe coding"**—an approach that prioritizes fluid interactions, intuitive flows, and a premium "feel" over traditional, rigid development patterns. The goal was to build something that doesn't just work, but feels great to use.

---

## ✨ Features

### 💰 Collection Management
- **One-Tap Collection:** Quickly record daily payments with a single tap.
- **Custom Amounts:** Flexible input for non-standard payments.
- **Skip Logic:** Mark days as skipped with reasons.
- **Smart History:** View complete timeline of every transaction.

### 🔄 Cycle & Withdrawal System
- **Auto-Cycle Management:** Tracks collections against a total target.
- **Full Withdrawals:** Close a cycle and start fresh with one tap.
- **Partial Withdrawals:** Unique date-based withdrawal system—withdraw collections up to a specific date while keeping the cycle active.
- **Instant Calculations:** Real-time updates of remaining balances and totals.

### 👥 People & Profiles
- **Rich Profiles:** specific photos, location metadata, and notes for each person.
- **Direct Calling:** One-tap calling integration.
- **Search:** Fast, responsive search to find people instantly.

### 📊 Reports & Data Check
- **PDF Reports:** Generate professional monthly collection reports.
- **Excel/CSV Export:** Export data for external analysis.
- **SMS Receipts:** (Ready) Send confirmation SMS for payments and withdrawals.
- **Weekly Reminders:** Friendly nudges to backup your data.

### 🛡️ Secure Data Backup
- **Comprehensive Backup:** Full JSON export of **all** data (People, Cycles, Withdrawals, Collection History).
- **Easy Restore:** Restore your entire database from a backup file with zero data loss.
- **Offline First:** All data lives on your device. No cloud servers, total privacy.

### 🎨 Premium "Vibe" Design
- **Glassmorphism UI:** Modern, translucent elements with blur effects.
- **Dark Mode:** Deep, battery-saving dark theme with vibrant accents.
- **Micro-Animations:** Smooth layout transitions (LayoutAnimation, Reanimated).
- **Haptic Feedback:** Tactile response for important actions.
- **Curve-Compatible:** Optimized layout for modern curved-screen devices.

---

## 🛠️ Tech Stack

- **Framework:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Language:** TypeScript
- **Database:** `expo-sqlite` (Local SQL engine)
- **Routing:** `expo-router` (File-based routing)
- **Animations:** `react-native-reanimated`
- **UI Components:** Custom "Glass" components, BlurView, Vector Icons

---

## 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/collection-tracker.git
    cd collection-tracker
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the app:**
    ```bash
    npx expo start
    ```

4.  **Scan & Go:** Scan the QR code with the **Expo Go** app on your Android/iOS device.

---

## 📸 Philosophy

This app was built to solve a real-world problem: replacing messy paper ledgers with a digital solution that doesn't feel like a boring spreadsheet. It emphasizes:
*   **Speed:** Get in, collect, get out.
*   **Trust:** Data is always accurate and backed up.
*   **delight:** Making finance tracking satisfying through good design.
