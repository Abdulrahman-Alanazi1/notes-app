import { View, Text, SafeAreaView } from "react-native";
import React, { Suspense } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SQLiteDatabase, SQLiteProvider } from "expo-sqlite";
import { ContextProvider } from "../context/UpdateContext";

// Layout component that wraps the app with necessary providers
export default function Layout() {
  return (
    // Provides SQLite context to the app
    <SQLiteProvider databaseName="myNotes.db" onInit={migrateDbIfNeeded}>
      {/* Provides custom context for managing notes data */}
      <ContextProvider>
        <View style={{ flex: 1 }}>
          <StatusBar />
          <Stack
            screenOptions={{
              headerShown: false, // Hides the default header for all screens
            }}
          />
        </View>
      </ContextProvider>
    </SQLiteProvider>
  );
}
// Function to handle database migration if needed
async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  try {
    // Get the current database version from PRAGMA
    const result = await db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version"
    );
    // If no version is set, default to 0
    let currentDbVersion = result?.user_version ?? 0;
    // If the current version is up-to-date, exit early
    if (currentDbVersion >= DATABASE_VERSION) {
      return;
    }
    // Enable Write-Ahead Logging (WAL) for better performance
    await db.execAsync("PRAGMA journal_mode = 'wal';");

    // Perform migrations based on the current version
    if (currentDbVersion === 0) {
      // Begin a transaction to ensure atomicity of schema changes
      await db.execAsync("BEGIN TRANSACTION;");
      try {
        // Create the notes table if it doesn't exist
        await db.execAsync(
          `
          CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY NOT NULL, title TEXT NOT NULL, desc TEXT);`
        );
        // Update the database version in PRAGMA
        currentDbVersion = 1;
        await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
        await db.execAsync("COMMIT;"); // Commit after successful operations
        console.log("Database migrated to version", DATABASE_VERSION);
      } catch (error) {
        // Rollback the transaction in case of any errors
        await db.execAsync("ROLLBACK;");
        throw error;
      }
    }
  } catch (error) {
    // Handle errors during database checks or upgrades
    console.error("Error checking/upgrading database:", error);
    throw error; // Important to re-throw so the app knows migration failed
  }
}
