export type Category =
  | "Development"
  | "Design"
  | "Languages"
  | "Music"
  | "Business"
  | "Lifestyle"
  | "Other";
export type OfferMode = "trade" | "paid" | "free";
export type Delivery = "online" | "in-person";
export type User = {
  id: string;
  name: string;
  username: string;
  bio: string;
  country: string;
  city: string;
  languages: string[];
  timezone: string;
  avatar: string;
  color: string;
  dob: string;
  contact: string;
  wants: string[];
  socials: { label: string; url: string }[];
  available: boolean;
  presence: boolean;
  balance: number;
  createdAt: string;
};
export type PublicUser = Omit<User, "dob" | "contact" | "balance"> & {
  stats: {
    taught: number;
    learned: number;
    trades: number;
    minutes: number;
    rating: number;
    reviews: number;
  };
  badges: BadgeProgress[];
  xp: number;
  level: number;
  nextLevelXp: number;
};
export type Skill = {
  id: string;
  ownerId: string;
  title: string;
  category: Category;
  description: string;
  outcome: string;
  tags: string[];
  language: string;
  level: string;
  duration: number;
  modes: OfferMode[];
  price: number;
  delivery: Delivery;
  proof: string;
  image: string;
  status: "published" | "paused" | "deleted";
  createdAt: string;
};
export type BookingStatus =
  | "pending"
  | "countered"
  | "awaiting-payment"
  | "scheduled"
  | "completed"
  | "declined"
  | "cancelled"
  | "expired";
export type Booking = {
  id: string;
  learnerId: string;
  providerId: string;
  skillId: string;
  exchangeSkillId?: string;
  kind: OfferMode;
  title: string;
  outcome: string;
  duration: number;
  price: number;
  exchangeTitle?: string;
  exchangeOutcome?: string;
  exchangeDuration?: number;
  startsAt: string;
  exchangeStartsAt?: string;
  note: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  holdUntil?: string;
  counterBy?: string;
  proposedAt?: string;
  rescheduleBy?: string;
  meeting: string;
  confirmations: string[];
  exchangeConfirmations: string[];
  evidence: string;
  feedback: string;
  demonstrated: boolean;
  dispute: string;
  circleId?: string;
};
export type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  clientId: string;
};
export type Conversation = {
  id: string;
  members: string[];
  title: string;
  messages: Message[];
  read: Record<string, string>;
  accepted: boolean;
  initiatedBy: string;
  bookingId?: string;
};
export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  target: string;
  read: boolean;
  createdAt: string;
};
export type Payment = {
  id: string;
  bookingId: string;
  payerId: string;
  recipientId: string;
  amount: number;
  status: "confirmed" | "refunded";
  createdAt: string;
};
export type Review = {
  id: string;
  bookingId: string;
  authorId: string;
  subjectId: string;
  rating: number;
  text: string;
  createdAt: string;
};
export type Circle = {
  id: string;
  members: string[];
  skillIds: string[];
  accepted: string[];
  status: "inviting" | "active" | "cancelled" | "completed";
  createdAt: string;
  startsAt: string[];
};
export type LearningPost = {
  id: string;
  userId: string;
  title: string;
  category: Category;
  description: string;
  language: string;
  delivery: Delivery;
  createdAt: string;
};
export type Report = {
  id: string;
  authorId: string;
  target: string;
  reason: string;
  createdAt: string;
  status: "open" | "reviewed";
};
export type Room = {
  id: string;
  createdAt: string;
  inviteHash: string;
  users: User[];
  skills: Skill[];
  bookings: Booking[];
  conversations: Conversation[];
  notifications: Notification[];
  payments: Payment[];
  reviews: Review[];
  circles: Circle[];
  posts: LearningPost[];
  saved: Record<string, string[]>;
  blocks: { by: string; target: string }[];
  reports: Report[];
};
export type Snapshot = {
  me: User;
  users: PublicUser[];
  skills: Skill[];
  bookings: Booking[];
  conversations: (Omit<Conversation, "messages"> & {
    unread: number;
    lastMessage: string;
    lastAt?: string;
  })[];
  notifications: Notification[];
  payments: Payment[];
  reviews: Review[];
  circles: Circle[];
  posts: LearningPost[];
  saved: string[];
  blocks: string[];
  reports: Report[];
  roomId: string;
  backend: string;
  matches?: { members: string[]; skillIds: string[] }[];
  badgeDefinitions: BadgeDefinition[];
  leaderboard: Leaderboard;
  myBadges: BadgeProgress[];
  myXp: number;
  myLevel: number;
  myNextLevelXp: number;
};
export const CATEGORIES: Category[] = [
  "Development",
  "Design",
  "Languages",
  "Music",
  "Business",
  "Lifestyle",
  "Other",
];
export const COUNTRIES = [
  ["IN", "India"],
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["CA", "Canada"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["ES", "Spain"],
  ["BR", "Brazil"],
  ["JP", "Japan"],
  ["AU", "Australia"],
  ["NG", "Nigeria"],
  ["AE", "United Arab Emirates"],
  ["PK", "Pakistan"],
  ["BD", "Bangladesh"],
  ["KR", "South Korea"],
  ["SG", "Singapore"],
  ["ZA", "South Africa"],
] as const;
export const LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Japanese",
  "Arabic",
  "Bengali",
  "Urdu",
  "Korean",
  "Mandarin",
  "Tamil",
  "Telugu",
];
export type BadgeTier = "common" | "rare" | "epic" | "legendary";
export type BadgeCategory =
  "onboarding" | "learning" | "teaching" | "community" | "mastery";
export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  howToEarn: string;
  icon: string;
  tier: BadgeTier;
  category: BadgeCategory;
  xp: number;
};
export type BadgeProgress = {
  id: string;
  name: string;
  description: string;
  howToEarn: string;
  icon: string;
  tier: BadgeTier;
  category: BadgeCategory;
  xp: number;
  earned: boolean;
  progress: number;
  total: number;
  earnedAt?: string;
};
export type LeaderboardEntry = {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  color: string;
  country: string;
  points: number;
  xp: number;
  level: number;
  completed: number;
  taught: number;
  learned: number;
  rank: number;
};
export type Leaderboard = {
  weekly: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
  sevenDays: LeaderboardEntry[];
};
export const money = (amount: number) =>
  `${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(amount / 100)} credits`;
