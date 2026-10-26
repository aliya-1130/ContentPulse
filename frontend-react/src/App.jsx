
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Film,
  Gauge,
  Instagram,
  Lightbulb,
  Menu,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Upload,
  Youtube,
  X
} from "lucide-react";

const themes = {
  ocean: {
    name: "Ocean Mist",
    mode: "light",
    bg: "#F5F9FF",
    card: "#FFFFFF",
    soft: "#EAF2FF",
    accent: "#E9F7F7",
    primary: "#2563EB",
    secondary: "#0F766E",
    text: "#172033",
    muted: "#64748B",
    border: "#DCE7F5"
  },
  sage: {
    name: "Sage Cream",
    mode: "light",
    bg: "#F7FBF5",
    card: "#FFFFFF",
    soft: "#EBF4E8",
    accent: "#FFF5E8",
    primary: "#5F8D62",
    secondary: "#B77945",
    text: "#1F2A21",
    muted: "#647267",
    border: "#DDE8DA"
  },
  lavender: {
    name: "Lavender Air",
    mode: "light",
    bg: "#FAF8FF",
    card: "#FFFFFF",
    soft: "#F0EBFB",
    accent: "#EEF2FA",
    primary: "#7C65AE",
    secondary: "#7083A5",
    text: "#25213A",
    muted: "#746F84",
    border: "#E5DFF1"
  },
  coral: {
    name: "Coral Glow",
    mode: "light",
    bg: "#FFF9F6",
    card: "#FFFFFF",
    soft: "#FFF0E8",
    accent: "#FFF6E6",
    primary: "#D9684B",
    secondary: "#D5A04B",
    text: "#2C211D",
    muted: "#786A63",
    border: "#F0DED7"
  },
  mint: {
    name: "Mint Sky",
    mode: "light",
    bg: "#F4FBFB",
    card: "#FFFFFF",
    soft: "#E7F7F5",
    accent: "#EAF2FF",
    primary: "#2C8C87",
    secondary: "#4E6FA7",
    text: "#173131",
    muted: "#647C7C",
    border: "#D8EAE8"
  },
  obsidian: {
    name: "Obsidian Lavender",
    mode: "dark",
    bg: "#17151F",
    card: "#211E2C",
    soft: "#2C2740",
    accent: "#30273C",
    primary: "#B8A6FF",
    secondary: "#9A8BD4",
    text: "#F7F4FF",
    muted: "#B8B2C7",
    border: "#383148"
  },
  midnight: {
    name: "Midnight Cyan",
    mode: "dark",
    bg: "#141C24",
    card: "#1E2A35",
    soft: "#233746",
    accent: "#24343C",
    primary: "#7DD3FC",
    secondary: "#65A8BF",
    text: "#F2FAFF",
    muted: "#AABDC9",
    border: "#334755"
  },
  forest: {
    name: "Forest Mint",
    mode: "dark",
    bg: "#16201C",
    card: "#202C27",
    soft: "#263B32",
    accent: "#2C392A",
    primary: "#86EFAC",
    secondary: "#79B596",
    text: "#F1FFF6",
    muted: "#ADC0B4",
    border: "#394B43"
  },
  cocoa: {
    name: "Cocoa Peach",
    mode: "dark",
    bg: "#211A17",
    card: "#2C211E",
    soft: "#3B2B26",
    accent: "#3A3024",
    primary: "#FDBA8C",
    secondary: "#E0A37F",
    text: "#FFF7F2",
    muted: "#C5B3AB",
    border: "#4C3931"
  },
  plum: {
    name: "Plum Rose",
    mode: "dark",
    bg: "#211821",
    card: "#2D202D",
    soft: "#402A3D",
    accent: "#382A32",
    primary: "#F0A6D7",
    secondary: "#CF8DB8",
    text: "#FFF5FC",
    muted: "#C4B1BE",
    border: "#4B3948"
  }
};

const youtubeNiches = [
  "Motivation",
  "Education",
  "Beauty",
  "Fitness",
  "Food",
  "Entertainment",
  "Technology",
  "Lifestyle"
];

const instagramNiches = [
  "Beauty",
  "Fitness",
  "Food",
  "Technology",
  "Entertainment",
  "Lifestyle"
];

const howItWorks = [
  {
    number: "01",
    title: "Choose Platform",
    text: "Select YouTube Shorts or Instagram Reels."
  },
  {
    number: "02",
    title: "Choose Niche",
    text: "Pick the niche that best matches your content."
  },
  {
    number: "03",
    title: "Add Content",
    text: "Upload your video and enter the text the analyzer needs."
  },
  {
    number: "04",
    title: "Get Insights",
    text: "See a score, content breakdown, and practical suggestions."
  }
];

const hookTerms = [
  "stop",
  "wait",
  "here's",
  "here is",
  "the truth",
  "secret",
  "mistake",
  "why",
  "how",
  "3 ways",
  "5 ways",
  "you need to know",
  "before you"
];

const ctaTerms = [
  "subscribe",
  "follow",
  "like",
  "comment",
  "share",
  "save",
  "tell me",
  "check out",
  "let me know",
  "try this"
];

const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(value)));
const normalizeModelEngagement = (value) => {
  const engagementRate = Number(value);

  if (!Number.isFinite(engagementRate)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(engagementRate))
  );
};
const getModelPerformanceLabel = (value) => {
  const engagementRate = Number(value);

  if (!Number.isFinite(engagementRate)) {
    return "Very Low";
  }

  if (engagementRate >= 10) return "Very High";
  if (engagementRate >= 5) return "High";
  if (engagementRate >= 2) return "Good";
  if (engagementRate >= 1) return "Moderate";
  if (engagementRate >= 0.5) return "Low";
  return "Very Low";
};

const normalize = (value) => String(value || "").toLowerCase().replace(/\s+/g, " ").trim();

const countMatches = (text, terms) => {
  const clean = normalize(text);
  return terms.filter((term) => clean.includes(term)).length;
};

const scoreToLabel = (score) => {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Average";
  return "Needs Improvement";
};

const nicheKey = (niche) => normalize(niche).replace(/[^a-z]/g, "");
const getStableVariantIndex = (text, count) => {
  const source = String(text || "");
  let hash = 0;

  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }

  return hash % count;
};

const detectYoutubeVideoType = ({ title, niche, transcript }) => {
  const text = normalize(
    `${title || ""} ${transcript || ""}`
  );

  const n = nicheKey(niche);
  const mealRoutinePattern =
  /\bwhat i (eat|ate) in a day\b|\bfull day of eating\b|\bwhat i eat today\b|\bwhat i ate today\b|\bmy meals today\b|\bday of eating\b/i;

if (mealRoutinePattern.test(text)) {
  return "mealRoutine";
}

  const rules = [
    {
      type: "food",
      keywords: [
        "recipe",
        "cooking",
        "cook",
        "breakfast",
        "lunch",
        "dinner",
        "meal",
        "food",
        "taste",
        "tasty",
        "restaurant",
        "cafe",
        "dessert",
        "snack",
        "eat",
        "eating",
        "khana",
        "khaya",
        "nashta"
      ]
    },
    {
      type: "workout",
      keywords: [
        "workout",
        "exercise",
        "gym",
        "fitness",
        "training",
        "cardio",
        "squat",
        "push up",
        "reps",
        "sets",
        "weight loss",
        "muscle",
        "calories"
      ]
    },
    {
      type: "study",
      keywords: [
        "study",
        "studying",
        "study with me",
        "exam",
        "exams",
        "internals",
        "assignment",
        "revision",
        "notes",
        "college",
        "student",
        "semester",
        "padhai",
        "parhai"
      ]
    },
    {
      type: "review",
      keywords: [
        "review",
        "unboxing",
        "first impression",
        "worth it",
        "tested",
        "i tried",
        "trying",
        "comparison",
        "compare",
        "vs",
        "dupe",
        "pros and cons",
        "rating"
      ]
    },
    {
      type: "tutorial",
      keywords: [
        "how to",
        "how do i",
        "tutorial",
        "step by step",
        "steps",
        "guide",
        "diy",
        "learn",
        "ways to",
        "tips",
        "explained",
        "method"
      ]
    },
    {
      type: "story",
      keywords: [
        "storytime",
        "story",
        "what happened",
        "my experience",
        "experience",
        "my journey",
        "journey",
        "mistake",
        "lesson",
        "when i",
        "then i",
        "one day",
        "real story"
      ]
    },
    {
      type: "list",
      keywords: [
        "3 ways",
        "5 ways",
        "3 things",
        "5 things",
        "7 things",
        "reasons",
        "mistakes",
        "habits",
        "ideas",
        "tips",
        "things you",
        "things i",
        "reasons why"
      ]
    },
    {
      type: "routine",
      keywords: [
        "morning routine",
        "night routine",
        "daily routine",
        "routine",
        "day in my life",
        "a day in my life",
        "realistic day",
        "productive day",
        "get ready with me",
        "grwm",
        "my morning",
        "my evening",
        "my day",
        "daily vlog",
        "college vlog",
        "vlog"
      ]
    },
    {
      type: "tech",
      keywords: [
        "technology",
        "tech",
        "app",
        "website",
        "software",
        "ai",
        "artificial intelligence",
        "coding",
        "code",
        "tool",
        "feature",
        "phone",
        "laptop",
        "chatgpt",
        "camera",
        "settings"
      ]
    }
  ];

  let bestType = "general";
  let bestScore = 0;

  for (const rule of rules) {
    let score = 0;

    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        score += keyword.includes(" ") ? 2 : 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestType = rule.type;
    }
  }

  if (bestType === "general") {
    if (n.includes("food")) return "food";
    if (n.includes("fitness")) return "workout";
    if (n.includes("education")) return "study";
    if (n.includes("technology")) return "tech";
    if (n.includes("lifestyle")) return "routine";
  }

  return bestType;
};

