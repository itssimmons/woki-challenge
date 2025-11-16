import { DatabaseSync } from "node:sqlite";

const sqlite = new DatabaseSync("./app/database/database.sqlite3");
sqlite.exec("PRAGMA foreign_keys = ON;");
process.on("exit", () => sqlite.close());

export default sqlite;
