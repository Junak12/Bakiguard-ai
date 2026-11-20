import { defineMessages } from "./define";

export const ai = defineMessages({
  en: {
    title: "AI insights",
    subtitle: "What needs your attention",
    pageSubtitle: "BakiGuard reads your khata and tells you what to do next.",
    analyzing: "Analyzing your khata...",
    unavailable: "AI insights are unavailable right now. Your khata is unaffected.",
    allGood: "Everything looks good",
    allGoodHint: "No important issues found.",
    footer: "Based on your latest transactions",
    overdueListTitle: "Collect from these customers first",
    overdueListSubtitle: "Overdue customers, most late first",
    overdueListEmpty: "No overdue customers. Well done!",
    lateBy: "{days} days late",
    dueToday: "Due today",
    insights: {
      overdue_baki: {
        title: "Overdue Baki",
        message: "{amount} is past its due date (customers: {count}). Collect these first.",
      },
      outstanding_baki: {
        title: "Outstanding Baki",
        message: "Customers owe you {amount} in total.",
      },
      top_customer: {
        title: "Highest Baki",
        message: "{name} owes the most: {amount}.",
      },
      payment_activity: {
        title: "Payments collected",
        message: "You have collected {amount} from customers so far.",
      },
      getting_started: {
        title: "Get started",
        message: "Add your first customer to start tracking Baki.",
      },
    },
  },
  bn: {
    title: "এআই পরামর্শ",
    subtitle: "যেদিকে নজর দেওয়া দরকার",
    pageSubtitle: "বাকিগার্ড আপনার খাতা পড়ে বলে দেয় এরপর কী করবেন।",
    analyzing: "আপনার খাতা বিশ্লেষণ হচ্ছে...",
    unavailable: "এই মুহূর্তে এআই পরামর্শ পাওয়া যাচ্ছে না। আপনার খাতার কোনো ক্ষতি হয়নি।",
    allGood: "সব ঠিক আছে",
    allGoodHint: "গুরুত্বপূর্ণ কোনো সমস্যা পাওয়া যায়নি।",
    footer: "আপনার সর্বশেষ লেনদেনের ভিত্তিতে",
    overdueListTitle: "আগে এই কাস্টমারদের কাছ থেকে টাকা তুলুন",
    overdueListSubtitle: "দেরি করা কাস্টমার, বেশি দেরি আগে",
    overdueListEmpty: "কেউ দেরি করেননি। চমৎকার!",
    lateBy: "{days} দিন দেরি",
    dueToday: "আজ পরিশোধের দিন",
    insights: {
      overdue_baki: {
        title: "সময় পেরোনো বাকি",
        message: "{count} জন কাস্টমারের কাছে {amount} পরিশোধের সময় পেরিয়ে গেছে। আগে এগুলো তুলুন।",
      },
      outstanding_baki: {
        title: "মোট পাওনা",
        message: "কাস্টমারদের কাছে আপনার মোট পাওনা {amount}।",
      },
      top_customer: {
        title: "সবচেয়ে বেশি বাকি",
        message: "{name} এর কাছে সবচেয়ে বেশি পাওনা: {amount}।",
      },
      payment_activity: {
        title: "আদায় হওয়া টাকা",
        message: "এখন পর্যন্ত কাস্টমারদের কাছ থেকে {amount} আদায় হয়েছে।",
      },
      getting_started: {
        title: "শুরু করুন",
        message: "বাকির হিসাব রাখতে প্রথম কাস্টমার যোগ করুন।",
      },
    },
  },
});