const getContentExamples = ({
  title,
  niche,
  transcript
}) => {
  const t = String(title || "").trim();
  const tr = String(transcript || "").trim();

  const opening =
    tr.split(/[.!?\n]+/)[0].trim();

  const videoType = detectYoutubeVideoType({
    title: t,
    niche,
    transcript: tr
  });

  const topic =
    t ||
    opening ||
    `${niche || "this topic"} content`;

  const seed =
    `${t}|${opening}|${tr}|${niche}|${videoType}`;

  const pick = (key, values) => {
    if (!values.length) return "";
    return values[
      getStableVariantIndex(
        `${seed}|${key}`,
        values.length
      )
    ];
  };

  const templates = {
    mealRoutine: {
  hook: [
    "Show the most interesting meal first so viewers immediately know what makes this day of eating worth watching.",
    "Open with the full-day food lineup or the meal you were most excited about instead of starting with a general introduction.",
    "Start with a realistic moment from your day of eating that viewers can relate to.",
    "Reveal the most unexpected meal or food choice first, then take viewers through the rest of the day."
  ],

  hookExample: [
    "“Here’s everything I actually ate today.”",
    "“This was everything I ate from morning to night.”",
    "“A realistic day of eating that did not go exactly as planned.”",
    "“The last meal of the day was definitely not what I expected.”"
  ],

  title: [
    "Make the title clearly about the full day of eating rather than a recipe or food review.",
    "Add a specific angle such as realistic, college, budget, healthy, or high-protein when it is actually part of the video.",
    "Make the title about the complete day's meals and the reason viewers would relate to them.",
    "Use the most distinctive part of the day's eating pattern as the title angle."
  ],

  titleExample: [
    `“${topic}” → “Everything I Ate in a Day”`,
    `“${topic}” → “A Realistic Day of Eating”`,
    `“${topic}” → “What I Actually Ate From Morning to Night”`,
    `“${topic}” → “My Full Day of Eating”`
  ],

  cta: [
    "Ask viewers which meal from the day they would choose.",
    "Ask viewers which meal they want to see in more detail.",
    "Invite viewers to share what they usually eat in a day.",
    "Ask viewers what you should eat or try in the next video."
  ],

  ctaExample: [
    "Which meal would you choose from this day?",
    "Which meal should I show in more detail next?",
    "What does a normal day of eating look like for you?",
    "What should I try eating next?"
  ],

  context:
    "Add one specific meal, food choice, routine detail, personal preference, or reason behind what you ate.",

  contextExample:
    "“I kept the meals simple today and chose foods I would realistically eat on a normal day.”",

  descriptionTitle:
    "Make the day's meals more specific",

  descriptionText:
    "Mention the main meals, eating pattern, or specific angle of the day so viewers understand what makes this food diary different."
},
    food: {
      hook: [
        "Lead with the taste, reaction, or surprising result before explaining what you made.",
        "Start with the part of the food experience that viewers will immediately want to know about.",
        "Open with the result first, then reveal how you got there.",
        "Use one strong food-related detail in the first sentence instead of beginning with a general introduction."
      ],

      hookExample: [
        "“I did not expect this to taste this good.”",
        "“The one thing that surprised me most about this meal was this.”",
        "“I tried making this at home, and the result was not what I expected.”",
        "“Before you try this, there is one thing you should know.”"
      ],

      title: [
        "Make the title reveal the specific dish, experience, or result.",
        "Highlight the most interesting taste, reaction, or outcome.",
        "Make the title more specific instead of describing the video broadly.",
        "Use the most surprising part of the food experience as the title angle."
      ],

      titleExample: [
        `“${topic}” → “I Tried It and Did NOT Expect This Result”`,
        `“${topic}” → “What It Actually Tasted Like”`,
        `“${topic}” → “The Food Experiment That Surprised Me”`,
        `“${topic}” → “What Worked, What Didn’t & Why”`
      ],

      cta: [
        "Ask viewers to choose, rate, or share their preference.",
        "Turn the ending into a simple food-related choice.",
        "Ask a question connected to the actual dish or experience.",
        "Invite viewers to share what they would try next."
      ],

      ctaExample: [
        "Would you try this? Rate it from 1–10.",
        "Which one would you choose for your next meal?",
        "What should I try making next?",
        "Would you make this at home or order it outside?"
      ],

      context: "Add one specific taste, texture, ingredient, reaction, comparison, or result.",
      contextExample: "“The texture was completely different from what I expected, but the flavor was the best part.”",

      descriptionTitle: "Add the useful food detail",
      descriptionText: "Give viewers one concrete detail about the taste, preparation, result, or experience instead of leaving the description broad."
    },

    workout: {
      hook: [
        "Start with the result, difficulty, or mistake instead of introducing the workout generally.",
        "Open with the most useful exercise-related takeaway from the video.",
        "Lead with the problem this workout or routine is solving.",
        "Show the most interesting result first and explain the routine afterward."
      ],

      hookExample: [
        "“This is the part of the workout I used to get completely wrong.”",
        "“You do not need a complicated routine to start making progress.”",
        "“If this exercise feels impossible, try this adjustment first.”",
        "“I changed one thing in my workout and noticed a huge difference.”"
      ],

      title: [
        "Name the exact workout, goal, or result instead of using a broad fitness title.",
        "Make the title focus on the specific problem the routine solves.",
        "Highlight the measurable or practical outcome.",
        "Use the most useful fitness takeaway as the title."
      ],

      titleExample: [
        `“${topic}” → “The Simple Routine I Actually Kept Doing”`,
        `“${topic}” → “What I Changed in My Workout”`,
        `“${topic}” → “The Workout Mistake I Stopped Making”`,
        `“${topic}” → “A Simple Routine for This Goal”`
      ],

      cta: [
        "Ask viewers about their routine, difficulty, or next goal.",
        "Turn the ending into a simple fitness choice.",
        "Ask viewers which exercise or topic they want next.",
        "Invite viewers to compare their experience with yours."
      ],

      ctaExample: [
        "Which part of this workout would you try first?",
        "What is the hardest part of staying consistent for you?",
        "Which workout should I test next?",
        "Would you prefer a shorter or longer version of this routine?"
      ],

      context: "Add one practical exercise detail, measurable result, personal experience, or useful adjustment.",
      contextExample: "“The biggest difference came from keeping the routine simple enough to repeat consistently.”",

      descriptionTitle: "Add one practical fitness detail",
      descriptionText: "Include the exact goal, exercise, result, or adjustment so viewers understand what they can take from the video."
    },

    study: {
      hook: [
        "Open with the study problem or result instead of starting with a general greeting.",
        "Lead with the most useful study lesson from the video.",
        "Start with the mistake, challenge, or realization that makes this study session different.",
        "Reveal the result first, then show how you studied."
      ],

      hookExample: [
        "“I wasted so much time studying this the wrong way.”",
        "“This one change made revision much easier for me.”",
        "“I thought I needed more study time, but I actually needed this.”",
        "“Here is what finally helped me remember this topic.”"
      ],

      title: [
        "Make the title focus on the actual study goal or problem.",
        "Use the specific subject, method, or result instead of a broad study label.",
        "Turn the study session into a clear outcome.",
        "Highlight the practical lesson viewers can take away."
      ],

      titleExample: [
        `“${topic}” → “The Study Method That Finally Worked for Me”`,
        `“${topic}” → “How I Made This Topic Easier to Understand”`,
        `“${topic}” → “What I Changed Before the Exam”`,
        `“${topic}” → “The Study Mistake I Wouldn’t Repeat”`
      ],

      cta: [
        "Ask viewers about their own study method or problem.",
        "Ask which topic they want next.",
        "Invite viewers to share their biggest study struggle.",
        "Turn the ending into a simple study-related choice."
      ],

      ctaExample: [
        "What topic should I cover next?",
        "What is the hardest part of studying for you?",
        "Which study method works best for you?",
        "Would you want to see the full study routine?"
      ],

      context: "Add one exact topic, study method, result, mistake, or practical lesson.",
      contextExample: "“I stopped rereading everything and focused on recalling the main ideas without looking at my notes.”",

      descriptionTitle: "Make the study takeaway clearer",
      descriptionText: "Add the exact subject, problem, method, or result so viewers immediately understand the value of the video."
    },

    review: {
      hook: [
        "Lead with your verdict, surprise, or strongest reaction before explaining the product or experience.",
        "Start with the one thing you noticed immediately after trying it.",
        "Open with the biggest reason someone should—or should not—care about this review.",
        "Reveal the most unexpected result first."
      ],

      hookExample: [
        "“After actually using it, this is what surprised me most.”",
        "“I thought this would be good, but one thing changed my mind.”",
        "“Before you buy this, there is one detail I would check.”",
        "“I tested it so you do not have to—and this was the result.”"
      ],

      title: [
        "Make the title focus on the verdict, result, or specific product.",
        "Highlight the main question viewers have before trying it.",
        "Turn the review into a clear decision point.",
        "Use the most useful comparison or result as the title angle."
      ],

      titleExample: [
        `“${topic}” → “Is It Actually Worth It?”`,
        `“${topic}” → “What I Noticed After Trying It”`,
        `“${topic}” → “The Good, The Bad & What I’d Change”`,
        `“${topic}” → “My Honest Result After Testing It”`
      ],

      cta: [
        "Ask whether viewers would try, buy, or skip it.",
        "Ask which feature or product should be reviewed next.",
        "Invite viewers to share their own experience.",
        "End with a simple comparison question."
      ],

      ctaExample: [
        "Would you try this or skip it?",
        "What should I review next?",
        "Have you tried this before? What was your experience?",
        "Which one would you pick?"
      ],

      context: "Add one concrete result, feature, comparison, reaction, or limitation from the review.",
      contextExample: "“The most useful part was how quickly it handled the task, but this one limitation stood out.”",

      descriptionTitle: "Include the actual verdict",
      descriptionText: "Add one concrete result, feature, comparison, or limitation so viewers know what the review is really about."
    },

    tutorial: {
      hook: [
        "Start with the result viewers will get instead of explaining the process first.",
        "Lead with the problem this tutorial solves.",
        "Show the easiest or most important step before giving the background.",
        "Open with the common mistake that this tutorial helps avoid."
      ],

      hookExample: [
        "“Here is the fastest way to get this done.”",
        "“If you keep getting stuck here, this is what to change.”",
        "“Do this first, and the rest becomes much easier.”",
        "“Most people make this mistake before they even start.”"
      ],

      title: [
        "State the exact task and outcome instead of using a broad tutorial title.",
        "Make the result immediately obvious in the title.",
        "Focus on the specific problem being solved.",
        "Highlight the easiest or most useful part of the process."
      ],

      titleExample: [
        `“${topic}” → “The Simple Way to Do It”`,
        `“${topic}” → “How to Fix This Without the Usual Hassle”`,
        `“${topic}” → “The Step Most People Miss”`,
        `“${topic}” → “A Faster Way to Get This Done”`
      ],

      cta: [
        "Ask what viewers want explained next.",
        "Invite viewers to share whether the method worked.",
        "Ask viewers which step they found hardest.",
        "Use the ending to continue the tutorial series."
      ],

      ctaExample: [
        "What should I explain next?",
        "Did this method work for you?",
        "Which step should I break down in more detail?",
        "What tutorial should I make next?"
      ],

      context: "Add the exact task, result, important step, common mistake, or practical use case.",
      contextExample: "“The important part is this one step because skipping it causes the problem most people run into.”",

      descriptionTitle: "Add the missing tutorial context",
      descriptionText: "State the exact task, result, key step, or problem being solved so viewers know what they will learn."
    },

    story: {
      hook: [
        "Open with the turning point instead of starting the story from the beginning.",
        "Lead with the most surprising part of the experience.",
        "Start with the problem or decision that changed what happened next.",
        "Reveal the outcome first and let viewers discover how you got there."
      ],

      hookExample: [
        "“I did not expect the day to end like this.”",
        "“Everything was normal until this happened.”",
        "“I almost made a completely different decision.”",
        "“Looking back, this was the moment everything changed.”"
      ],

      title: [
        "Build curiosity around the turning point instead of simply naming the story.",
        "Focus the title on the unexpected result or decision.",
        "Make the personal experience feel like a story with a clear tension point.",
        "Use the most surprising moment as the title angle."
      ],

      titleExample: [
        `“${topic}” → “The Part I Definitely Didn’t Expect”`,
        `“${topic}” → “How One Small Moment Changed My Day”`,
        `“${topic}” → “What Actually Happened That Day”`,
        `“${topic}” → “The Decision I Didn’t See Coming”`
      ],

      cta: [
        "Ask viewers what they would have done.",
        "Invite viewers to share a similar experience.",
        "Ask which part of the story they related to most.",
        "Use the ending to open a conversation."
      ],

      ctaExample: [
        "What would you have done in my situation?",
        "Has something similar ever happened to you?",
        "Which part of this story felt most relatable?",
        "Would you have made the same decision?"
      ],

      context: "Add one specific event, decision, reaction, or turning point instead of keeping the story broad.",
      contextExample: "“The situation changed when I realized that the plan I had made was no longer going to work.”",

      descriptionTitle: "Give the story a clearer setup",
      descriptionText: "Add one concrete event, turning point, or outcome so viewers understand why the story is worth watching."
    },

    list: {
      hook: [
        "Start with the strongest item or most surprising point instead of introducing the list.",
        "Lead with the problem the list will help viewers solve.",
        "Open with the point that creates the most curiosity.",
        "Tell viewers why these points matter before listing them."
      ],

      hookExample: [
        "“The third one is the mistake I wish I knew earlier.”",
        "“These are the things that actually made the biggest difference for me.”",
        "“Most people overlook the last one.”",
        "“Before you try anything else, start with this.”"
      ],

      title: [
        "Make the title specific about what the list helps viewers do or avoid.",
        "Highlight the strongest outcome rather than only giving a number.",
        "Use the most surprising point as the curiosity angle.",
        "Make the audience and benefit clearer."
      ],

      titleExample: [
        `“${topic}” → “The Things That Actually Made a Difference”`,
        `“${topic}” → “What I Wish I Knew Earlier”`,
        `“${topic}” → “The Mistakes I Would Avoid Now”`,
        `“${topic}” → “The Tips That Are Actually Worth Trying”`
      ],

      cta: [
        "Ask viewers which item they agree with.",
        "Ask which point should become a full video.",
        "Invite viewers to add their own tip.",
        "Ask viewers to choose one item to try."
      ],

      ctaExample: [
        "Which one would you add to this list?",
        "Which point should I explain next?",
        "Which one would you try first?",
        "What tip would you add?"
      ],

      context: "Add one concrete example or result for the strongest item so the list feels useful rather than generic.",
      contextExample: "“This mattered most for me because it solved the exact problem I kept running into.”",

      descriptionTitle: "Add context to the strongest point",
      descriptionText: "Explain one important item with a concrete example or result instead of leaving the list without supporting detail."
    },

    routine: {
      hook: [
        "Start with the most interesting moment of the day instead of a general introduction.",
        "Open with a relatable problem or feeling that makes this day different.",
        "Reveal the unexpected part first, then show how the day reached that point.",
        "Lead with one small personal detail that makes the routine feel real."
      ],

      hookExample: [
        "“This was supposed to be a normal day, but it really wasn’t.”",
        "“Some days look productive from the outside, but this was the reality.”",
        "“I definitely did not expect my day to go like this.”",
        "“The smallest part of my morning ended up being my favorite.”"
      ],

      title: [
        "Turn the routine into a specific story instead of using a broad day-in-my-life title.",
        "Make the title focus on the most relatable situation from the day.",
        "Build curiosity around the unexpected moment.",
        "Use one specific personal detail to make the routine feel unique."
      ],

      titleExample: [
        `“${topic}” → “The One Part of My Day I Didn’t Expect”`,
        `“${topic}” → “A Day That Did Not Go As Planned”`,
        `“${topic}” → “How My Ordinary Day Took an Unexpected Turn”`,
        `“${topic}” → “The Little Moment That Made My Day”`
      ],

      cta: [
        "Ask viewers which part of the day they want to see more of.",
        "Ask whether viewers relate to the situation shown.",
        "Let viewers choose what you should film next.",
        "End with a question connected to their own routine."
      ],

      ctaExample: [
        "Which part of the day would you want to see more of?",
        "Do your days ever turn out completely different from what you planned?",
        "What part should I vlog next?",
        "What does your routine usually look like?"
      ],

      context: "Add one specific moment, feeling, problem, reaction, or small detail that gives the day a reason to stay interesting.",
      contextExample: "“The day looked ordinary at first, but this one unexpected moment completely changed the plan.”",

      descriptionTitle: "Make the day more specific",
      descriptionText: "Add one real moment, problem, feeling, or detail from the day so the video feels personal rather than generic."
    },

    tech: {
      hook: [
        "Lead with the exact problem the tool, app, or feature solves.",
        "Start with the most useful feature instead of introducing the technology generally.",
        "Reveal the result first, then show how the tool achieved it.",
        "Open with the feature viewers are most likely to overlook."
      ],

      hookExample: [
        "“This one feature can save you more time than you think.”",
        "“I found the part of this tool that actually makes a difference.”",
        "“This is what happened when I used it for the task I usually struggle with.”",
        "“Most people use this tool without noticing this feature.”"
      ],

      title: [
        "Name the exact tool, feature, or problem instead of using a broad technology title.",
        "Focus on the practical outcome viewers will get.",
        "Highlight the overlooked feature or use case.",
        "Make the title answer what the technology actually helps with."
      ],

      titleExample: [
        `“${topic}” → “The Feature You Might Be Missing”`,
        `“${topic}” → “What This Tool Actually Helps With”`,
        `“${topic}” → “The Simple Use Case That Makes It Useful”`,
        `“${topic}” → “What I Learned After Actually Using It”`
      ],

      cta: [
        "Ask viewers whether they would use the tool or feature.",
        "Ask which feature should be tested next.",
        "Invite viewers to share their preferred tool.",
        "Ask what problem they want solved in the next video."
      ],

      ctaExample: [
        "Would you actually use this feature?",
        "Which tool should I test next?",
        "What feature should I explain next?",
        "What tech problem should I cover next?"
      ],

      context: "Add the exact problem solved, feature used, user benefit, or real use case.",
      contextExample: "“The useful part is that it removes one extra step from the process, which makes the task much faster.”",

      descriptionTitle: "Explain the actual use case",
      descriptionText: "Add the exact problem, feature, result, or use case so viewers immediately understand why the technology matters."
    },

    general: {
      hook: [
        "Lead with the most interesting outcome instead of a general introduction.",
        "Start with the problem or question the video actually answers.",
        "Open with the most surprising detail from the topic.",
        "Give viewers the reason to care before giving background."
      ],

      hookExample: [
        "“There is one thing about this that most people miss.”",
        "“I tried this expecting one result, but something else happened.”",
        "“Before you do this, there is one detail you should know.”",
        "“This looked simple at first, but here is what I learned.”"
      ],

      title: [
        "Make the title specific about the problem, result, or audience.",
        "Use the most interesting detail from the video as the title angle.",
        "Make the outcome clearer instead of keeping the title broad.",
        "Turn the topic into a curiosity-driven title."
      ],

      titleExample: [
        `“${topic}” → “What I Actually Learned From This”`,
        `“${topic}” → “The Part Nobody Told Me About”`,
        `“${topic}” → “What Worked, What Didn’t & Why”`,
        `“${topic}” → “The One Thing You Should Know”`
      ],

      cta: [
        "Ask viewers a simple question connected to the topic.",
        "Invite viewers to share their experience.",
        "Ask what they want to see next.",
        "Give viewers one easy action at the end."
      ],

      ctaExample: [
        "What would you like to see next?",
        "Have you tried this before?",
        "Which part should I explain next?",
        "What would you do differently?"
      ],

      context: "Add one concrete example, result, personal detail, comparison, or useful takeaway.",
      contextExample: "“The biggest difference came from actually trying it instead of relying on what I expected beforehand.”",

      descriptionTitle: "Add one useful context point",
      descriptionText: "Give viewers a concrete example, result, comparison, or personal detail so the content feels specific."
    }
  };

  const selected =
    templates[videoType] ||
    templates.general;

  const hookVariant = pick(
    "hook",
    selected.hook
  );

  const hookExample = pick(
    "hookExample",
    selected.hookExample
  );

  const titleVariant = pick(
    "title",
    selected.title
  );

  const titleExample = pick(
    "titleExample",
    selected.titleExample
  );

  const ctaVariant = pick(
    "cta",
    selected.cta
  );

  const ctaExample = pick(
    "ctaExample",
    selected.ctaExample
  );

  return {
    videoType,

    hook: hookExample,

    title: titleExample,

    cta: ctaExample,

    context:
      selected.context,

    contextExample:
      selected.contextExample,

    hookSuggestionText:
      hookVariant,

    titleSuggestionTitle:
      titleVariant,

    titleSuggestionText:
      selected.title[
        getStableVariantIndex(
          `${seed}|titleText`,
          selected.title.length
        )
      ],

    ctaSuggestionTitle:
      "Make the ending more interactive",

    ctaSuggestionText:
      ctaVariant,

    descriptionSuggestionTitle:
      selected.descriptionTitle,

    descriptionSuggestionText:
      selected.descriptionText
  };
};

