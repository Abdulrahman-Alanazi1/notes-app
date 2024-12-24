import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Alert,
} from "react-native";
import React, { useContext, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, AntDesign } from "@expo/vector-icons/";
import * as SQLite from "expo-sqlite";
import { myContextProps, UpdateContext } from "../context/UpdateContext";

// Interface defining the structure of a note object
type headerProps = {
  onSave: () => Promise<void>;
  mode: "addfile" | "edit";
  headerTitle: string;
};
// Header component that displays title and save/edit button
const Header = ({ onSave, mode, headerTitle }: headerProps) => {
  return (
    <View style={styles.HeaderContainer}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-start",
          width: "50%",
          margin: 10,
        }}
      >
        <Ionicons name="arrow-back" size={24} onPress={() => router.back()} />
        <Text
          style={{
            fontWeight: "bold",
            fontSize: 18,
            textAlign: "left",
            marginLeft: 10,
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {headerTitle}
        </Text>
      </View>
      <View style={{ margin: 10 }}>
        <TouchableOpacity
          onPress={async () => {
            try {
              await onSave(); // Call the provided saving function
            } catch (error) {
              console.error("Error inserting note:", error);
              Alert.alert("Error", "Failed to save note. Please try again.");
            }
          }}
        >
          {mode === "addfile" ? (
            <AntDesign name="addfile" size={24} />
          ) : (
            <AntDesign name="edit" size={24} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
// Function to update a note in the database
async function updateNoteInDb(
  db: SQLite.SQLiteDatabase,
  id: number,
  title: string,
  desc: string
): Promise<void> {
  if (!db) {
    console.warn("Database not initialized yet.");
    Alert.alert("Error", "Database is not ready. Please try again later.");
    return;
  }
  if (!title.trim() || !desc.trim()) {
    Alert.alert("Error", "Please enter both title and Note.");
    return;
  }
  try {
    db.runAsync(`UPDATE notes SET title = ?, desc = ? WHERE id = ?`, [
      title,
      desc,
      id,
    ]);
  } catch (error) {
    console.error("Error updating note:", error);
    Alert.alert("Error", "Failed to update note. Please try again.");
    throw error;
  }
}
// Function to insert a new note into the database
async function insertSQL(
  db: SQLite.SQLiteDatabase,
  title: string,
  desc: string
): Promise<void> {
  if (!db) {
    console.warn("Database not initialized yet.");
    Alert.alert("Error", "Database is not ready. Please try again later.");
    return;
  }
  if (!title.trim() || !desc.trim()) {
    Alert.alert("Error", "Please enter both title and Note.");
    return;
  }
  try {
    const result = await db.runAsync(
      `INSERT INTO notes (title, desc) VALUES (?,?)`,
      [title, desc]
    );
    console.log(result.lastInsertRowId, result.changes);
  } catch (error) {
    console.log(error);
    Alert.alert(
      "Error",
      "Failed to save note. Please check your inputs and try again."
    );

    throw error;
  }
}
export default function details() {
  // State to store route parameters (using useLocalSearchParams)
  const params = useLocalSearchParams();

  // Extract note ID, title, and description from parameters with robust handling
  const noteId = params.id ? Number(params.id) : null;
  const initialTitle =
    typeof params.title === "string"
      ? params.title
      : Array.isArray(params.title)
      ? params.title[0]
      : "";
  const initialDesc =
    typeof params.desc === "string"
      ? params.desc
      : Array.isArray(params.desc)
      ? params.desc[0]
      : "";

  const [title, setTitle] = useState(initialTitle);
  const [desc, setDesc] = useState(initialDesc);
  // Context to access and update the notes list
  const { items, setItems } = useContext(UpdateContext);
  // Access the database connection
  const db = SQLite.useSQLiteContext();
  // Flag to determine if editing an existing note
  const isEditing = !!noteId;

  // Function to handle saving the note (either insert or update)
  const handleNote = async () => {
    try {
      if (isEditing) {
        await updateNoteInDb(db, Number(noteId), title, desc); // Update existing note
      } else {
        await insertSQL(db, title, desc); // Insert new note
      }
      // Refetch data after insertion or update
      const allRows = await db.getAllAsync(`SELECT * FROM notes ORDER BY DESC`);
      const typedRows: myContextProps[] = allRows.map((row: any) => ({
        id: row.id,
        title: row.title,
        desc: row.desc,
      }));
      await setItems(typedRows);
      router.replace("/");
    } catch (error) {
      // This catch block is now empty as the errors are handled in the functions
    }
  };
  return (
    <SafeAreaView style={styles.Container}>
      <Header
        onSave={handleNote}
        mode={isEditing ? "edit" : "addfile"}
        headerTitle={title}
      />
      <View
        style={{ backgroundColor: "white", height: "90%", borderRadius: 5 }}
      >
        <TextInput
          style={styles.Title}
          onChangeText={(text) => setTitle(text)}
          value={title}
          multiline
          placeholder="Title"
        />
        <TextInput
          style={styles.Desc}
          onChangeText={(text) => setDesc(text)}
          value={desc}
          placeholder="Your Note"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  HeaderContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
  },
  Container: {
    paddingTop: StatusBar.currentHeight,
    padding: 10,
  },
  Title: {
    fontWeight: "bold",
    margin: 10,
    borderBottomWidth: 1,
  },
  Desc: {
    height: "94%",
    textAlign: "justify",
    textAlignVertical: "top",
    margin: 10,
  },
});
