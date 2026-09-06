export type Track = {
  id: string;
  code: string;
  title: string;
  crisisName: string;
  category: "PREDICTION" | "PREVENTION" | "MITIGATION" | "OPEN INNOVATION";
  icon: "waves" | "flame" | "rocket" | "anchor" | "zap";
  threat: string;
  brief: string;
  scenario: string;
  engineeringProblem: string;
  exampleIdeas: string[];
  constraint?: string;
  featured?: boolean;
  stack: string[];
};

export const TRACKS: Track[] = [
  {
    id: "earthquake",
    code: "CRISIS 01",
    title: "The Earth Breaks",
    crisisName: "Earthquake Crisis",
    category: "PREVENTION",
    icon: "flame",
    threat: "SEISMIC DEFENCE",
    brief:
      "Detect abnormal vibration/motion in real time and trigger a physical protective response before damage occurs.",
    scenario:
      "A quake has already begun. Buildings are swaying, equipment is at risk, and there's no time to evacuate — only time to react. The ground doesn't ask permission before it moves.",
    engineeringProblem:
      "Detect abnormal vibration/motion in real time and trigger a physical protective response before damage occurs.",
    exampleIdeas: [
      "Adaptive counterweight / tuned mass response that shifts to counteract detected sway",
      "Auto-cutoff system that kills power/gas to a mock structure the instant unsafe vibration is sensed",
      "Active isolation base that lifts or decouples a platform from vibration using a servo/motor",
    ],
    stack: [],
  },
  {
    id: "ocean",
    code: "CRISIS 02",
    title: "The Ocean Takes the Land",
    crisisName: "Rising Sea Crisis",
    category: "PREVENTION",
    icon: "waves",
    threat: "HYDRO DEFENCE",
    brief: "Detect rising water level and trigger a physical adaptation — before the water wins.",
    scenario:
      "Water is rising and it isn't stopping. Coastal infrastructure that was built for yesterday's sea level is drowning today. Something has to adapt to a shoreline that keeps moving.",
    engineeringProblem:
      "Detect rising water level and trigger a physical adaptation — before the water wins.",
    exampleIdeas: [
      "Auto-rising flood barrier (servo/motor-driven gate that lifts as water rises)",
      "Adaptive drainage/pump system that activates proportionally to water level",
      "Buoyant platform that lifts critical equipment automatically to stay above the waterline",
    ],
    stack: [],
  },
  {
    id: "mars",
    code: "CRISIS 03",
    title: "Humanity on Mars",
    crisisName: "Mars Survival Crisis",
    category: "PREVENTION",
    icon: "rocket",
    threat: "OFF-WORLD DEFENCE",
    brief:
      "Sense changing environmental conditions (light, temp, dust, power) and adapt operation autonomously.",
    scenario:
      'The first Martian settlement is alive — barely. Extreme temperature swings, dust storms, and thin unstable power make "normal operation" impossible. Something has to keep adapting just so life support doesn\'t quietly fail.',
    engineeringProblem:
      "Build an autonomous system that senses a changing environmental condition (light, temperature, dust/particulate, or power availability) and adapts operation to keep something alive or protected.",
    exampleIdeas: [
      "Adaptive greenhouse controller that adjusts lighting/ventilation/irrigation for a mock plant enclosure",
      "Dust-storm protection system that detects reduced visibility/airflow change and shields or retracts exposed equipment",
      "Adaptive solar power system that reroutes power/load priority as simulated sunlight changes",
    ],
    stack: [],
  },
  {
    id: "communication",
    code: "CRISIS 04",
    title: "The World Goes Silent",
    crisisName: "Communication Collapse Crisis",
    category: "MITIGATION",
    icon: "anchor",
    threat: "COMMS DEFENCE",
    brief:
      "Build a hardware communication path that works without relying on existing cell/internet infrastructure.",
    scenario:
      "Every signal just died. No towers, no satellites, no network — just silence where coordination used to be. Somewhere out there, someone needs to be heard.",
    engineeringProblem:
      "Build a hardware communication path that works without relying on existing cell/internet infrastructure.",
    exampleIdeas: [
      "LoRa point-to-point emergency messenger (send/receive a short text or status code)",
      "RF relay node that extends a signal's range by one hop between two fixed points",
      "Priority beacon system that transmits a distress code (light/sound/RF) detectable from a distance without networked infra",
    ],
    stack: [],
  },
  {
    id: "spread",
    code: "CRISIS 05",
    title: "The Spread",
    crisisName: "Bio-Contamination Crisis",
    category: "PREVENTION",
    icon: "flame",
    threat: "BIO DEFENCE",
    brief:
      "Detect rising contamination/air-quality danger in a zone and automatically seal or isolate it before spread.",
    scenario:
      "Something got out. An unknown contaminant is spreading through the air, and nobody knows how fast or how far. Every second of delay means another zone lost. Containment isn't optional — it's the only thing standing between this and total collapse.",
    engineeringProblem:
      "Build a hardware system that detects rising contamination/air-quality danger in a zone and automatically seals or isolates it before the spread continues.",
    exampleIdeas: [
      "Automated quarantine airlock — servo-driven doors seal a zone the instant contamination crosses a threshold",
      "Contamination gradient mapper — a small sensor array detects which direction concentration is increasing and flags the spread path",
      "Auto-ventilation containment system — instead of sealing, actively filters/exhausts contaminated air from an enclosed zone while sealing exits",
    ],
    stack: [],
  },
  {
    id: "unknown",
    code: "CRISIS 06 (OPEN)",
    title: "Open Innovation",
    crisisName: "Open Innovation",
    category: "OPEN INNOVATION",
    icon: "zap",
    featured: true,
    threat: "WILDCARD DEFENCE",
    brief:
      "Bring your own hardware crisis. Any sense → decide → act system with real physical response.",
    scenario:
      "Not every crisis has been named yet. Somewhere, something is about to fail, and it doesn't match any protocol on file. This is your chance to define the threat — and the system that survives it.",
    engineeringProblem:
      "Bring your own hardware crisis. Any sense → decide → act system — embedded, IoT, robotics, power, RF, control systems — as long as it demonstrates a real physical response to a real physical problem.",
    constraint:
      "Must still follow the core rule of the event — a sensor, a decision, and a physical actuation. No pure software/dashboard/chatbot/AI-only entries.",
    exampleIdeas: [
      "Custom Robotics & Actuated Mechanisms",
      "Embedded IoT Sensor & Feedback Control Loop",
      "Hardware Power / RF / Autonomous Reactive System",
    ],
    stack: [],
  },
];

