import { View, Text, TouchableOpacity, FlatList, Alert, Platform, Share } from "react-native";
import React, { useEffect, useState, useContext } from "react";
import { router } from "expo-router";
import * as SQLite from "expo-sqlite";
import { Ionicons, Feather } from "@expo/vector-icons/";
import { SafeAreaView } from "react-native-safe-area-context";
import { myContextProps, UpdateContext } from "../context/UpdateContext";

type index = {
  id: number;
};
const Header = ({ id }: index) => {
  // Renders the header component with note count
  return (
    <SafeAreaView
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        margin: 10,
      }}
    >
      <View style={{ flexDirection: "column" }}>
        <Text style={{ fontWeight: "bold", fontSize: 18 }}>Notes App</Text>
        <Text style={{ fontSize: 13 }}>You Have {id} Note/s</Text>
      </View>
      <View style={{ flexDirection: "row" }}>
        <TouchableOpacity
          onPress={() => {
            router.push("./details");
          }}
        >
          <Feather name="edit" size={24} />
        </TouchableOpacity>
        <Ionicons name="ellipsis-vertical-sharp" size={24} />
      </View>
    </SafeAreaView>
  );
};
export default function index() {
  const [id, setId] = useState(0); // State variable for note count
  const { items, setItems } = useContext(UpdateContext); // Access notes data from context
  const db = SQLite.useSQLiteContext(); // Get access to the SQLite database

  // Update note count based on context data on component mount/update
  useEffect(() => {
    if (items) {
      setId(items.length);
    } else {
      setId(0);
    }
  }, [items]);
  const shareNote = async (title: string, desc: string) => {
    try {
      const result = await Share.share({
        message: `${title}\n\n${desc}`, // Content to share
        title: title, // Title of the shared content (Android)
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          console.log("Shared with:", result.activityType);
        } else {
          // shared
          console.log("Shared successfully");
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
        console.log("Sharing dismissed");
      }
    } catch (error: any) {
      if (Platform.OS === 'android' && error.message === 'No Activity Found') {
        Alert.alert("Error", "No app available to handle sharing.");
      } else {
        Alert.alert("Error", error.message);
      }
      console.error("Error sharing:", error);
    }
  };
  // Function to delete a note using its ID
  const deleteOneItem = async (id: number) => {
    try {
      // Delete the note from the database
      await db.runAsync(`DELETE FROM notes WHERE id= ?`, [id]);

      // Refetch data after deletion to update UI
      const allRows = await db.getAllAsync(`SELECT * FROM notes`);
      const typedRows: myContextProps[] = allRows.map((row: any) => ({
        id: row.id,
        title: row.title,
        desc: row.desc,
      }));
      setItems(typedRows);
      console.log(`Item with ID ${id} deleted`);
    } catch (error) {
      console.error(error);
    }
    // Update the note count state to reflect deletion (optional)
    setId((prevId) => prevId - 1);  // Assuming decrement on deletion
  };
  return (
    <View style={{ flex: 1 }}>
      <Header id={id} />

      <FlatList
        data={items}
        keyExtractor={(item, index) => index.toString()}
        scrollEnabled={true}
        renderItem={({ item, index }) => {
          return (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                router.push({
                  pathname: "./details",
                  params: {
                    id: item.id,
                    title: item.title,
                    desc: item.desc,
                  },
                });
              }}
            >
              <View
                style={{
                  padding: 10,
                  backgroundColor: "snow",
                  margin: 5,
                  alignItems: "center",
                  borderRadius: 5,
                  elevation: 5,
                }}
                key={item.id}
              >
                <View
                  style={{
                    flex: 1,
                    flexDirection: "column",
                    justifyContent: "space-evenly",
                  }}
                >
                  <View
                    style={{
                      width: "100%",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      borderBottomWidth: 1,
                      padding: 10,
                      borderStyle: "dashed",
                    }}
                  >
                    <Text style={{ fontWeight: "bold" }}>{item.title}</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail">
                      {item.desc}
                    </Text>
                  </View>
                  <View
                    style={{
                      margin: 5,
                      flexDirection: "row-reverse",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      color={"gray"}
                      name="trash"
                      size={24}
                      onPress={() => deleteOneItem(item.id)}
                    />
                    <Ionicons
                      color={"gray"}
                      style={{ marginRight: 10 }}
                      name="share-social"
                      size={24}
                      onPress={() => {
                        shareNote(item.title, item.desc)
                      }}
                    />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
