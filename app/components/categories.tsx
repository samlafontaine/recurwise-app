export const categories = [
  { label: "Streaming", value: "streaming", icon: "📺" },
  { label: "Music", value: "music", icon: "🎵" },
  { label: "Cloud", value: "cloud", icon: "☁️" },
  { label: "Gaming", value: "gaming", icon: "🎮" },
  { label: "News", value: "news", icon: "📰" },
  { label: "Fitness", value: "fitness", icon: "🏋️" },
  { label: "Meals", value: "meals", icon: "🍱" },
  { label: "Learning", value: "learning", icon: "📚" },
  { label: "Software", value: "software", icon: "💻" },
  { label: "Fashion", value: "fashion", icon: "👗" },
  { label: "Beauty", value: "beauty", icon: "💄" },
  { label: "Pets", value: "pets", icon: "🐾" },
  { label: "Health", value: "health", icon: "💊" },
  { label: "Hobbies", value: "hobbies", icon: "🎨" },
  { label: "Transit", value: "transit", icon: "🚗" },
  { label: "Finance", value: "finance", icon: "🏦" },
  { label: "Internet", value: "internet", icon: "🛜" },
  { label: "Mobile", value: "mobile", icon: "📱" },
] as const;

export type CategoryType = (typeof categories)[number]["value"];