const makeYoutubeHookExample = ({ title, niche, transcript }) =>
  getContentExamples({ title, niche, transcript }).hook;

const makeYoutubeTitleExample = ({ title, niche, transcript }) =>
  getContentExamples({ title, niche, transcript }).title;

const makeYoutubeCtaExample = ({ title, niche, transcript }) =>
  getContentExamples({ title, niche, transcript }).cta;

const makeYoutubeContextExample = ({ title, niche, transcript }) =>
  getContentExamples({ title, niche, transcript }).contextExample;

const makeYoutubeDescriptionExample = ({ title, niche, transcript }) => {
  const topic = String(title || "This video").trim() || "This video";
  const examples = getContentExamples({ title, niche, transcript });
  return `${topic} — ${examples.context} What would you like to see next?`;
};

const makeInstagramCaptionExample = ({ niche }) =>
  `A little ${niche || "lifestyle"} moment from my day ✨ What part would you try first?`;

const makeInstagramCtaExample = () =>
  "Which one would you pick? Tell me in the comments 👇";

const makeInstagramHashtagExample = ({ niche }) => {
  const cleanNiche = String(niche || "lifestyle").toLowerCase().replace(/\s+/g, "");
  return `#${cleanNiche} #shortformcontent #creator #reels #contentcreator`;
};

