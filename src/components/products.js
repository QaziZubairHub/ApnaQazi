// Centralized product data for the entire application
// This ensures a "Single Source of Truth"

import beltpic1 from "../assets/beltpic1.png";
import beltpic2 from "../assets/beltpic2.png";
// Agar aapke paas mazeed images hain toh unhe yahan import karein (e.g., beltpic3, beltpic4)

export const beltProducts = [
  {
    id: 1,
    title: "2-in-1 Reversible Leather Belt Crocodile Texture Art #809",
    description: "A stylish and versatile 2-in-1 reversible belt. Features a sophisticated crocodile texture on one side and a classic plain finish on the other. Perfect for both formal and casual wear.",
    image: beltpic1,
    hoverImage: beltpic2,
    // 👇 NEW: Thumbnail gallery ke liye array (Yahan aap 4-5 images bhi daal sakte hain)
    gallery: [beltpic1, beltpic2, beltpic1, beltpic2], 
    // 👇 NEW: Color Selection ke liye array
    colors: [
      { name: "Black", hex: "#000000" },
      { name: "/Brown", hex: "#8B4513" },
    ],
    price: 1850,
    originalPrice: 3999,
    rating: 4.8,
    reviews: 11,
    availableSizes: ["32", "34", "36", "38", "40", "42","44"],
    sku: "BLT-809-CRO",
    category: "Belts",
  },
  {
    id: 2,
    title: "2-in-1 Pure Leather Belt Art #806",
    description: "Crafted from pure, high-quality leather, this 2-in-1 belt offers durability and timeless style. Reverse it for a different color or texture to match any outfit.",
    image: beltpic2,
    hoverImage: beltpic1,
    // 👇 NEW
    gallery: [beltpic2, beltpic1, beltpic2],
    // 👇 NEW
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Dark Brown", hex: "#3B2F2F" }
    ],
    price: 2799,
    originalPrice: 4499,
    rating: 4.9,
    reviews: 57,
    availableSizes: ["32", "34", "36", "38", "40", "42"],
    sku: "BLT-806-PURE",
    category: "Belts",
  },
  { 
    id: 3, 
    title: "2-in-1 Reversible Leather Belt Needle Texture Art #809", 
    description: "A unique needle texture reversible belt for a modern look. High-quality materials ensure it lasts for years.", 
    image: beltpic1, 
    hoverImage: beltpic2, 
    // 👇 NEW
    gallery: [beltpic1, beltpic2],
    // 👇 NEW
    colors: [
      { name: "Black/Grey", hex: "#222222" }
    ],
    price: 2499, 
    originalPrice: 3999, 
    rating: 4.5, 
    reviews: 4, 
    availableSizes: ["32", "34", "36"], 
    sku: "BLT-809-NEEDLE", 
    category: "Belts" 
  },
  { 
    id: 4, 
    title: "Men Pull Up Leather Belt Brown Art #721", 
    description: "A classic brown leather belt made with pull-up leather that develops a beautiful patina over time. A must-have for any wardrobe.", 
    image: beltpic2, 
    hoverImage: beltpic1,
    // 👇 NEW
    gallery: [beltpic2, beltpic1, beltpic2],
    // 👇 NEW
    colors: [
      { name: "Brown", hex: "#5C4033" },
      { name: "Light Tan", hex: "#D2B48C" }
    ],
    price: 1999, 
    originalPrice: 2999, 
    rating: 4.2, 
    reviews: 3, 
    availableSizes: ["32", "34", "36"], 
    sku: "BLT-721-BROWN", 
    category: "Belts" 
  },
];