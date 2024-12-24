import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import * as SQLite from "expo-sqlite";

// Interface defining the structure of a note object
export interface myContextProps {
  id: number;
  title: string;
  desc: string;
}

// Create a React context for managing note data
export const UpdateContext = createContext<{
  items: myContextProps[];
  setItems: React.Dispatch<React.SetStateAction<myContextProps[]>>;
}>({
  items: [],
  setItems: () => {},
});

// Context provider component that wraps the app and provides note data
export const ContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<myContextProps[]>([]); // State to store note data
  const db = SQLite.useSQLiteContext(); // Get access to the SQLite database

  // Function to fetch note data from the database (useCallback for memoization)
  const getData = useCallback(async () => {
    // Check if database is available before accessing
    if (!db) return;
    try {
      const allRows = await db.getAllAsync(`SELECT * FROM notes ORDER BY DESC`);

      // from AI to make the item more typed
      const typedRows: myContextProps[] = allRows.map((row: any) => ({
        id: row.id,
        title: row.title,
        desc: row.desc,
      }));
      setItems(typedRows);
      // Alternative way using type assertion (less safe, commented out)
      // setItems(allRows as myContextProps[]);

      // // Optionally set a separate state for note count (commented out)
      // setId(allRows.length);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [db]); // Re-run getData when the database context changes

  // Run getData on component mount
  useEffect(() => {
    getData();
  }, [getData]);
  return (
    // Provide the context value with current items and setItems function
    <UpdateContext.Provider value={{ items, setItems }}>
      {children}
    </UpdateContext.Provider>
  );
};
