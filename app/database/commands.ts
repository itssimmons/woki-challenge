#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs/promises";
import chalk from "chalk";
import { fileURLToPath } from "node:url";

import sqlite from "@database/driver/sqlite";
import * as cli from "../../packages/cli";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = console.log.bind(console);

namespace DB {
  export async function wipe() {
    log();
    try {
      await fs.writeFile("./app/database/database.sqlite3", "", {
        encoding: "utf-8",
      });

      cli.indexPrint("Wiped in", chalk.green("0ms"), {
        character: chalk.gray(".") as ".",
      });
    } catch {
      cli.indexPrint("Wipe failed", chalk.red("0ms"), {
        character: chalk.gray(".") as ".",
      });
    }
  }

  export async function runQueryFolder(
    kind: "migrations" | "seeders" = "migrations",
  ) {
    return new Promise<void>(async (resolve) => {
      const label = kind.slice(0, -1).toUpperCase();

      log();
      cli.indexPrint(chalk.grey(label), chalk.gray("STATUS"), {
        character: chalk.gray(".") as ".",
      });

      for await (const entry of fs.glob(`${__dirname}/${kind}/*.sql`)) {
        const { name: filename } = path.parse(entry);

        try {
          const rawQuery = await fs.readFile(entry, { encoding: "utf-8" });
          sqlite.exec(rawQuery);

          cli.indexPrint(`${filename}.sql`, chalk.green("Ran"), {
            character: chalk.gray(".") as ".",
          });
        } catch (e) {
          cli.indexPrint(`${filename}.sql`, chalk.red("Failed"), {
            character: chalk.gray(".") as ".",
          });
          log(`\n  ${e}\n`);
          break;
        }
      }

      log();
      resolve();
    });
  }
}

(async () => {
  const args = process.argv.slice(2);

  for (const s of args) {
    switch (true) {
      case /^(--migrate)$/.test(s):
        await DB.runQueryFolder("migrations");
        break;
      case /^(--seed)$/.test(s):
        await DB.runQueryFolder("seeders");
        break;
      case /^(--wipe)$/.test(s):
        await DB.wipe();
        break;
      default:
        log("Unhandled flag, please try with a valid one.");
        break;
    }
  }
})();
