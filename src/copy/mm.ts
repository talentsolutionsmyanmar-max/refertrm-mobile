/**
 * CCO/F50-approved Myanmar chrome for the complete Academy/Learn mobile journey.
 * Source lesson/content bytes remain server-owned and must never be translated here.
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
    minutes: (n: number) => `${n} မိနစ်`,
    xp: (n: number) => `${n} XP`,
    empty: "ရှာဖွေမှုနှင့် ကိုက်ညီသော ထုတ်ပြန်ထားသည့် course မရှိပါ။",
    emptyOffline: "သိမ်းထားသော course မရှိသေးပါ။ Catalogue ရယူရန် အင်တာနက်ဖြင့် တစ်ကြိမ်ချိတ်ဆက်ပါ။",
    languageEn: "English",
    languageMm: "မြန်မာ",
    questions: "မေးခွန်းများ",
    furtherReading: "ဆက်လက်ဖတ်ရှုရန်",
    mmHidden: "ဤ lesson ၏ မြန်မာစာကို မအတည်ပြုရသေးပါ။ လက်ရှိတွင် English ကိုသာ ဖော်ပြထားပါသည်။",
    bodyOffline: "ဤ lesson ကို ပထမဆုံးဖွင့်ရန် အင်တာနက်ချိတ်ဆက်မှု လိုအပ်ပါသည်။",
  },

  offline: {
    banner: "အင်တာနက်ချိတ်ဆက်မှု မရှိပါ။ သိမ်းထားသောအကြောင်းအရာကို ဖော်ပြထားပါသည်။",
    stale: "သိမ်းထားသောအကြောင်းအရာဖြစ်ပါသည်။ အချိန်မီမဖြစ်နိုင်ပါ။",
  },

  errors: {
    network: "ReferTRM သို့ ချိတ်ဆက်မရပါ။ အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပါ။",
    loading: "တင်နေပါသည်…",
    retry: "ထပ်မံကြိုးစားပါ",
    notFound: "မတွေ့ရှိပါ။",
  },
} as const;

export type CopyMm = typeof copyMm;