export const STATS = [
  { label: "PRIZE CACHE", value: "₹22K INR", val: "₹22K INR", desc: "Top 3 Squads Rewarded" },
  { label: "SPRINT DURATION", value: "5 HOURS", val: "5 HOURS", desc: "High-Intensity Build" },
  { label: "THREAT SECTORS", value: "5 TRACKS", val: "5 TRACKS", desc: "Open & Focused Domains" },
  {
    label: "CLEARANCE RATE",
    value: "OPEN TO ALL",
    val: "OPEN TO ALL",
    desc: "All Colleges & Streams",
  },
];

export type Stage = "prep" | "hacking" | "pitch";

export type TimelineEvent = {
  phase: string;
  time: string;
  title: string;
  location: string;
  stage: Stage;
  description: string;
  status: string;
};

export const TIMELINE: TimelineEvent[] = [
  {
    phase: "STAGE 1 // REPORTING",
    time: "08:00 AM",
    title: "Event Registration & Squad Check-in",
    location: "Jaya Auditorium",
    stage: "prep",
    description:
      "Squad check-in, clearance badge verification, kit allocation, and preliminary briefing.",
    status: "REGISTRATION DESK ACTIVE",
  },
  {
    phase: "STAGE 2 // KICKOFF",
    time: "11:00 AM",
    title: "Makeathon Official Start — 5-Hour Build Sprint",
    location: "Jaya Auditorium",
    stage: "hacking",
    description:
      "5-hour intense continuous sprint begins. Squads start prototyping hardware, firmware, and student engineering solutions.",
    status: "SPRINT ACTIVE",
  },
  {
    phase: "STAGE 2 // REVIEW",
    time: "01:00 PM",
    title: "Mid-Point Progress Inspection & Lunch Break",
    location: "Jaya Auditorium",
    stage: "hacking",
    description:
      "Mentors visit tables for prototype reviews, technical feedback, and troubleshooting support.",
    status: "MENTOR ROUND ACTIVE",
  },
  {
    phase: "STAGE 2 // FINAL SPRINT",
    time: "03:30 PM",
    title: "Project Freeze & Code Lockdown",
    location: "Jaya Auditorium",
    stage: "hacking",
    description: "Stop work command. Prototypes and presentations locked for jury evaluation.",
    status: "CODE LOCKDOWN",
  },
  {
    phase: "STAGE 3 // EVALUATION",
    time: "04:00 PM",
    title: "Jury Demonstrations & Award Ceremony",
    location: "Jaya Auditorium",
    stage: "pitch",
    description:
      "3-minute live prototype demonstrations before jury, followed by announcement of winners and prize distribution.",
    status: "JURY DEMOS ACTIVE",
  },
];

export const FAQS = [
  {
    q: "When is the makeathon?",
    a: "Confirmed for Sept 23 — a 5-hour makeathon. The detailed timeline will be released to registered squads before lockdown.",
  },
  {
    q: "Who is allowed to enlist?",
    a: "Students from all engineering disciplines, polytechnic colleges, and universities. Registration is ₹200 INR per team.",
  },
  {
    q: "How large can a squad be?",
    a: "Between 1 and 4 members per squad. Solo participants are also welcome!",
  },
  {
    q: "Can I bring my own project or idea (Open Innovation)?",
    a: "Yes! Sector 05 (Open Innovation) allows any software app, hardware prototype, IoT project, or AI model. All creative ideas are welcome.",
  },
];
