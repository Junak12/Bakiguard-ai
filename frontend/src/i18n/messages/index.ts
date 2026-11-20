import type { Language } from "../format";
import { ai } from "./ai";
import { auth } from "./auth";
import { collections, reminders, statement } from "./collections";
import { billing, reports, team } from "./business";
import { common } from "./common";
import { customers } from "./customers";
import { dashboard } from "./dashboard";
import { landing } from "./landing";
import { nav } from "./nav";
import { pwa } from "./pwa";
import { risk } from "./risk";
import { settings } from "./settings";
import { transactions } from "./transactions";

const areas = { common, nav, auth, pwa, settings, dashboard, ai, customers, transactions, landing, collections, reminders, statement, risk, reports, billing, team };

type Areas = typeof areas;

export type Dictionary = { [K in keyof Areas]: Areas[K]["en"] };

function build(lang: Language): Dictionary {
  return Object.fromEntries(
    Object.entries(areas).map(([name, messages]) => [name, messages[lang]])
  ) as Dictionary;
}

export const dictionaries: Record<Language, Dictionary> = {
  en: build("en"),
  bn: build("bn"),
};
