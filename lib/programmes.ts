export interface Programme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  isAvailable: boolean;
  electives: { name: string; code: string }[];
}

export const PROGRAMMES: Programme[] = [
  {
    id: "science",
    name: "General Science",
    emoji: "🔬",
    description: "Elective Maths, Physics, Chemistry, Biology",
    isAvailable: true,
    electives: [
      { name: "Elective Maths", code: "elective_math" },
      { name: "Physics", code: "physics" },
      { name: "Chemistry", code: "chemistry" },
      { name: "Biology", code: "biology" },
    ],
  },
  {
    id: "general_arts",
    name: "General Arts",
    emoji: "🎭",
    description: "Literature, History/Government, Geography, Economics",
    isAvailable: true,
    electives: [
      { name: "Literature in English", code: "literature" },
      { name: "History / Government", code: "government" },
      { name: "Geography", code: "geography" },
      { name: "Economics", code: "economics" },
    ],
  },
  {
    id: "business",
    name: "Business",
    emoji: "📊",
    description: "Financial Accounting, Cost Accounting, Economics, Business Mgmt",
    isAvailable: true,
    electives: [
      { name: "Financial Accounting", code: "financial_accounting" },
      { name: "Cost Accounting", code: "cost_accounting" },
      { name: "Economics", code: "economics" },
      { name: "Business Management", code: "business_management" },
    ],
  },
  {
    id: "vapa",
    name: "Visual Arts",
    emoji: "🎨",
    description: "Graphic Design, Textiles, Picture Making, Music",
    isAvailable: true,
    electives: [
      { name: "Graphic Design", code: "graphic_design" },
      { name: "Textiles", code: "textiles" },
      { name: "Picture Making", code: "picture_making" },
      { name: "Music", code: "music" },
    ],
  },
  {
    id: "technical",
    name: "Technical",
    emoji: "⚙️",
    description: "Building Construction, Technical Drawing, Auto Mechanics",
    isAvailable: false,
    electives: [
      { name: "Building Construction", code: "building_construction" },
      { name: "Technical Drawing", code: "technical_drawing" },
      { name: "Auto Mechanics", code: "auto_mechanics" },
    ],
  },
  {
    id: "home_economics",
    name: "Home Economics",
    emoji: "🏡",
    description: "Food & Nutrition, Management in Living, Clothing & Textiles",
    isAvailable: false,
    electives: [
      { name: "Food & Nutrition", code: "food_nutrition" },
      { name: "Management in Living", code: "management_living" },
      { name: "Clothing & Textiles", code: "clothing_textiles" },
    ],
  },
  {
    id: "agricultural_science",
    name: "Agricultural Science",
    emoji: "🌾",
    description: "Animal Husbandry, Farm Management, Agric Economics",
    isAvailable: false,
    electives: [
      { name: "Animal Husbandry", code: "animal_husbandry" },
      { name: "Farm Management", code: "farm_management" },
      { name: "Agric Economics", code: "agric_economics" },
    ],
  },
  {
    id: "vocational_skills",
    name: "Vocational Skills",
    emoji: "🔧",
    description: "Electronics, Welding & Fabrication, Plumbing",
    isAvailable: false,
    electives: [
      { name: "Electronics", code: "electronics" },
      { name: "Welding & Fabrication", code: "welding" },
      { name: "Plumbing", code: "plumbing" },
    ],
  },
  {
    id: "general",
    name: "General",
    emoji: "📚",
    description: "Mixed electives depending on your school",
    isAvailable: false,
    electives: [
      { name: "Mixed electives", code: "mixed" },
    ],
  },
];
