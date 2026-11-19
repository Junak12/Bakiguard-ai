import { defineMessages } from "./define";

export const dashboard = defineMessages({
  en: {
    greetingMorning: "Good morning, {name}",
    greetingAfternoon: "Good afternoon, {name}",
    greetingEvening: "Good evening, {name}",
    subtitle: "Here's where your khata stands today.",
    addCustomer: "Add customer",
    loadError: "Couldn't load your dashboard.",

    stats: {
      totalBaki: "Total Baki",
      totalBakiHint: "Money customers owe you now",
      overdue: "Overdue",
      overdueHint: "Customers late: {count}",
      overdueNone: "No one is late",
      collected: "Collected",
      collectedHint: "All payments received",
      customers: "Customers",
      customersHint: "Active customers",
    },

    aging: {
      title: "Who's late, and how late",
      subtitle: "Unpaid Baki grouped by days past the due date",
      notDue: "Not due yet",
      d1_30: "1–30 days late",
      d31_60: "31–60 days late",
      d61_90: "61–90 days late",
      d90plus: "Over 90 days late",
      customers: "Customers: {count}",
      empty: "No unpaid Baki. Everyone is settled.",
      seeOverdue: "See overdue customers",
    },

    recent: {
      title: "Recent transactions",
      subtitle: "Latest credit and payments",
      empty: "No transactions yet. Add a customer and record their first Baki.",
      credit: "Baki given",
      payment: "Payment received",
    },
  },
  bn: {
    greetingMorning: "শুভ সকাল, {name}",
    greetingAfternoon: "শুভ দুপুর, {name}",
    greetingEvening: "শুভ সন্ধ্যা, {name}",
    subtitle: "আজ আপনার খাতার অবস্থা দেখে নিন।",
    addCustomer: "কাস্টমার যোগ করুন",
    loadError: "ড্যাশবোর্ড লোড করা যায়নি।",

    stats: {
      totalBaki: "মোট বাকি",
      totalBakiHint: "কাস্টমারদের কাছে এখন পাওনা",
      overdue: "সময় পেরিয়েছে",
      overdueHint: "{count} জন কাস্টমার দেরি করছেন",
      overdueNone: "কেউ দেরি করেননি",
      collected: "আদায় হয়েছে",
      collectedHint: "মোট জমা পাওয়া টাকা",
      customers: "কাস্টমার",
      customersHint: "সক্রিয় কাস্টমার",
    },

    aging: {
      title: "কে দেরি করছেন, কত দিন",
      subtitle: "পরিশোধের তারিখ পেরোনোর দিন অনুযায়ী বাকি",
      notDue: "এখনো সময় আছে",
      d1_30: "১–৩০ দিন দেরি",
      d31_60: "৩১–৬০ দিন দেরি",
      d61_90: "৬১–৯০ দিন দেরি",
      d90plus: "৯০ দিনের বেশি দেরি",
      customers: "{count} জন",
      empty: "কোনো বাকি নেই। সবার হিসাব পরিষ্কার।",
      seeOverdue: "দেরি করা কাস্টমার দেখুন",
    },

    recent: {
      title: "সাম্প্রতিক লেনদেন",
      subtitle: "সর্বশেষ বাকি ও জমা",
      empty: "এখনো কোনো লেনদেন নেই। একজন কাস্টমার যোগ করে প্রথম বাকি লিখুন।",
      credit: "বাকি দেওয়া হয়েছে",
      payment: "টাকা জমা পাওয়া গেছে",
    },
  },
});
