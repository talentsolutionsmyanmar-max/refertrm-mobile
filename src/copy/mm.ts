/**
 * CCO/F50-approved Myanmar chrome for the Academy/Learn mobile journey.
 * Lesson/content bytes remain source-bound and must never be translated here.
 */
export const copyMm = {
  nav: {
    academy: "Academy",
  },

  academy: {
    search: "Course ရှာရန်",
    allTopics: "ခေါင်းစဉ်အားလုံး",
    myanmarAvailable: "မြန်မာစာ ရနိုင်ပါသည်",
    count: (n: number) => `ထုတ်ပြန်ထားသော course ${n} ခု`,
    languageEn: "English",
    languageMm: "မြန်မာ",
    questions: "မေးခွန်းများ",
    empty: "ရှာဖွေမှုနှင့် ကိုက်ညီသော ထုတ်ပြန်ထားသည့် course မရှိပါ။",
    emptyOffline: "သိမ်းထားသော course မရှိသေးပါ။ Catalogue ရယူရန် အင်တာနက်ဖြင့် တစ်ကြိမ်ချိတ်ဆက်ပါ။",
  },

  errors: {
    notFound: "မတွေ့ရှိပါ။",
  },
} as const;
