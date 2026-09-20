import { randomUUID } from "node:crypto";
import type { Room, Skill, User } from "./types";

export const uid = () => randomUUID();
export const now = () => new Date().toISOString();
export const IMAGES = {
  code: "/images/code.jpg",
  design: "/images/design.jpg",
  guitar: "/images/guitar.jpg",
  language: "/images/language.jpg",
  camera: "/images/camera.jpg",
  cooking: "/images/cooking.jpg",
  business: "/images/business.jpg",
  piano: "/images/piano.jpg",
};

export function createRoom(): Room {
  const createdAt = now();
  const room: Room = {
    id: uid(),
    createdAt,
    inviteHash: "",
    users: [],
    skills: [],
    bookings: [],
    conversations: [],
    notifications: [],
    payments: [],
    reviews: [],
    circles: [],
    posts: [],
    saved: {},
    blocks: [],
    reports: [],
  };
  const people = [
    [
      "Asha Patel",
      "asha",
      "IN",
      "Asia/Kolkata",
      "Python,React",
      "Guitar",
      "#8b5cf6",
      "I turn tricky code into small, friendly steps. Building things, one coffee at a time.",
    ],
    [
      "Ben Carter",
      "ben",
      "GB",
      "Europe/London",
      "Guitar",
      "Design",
      "#f59e0b",
      "Guitar player and patient teacher. Let's make your first song happen.",
    ],
    [
      "Cara Silva",
      "cara",
      "BR",
      "America/Sao_Paulo",
      "Design,Figma",
      "Python",
      "#ec4899",
      "Visual designer. Big believer that everyone can learn to make something beautiful.",
    ],
    [
      "Yuki Tanaka",
      "yuki",
      "JP",
      "Asia/Tokyo",
      "Japanese",
      "Photography",
      "#14b8a6",
      "Learn everyday Japanese through real conversations, not endless memorisation.",
    ],
    [
      "Sofia García",
      "sofia",
      "ES",
      "Europe/Madrid",
      "Spanish",
      "Cooking",
      "#f97316",
      "Your friendly Spanish conversation partner. Mistakes are welcome here.",
    ],
    [
      "Noah Williams",
      "noah",
      "US",
      "America/New_York",
      "Photography",
      "Japanese",
      "#3b82f6",
      "Chasing light and helping you see the everyday differently.",
    ],
    [
      "Priya Sharma",
      "priya",
      "IN",
      "Asia/Kolkata",
      "Cooking,English",
      "Excel",
      "#10b981",
      "Good food and good conversations. Sharing simple recipes from my kitchen.",
    ],
    [
      "Leo Martin",
      "leo",
      "FR",
      "Europe/Paris",
      "Piano",
      "React",
      "#a855f7",
      "Piano lessons without the pressure. We'll start with music you actually love.",
    ],
    [
      "Amara Okafor",
      "amara",
      "NG",
      "Africa/Lagos",
      "Excel",
      "Design",
      "#eab308",
      "Making spreadsheets useful, understandable, and a little less intimidating.",
    ],
    [
      "Emma Wilson",
      "emma",
      "CA",
      "America/Toronto",
      "English",
      "Photography",
      "#06b6d4",
      "Confidence comes with practice. Let's get comfortable speaking English.",
    ],
    [
      "Omar Hassan",
      "omar",
      "AE",
      "Asia/Dubai",
      "Business",
      "Spanish",
      "#ef4444",
      "From an idea to your first pitch. Practical business lessons for beginners.",
    ],
    [
      "Lena Fischer",
      "lena",
      "DE",
      "Europe/Berlin",
      "Design",
      "Piano",
      "#84cc16",
      "Illustrator, maker, and curious learner. Happy to share my creative process.",
    ],
  ];
  for (const p of people) {
    room.users.push({
      id: uid(),
      name: p[0],
      username: p[1],
      country: p[2],
      timezone: p[3],
      bio: p[7],
      city: "",
      languages:
        p[2] === "IN"
          ? ["English", "Hindi"]
          : p[2] === "ES"
            ? ["English", "Spanish"]
            : ["English"],
      avatar: "",
      color: p[6],
      dob: "2001-01-01",
      contact: "",
      wants: p[5].split(","),
      socials: [],
      available: true,
      presence: false,
      balance: 10000,
      createdAt,
    });
  }
  const add = (
    owner: number,
    title: string,
    category: Skill["category"],
    tags: string[],
    image: string,
    modes: Skill["modes"],
    price: number,
    outcome: string,
    description: string,
  ) => {
    room.skills.push({
      id: uid(),
      ownerId: room.users[owner].id,
      title,
      category,
      tags,
      image,
      modes,
      price,
      outcome,
      description,
      language: "English",
      level: "Beginner",
      duration: 45,
      delivery: "online",
      proof: "",
      status: "published",
      createdAt: new Date(
        Date.now() - room.skills.length * 3600000,
      ).toISOString(),
    });
  };
  add(
    0,
    "Python, from zero to your first project",
    "Development",
    ["Python", "Coding"],
    IMAGES.code,
    ["trade", "paid", "free"],
    1500,
    "Build and explain a small Python calculator.",
    "Skip the intimidating tutorials. We'll explore variables, loops, and functions together, then build something that actually works. No experience needed.",
  );
  add(
    2,
    "Design interfaces people love",
    "Design",
    ["Design", "Figma", "UI/UX"],
    IMAGES.design,
    ["trade", "paid"],
    2000,
    "Design a simple, accessible app screen in Figma.",
    "Learn layout, typography and colour through a tiny real project. Bring your curiosity; we'll turn a blank canvas into your first thoughtful interface.",
  );
  add(
    1,
    "Your first song on acoustic guitar",
    "Music",
    ["Guitar", "Music"],
    IMAGES.guitar,
    ["trade", "paid"],
    1200,
    "Play a four-chord progression with a steady rhythm.",
    "Start with the songs you love. A relaxed, one-to-one introduction to tuning, chords and strumming. You'll need access to an acoustic guitar.",
  );
  add(
    4,
    "Spanish for real-life conversations",
    "Languages",
    ["Spanish", "Conversation"],
    IMAGES.language,
    ["trade", "free"],
    0,
    "Introduce yourself and hold a short everyday conversation.",
    "Friendly speaking practice tailored to you. We'll role-play an everyday situation and build confidence, one conversation at a time.",
  );
  add(
    5,
    "See the world through your lens",
    "Lifestyle",
    ["Photography", "Camera"],
    IMAGES.camera,
    ["trade", "paid"],
    1800,
    "Take and explain three photos using different compositions.",
    "Great photos start with seeing, not expensive gear. Explore light, framing and storytelling using your phone or camera.",
  );
  add(
    6,
    "Simple Indian cooking, together",
    "Lifestyle",
    ["Cooking", "Food"],
    IMAGES.cooking,
    ["trade", "free"],
    0,
    "Explain the steps and safely prepare one beginner recipe.",
    "A welcoming introduction to everyday home cooking. We'll agree a recipe and ingredients beforehand; tell me about any allergies or dietary needs.",
  );
  add(
    8,
    "Excel that makes everyday work easier",
    "Business",
    ["Excel", "Spreadsheets"],
    IMAGES.business,
    ["trade", "free"],
    0,
    "Build a budget tracker with formulas and a simple chart.",
    "Learn useful spreadsheet skills through a small expense tracker with fictional data. No advanced maths required.",
  );
  add(
    7,
    "Find your rhythm on piano",
    "Music",
    ["Piano", "Music"],
    IMAGES.piano,
    ["trade", "paid"],
    1600,
    "Play a short melody and identify its notes.",
    "A patient introduction to keys, rhythm and musical confidence. Bring a piano or keyboard and a song you want to learn.",
  );
  add(
    3,
    "Your first everyday Japanese",
    "Languages",
    ["Japanese", "Conversation"],
    IMAGES.language,
    ["trade", "paid"],
    1400,
    "Greet someone and introduce yourself in Japanese.",
    "Start with useful phrases and comfortable pronunciation practice. We'll work at your pace and make space for questions.",
  );
  add(
    9,
    "Speak English with confidence",
    "Languages",
    ["English", "Speaking"],
    IMAGES.language,
    ["free", "trade"],
    0,
    "Deliver a one-minute introduction and answer follow-up questions.",
    "A supportive space to practise speaking. We'll choose a situation relevant to your life, practise it, then try a new variation.",
  );
  add(
    10,
    "Turn your idea into a clear pitch",
    "Business",
    ["Business", "Pitching"],
    IMAGES.business,
    ["paid", "trade"],
    2000,
    "Present your idea in a structured two-minute pitch.",
    "Find the problem, explain your solution, and make your next step clear. Practical feedback, not complicated frameworks.",
  );
  add(
    11,
    "Make your first illustrated poster",
    "Design",
    ["Design", "Illustration"],
    IMAGES.design,
    ["trade", "free"],
    0,
    "Create a poster with clear hierarchy and original visual elements.",
    "Explore visual storytelling through a small poster project. Use your preferred drawing or design tool.",
  );
  add(
    0,
    "React components that finally click",
    "Development",
    ["React", "JavaScript"],
    IMAGES.code,
    ["trade", "paid"],
    2000,
    "Build a reusable interactive React component.",
    "Understand props and state by building a little interactive interface. Basic JavaScript knowledge is helpful.",
  );
  room.posts = [
    {
      id: uid(),
      userId: room.users[1].id,
      title: "Looking for a design buddy",
      category: "Design",
      description:
        "I'd love to design a poster for my music group. Can teach beginner guitar in exchange!",
      language: "English",
      delivery: "online",
      createdAt,
    },
    {
      id: uid(),
      userId: room.users[2].id,
      title: "Help me take my first steps in Python",
      category: "Development",
      description:
        "Designer curious about code. Looking for a patient introduction, happy to trade a Figma lesson.",
      language: "English",
      delivery: "online",
      createdAt,
    },
    {
      id: uid(),
      userId: room.users[6].id,
      title: "An expense tracker for our community kitchen",
      category: "Business",
      description:
        "I want to understand formulas, not just copy a template. Happy to share a cooking lesson!",
      language: "English",
      delivery: "online",
      createdAt,
    },
  ];
  return room;
}

export function createUser(
  input: {
    name: string;
    dob: string;
    contact: string;
    country: string;
    timezone: string;
  },
  room: Room,
): User {
  const id = uid();
  const base =
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 16) || "learner";
  return {
    id,
    ...input,
    username: `${base}_${id.slice(0, 4)}`,
    bio: "Curious mind. Something to teach, something to learn.",
    city: "",
    languages: ["English"],
    avatar: "",
    color: "#8b5cf6",
    wants: ["Python", "Design"],
    socials: [],
    available: true,
    presence: false,
    balance: 10000,
    createdAt: room.createdAt,
  };
}