const getWordTokens = (text) =>
  String(text || "").toLowerCase().match(/[\p{L}\p{M}']+/gu) || [];

const analyzeSpokenTranscript = ({ transcript, duration, title, niche }) => {
  const cleanTranscript = String(transcript || "").trim();
  const tokens = getWordTokens(cleanTranscript);
  const lower = cleanTranscript.toLowerCase();
  const issues = [];

  if (!tokens.length) {
    return { issues, wordCount: 0, wordsPerMinute: 0 };
  }

  // Detect repeated consecutive words/phrases, including non-Latin scripts.
  let consecutiveRepeatCount = 0;
  for (let i = 1; i < tokens.length; i += 1) {
    if (tokens[i] === tokens[i - 1]) {
      consecutiveRepeatCount += 1;
    }
  }

  const repeatedPhrases = [];
  for (let size = 2; size <= 4; size += 1) {
    const seen = new Map();
    for (let i = 0; i <= tokens.length - size; i += 1) {
      const phrase = tokens.slice(i, i + size).join(" ");
      seen.set(phrase, (seen.get(phrase) || 0) + 1);
    }
    for (const [phrase, count] of seen.entries()) {
      if (count >= 2 && phrase.length >= 4) {
        repeatedPhrases.push({ phrase, count, size });
      }
    }
  }

  repeatedPhrases.sort((a, b) => (b.count * b.size) - (a.count * a.size));

  const fillerTerms = [
    "so", "like", "actually", "basically", "honestly", "literally",
    "umm", "um", "uh", "you know", "i mean"
  ];

  const fillerCounts = fillerTerms
    .map((term) => ({
      term,
      count: term.includes(" ")
        ? Math.max(0, lower.split(term).length - 1)
        : tokens.filter((token) => token === term).length
    }))
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.count - a.count);

  const firstWords = tokens.slice(0, 10).join(" ");

  const genericOpening =
    /^(so|hi|hey|hello|ok|okay) (guys|everyone|friends)\b/i.test(firstWords) ||
    /^(welcome to)\b/i.test(firstWords);

  const spokenCtaPresent = ctaTerms.some((term) => lower.includes(term));

  const seconds = Number(duration) || 0;
  const wordsPerMinute = seconds > 0 ? (tokens.length / seconds) * 60 : 0;

  if (consecutiveRepeatCount >= 2 || repeatedPhrases.some((item) => item.count >= 3)) {
    const bestRepeat = repeatedPhrases[0]?.phrase || "the repeated phrase";

    issues.push({
      category: "Speaking",
      title: "Remove repeated phrases", 
      text: "The transcript contains repeated wording, which can make the delivery feel hesitant or less tight. Say the idea once and move to the next point.",
      example: `Instead of repeating “${bestRepeat}”, say it once and continue with the next point or idea.`,
      score: 91
    });
  }

  if (fillerCounts.length) {
    const topFiller = fillerCounts[0];

    issues.push({
      category: "Speaking",
      title: "Reduce filler words",
      text: `The spoken transcript uses “${topFiller.term}” repeatedly. Replacing some filler words with a short pause can make the delivery sound more confident.`,
      example: `Pause briefly instead of saying “${topFiller.term}” repeatedly, then continue with the next sentence.`,
      score: 86
    });
  }

  if (genericOpening) {
    issues.push({
      category: "Speaking",
      title: "Start the video more directly",
      text: "The spoken opening begins with a generic greeting before revealing the main idea. Lead with the specific payoff or curiosity point first.",
      example: makeYoutubeHookExample({ title, niche, transcript }),
      score: 89
    });
  }

  if (wordsPerMinute >= 185) {
    issues.push({
      category: "Speaking",
      title: "Slow down the delivery",
      text: `The transcript is roughly ${Math.round(wordsPerMinute)} words per minute for the supplied duration. A slightly slower pace with short pauses can make the story easier to follow.`,
      example: "Break longer sentences into two short sentences and pause briefly before each key point or section.",
      score: 83
    });
  } else if (wordsPerMinute > 0 && wordsPerMinute <= 80) {
    issues.push({
      category: "Speaking",
      title: "Add a little more spoken context",
      text: `The transcript is roughly ${Math.round(wordsPerMinute)} words per minute. Add one useful detail or reaction so the viewer gets more value from the narration.`,
      example: makeYoutubeContextExample({ title, niche, transcript }),
      score: 77
    });
  }

  if (!spokenCtaPresent && tokens.length >= 20) {
    issues.push({
      category: "Speaking",
      title: "Add a spoken CTA",
      text: "The transcript ends without a clear spoken invitation for viewers to respond. Add one natural question or action at the end.",
      example: makeYoutubeCtaExample({ title, niche, transcript }),
      score: 80
    });
  }

  return { issues, wordCount: tokens.length, wordsPerMinute };
};

const buildYoutubeResult = ({ title, description, duration, niche, transcript }) => {
  const cleanTitle = normalize(title);
  const cleanDescription = normalize(description);
  const spokenTranscript = String(transcript || description || "").trim();
  const cleanSpokenTranscript = normalize(spokenTranscript);
  const combined = `${cleanTitle} ${cleanDescription}`;
  const titleWords = cleanTitle ? cleanTitle.split(" ").filter(Boolean).length : 0;
  const descWords = cleanDescription ? cleanDescription.split(" ").filter(Boolean).length : 0;
  
  const hooks = countMatches(combined, hookTerms);
  const ctas = countMatches(combined, ctaTerms);
  const question = combined.includes("?");
  const exclamation = combined.includes("!");

  const titleQuality = clamp(
    35 +
      (titleWords >= 4 && titleWords <= 14 ? 28 : titleWords > 0 ? 16 : 0) +
      (question ? 12 : 0) +
      (exclamation ? 8 : 0) +
      Math.min(hooks * 6, 18)
  );

  const contentSignals = clamp(
    28 +
      (descWords >= 25 && descWords <= 180 ? 34 : descWords > 0 ? 22 : 0) +
      Math.min(descWords / 7, 18) +
      Math.min(ctas * 5, 10)
  );

  const hookStrength = clamp(
    32 + hooks * 18 + (question ? 8 : 0) + (exclamation ? 4 : 0)
  );

  const ctaSignals = clamp(
    30 + ctas * 18 + (question ? 8 : 0)
  );

  const durationScore =
    duration >= 8 && duration <= 60 ? 6 : duration > 0 ? 3 : 0;

  const score = clamp(
    titleQuality * 0.26 +
      contentSignals * 0.28 +
      hookStrength * 0.28 +
      ctaSignals * 0.12 +
      durationScore
  );

  const positive = [];
  const negative = [];
  const suggestions = [];

  const spokenAnalysis = analyzeSpokenTranscript({
    transcript: cleanSpokenTranscript,
    duration,
    title,
    niche
  });
  const contentExamples = getContentExamples({
  title,
  niche,
  transcript
});

  if (hookStrength >= 65) {
    positive.push("A recognizable hook signal is present.");
  } else {
    negative.push("The opening lacks a strong hook signal.");

    suggestions.push({
  category: "Hook",
  title: "Strengthen the opening hook",
  text:
    contentExamples.hookSuggestionText,
  example:
    contentExamples.hook,
  score: 88
});
  }

  if (titleQuality >= 65) {
    positive.push("The title has a useful structure for short-form content.");
  } else {
    negative.push("The title could be clearer or more specific.");

    suggestions.push({
  category: "Title",
  title:
    contentExamples.titleSuggestionTitle,
  text:
    contentExamples.titleSuggestionText,
  example:
    contentExamples.title,
  score: 82
});
  }

  if (ctaSignals >= 65) {
    positive.push("A call-to-action signal was detected.");
  } else {
    negative.push("No clear call-to-action signal was detected.");

    suggestions.push({
  category: "CTA",
  title:
    contentExamples.ctaSuggestionTitle,
  text:
    contentExamples.ctaSuggestionText,
  example:
    contentExamples.cta,
  score: 78
});
  }

  if (contentSignals >= 65) {
    positive.push("Caption/description contains enough text for content analysis.");
  } else {
    negative.push("Caption/description is short for deeper content analysis.");

    suggestions.push({
  category: "Description",
  title:
    contentExamples.descriptionSuggestionTitle,
  text:
    contentExamples.descriptionSuggestionText,
  example:
    contentExamples.contextExample,
  score: 74
});
  }

  if (!spokenAnalysis.issues.length) {
    positive.push(
      "The spoken transcript does not show obvious repetition or pacing issues from the available text."
    );
  } else {
    negative.push(
      "The spoken transcript contains delivery or wording patterns that can be improved."
    );
  }

  if (spokenAnalysis.issues.length) {
    suggestions.push(...spokenAnalysis.issues);
  }

  if (!suggestions.length) {
    suggestions.push({
      category: "Content",
      title: "Test a stronger overall version",
      text: "Keep the main idea, but make the opening, details and closing more direct and specific.",
      example:
        "Lead with the most interesting detail, add one useful context point, then finish with a simple viewer question.",
      score: 72
    });
  }

  return {
    platform: "youtube",
    niche,
    score,
    label: scoreToLabel(score),
    title: "YouTube Content Score",
    type: "Frontend preview analysis",
    breakdown: [
      ["Hook Strength", hookStrength],
      ["Title Quality", titleQuality],
      ["Content Signals", contentSignals],
      ["CTA Signals", ctaSignals]
    ],
    positive,
    negative,
    suggestions
  };
};

const buildInstagramResult = ({ caption, hashtags, niche }) => {
  const cleanCaption = normalize(caption);

  const hashtagArray = hashtags
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const hookCount = countMatches(cleanCaption, hookTerms);
  const ctaCount = countMatches(cleanCaption, ctaTerms);
  const question = cleanCaption.includes("?");
  const captionLength = cleanCaption.length;
  const hashtagCount = hashtagArray.length;

  const captionScore =
    captionLength >= 80 && captionLength <= 600
      ? 92
      : captionLength >= 40 && captionLength <= 1000
        ? 76
        : captionLength > 0
          ? 55
          : 0;

  const hookScore = clamp(
    42 + hookCount * 18 + (question ? 10 : 0)
  );

  const hashtagScore =
    hashtagCount >= 3 && hashtagCount <= 8
      ? 92
      : hashtagCount > 0
        ? 68
        : 42;

  const ctaScore = clamp(
    38 + ctaCount * 20 + (question ? 10 : 0)
  );

  const score = clamp(
    captionScore * 0.28 +
      hookScore * 0.27 +
      hashtagScore * 0.2 +
      ctaScore * 0.25
  );

  const positive = [];
  const negative = [];
  const suggestions = [];

  if (captionLength >= 80 && captionLength <= 600) {
    positive.push("Caption length is within a useful analysis range.");
  } else {
    negative.push("Caption length could be improved.");

    suggestions.push({
      title: "Improve caption structure",
      text: "Open with a clear idea, then add enough context to make the post easy to understand.",
      example: makeInstagramCaptionExample({ niche }),
      score: 85
    });
  }

  if (hookCount > 0) {
    positive.push("A recognizable hook signal is present.");
  } else {
    negative.push("Opening hook can be stronger.");

    suggestions.push({
      title: "Strengthen the hook",
      text: "Make the first line specific enough to create curiosity or show a direct benefit.",
      example: "“You need to see this before you buy another one…”",
      score: 81
    });
  }

  if (ctaCount > 0 || question) {
    positive.push("The caption contains an interaction signal.");
  } else {
    negative.push("No clear interaction CTA or question was detected.");

    suggestions.push({
      title: "Add a clear CTA",
      text: "Ask viewers to take one simple action instead of ending without an interaction prompt.",
      example: makeInstagramCtaExample(),
      score: 79
    });
  }

  if (hashtagCount >= 3 && hashtagCount <= 8) {
    positive.push("Hashtag count is within the selected project range.");
  } else {
    negative.push("Hashtag count could be adjusted.");

    suggestions.push({
      title: "Refine hashtag usage",
      text: "Use a small, relevant set that matches the actual content and niche.",
      example: makeInstagramHashtagExample({ niche }),
      score: 75
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      title: "Test a stronger version",
      text: "The signals are balanced. Test one concrete rewrite and compare performance.",
      example: makeInstagramCtaExample(),
      score: 72
    });
  }

  return {
    platform: "instagram",
    niche,
    score,
    label: scoreToLabel(score),
    title: "Instagram Engagement Potential",
    type: "Rule-based preview analysis",
    breakdown: [
      ["Hook Signals", hookScore],
      ["Caption Structure", captionScore],
      ["Hashtag Usage", hashtagScore],
      ["CTA", ctaScore]
    ],
    positive,
    negative,
    suggestions: suggestions.slice(0, 3)
  };
};

function App() {
  const [page, setPage] = useState("welcome");
  const [platform, setPlatform] = useState("");
  const [niche, setNiche] = useState("");
  const [themeKey, setThemeKey] = useState("ocean");
  const [themeOpen, setThemeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const [youtubeForm, setYoutubeForm] = useState({
    video: null,
    title: "",
    description: "",
    duration: 30,
    transcript: "",
    audioUrl: "",
    transcribing: false
  });

  const [instagramForm, setInstagramForm] = useState({
    video: null,
    caption: "",
    hashtags: ""
  });
  const [instagramPreviewUrl, setInstagramPreviewUrl] = useState("");

  useEffect(() => {
    if (!instagramForm.video) {
      setInstagramPreviewUrl("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(instagramForm.video);
    setInstagramPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [instagramForm.video]);

  const theme = themes[themeKey];

  const niches = useMemo(
    () => (platform === "youtube" ? youtubeNiches : instagramNiches),
    [platform]
  );

  const themeVars = {
    "--bg": theme.bg,
    "--card": theme.card,
    "--soft": theme.soft,
    "--accent": theme.accent,
    "--primary": theme.primary,
    "--secondary": theme.secondary,
    "--text": theme.text,
    "--muted": theme.muted,
    "--border": theme.border
  };

  const navigate = (nextPage) => {
    setPage(nextPage);
    setThemeOpen(false);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startAnalysis = () => navigate("home");

  const choosePlatform = (value) => {
    setPlatform(value);
    setNiche("");
    setResults(null);
    navigate("niche");
  };

  const youtubeReady =
    niche &&
    youtubeForm.video &&
    youtubeForm.title.trim() &&
    youtubeForm.duration > 0;

  const instagramReady =
    niche && instagramForm.caption.trim();

  const ready =
    platform === "youtube" ? youtubeReady : instagramReady;

  const handleAnalyze = async () => {
    if (!ready || loading) return;

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            platform,
            niche,

            title:
              platform === "youtube"
                ? youtubeForm.title
                : "",

            description:
              platform === "youtube"
                ? (
                    youtubeForm.transcript ||
                    youtubeForm.description ||
                    youtubeForm.title
                  )
                : "",

            caption:
              platform === "instagram"
                ? instagramForm.caption
                : "",

            hashtags:
              platform === "instagram"
                ? instagramForm.hashtags
                : "",

            duration:
              platform === "youtube"
                ? Number(youtubeForm.duration)
                : 30
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Backend analysis failed."
        );
      }

      if (platform === "youtube") {
        const ruleBasedDetails = buildYoutubeResult({
          title: youtubeForm.title,
          description:
            youtubeForm.transcript ||
            youtubeForm.description ||
            youtubeForm.title,
          transcript: youtubeForm.transcript,
          duration: Number(youtubeForm.duration),
          niche
        });

       const normalizedEngagement = normalizeModelEngagement(
  data.predicted_engagement_rate
);


  setResults({
    ...ruleBasedDetails,

  // REAL prediction from Python backend
  score: ruleBasedDetails.score,

label: scoreToLabel(ruleBasedDetails.score),
  title: "Predicted Engagement Rate",
  type: "Trained YouTube ML Model",

          // Keep backend values available
          predicted_engagement_rate:
            data.predicted_engagement_rate,
          feature_count: data.feature_count,

          // Keep explanations/suggestions from content-analysis rules
          breakdown: ruleBasedDetails.breakdown,
          positive: ruleBasedDetails.positive,
          negative: ruleBasedDetails.negative,
          suggestions: ruleBasedDetails.suggestions
        });
      } else {
        setResults(data);
      }

      navigate("results");
    } catch (error) {
      console.error(
        "ContentPulse backend error:",
        error
      );

      window.alert(
        error.message ||
          "Unable to connect to the ContentPulse backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResults(null);
    setNiche("");
    navigate("platform");
  };

  const handleYoutubeFile = async (file) => {
    if (!file) return;

    const validTypes = [
      "video/mp4",
      "video/quicktime",
      "video/webm",
      "video/x-m4v",
      "video/x-msvideo",
      "video/x-matroska"
    ];

    if (!validTypes.includes(file.type)) {
      window.alert(
        "Please upload a valid video file such as MP4, MOV, WEBM, AVI or MKV."
      );
      return;
    }

    setYoutubeForm((current) => ({
      ...current,
      video: file,
      transcript: "",
      audioUrl: "",
      transcribing: true
    }));

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("language", "auto");

      const response = await fetch(
        "http://127.0.0.1:8000/api/transcribe",
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to transcribe the video."
        );
      }

      const originalTranscript =
        data.variants?.original ||
        data.original ||
        data.transcript ||
        "";

      setYoutubeForm((current) => ({
        ...current,
        video: file,
        transcript: originalTranscript,
        audioUrl: data.audio_url || "",
        transcribing: false
      }));

      console.log(
        "Detected language:",
        data.language
      );

      console.log(
        "Original transcript:",
        originalTranscript
      );
    } catch (error) {
      console.error(
        "YouTube transcription error:",
        error
      );

      setYoutubeForm((current) => ({
        ...current,
        transcribing: false,
        transcript: "",
        audioUrl: ""
      }));

      const transcriptionError =
        String(error?.message || "");

      const noSpeechError =
        /no speech|speech was not detected|transcrib/i.test(
          transcriptionError
        );

      if (!noSpeechError) {
        window.alert(
          transcriptionError ||
            "Unable to connect to the transcription service."
        );
      }
    }
  };

  const handleFileDrop = async (event, type) => {
    event.preventDefault();

    const file =
      event.dataTransfer.files?.[0];

    if (!file) return;

    if (type === "youtube") {
      await handleYoutubeFile(file);
    } else {
      setInstagramForm((current) => ({
        ...current,
        video: file
      }));
    }
  };

  const showHeader = page !== "welcome";
  const showFooter = page !== "welcome";

  const navItems = [
    ["home", "Home"],
    ["how", "How It Works"],
    ["platform", "Analyze"]
  ];

  return (
    <div
      style={{
        ...themeVars,
        backgroundColor: "var(--bg)",
        color: "var(--text)"
      }}
      className="min-h-screen transition-colors duration-500"
    >
      <AnimatePresence mode="wait">
        {page === "welcome" && (
          <motion.main
            key="welcome"
            className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-[var(--bg)]" />

            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[min(760px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, var(--soft) 0%, var(--accent) 42%, transparent 72%)",
                opacity: 0.56
              }}
              animate={{
                scale: [1, 1.04, 1],
                opacity: [0.46, 0.62, 0.46]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[min(760px,94vw)] -translate-x-1/2 -translate-y-1/2">
              {[
                {
                  left: "12%",
                  top: "48%",
                  size: 14,
                  color: "var(--primary)",
                  x: 18,
                  y: -12,
                  d: 9.8,
                  delay: 0.0,
                  o: 0.30
                },
                {
                  left: "18%",
                  top: "33%",
                  size: 8,
                  color: "var(--secondary)",
                  x: -12,
                  y: -18,
                  d: 8.4,
                  delay: 0.8,
                  o: 0.34
                },
                {
                  left: "23%",
                  top: "66%",
                  size: 5,
                  color: "var(--primary)",
                  x: 10,
                  y: 16,
                  d: 7.3,
                  delay: 1.7,
                  o: 0.44
                },
                {
                  left: "30%",
                  top: "18%",
                  size: 11,
                  color: "var(--secondary)",
                  x: -14,
                  y: -14,
                  d: 10.8,
                  delay: 1.1,
                  o: 0.24
                },
                {
                  left: "34%",
                  top: "79%",
                  size: 6,
                  color: "var(--primary)",
                  x: 12,
                  y: 10,
                  d: 8.8,
                  delay: 2.2,
                  o: 0.38
                },
                {
                  left: "41%",
                  top: "11%",
                  size: 4,
                  color: "var(--secondary)",
                  x: 8,
                  y: -10,
                  d: 7.6,
                  delay: 0.5,
                  o: 0.42
                },
                {
                  left: "47%",
                  top: "86%",
                  size: 9,
                  color: "var(--primary)",
                  x: -10,
                  y: 13,
                  d: 11.2,
                  delay: 2.7,
                  o: 0.28
                },
                {
                  left: "54%",
                  top: "8%",
                  size: 6,
                  color: "var(--primary)",
                  x: 11,
                  y: -13,
                  d: 8.7,
                  delay: 1.4,
                  o: 0.36
                },
                {
                  left: "61%",
                  top: "91%",
                  size: 5,
                  color: "var(--secondary)",
                  x: -12,
                  y: 9,
                  d: 7.9,
                  delay: 0.9,
                  o: 0.40
                },
                {
                  left: "66%",
                  top: "21%",
                  size: 12,
                  color: "var(--secondary)",
                  x: 14,
                  y: -16,
                  d: 10.2,
                  delay: 2.0,
                  o: 0.25
                },
                {
                  left: "73%",
                  top: "69%",
                  size: 7,
                  color: "var(--primary)",
                  x: -13,
                  y: 15,
                  d: 8.9,
                  delay: 0.4,
                  o: 0.34
                },
                {
                  left: "79%",
                  top: "34%",
                  size: 4,
                  color: "var(--secondary)",
                  x: 8,
                  y: -9,
                  d: 7.0,
                  delay: 2.4,
                  o: 0.45
                },
                {
                  left: "86%",
                  top: "51%",
                  size: 15,
                  color: "var(--primary)",
                  x: -16,
                  y: -8,
                  d: 11.8,
                  delay: 1.3,
                  o: 0.22
                },
                {
                  left: "27%",
                  top: "47%",
                  size: 3,
                  color: "var(--secondary)",
                  x: 5,
                  y: -7,
                  d: 6.5,
                  delay: 3.0,
                  o: 0.50
                },
                {
                  left: "70%",
                  top: "48%",
                  size: 3,
                  color: "var(--primary)",
                  x: -5,
                  y: 8,
                  d: 6.8,
                  delay: 1.9,
                  o: 0.52
                }
              ].map((bubble, index) => (
                <motion.span
                  key={`welcome-bubble-${index}`}
                  className="absolute rounded-full"
                  style={{
                    left: bubble.left,
                    top: bubble.top,
                    width: bubble.size,
                    height: bubble.size,
                    backgroundColor: bubble.color,
                    opacity: bubble.o,
                    boxShadow: `0 4px 14px ${bubble.color}`
                  }}
                  animate={{
                    x: [
                      0,
                      bubble.x,
                      bubble.x * -0.6,
                      0
                    ],
                    y: [
                      0,
                      bubble.y,
                      bubble.y * -0.45,
                      0
                    ],
                    opacity: [
                      bubble.o * 0.65,
                      bubble.o,
                      bubble.o * 0.78,
                      bubble.o * 0.65
                    ],
                    scale: [1, 1.16, 0.92, 1]
                  }}
                  transition={{
                    duration: bubble.d,
                    delay: bubble.delay,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 mx-auto max-w-4xl text-center">
              <motion.div
                initial={{
                  opacity: 0,
                  y: 18
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  duration: 0.7
                }}
              >
                <div
                  className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black tracking-widest backdrop-blur"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--card)"
                  }}
                >
                  <Sparkles
                    size={15}
                    style={{
                      color: "var(--primary)"
                    }}
                  />
                  CONTENTPULSE
                </div>

                <motion.p
                  initial={{
                    opacity: 0,
                    y: 18
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  transition={{
                    duration: 0.7,
                    delay: 0.12
                  }}
                  className="text-3xl font-semibold sm:text-5xl"
                >
                  Welcome to
                </motion.p>

                <motion.h1
                  initial={{
                    opacity: 0,
                    y: 30,
                    scale: 0.96
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1
                  }}
                  transition={{
                    duration: 0.85,
                    delay: 0.28,
                    type: "spring",
                    stiffness: 90
                  }}
                  className="mt-2 text-6xl font-black tracking-tight sm:text-8xl"
                  style={{
                    color: "var(--primary)"
                  }}
                >
                  ContentPulse
                </motion.h1>

                <p
                  className="mx-auto mt-6 max-w-2xl text-base leading-8 sm:text-lg"
                  style={{
                    color: "var(--muted)"
                  }}
                >
                  A short-form content analyzer for YouTube Shorts and Instagram Reels.
                  Explore engagement signals, discover weak points, and improve your content
                  before publishing.
                </p>

                <motion.button
                  onClick={startAnalysis}
                  whileHover={{
                    y: -3,
                    scale: 1.01
                  }}
                  whileTap={{
                    scale: 0.98
                  }}
                  className="mt-9 inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 font-bold text-white shadow-xl"
                  style={{
                    backgroundColor: "var(--primary)"
                  }}
                >
                  Get Started
                  <ArrowRight size={18} />
                </motion.button>
              </motion.div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {showHeader && (
        <motion.header
          initial={{
            y: -20,
            opacity: 0
          }}
          animate={{
            y: 0,
            opacity: 1
          }}
          className="sticky top-0 z-40 border-b backdrop-blur-xl"
          style={{
            borderColor: "var(--border)",
            backgroundColor: `${theme.card}DD`
          }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
            <button
              onClick={() => navigate("home")}
              className="flex items-center gap-2 text-left font-black"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
                style={{
                  backgroundColor: "var(--primary)"
                }}
              >
                <Sparkles size={18} />
              </span>

              <span>ContentPulse</span>
            </button>

            <nav className="hidden items-center gap-7 text-sm font-bold md:flex">
              {navItems.map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => navigate(value)}
                  className="transition-opacity hover:opacity-70"
                  style={{
                    color: "var(--muted)"
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() =>
                    setThemeOpen((open) => !open)
                  }
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--card)"
                  }}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: "var(--primary)"
                    }}
                  />

                  <span className="hidden sm:block">
                    Theme
                  </span>

                  <ChevronDown size={15} />
                </button>

                <AnimatePresence>
                  {themeOpen && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 5
                      }}
                      animate={{
                        opacity: 1,
                        y: 0
                      }}
                      exit={{
                        opacity: 0,
                        y: 5
                      }}
                      className="absolute right-0 mt-2 grid w-72 gap-1 rounded-2xl border p-2 shadow-2xl"
                      style={{
                        borderColor: "var(--border)",
                        backgroundColor: "var(--card)"
                      }}
                    >
                      <p
                        className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-widest"
                        style={{
                          color: "var(--muted)"
                        }}
                      >
                        Choose your theme
                      </p>

                      {Object.entries(themes).map(
                        ([key, value]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setThemeKey(key);
                              setThemeOpen(false);
                            }}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition"
                            style={{
                              color: "var(--text)",
                              backgroundColor:
                                themeKey === key
                                  ? "var(--soft)"
                                  : "transparent"
                            }}
                          >
                            <span
                              className="h-4 w-4 rounded-full border"
                              style={{
                                backgroundColor:
                                  value.primary,
                                borderColor:
                                  value.border
                              }}
                            />

                            <span className="flex-1">
                              {value.name}
                            </span>

                            <span
                              className="text-[10px] font-black uppercase"
                              style={{
                                color: "var(--muted)"
                              }}
                            >
                              {value.mode}
                            </span>

                            {themeKey === key && (
                              <Check
                                size={15}
                                style={{
                                  color:
                                    value.primary
                                }}
                              />
                            )}
                          </button>
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() =>
                  setMenuOpen((open) => !open)
                }
                className="rounded-xl border p-2 md:hidden"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--card)"
                }}
              >
                {menuOpen ? (
                  <X size={19} />
                ) : (
                  <Menu size={19} />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0
                }}
                animate={{
                  height: "auto",
                  opacity: 1
                }}
                exit={{
                  height: 0,
                  opacity: 0
                }}
                className="border-t px-5 py-4 md:hidden"
                style={{
                  borderColor: "var(--border)"
                }}
              >
                <div className="flex flex-col gap-3">
                  {navItems.map(
                    ([value, label]) => (
                      <button
                        key={value}
                        onClick={() =>
                          navigate(value)
                        }
                        className="rounded-xl px-3 py-2 text-left text-sm font-bold"
                        style={{
                          color: "var(--muted)"
                        }}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      )}

      {showHeader && (
        <main>
          <AnimatePresence mode="wait">
            {page === "home" && (
              <motion.section
                key="home"
                initial={{
                  opacity: 0,
                  y: 24
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: -16
                }}
                transition={{
                  duration: 0.4
                }}
              >
                <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:pt-24">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${theme.soft}, ${theme.bg}, ${theme.accent})`
                    }}
                  />

                  <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
                    <div>
                      <div
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black tracking-wide"
                        style={{
                          borderColor: "var(--border)",
                          backgroundColor: "var(--card)"
                        }}
                      >
                        <Target
                          size={14}
                          style={{
                            color: "var(--primary)"
                          }}
                        />
                        SHORT-FORM CONTENT INTELLIGENCE
                      </div>

                      <h2 className="mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
                        Turn your content into{" "}
                        <span
                          style={{
                            color: "var(--primary)"
                          }}
                        >
                          smarter decisions.
                        </span>
                      </h2>

                      <p
                        className="mt-6 max-w-2xl text-base leading-8 sm:text-lg"
                        style={{
                          color: "var(--muted)"
                        }}
                      >
                        Analyze YouTube Shorts and Instagram Reels with a creator-friendly
                        workflow built around hooks, titles, captions, hashtags, CTAs, and
                        content signals.
                      </p>

                      <div className="mt-8 flex flex-wrap gap-3">
                        <button
                          onClick={() =>
                            navigate("platform")
                          }
                          className="rounded-2xl px-6 py-3 font-bold text-white shadow-lg"
                          style={{
                            backgroundColor:
                              "var(--primary)"
                          }}
                        >
                          Analyze Content
                        </button>

                        <button
                          onClick={() =>
                            navigate("how")
                          }
                          className="rounded-2xl border px-6 py-3 font-bold"
                          style={{
                            borderColor:
                              "var(--border)",
                            backgroundColor:
                              "var(--card)"
                          }}
                        >
                          How It Works
                        </button>
                      </div>
                    </div>

                    <motion.div
                      animate={{
                        y: [0, -8, 0]
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="rounded-[2rem] border p-5 shadow-2xl"
                      style={{
                        borderColor: "var(--border)",
                        backgroundColor: `${theme.card}E8`
                      }}
                    >
                      <div
                        className="rounded-[1.5rem] p-6"
                        style={{
                          backgroundColor: "var(--card)"
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p
                              className="text-sm font-semibold"
                              style={{
                                color: "var(--muted)"
                              }}
                            >
                              Engagement overview
                            </p>

                            <p className="mt-1 text-4xl font-black">
                              76
                            </p>
                          </div>

                          <div
                            className="flex h-14 w-14 items-center justify-center rounded-2xl"
                            style={{
                              backgroundColor:
                                "var(--soft)"
                            }}
                          >
                            <Gauge
                              size={28}
                              style={{
                                color: "var(--primary)"
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-7 space-y-4">
                          {[
                            ["Hook", 82],
                            ["Title", 76],
                            ["Content", 71],
                            ["CTA", 65]
                          ].map(
                            ([label, value]) => (
                              <div key={label}>
                                <div className="mb-1.5 flex justify-between text-xs font-bold">
                                  <span
                                    style={{
                                      color:
                                        "var(--muted)"
                                    }}
                                  >
                                    {label}
                                  </span>

                                  <span>
                                    {value}%
                                  </span>
                                </div>

                                <div
                                  className="h-2.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      "var(--soft)"
                                  }}
                                >
                                  <motion.div
                                    initial={{
                                      width: 0
                                    }}
                                    animate={{
                                      width: `${value}%`
                                    }}
                                    transition={{
                                      duration: 1,
                                      delay: 0.25
                                    }}
                                    className="h-2.5 rounded-full"
                                    style={{
                                      backgroundColor:
                                        "var(--primary)"
                                    }}
                                  />
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </section>

                <section className="px-5 pb-24 pt-4">
                  <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
                    {[
                      [
                        "YouTube Shorts",
                        "Trained model project path",
                        Youtube
                      ],
                      [
                        "Instagram Reels",
                        "Content-signal scoring workflow",
                        Instagram
                      ],
                      [
                        "Creator-first",
                        "Clear, practical explanations",
                        Lightbulb
                      ]
                    ].map(
                      ([title, text, Icon]) => (
                        <motion.div
                          key={title}
                          whileHover={{
                            y: -4
                          }}
                          className="rounded-3xl border p-6 shadow-sm"
                          style={{
                            borderColor:
                              "var(--border)",
                            backgroundColor:
                              "var(--card)"
                          }}
                        >
                          <Icon
                            size={24}
                            style={{
                              color: "var(--primary)"
                            }}
                          />

                          <h3 className="mt-4 text-xl font-black">
                            {title}
                          </h3>

                          <p
                            className="mt-2 text-sm leading-6"
                            style={{
                              color: "var(--muted)"
                            }}
                          >
                            {text}
                          </p>
                        </motion.div>
                      )
                    )}
                  </div>
                </section>
              </motion.section>
            )}

            {page === "how" && (
              <motion.section
                key="how"
                className="mx-auto max-w-7xl px-5 py-20"
                initial={{
                  opacity: 0,
                  y: 24
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: -16
                }}
              >
                <div className="mx-auto max-w-3xl text-center">
                  <p
                    className="text-sm font-black uppercase tracking-widest"
                    style={{
                      color: "var(--primary)"
                    }}
                  >
                    How It Works
                  </p>

                  <h2 className="mt-3 text-4xl font-black sm:text-5xl">
                    A simple path from content to insight.
                  </h2>

                  <p
                    className="mt-5 leading-8"
                    style={{
                      color: "var(--muted)"
                    }}
                  >
                    The workflow is intentionally simple so creators can move from input
                    to useful feedback without getting lost in technical details.
                  </p>
                </div>

                <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                  {howItWorks.map(
                    (step, index) => (
                      <motion.div
                        key={step.number}
                        initial={{
                          opacity: 0,
                          y: 24
                        }}
                        animate={{
                          opacity: 1,
                          y: 0
                        }}
                        transition={{
                          delay: index * 0.08
                        }}
                        className="rounded-3xl border p-6 shadow-sm"
                        style={{
                          borderColor:
                            "var(--border)",
                          backgroundColor:
                            "var(--card)"
                        }}
                      >
                        <span
                          className="text-sm font-black"
                          style={{
                            color: "var(--primary)"
                          }}
                        >
                          {step.number}
                        </span>

                        <h3 className="mt-5 text-xl font-black">
                          {step.title}
                        </h3>

                        <p
                          className="mt-3 text-sm leading-7"
                          style={{
                            color: "var(--muted)"
                          }}
                        >
                          {step.text}
                        </p>
                      </motion.div>
                    )
                  )}
                </div>

                <div
                  className="mt-10 rounded-[2rem] border p-8 sm:p-10"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--soft)"
                  }}
                >
                  <div className="grid gap-8 lg:grid-cols-[1fr_.8fr] lg:items-center">
                    <div>
                      <p
                        className="text-sm font-black uppercase tracking-widest"
                        style={{
                          color: "var(--primary)"
                        }}
                      >
                        What gets analyzed
                      </p>

                      <h3 className="mt-3 text-3xl font-black">
                        Hooks, titles, captions, hashtags, CTAs, and structure.
                      </h3>

                      <p
                        className="mt-4 max-w-2xl leading-8"
                        style={{
                          color: "var(--muted)"
                        }}
                      >
                        The frontend presents these signals in a clear sequence so you can
                        understand what is working and what to improve.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        "Hook",
                        "Title",
                        "Caption",
                        "Keywords",
                        "CTA",
                        "Structure"
                      ].map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border px-4 py-4 text-center text-sm font-bold"
                          style={{
                            borderColor:
                              "var(--border)",
                            backgroundColor:
                              "var(--card)"
                          }}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {page === "about" && (
              <motion.section
                key="about"
                className="mx-auto max-w-5xl px-5 py-20"
                initial={{
                  opacity: 0,
                  y: 24
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: -16
                }}
              >
                <div
                  className="rounded-[2rem] border p-8 shadow-sm sm:p-12"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--card)"
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                      style={{
                        backgroundColor:
                          "var(--primary)"
                      }}
                    >
                      <Sparkles size={20} />
                    </span>

                    <div>
                      <p
                        className="text-xs font-black uppercase tracking-widest"
                        style={{
                          color: "var(--primary)"
                        }}
                      >
                        About ContentPulse
                      </p>

                      <h2 className="text-3xl font-black">
                        Built for short-form creators.
                      </h2>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-7 md:grid-cols-2">
                    <p
                      className="leading-8"
                      style={{
                        color: "var(--muted)"
                      }}
                    >
                      ContentPulse is the frontend experience for your AI Content
                      Engagement Analyzer project. It is designed around YouTube Shorts
                      and Instagram Reels, with separate platform inputs and a dedicated
                      results page.
                    </p>

                    <p
                      className="leading-8"
                      style={{
                        color: "var(--muted)"
                      }}
                    >
                      The existing Python backend and model files remain untouched in
                      this version. The frontend is made fully usable on its own so you
                      can test the flow, styling, navigation, themes, uploads, and results.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      navigate("platform")
                    }
                    className="mt-8 inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-bold text-white"
                    style={{
                      backgroundColor:
                        "var(--primary)"
                    }}
                  >
                    Start Analyzing
                    <ArrowRight size={17} />
                  </button>
                </div>
              </motion.section>
            )}

            {page === "platform" && (
              <motion.section
                key="platform"
                className="mx-auto max-w-6xl px-5 py-20"
                initial={{
                  opacity: 0,
                  y: 24
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: -16
                }}
              >
                <div className="text-center">
                  <p
                    className="text-sm font-black uppercase tracking-widest"
                    style={{
                      color: "var(--primary)"
                    }}
                  >
                    Analyze
                  </p>

                  <h2 className="mt-3 text-4xl font-black sm:text-5xl">
                    Choose your platform
                  </h2>

                  <p
                    className="mx-auto mt-4 max-w-2xl leading-7"
                    style={{
                      color: "var(--muted)"
                    }}
                  >
                    Start with the platform that matches the content you want to evaluate.
                  </p>
                </div>

                <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
                  {[
                    {
                      id: "youtube",
                      title: "YouTube Shorts",
                      text: "Use video, title, caption/description, duration, and niche.",
                      icon: Youtube
                    },
                    {
                      id: "instagram",
                      title: "Instagram Reels",
                      text: "Upload the Reel and add its caption, hashtags, and niche.",
                      icon: Instagram
                    }
                  ].map((item) => {
                    const Icon = item.icon;
                    const selected =
                      platform === item.id;

                    return (
                      <motion.button
                        key={item.id}
                        whileHover={{
                          y: -5
                        }}
                        whileTap={{
                          scale: 0.99
                        }}
                        onClick={() =>
                          choosePlatform(item.id)
                        }
                        className="rounded-[2rem] border p-7 text-left shadow-sm"
                        style={{
                          borderColor: selected
                            ? "var(--primary)"
                            : "var(--border)",
                          backgroundColor: selected
                            ? "var(--soft)"
                            : "var(--card)"
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="flex h-14 w-14 items-center justify-center rounded-2xl"
                            style={{
                              backgroundColor:
                                "var(--soft)",
                              color:
                                "var(--primary)"
                            }}
                          >
                            <Icon size={29} />
                          </div>

                          {selected && (
                            <span
                              className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                              style={{
                                backgroundColor:
                                  "var(--primary)"
                              }}
                            >
                              <Check size={16} />
                            </span>
                          )}
                        </div>

                        <h3 className="mt-6 text-2xl font-black">
                          {item.title}
                        </h3>

                        <p
                          className="mt-2 text-sm leading-6"
                          style={{
                            color: "var(--muted)"
                          }}
                        >
                          {item.text}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {page === "niche" && (
              <motion.section
                key="niche"
                className="mx-auto max-w-6xl px-5 py-16"
                initial={{
                  opacity: 0,
                  y: 24
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: -16
                }}
              >
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() =>
                      navigate("platform")
                    }
                    className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold"
                    style={{
                      borderColor:
                        "var(--border)",
                      backgroundColor:
                        "var(--card)"
                    }}
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>

                  <div
                    className="rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest"
                    style={{
                      color: "var(--primary)",
                      backgroundColor:
                        "var(--soft)"
                    }}
                  >
                    {platform === "youtube"
                      ? "YouTube Shorts"
                      : "Instagram Reels"}
                  </div>
                </div>

                <div className="text-center">
                  <p
                    className="text-sm font-black uppercase tracking-widest"
                    style={{
                      color: "var(--primary)"
                    }}
                  >
                    Step 2
                  </p>

                  <h2 className="mt-3 text-4xl font-black">
                    Choose your niche and add content
                  </h2>

                  <p
                    className="mx-auto mt-4 max-w-2xl"
                    style={{
                      color: "var(--muted)"
                    }}
                  >
                    Your niche helps keep the analysis aligned with the content category.
                  </p>
                </div>

                <div className="mt-10">
                  <p className="text-sm font-black uppercase tracking-widest">
                    Choose niche
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {niches.map(
                      (item, index) => {
                        const selected =
                          niche === item;

                        return (
                          <motion.button
                            key={item}
                            initial={{
                              opacity: 0,
                              y: 12
                            }}
                            animate={{
                              opacity: 1,
                              y: 0
                            }}
                            transition={{
                              delay:
                                index * 0.04
                            }}
                            onClick={() =>
                              setNiche(item)
                            }
                            className="rounded-2xl border px-4 py-4 text-sm font-bold transition"
                            style={{
                              borderColor:
                                selected
                                  ? "var(--primary)"
                                  : "var(--border)",
                              backgroundColor:
                                selected
                                  ? "var(--soft)"
                                  : "var(--card)",
                              color: selected
                                ? "var(--primary)"
                                : "var(--text)"
                            }}
                          >
                            <span className="flex items-center justify-center gap-2">
                              {selected && (
                                <Check size={15} />
                              )}

                              {item}
                            </span>
                          </motion.button>
                        );
                      }
                    )}
                  </div>
                </div>

                <motion.div
                  className="mt-10 rounded-[2rem] border p-6 shadow-sm sm:p-8"
                  initial={{
                    opacity: 0,
                    y: 16
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  transition={{
                    delay: 0.12
                  }}
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--card)"
                  }}
                >
                  {platform === "youtube" ? (
                    <div>
                      <div className="mb-7 flex items-center gap-3">
                        <Youtube
                          size={21}
                          style={{
                            color:
                              "var(--primary)"
                          }}
                        />

                        <h3 className="text-2xl font-black">
                          YouTube Shorts Input
                        </h3>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <UploadBox
                          label="Drag & drop your Short"
                          description="MP4, MOV, AVI or MKV"
                          file={youtubeForm.video}
                          onDrop={(event) =>
                            handleFileDrop(
                              event,
                              "youtube"
                            )
                          }
                          onChange={(file) =>
                            handleYoutubeFile(
                              file
                            )
                          }
                        />

                        {youtubeForm.video && (
                          <div className="mt-5 space-y-4">
                            <div
                              className="rounded-2xl border p-4"
                              style={{
                                borderColor:
                                  "var(--border)",
                                backgroundColor:
                                  "var(--soft)"
                              }}
                            >
                              <p className="mb-3 text-sm font-black">
                                Video Preview
                              </p>

                              <video
                                controls
                                className="w-full rounded-2xl"
                                src={URL.createObjectURL(
                                  youtubeForm.video
                                )}
                              />
                            </div>

                            {youtubeForm.transcribing && (
                              <div
                                className="rounded-2xl border p-4 text-sm font-bold"
                                style={{
                                  borderColor:
                                    "var(--border)",
                                  backgroundColor:
                                    "var(--card)",
                                  color:
                                    "var(--primary)"
                                }}
                              >
                                Transcribing your video...
                              </div>
                            )}

                            {youtubeForm.audioUrl &&
                              !youtubeForm.transcribing && (
                                <div
                                  className="rounded-2xl border p-4"
                                  style={{
                                    borderColor:
                                      "var(--border)",
                                    backgroundColor:
                                      "var(--card)"
                                  }}
                                >
                                  <p className="mb-3 text-sm font-black">
                                    Extracted Audio
                                  </p>

                                  <audio
                                    controls
                                    className="w-full"
                                    src={
                                      youtubeForm.audioUrl
                                    }
                                  />
                                </div>
                              )}

                            {youtubeForm.transcript &&
                              !youtubeForm.transcribing && (
                                <div
                                  className="rounded-2xl border p-4"
                                  style={{
                                    borderColor:
                                      "var(--border)",
                                    backgroundColor:
                                      "var(--card)"
                                  }}
                                >
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <p className="text-sm font-black">
                                      Generated Transcript
                                    </p>

                                    <span
                                      className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase"
                                      style={{
                                        backgroundColor:
                                          "var(--soft)",
                                        color:
                                          "var(--primary)"
                                      }}
                                    >
                                      Speech-to-text
                                    </span>
                                  </div>

                                  <div className="mb-3 flex items-center gap-2">
                                    <span
                                      className="rounded-lg px-4 py-2 text-sm font-medium"
                                      style={{
                                        backgroundColor:
                                          "var(--soft)",
                                        color:
                                          "var(--primary)"
                                      }}
                                    >
                                      Original
                                    </span>
                                  </div>

                                  <TranscriptTextArea
                                    value={
                                      youtubeForm.transcript
                                    }
                                    onCommit={(
                                      value
                                    ) => {
                                      setYoutubeForm(
                                        (
                                          current
                                        ) => ({
                                          ...current,
                                          transcript:
                                            value
                                        })
                                      );
                                    }}
                                    placeholder="Your generated transcript will appear here..."
                                    rows={9}
                                  />

                                  <p
                                    className="mt-2 text-xs"
                                    style={{
                                      color:
                                        "var(--muted)"
                                    }}
                                  >
                                    Note: AI-generated transcription may contain mistakes. Please review and edit if needed.
                                  </p>
                                </div>
                              )}
                          </div>
                        )}

                        <div className="space-y-4">
                          <Input
                            value={
                              youtubeForm.title
                            }
                            onChange={(value) =>
                              setYoutubeForm(
                                (current) => ({
                                  ...current,
                                  title: value
                                })
                              )
                            }
                            placeholder="Video title"
                          />

                          <TextArea
                            value={
                              youtubeForm.description
                            }
                            onChange={(value) =>
                              setYoutubeForm(
                                (current) => ({
                                  ...current,
                                  description:
                                    value
                                })
                              )
                            }
                            placeholder="Write your caption or description"
                            rows={7}
                          />

                          <Input
                            value={String(
                              youtubeForm.duration
                            )}
                            onChange={(value) =>
                              setYoutubeForm(
                                (current) => ({
                                  ...current,
                                  duration:
                                    Number(value) ||
                                    0
                                })
                              )
                            }
                            placeholder="Duration in seconds"
                            type="number"
                            min="1"
                            max="180"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-7 flex items-center gap-3">
                        <Instagram
                          size={21}
                          style={{
                            color:
                              "var(--primary)"
                          }}
                        />

                        <h3 className="text-2xl font-black">
                          Instagram Reels Input
                        </h3>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <UploadBox
                          label="Drag & drop your Reel"
                          description="MP4, MOV, AVI or MKV"
                          file={instagramForm.video}
                          onDrop={(event) =>
                            handleFileDrop(event, "instagram")
                          }
                          onChange={(file) =>
                            setInstagramForm((current) => ({
                              ...current,
                              video: file
                            }))
                          }
                        />

                        {instagramPreviewUrl && (
                          <div
                            className="rounded-3xl border p-4"
                            style={{
                              borderColor: "var(--border)",
                              backgroundColor: "var(--card)"
                            }}
                          >
                            <p className="mb-3 text-sm font-black">
                              Video Preview
                            </p>
                            <video
                              controls
                              playsInline
                              className="max-h-[26rem] w-full rounded-2xl bg-black object-contain"
                              src={instagramPreviewUrl}
                            />
                          </div>
                        )}

                        <div className={`space-y-4 ${instagramPreviewUrl ? "md:col-span-2" : ""}`}>
                          <TextArea
                            value={
                              instagramForm.caption
                            }
                            onChange={(value) =>
                              setInstagramForm(
                                (current) => ({
                                  ...current,
                                  caption: value
                                })
                              )
                            }
                            placeholder="Write your caption"
                            rows={7}
                          />

                          <Input
                            value={
                              instagramForm.hashtags
                            }
                            onChange={(value) =>
                              setInstagramForm(
                                (current) => ({
                                  ...current,
                                  hashtags: value
                                })
                              )
                            }
                            placeholder="Hashtags — #beauty #skincare"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className="mt-8 flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                      borderColor:
                        "var(--border)",
                      backgroundColor:
                        "var(--soft)"
                    }}
                  >
                    <div className="text-sm">
                      <p className="font-bold">
                        Selected niche
                      </p>

                      <p
                        style={{
                          color: "var(--muted)"
                        }}
                      >
                        {niche ||
                          "Select a niche to continue"}
                      </p>
                    </div>

                    <button
                      onMouseDown={(event) =>
                        event.preventDefault()
                      }
                      onClick={handleAnalyze}
                      disabled={!ready || loading}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        backgroundColor:
                          "var(--primary)"
                      }}
                    >
                      {loading ? (
                        <>
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Analyze Content
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.section>
            )}

            {page === "results" && results && (
              <motion.section
                key="results"
                className="mx-auto max-w-7xl px-5 py-16"
                initial={{
                  opacity: 0,
                  y: 24
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: -16
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <button
                      onClick={() =>
                        navigate("niche")
                      }
                      className="mb-5 inline-flex items-center gap-2 text-sm font-bold"
                      style={{
                        color: "var(--muted)"
                      }}
                    >
                      <ArrowLeft size={16} />
                      Back to content
                    </button>

                    <p
                      className="text-sm font-black uppercase tracking-widest"
                      style={{
                        color: "var(--primary)"
                      }}
                    >
                      Results
                    </p>

                    <h2 className="mt-3 text-4xl font-black sm:text-5xl">
                      Your content analysis
                    </h2>

                    <p
                      className="mt-2"
                      style={{
                        color: "var(--muted)"
                      }}
                    >
                      {results.platform ===
                      "youtube"
                        ? "YouTube Shorts"
                        : "Instagram Reels"}{" "}
                      · {results.niche}
                    </p>
                  </div>

                  <div
                    className="rounded-2xl border px-4 py-3 text-right"
                    style={{
                      borderColor:
                        "var(--border)",
                      backgroundColor:
                        "var(--card)"
                    }}
                  >
                    <p className="text-xs font-black uppercase tracking-widest">
                      Analysis mode
                    </p>

                    <p
                      className="mt-1 text-sm font-bold"
                      style={{
                        color:
                          "var(--primary)"
                      }}
                    >
                      {results.type}
                    </p>
                  </div>
                </div>

                <div className="mt-10 grid gap-7 lg:grid-cols-[.8fr_1.2fr]">
                  <div
                    className="rounded-[2rem] border p-8 shadow-sm sm:p-10"
                    style={{
                      borderColor:
                        "var(--border)",
                      backgroundColor:
                        "var(--card)"
                    }}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div
                        className="relative flex h-52 w-52 items-center justify-center rounded-full"
                        style={{
                          background: `conic-gradient(var(--primary) ${
                            results.score * 3.6
                          }deg, var(--soft) 0deg)`
                        }}
                      >
                        <div
                          className="flex h-40 w-40 flex-col items-center justify-center rounded-full"
                          style={{
                            backgroundColor:
                              "var(--card)"
                          }}
                        >
                          <span className="text-5xl font-black">
                            {results.score}
                          </span>

                          <span
                            className="text-sm font-bold"
                            style={{
                              color:
                                "var(--muted)"
                            }}
                          >
                            / 100
                          </span>
                        </div>
                      </div>

                      <h3 className="mt-6 text-2xl font-black">
                        {results.label}
                      </h3>

                      <p
                        className="mt-3 max-w-sm text-sm leading-7"
                        style={{
                          color: "var(--muted)"
                        }}
                      >
                        {results.title}
                      </p>
                    </div>
                  </div>

                  <div
                    className="rounded-[2rem] border p-8 shadow-sm sm:p-10"
                    style={{
                      borderColor:
                        "var(--border)",
                      backgroundColor:
                        "var(--card)"
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <BarChart3
                        size={20}
                        style={{
                          color:
                            "var(--primary)"
                        }}
                      />

                      <h3 className="text-2xl font-black">
                        Content breakdown
                      </h3>
                    </div>

                    <div className="mt-8 space-y-6">
                      {results.breakdown.map(
                        ([label, value]) => (
                          <div key={label}>
                            <div className="mb-2 flex justify-between text-sm font-bold">
                              <span>{label}</span>
                              <span>
                                {value}%
                              </span>
                            </div>

                            <div
                              className="h-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  "var(--soft)"
                              }}
                            >
                              <motion.div
                                initial={{
                                  width: 0
                                }}
                                animate={{
                                  width: `${value}%`
                                }}
                                transition={{
                                  duration: 0.8
                                }}
                                className="h-2.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    "var(--primary)"
                                }}
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-7 grid gap-7 md:grid-cols-2">
                  <div
                    className="rounded-[2rem] border p-8 shadow-sm"
                    style={{
                      borderColor:
                        "var(--border)",
                      backgroundColor:
                        "var(--card)"
                    }}
                  >
                    <h3 className="text-xl font-black">
                      Why this score
                    </h3>

                    <div className="mt-6 grid gap-7 sm:grid-cols-2">
                      <div>
                        <p className="font-bold text-emerald-600">
                          Positive factors
                        </p>

                        <div className="mt-3 space-y-3">
                          {results.positive.map(
                            (item) => (
                              <div
                                key={item}
                                className="flex gap-2 text-sm leading-6"
                              >
                                <Check
                                  size={17}
                                  className="mt-1 shrink-0 text-emerald-600"
                                />

                                <span
                                  style={{
                                    color:
                                      "var(--muted)"
                                  }}
                                >
                                  {item}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="font-bold text-rose-500">
                          Needs attention
                        </p>

                        <div className="mt-3 space-y-3">
                          {results.negative.map(
                            (item) => (
                              <div
                                key={item}
                                className="flex gap-2 text-sm leading-6"
                              >
                                <X
                                  size={17}
                                  className="mt-1 shrink-0 text-rose-500"
                                />

                                <span
                                  style={{
                                    color:
                                      "var(--muted)"
                                  }}
                                >
                                  {item}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="rounded-[2rem] border p-8 shadow-sm"
                    style={{
                      borderColor:
                        "var(--border)",
                      backgroundColor:
                        "var(--card)"
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb
                        size={20}
                        style={{
                          color:
                            "var(--primary)"
                        }}
                      />

                      <h3 className="text-xl font-black">
                        Suggestions
                      </h3>
                    </div>

                    <div className="mt-5 space-y-3">
                      {(results.suggestions ||
                        []).map(
                        (item, index) => (
                          <div
                            key={item.title}
                            className="rounded-2xl border p-4"
                            style={{
                              borderColor:
                                index === 0
                                  ? "var(--primary)"
                                  : "var(--border)",
                              backgroundColor:
                                index === 0
                                  ? "var(--soft)"
                                  : "transparent"
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  {index === 0 && (
                                    <span
                                      className="rounded-full px-2 py-1 text-[10px] font-black text-white"
                                      style={{
                                        backgroundColor:
                                          "var(--primary)"
                                      }}
                                    >
                                      FOCUS
                                    </span>
                                  )}

                                  {item.category && (
                                    <span
                                      className="rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wide"
                                      style={{
                                        borderColor:
                                          "var(--border)",
                                        color:
                                          "var(--muted)"
                                      }}
                                    >
                                      {item.category}
                                    </span>
                                  )}

                                  <span className="font-bold">
                                    {item.title}
                                  </span>
                                </div>

                                <p
                                  className="mt-2 text-sm leading-6"
                                  style={{
                                    color:
                                      "var(--muted)"
                                  }}
                                >
                                  {item.text}
                                </p>

                                {item.example && (
                                  <div
                                    className="mt-3 rounded-xl border px-3 py-3 text-sm leading-6"
                                    style={{
                                      borderColor:
                                        "var(--border)",
                                      backgroundColor:
                                        "var(--card)"
                                    }}
                                  >
                                    <span
                                      className="font-black"
                                      style={{
                                        color:
                                          "var(--primary)"
                                      }}
                                    >
                                      Example:{" "}
                                    </span>

                                    <span
                                      style={{
                                        color:
                                          "var(--text)"
                                      }}
                                    >
                                      {item.example}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <span
                                className="shrink-0 text-sm font-black"
                                style={{
                                  color:
                                    "var(--primary)"
                                }}
                              >
                                {item.score}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={resetAnalysis}
                    className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 font-bold"
                    style={{
                      borderColor:
                        "var(--border)",
                      backgroundColor:
                        "var(--card)"
                    }}
                  >
                    <RotateCcw size={17} />
                    Try Another
                  </button>

                  <button
                    onClick={() =>
                      navigate("home")
                    }
                    className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-bold text-white"
                    style={{
                      backgroundColor:
                        "var(--primary)"
                    }}
                  >
                    Back Home
                    <ArrowRight size={17} />
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      )}

      {showFooter && (
        <footer
          className="mt-auto border-t px-5 py-10"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)"
          }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 md:grid-cols-[1fr_.7fr_1.3fr]">
              <div>
                <div className="flex items-center gap-2 text-lg font-black">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                    style={{
                      backgroundColor:
                        "var(--primary)"
                    }}
                  >
                    <Sparkles size={18} />
                  </span>

                  ContentPulse
                </div>

                <p
                  className="mt-3 max-w-sm text-sm leading-6"
                  style={{
                    color: "var(--muted)"
                  }}
                >
                  AI Content Engagement Analyzer for YouTube Shorts and Instagram Reels.
                </p>
              </div>

              <div>
                <p className="font-black">
                  Quick Links
                </p>

                <div className="mt-3 flex flex-col items-start gap-2 text-sm">
                  <button
                    onClick={() =>
                      navigate("home")
                    }
                    style={{
                      color: "var(--muted)"
                    }}
                  >
                    Home
                  </button>

                  <button
                    onClick={() =>
                      navigate("how")
                    }
                    style={{
                      color: "var(--muted)"
                    }}
                  >
                    How It Works
                  </button>

                  <button
                    onClick={() =>
                      navigate("platform")
                    }
                    style={{
                      color: "var(--muted)"
                    }}
                  >
                    Analyze
                  </button>

                  <button
                    onClick={() =>
                      navigate("about")
                    }
                    style={{
                      color: "var(--muted)"
                    }}
                  >
                    About
                  </button>
                </div>
              </div>

              <div>
                <p className="font-black">
                  Important Note
                </p>

                <p
                  className="mt-3 text-sm leading-7"
                  style={{
                    color: "var(--muted)"
                  }}
                >
                  This tool provides results based on trained machine learning models and
                  content-analysis rules. Results are directional and may vary from actual
                  engagement. Real-world performance depends on many factors outside the
                  model’s training data and scope.
                </p>
              </div>
            </div>

            <div
              className="mt-10 border-t pt-6 text-center text-xs"
              style={{
                borderColor:
                  "var(--border)",
                color: "var(--muted)"
              }}
            >
              © {new Date().getFullYear()} ContentPulse. All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max
}) {
  const [draft, setDraft] = useState(
    value === undefined || value === null
      ? ""
      : String(value)
  );

  const lastValueRef = useRef(
    value === undefined || value === null
      ? ""
      : String(value)
  );

  const focusedRef = useRef(false);
  const restoreScrollRef = useRef(null);

  useLayoutEffect(() => {
    const nextValue =
      value === undefined || value === null
        ? ""
        : String(value);

    if (
      !focusedRef.current &&
      nextValue !== lastValueRef.current
    ) {
      setDraft(nextValue);
      lastValueRef.current = nextValue;
    }
  }, [value]);

  const rememberScroll = () => {
    restoreScrollRef.current =
      window.scrollY;
  };

  const restoreScroll = (
    immediate = false
  ) => {
    const saved =
      restoreScrollRef.current;

    if (saved === null) return;

    const restore = () => {
      window.scrollTo({
        top: saved,
        left: window.scrollX,
        behavior: "auto"
      });
    };

    if (immediate) restore();

    requestAnimationFrame(restore);

    requestAnimationFrame(() =>
      requestAnimationFrame(restore)
    );

    [0, 16, 40, 80, 160, 300].forEach(
      (delay) => {
        window.setTimeout(
          restore,
          delay
        );
      }
    );

    window.setTimeout(() => {
      if (!focusedRef.current) {
        restoreScrollRef.current =
          null;
      }
    }, 320);
  };

  const handlePointerDown = () => {
    rememberScroll();
  };

  const handleFocus = (event) => {
    focusedRef.current = true;

    if (
      restoreScrollRef.current === null
    ) {
      restoreScrollRef.current =
        window.scrollY;
    }

    const saved =
      restoreScrollRef.current;

    try {
      event.currentTarget.focus({
        preventScroll: true
      });
    } catch {
      // Older browsers may not support the preventScroll option.
    }

    window.scrollTo({
      top: saved,
      left: window.scrollX,
      behavior: "auto"
    });

    restoreScroll(true);
  };

  const handleChange = (event) => {
    setDraft(event.target.value);
  };

  const handleBlur = () => {
    const saved =
      restoreScrollRef.current ??
      window.scrollY;

    focusedRef.current = false;

    if (
      draft !== lastValueRef.current
    ) {
      lastValueRef.current = draft;
      onChange(draft);
    }

    restoreScrollRef.current = saved;
    restoreScroll();
  };

  return (
    <input
      value={draft}
      onChange={handleChange}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      type={type}
      min={min}
      max={max}
      className="w-full rounded-2xl border px-4 py-3.5 outline-none transition focus:ring-2"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--card)",
        color: "var(--text)",
        boxShadow: "0 0 0 0 transparent"
      }}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 6
}) {
  const [draft, setDraft] =
    useState(value || "");

  const lastValueRef = useRef(
    value || ""
  );

  const focusedRef = useRef(false);
  const restoreScrollRef = useRef(null);

  useLayoutEffect(() => {
    const nextValue =
      value || "";

    if (
      !focusedRef.current &&
      nextValue !== lastValueRef.current
    ) {
      setDraft(nextValue);
      lastValueRef.current =
        nextValue;
    }
  }, [value]);

  const rememberScroll = () => {
    restoreScrollRef.current =
      window.scrollY;
  };

  const restoreScroll = (
    immediate = false
  ) => {
    const saved =
      restoreScrollRef.current;

    if (saved === null) return;

    const restore = () => {
      window.scrollTo({
        top: saved,
        left: window.scrollX,
        behavior: "auto"
      });
    };

    if (immediate) restore();

    requestAnimationFrame(restore);

    requestAnimationFrame(() =>
      requestAnimationFrame(restore)
    );

    [0, 16, 40, 80, 160, 300].forEach(
      (delay) => {
        window.setTimeout(
          restore,
          delay
        );
      }
    );

    window.setTimeout(() => {
      if (!focusedRef.current) {
        restoreScrollRef.current =
          null;
      }
    }, 320);
  };

  const handlePointerDown = () => {
    rememberScroll();
  };

  const handleFocus = (event) => {
    focusedRef.current = true;

    if (
      restoreScrollRef.current === null
    ) {
      restoreScrollRef.current =
        window.scrollY;
    }

    const saved =
      restoreScrollRef.current;

    try {
      event.currentTarget.focus({
        preventScroll: true
      });
    } catch {
      // Older browsers may not support the preventScroll option.
    }

    window.scrollTo({
      top: saved,
      left: window.scrollX,
      behavior: "auto"
    });

    restoreScroll(true);
  };

  const handleChange = (event) => {
    setDraft(event.target.value);
  };

  const handleBlur = () => {
    const saved =
      restoreScrollRef.current ??
      window.scrollY;

    focusedRef.current = false;

    if (
      draft !== lastValueRef.current
    ) {
      lastValueRef.current = draft;
      onChange(draft);
    }

    restoreScrollRef.current = saved;
    restoreScroll();
  };

  return (
    <textarea
      value={draft}
      onChange={handleChange}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-2xl border px-4 p-3.5 outline-none transition focus:ring-2"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--card)",
        color: "var(--text)"
      }}
    />
  );
}

function TranscriptTextArea({
  value,
  onCommit,
  placeholder,
  rows = 6
}) {
  const [draft, setDraft] =
    useState(value);

  const lastCommittedValueRef =
    useRef(value);

  useLayoutEffect(() => {
    if (
      value !==
      lastCommittedValueRef.current
    ) {
      setDraft(value);

      lastCommittedValueRef.current =
        value;
    }
  }, [value]);

  const handleBlur = () => {
    if (
      draft !==
      lastCommittedValueRef.current
    ) {
      lastCommittedValueRef.current =
        draft;

      onCommit(draft);
    }
  };

  return (
    <textarea
      value={draft}
      onChange={(event) =>
        setDraft(event.target.value)
      }
      onBlur={handleBlur}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-2xl border px-4 p-3.5 outline-none transition focus:ring-2"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--card)",
        color: "var(--text)"
      }}
    />
  );
}

function UploadBox({
  label,
  description,
  file,
  onDrop,
  onChange
}) {
  return (
    <div
      onDragOver={(event) =>
        event.preventDefault()
      }
      onDrop={onDrop}
      className="flex min-h-56 flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center transition"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--soft)"
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          backgroundColor:
            "var(--card)",
          color: "var(--primary)"
        }}
      >
        <Upload size={27} />
      </div>

      <p className="mt-4 font-black">
        {label}
      </p>

      <p
        className="mt-1 text-sm"
        style={{
          color: "var(--muted)"
        }}
      >
        {description}
      </p>

      <label
        className="mt-5 cursor-pointer rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm"
        style={{
          backgroundColor:
            "var(--primary)"
        }}
      >
        Browse file

        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) =>
            onChange(
              event.target.files?.[0] ||
                null
            )
          }
        />
      </label>

      {file && (
        <p
          className="mt-3 max-w-full truncate text-xs font-bold"
          style={{
            color: "var(--muted)"
          }}
        >
          {file.name}
        </p>
      )}
    </div>
  );
}

export default App;
