export interface PresetText {
  id: string;
  category: string;
  title: string;
  english: string;
  hindi: string;
}

export const PRESET_TEXTS: PresetText[] = [
  {
    id: "greet-formal",
    category: "Greetings",
    title: "Formal Greetings",
    english: "Welcome, dear guest. It is an absolute honor and pleasure to have you with us today. We hope you have a spectacular stay.",
    hindi: "आपका स्वागत है, प्रिय अतिथि। आज हमारे साथ आपका होना अत्यंत सम्मान और प्रसन्नता की बात है। हम आशा करते हैं कि आपका यहाँ ठहरना शानदार रहेगा।"
  },
  {
    id: "greet-casual",
    category: "Greetings",
    title: "Warm Wishes",
    english: "Hey my friend! I was just thinking about you. Hope you are doing amazing and having a wonderful week!",
    hindi: "अरे मेरे दोस्त! मैं बस तुम्हारे बारे ही में सोच रहा था। आशा है कि तुम बहुत अच्छे होगे और तुम्हारा यह हफ्ता शानदार बीत रहा होगा!"
  },
  {
    id: "customer-service",
    category: "Business",
    title: "Customer Support Announcement",
    english: "Thank you for contacting our support desk. All of our agents are currently assisting other clients. Your call is very important to us, please stay on the line.",
    hindi: "हमारे सहायता सहायता केंद्र से संपर्क करने के लिए धन्यवाद। हमारे सभी एजेंट वर्तमान में अन्य ग्राहकों की सहायता कर रहे हैं। आपकी कॉल हमारे लिए बहुत महत्वपूर्ण है, कृपया लाइन पर बने रहें।"
  },
  {
    id: "audiobook-story",
    category: "Storytelling",
    title: "Magical Short Story",
    english: "Deep within the whisper valley, there lies a glowing waterfall where time stands still. Legend says whoever drinks its water gains the voice of the stars.",
    hindi: "कानाफूसी घाटी के गहरे भीतर, एक चमकता हुआ झरना है जहाँ समय थम जाता है। किंवदंती है कि जो कोई भी इसका पानी पीता है उसे सितारों की आवाज़ मिल जाती है।"
  },
  {
    id: "tech-news",
    category: "Technology",
    title: "Tech Innovation",
    english: "Yesterday evening, researchers unveiled a fully functional neural interface that allows humans to write code at the speed of thought. The future is truly here.",
    hindi: "कल शाम, शोधकर्ताओं ने एक पूरी तरह से कार्यात्मक न्यूरल इंटरफ़ेस का अनावरण किया जो मनुष्यों को विचार की गति से कोड लिखने की अनुमति देता है। भविष्य वास्तव में यहाँ है।"
  }
];

export const GOOGLE_VOICES_INFO = [
  {
    id: "Zephyr",
    name: "Zephyr",
    gender: "Female",
    description: "Soft, gentle, warm conversational feminine voice",
    style: "Friendly & Warm"
  },
  {
    id: "Kore",
    name: "Kore",
    gender: "Female",
    description: "Clear, bright, elegant classic feminine voice",
    style: "Professional & Bright"
  },
  {
    id: "Puck",
    name: "Puck",
    gender: "Male",
    description: "Energetic, youthful, clear masculine/neutral voice",
    style: "Energetic & Modern"
  },
  {
    id: "Charon",
    name: "Charon",
    gender: "Male",
    description: "Deep, mature, authority-classic masculine voice",
    style: "Deep & Professional"
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    gender: "Male",
    description: "Rich, warm, raspy masculine voice",
    style: "Textured & Story-ready"
  }
];
