/* eslint-disable no-console */

import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { parseDatabaseUrl } from "../src/lib/db-url";
import { DEFAULT_ZONES, quoteShipping, type ShippingConfig } from "../src/lib/shipping";
import { splitInclusive, summariseTax } from "../src/lib/tax";
import { combinations, variantLabel, type OptionAxis } from "../src/lib/variants";

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL is not set.");
    console.error("   Copy .env.example to .env and set it, e.g.");
    console.error(
      '   DATABASE_URL="mysql://root:yourpassword@localhost:3306/kcs_gmart"',
    );
    process.exit(1);
  }
  return url;
}

const dbConfig = parseDatabaseUrl(requireDatabaseUrl(), 5);

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(dbConfig),
});

type CategorySeed = {
  title: string;
  slug: string;
  image?: string;
  isSpecial?: boolean;
  sortOrder?: number;
  children?: { title: string; slug: string; image?: string }[];
};

const CATEGORIES: CategorySeed[] = [
  {
    title: "Curated Gift Hampers",
    slug: "curated-gift-hampers",
    image: "/images/product/category/curated-gift-hampers-00-2024-04.webp",
    sortOrder: 1,
    children: [
      {
        title: "Festive Hampers",
        slug: "festive-gift-hampers",
        image: "/images/product/category/festive-gift-hampers-44-2024-04.webp",
      },
      {
        title: "Gourmet Hampers",
        slug: "gourmet-hampers",
        image: "/images/product/category/dry-fruit-packs-54-2024-04.webp",
      },
    ],
  },
  {
    title: "Apparels & Clothing",
    slug: "apparels-clothing",
    image: "/images/product/featured/apparels-clothing-99-2024-04.webp",
    sortOrder: 2,
    children: [
      {
        title: "T-Shirts & Polos",
        slug: "tshirts-polos",
        image: "/images/product/category/collar-neck-t-shirt-06-2024-04.webp",
      },
      {
        title: "Jackets & Hoodies",
        slug: "jackets-hoodies",
        image: "/images/product/category/jacket-hoodie-29-2024-04.webp",
      },
      {
        title: "Uniforms",
        slug: "uniforms",
        image: "/images/product/category/uniform-shirt-90-2024-04.webp",
      },
    ],
  },
  {
    title: "Bags & Luggage",
    slug: "bags-luggage",
    image: "/images/product/featured/bags-luggage-37-2024-04.webp",
    sortOrder: 3,
    children: [
      {
        title: "Backpacks",
        slug: "backpacks-haversacks",
        image: "/images/product/category/backpack-haversack-21-2024-04.webp",
      },
      {
        title: "Laptop Bags",
        slug: "laptop-bags",
        image: "/images/product/category/accessories-gift-set-89-2024-04.webp",
      },
      {
        title: "Trolley & Suitcases",
        slug: "trolley-suitcases",
        image: "/images/product/category/trolley-bag-suitcase-05-2024-04.webp",
      },
    ],
  },
  {
    title: "Electronics & Tech",
    slug: "electronics-tech",
    image: "/images/product/featured/-electronics-tech-91-2024-04.webp",
    sortOrder: 4,
    children: [
      {
        title: "Earpods & Audio",
        slug: "earpods-audio",
        image: "/images/product/category/earpods-07-2024-04.webp",
      },
      {
        title: "Smart Watches",
        slug: "smart-watches",
        image: "/images/product/category/smart-watches-35-2024-04.webp",
      },
      {
        title: "Power Banks & Chargers",
        slug: "power-banks-chargers",
        image: "/images/product/category/power-banks-chargers-42-2024-04.webp",
      },
      {
        title: "Bluetooth Speakers",
        slug: "bluetooth-speakers",
        image: "/images/product/category/bluetooth-speakers-31-2024-04.webp",
      },
    ],
  },
  {
    title: "Drinkwares",
    slug: "drinkwares",
    image: "/images/product/featured/drinkwares-78-2024-04.webp",
    sortOrder: 5,
    children: [
      { title: "Bottles & Sippers", slug: "bottles-sippers" },
      {
        title: "Mugs & Cups",
        slug: "mugs-cups",
        image: "/images/product/category/mugs-cups-23-2024-04.webp",
      },
    ],
  },
  {
    title: "Office & Stationery",
    slug: "office-stationery",
    image: "/images/product/featured/office-stationery-95-2024-04.webp",
    sortOrder: 6,
    children: [
      {
        title: "Notebooks & Notepads",
        slug: "notebooks-notepads",
        image: "/images/product/category/notebook-notepad-71-2024-04.webp",
      },
      {
        title: "Desktop Essentials",
        slug: "desktop-essentials",
        image: "/images/product/category/desktop-items-80-2024-04.webp",
      },
    ],
  },
  {
    title: "Kitchenware & Appliances",
    slug: "kitchenware-appliances",
    image: "/images/product/category/kitchen-appliances-53-2024-04.webp",
    sortOrder: 7,
    children: [
      {
        title: "Electric Kettles",
        slug: "electric-kettles",
        image: "/images/product/category/electric-kettle-73-2024-04.webp",
      },
      { title: "Cookware & Utensils", slug: "cookware-utensils" },
    ],
  },
  {
    title: "Chocolates & Dry Fruits",
    slug: "chocolates-dry-fruits",
    image: "/images/product/featured/chocolates-dry-fruits-30-2024-04.webp",
    sortOrder: 8,
    children: [
      {
        title: "Dry Fruit Packs",
        slug: "dry-fruit-packs",
        image: "/images/product/category/dry-fruit-packs-54-2024-04.webp",
      },
    ],
  },
  {
    title: "Combo Gift Sets",
    slug: "combo-gift-sets",
    image: "/images/product/featured/combo-gift-sets-09-2024-04.webp",
    sortOrder: 9,
    children: [
      {
        title: "Tech Gift Sets",
        slug: "tech-gift-sets",
        image: "/images/product/category/tech-gift-set-25-2024-04.webp",
      },
    ],
  },
  {
    title: "Personal & Lifestyle",
    slug: "personal-lifestyle",
    image: "/images/product/featured/personal-lifestyle-86-2024-04.webp",
    sortOrder: 10,
    children: [
      {
        title: "Fitness & Wellness",
        slug: "fitness-wellness",
        image: "/images/product/category/fitness-tracker-band-23-2024-04.webp",
      },
    ],
  },
  // Special categories (mega menu #2)
  {
    title: "Diwali Gift Hampers",
    slug: "diwali-gift-hampers",
    image: "/images/product/themes/diwali-gift-hampers-37-2024-09.webp",
    isSpecial: true,
    sortOrder: 1,
  },
  {
    title: "Employee Joining Kits",
    slug: "onboarding-joining-kits",
    image: "/images/product/category/onboarding-joining-kits-04-2024-04.webp",
    isSpecial: true,
    sortOrder: 2,
  },
  {
    title: "Corporate Gifting",
    slug: "corporate-gifting",
    image: "/images/KCS/cat/Corporate-Gifting.jpg",
    isSpecial: true,
    sortOrder: 3,
  },
  {
    title: "Trade Schemes",
    slug: "trade-schemes",
    image: "/images/KCS/cat/Trade-Schemes.jpg",
    isSpecial: true,
    sortOrder: 4,
  },
  {
    title: "Work From Home",
    slug: "work-from-home",
    image: "/images/product/themes/work-from-home-83-2024-09.webp",
    isSpecial: true,
    sortOrder: 5,
  },
  {
    title: "Sustainable Gifts",
    slug: "sustainable-gifts",
    image: "/images/product/themes/sustainable-gifts-02-2024-09.webp",
    isSpecial: true,
    sortOrder: 6,
  },
];

const BRANDS = [
  {
    name: "Adidas",
    slug: "adidas",
    logo: "/images/product/brand/adidas-05-2024-04.webp",
  },
  {
    name: "Amazon",
    slug: "amazon",
    logo: "/images/product/brand/amazon-72-2024-04.webp",
  },
  {
    name: "American Tourister",
    slug: "american-tourister",
    logo: "/images/product/brand/american-tourister-40-2024-04.webp",
  },
  {
    name: "boAt",
    slug: "boat",
    logo: "/images/product/brand/boat-44-2024-04.webp",
  },
  {
    name: "Borosil",
    slug: "borosil",
    logo: "/images/product/brand/borosil-11-2024-04.webp",
  },
  {
    name: "Cadbury",
    slug: "cadbury",
    logo: "/images/product/brand/cadbury-04-2024-04.webp",
  },
  {
    name: "Cross",
    slug: "cross",
    logo: "/images/product/brand/cross-85-2024-04.webp",
  },
  {
    name: "Ferrero Rocher",
    slug: "ferrero-rocher",
    logo: "/images/product/brand/ferrero-rocher-38-2024-04.webp",
  },
  {
    name: "Google",
    slug: "google",
    logo: "/images/product/brand/google-01-2024-04.webp",
  },
  {
    name: "Jack & Jones",
    slug: "jack-jones",
    logo: "/images/product/brand/jack&jones-69-2024-04.webp",
  },
  {
    name: "JBL",
    slug: "jbl",
    logo: "/images/product/brand/jbl-40-2024-04.webp",
  },
  {
    name: "Marks & Spencer",
    slug: "marks-spencer",
    logo: "/images/product/brand/marks-&-spencers-34-2024-04.webp",
  },
  {
    name: "Mi (Xiaomi)",
    slug: "mi-xiaomi",
    logo: "/images/product/brand/mi-xiaomi-15-2024-04.webp",
  },
  {
    name: "Noise",
    slug: "noise",
    logo: "/images/product/brand/noise-09-2024-04.webp",
  },
  {
    name: "Portronics",
    slug: "portronics",
    logo: "/images/product/brand/portronics-63-2024-04.webp",
  },
  {
    name: "Procter Hampers",
    slug: "procter-hampers",
    logo: "/images/product/brand/procter-hampers-32-2024-04.webp",
  },
  {
    name: "Puma",
    slug: "puma",
    logo: "/images/product/brand/puma-05-2024-04.webp",
  },
  {
    name: "Safari",
    slug: "safari",
    logo: "/images/product/brand/safari-89-2024-04.webp",
  },
  {
    name: "Swiss Military",
    slug: "swiss-military",
    logo: "/images/product/brand/swiss-military-84-2024-04.webp",
  },
  {
    name: "VIP",
    slug: "vip",
    logo: "/images/product/brand/vip-33-2024-04.webp",
  },
  {
    name: "Wildcraft",
    slug: "wildcraft",
    logo: "/images/product/brand/wildcraft-55-2024-04.webp",
  },
];

type ProductSeed = {
  name: string;
  slug: string;
  brand: string;
  categories: string[];
  image: string;
  images?: string[];
  introtext: string;
  description: string;
  stock: number;
  flags?: ("new" | "featured" | "bestseller")[];
  /** Defaults to BULK. SINGLE = one tier at qty 1; ENQUIRY = no tiers, quote only. */
  pricingMode?: "SINGLE" | "BULK" | "ENQUIRY";
  tiers: { minQuantity: number; price: number; mrp: number }[];
  specs: { label: string; value: string }[];
  /** Tax & logistics — defaults are filled in by `logistics()` from the category. */
  hsnCode?: string;
  gstRate?: number;
  weightGrams?: number;
  dims?: [number, number, number];
  /** Option axes → one variant per combination (apparel). */
  options?: OptionAxis[];
  /** Per-variant overrides keyed by attribute label ("Red / L"). */
  variantOverrides?: Record<string, { sku?: string; stock?: number; priceDelta?: number; image?: string; isActive?: boolean }>;
};

/**
 * Category-driven defaults for HSN / GST / packed weight / box size so every
 * seeded product prices shipping and prints a proper tax invoice.
 */
const LOGISTICS: Record<string, { hsn: string; gst: number; grams: number; dims: [number, number, number] }> = {
  "tshirts-polos": { hsn: "6109", gst: 5, grams: 220, dims: [30, 25, 3] },
  "jackets-hoodies": { hsn: "6101", gst: 12, grams: 650, dims: [40, 30, 8] },
  uniforms: { hsn: "6105", gst: 5, grams: 260, dims: [32, 26, 3] },
  "backpacks-haversacks": { hsn: "4202", gst: 18, grams: 900, dims: [48, 32, 18] },
  "laptop-bags": { hsn: "4202", gst: 18, grams: 800, dims: [42, 32, 10] },
  "trolley-suitcases": { hsn: "4202", gst: 18, grams: 2600, dims: [55, 38, 22] },
  "bags-luggage": { hsn: "4202", gst: 18, grams: 700, dims: [45, 30, 20] },
  "earpods-audio": { hsn: "8518", gst: 18, grams: 120, dims: [10, 8, 4] },
  "smart-watches": { hsn: "8517", gst: 18, grams: 140, dims: [12, 10, 7] },
  "power-banks-chargers": { hsn: "8507", gst: 18, grams: 380, dims: [16, 9, 4] },
  "bluetooth-speakers": { hsn: "8518", gst: 18, grams: 900, dims: [22, 12, 12] },
  "electronics-tech": { hsn: "8517", gst: 18, grams: 400, dims: [18, 14, 8] },
  "Bottles & Sippers": { hsn: "9617", gst: 18, grams: 320, dims: [27, 8, 8] },
  "mugs-cups": { hsn: "6912", gst: 12, grams: 400, dims: [12, 12, 11] },
  drinkwares: { hsn: "9617", gst: 18, grams: 350, dims: [26, 9, 9] },
  "notebooks-notepads": { hsn: "4820", gst: 12, grams: 350, dims: [22, 15, 2] },
  "desktop-essentials": { hsn: "8304", gst: 18, grams: 450, dims: [25, 18, 8] },
  "office-stationery": { hsn: "4820", gst: 12, grams: 300, dims: [24, 16, 4] },
  "electric-kettles": { hsn: "8516", gst: 18, grams: 1100, dims: [24, 20, 22] },
  "Cookware & Utensils": { hsn: "7323", gst: 12, grams: 1500, dims: [35, 30, 15] },
  "kitchenware-appliances": { hsn: "8516", gst: 18, grams: 1200, dims: [30, 25, 20] },
  "dry-fruit-packs": { hsn: "0802", gst: 12, grams: 800, dims: [28, 20, 8] },
  "chocolates-dry-fruits": { hsn: "1806", gst: 18, grams: 700, dims: [30, 22, 7] },
  "festive-gift-hampers": { hsn: "1806", gst: 18, grams: 1800, dims: [40, 30, 15] },
  "gourmet-hampers": { hsn: "2106", gst: 18, grams: 1600, dims: [38, 28, 14] },
  "curated-gift-hampers": { hsn: "1806", gst: 18, grams: 1500, dims: [38, 28, 14] },
  "diwali-gift-hampers": { hsn: "1806", gst: 18, grams: 1800, dims: [40, 30, 15] },
  "tech-gift-sets": { hsn: "8507", gst: 18, grams: 750, dims: [28, 22, 8] },
  "combo-gift-sets": { hsn: "4202", gst: 18, grams: 900, dims: [32, 24, 10] },
  "onboarding-joining-kits": { hsn: "4202", gst: 18, grams: 1400, dims: [42, 32, 12] },
  "fitness-wellness": { hsn: "9019", gst: 18, grams: 900, dims: [30, 20, 12] },
  "personal-lifestyle": { hsn: "4202", gst: 18, grams: 600, dims: [30, 22, 10] },
  "work-from-home": { hsn: "8471", gst: 18, grams: 1200, dims: [40, 30, 12] },
  "sustainable-gifts": { hsn: "4602", gst: 12, grams: 700, dims: [30, 22, 10] },
};

function logistics(seed: ProductSeed) {
  const match = seed.categories.map((c) => LOGISTICS[c]).find(Boolean) ?? { hsn: "9505", gst: 18, grams: 500, dims: [25, 20, 10] as [number, number, number] };
  return {
    hsnCode: seed.hsnCode ?? match.hsn,
    gstRate: seed.gstRate ?? match.gst,
    weightGrams: seed.weightGrams ?? match.grams,
    dims: seed.dims ?? match.dims,
  };
}

const APPAREL_SIZES = ["S", "M", "L", "XL", "XXL"];

const P: ProductSeed[] = [
  {
    name: "Adidas Dry-Fit Round Neck T-Shirt",
    slug: "adidas-dryfit-round-neck-t-shirt",
    brand: "Adidas",
    categories: ["apparels-clothing", "tshirts-polos"],
    image: "/images/adidas-dryfit-round-neck-t-shirt.webp",
    introtext:
      "Moisture-wicking dry-fit tee with your logo embroidered on the chest.",
    description:
      "The Adidas Dry-Fit Round Neck T-Shirt is a corporate wardrobe staple. Made with breathable climacool fabric, it keeps teams comfortable through long days while looking sharp.\n\nPersonalise with your company logo via premium embroidery or heat transfer. Available in sizes S–3XL with mixed-size packs.",
    stock: 850,
    flags: ["new", "bestseller"],
    tiers: [
      { minQuantity: 10, price: 749, mrp: 1299 },
      { minQuantity: 50, price: 689, mrp: 1299 },
      { minQuantity: 100, price: 629, mrp: 1299 },
    ],
    specs: [
      { label: "Fabric", value: "100% Polyester Climacool" },
      { label: "Sizes", value: "S, M, L, XL, XXL, 3XL" },
      { label: "Colours", value: "Black, Navy, White, Grey Melange" },
      { label: "Branding", value: "Embroidery / Heat Transfer" },
    ],
    options: [
      { name: "Colour", values: ["Black", "Navy", "White", "Grey Melange"] },
      { name: "Size", values: APPAREL_SIZES },
    ],
    variantOverrides: {
      "White / S": { stock: 0 },
      "Grey Melange / XXL": { isActive: false },
      "Black / XXL": { priceDelta: 30 },
      "Navy / XXL": { priceDelta: 30 },
      "White / XXL": { priceDelta: 30 },
    },
  },
  {
    name: "Puma Cotton Polo T-Shirt",
    slug: "puma-cotton-polo-t-shirt",
    brand: "Puma",
    categories: ["apparels-clothing", "tshirts-polos"],
    image: "/images/puma-cotton-polo-t-shirt.webp",
    introtext:
      "Classic cotton piqué polo with contrast collar — perfect for uniform programs.",
    description:
      "A premium cotton piqué polo from Puma, ideal for staff uniforms, sports events and offsite team kits. The breathable fabric and tailored fit keep it comfortable all day.\n\nAdd your logo with tonal embroidery on the left chest or sleeve.",
    stock: 640,
    flags: ["featured"],
    tiers: [
      { minQuantity: 10, price: 899, mrp: 1499 },
      { minQuantity: 50, price: 829, mrp: 1499 },
      { minQuantity: 150, price: 759, mrp: 1499 },
    ],
    specs: [
      { label: "Fabric", value: "220 GSM Cotton Piqué" },
      { label: "Sizes", value: "S – XXL" },
      { label: "Colours", value: "Navy, Black, White, Maroon" },
      { label: "Branding", value: "Left chest embroidery" },
    ],
    options: [
      { name: "Colour", values: ["Black", "White", "Royal Blue", "Maroon"] },
      { name: "Size", values: APPAREL_SIZES },
    ],
    variantOverrides: {
      "Maroon / S": { stock: 0 },
      "Black / XXL": { priceDelta: 40 },
      "White / XXL": { priceDelta: 40 },
      "Royal Blue / XXL": { priceDelta: 40 },
      "Maroon / XXL": { priceDelta: 40 },
    },
  },
  {
    name: "Amazon Echo Dot (5th Gen)",
    slug: "amazon-echo-dot-5th-gen",
    brand: "Amazon",
    categories: ["electronics-tech", "smart-home-devices"],
    image: "/images/amazon-echo-dot-5.webp",
    introtext:
      "Smart speaker with Alexa — a premium gifting favourite for CXOs.",
    description:
      "The 5th-generation Echo Dot delivers bigger, bolder sound with improved bass. Voice-control music, set reminders, control smart devices and more.\n\nA top-tier gift for senior leadership, milestone celebrations and client gifting.",
    stock: 120,
    flags: ["featured", "bestseller"],
    tiers: [
      { minQuantity: 5, price: 3499, mrp: 4999 },
      { minQuantity: 25, price: 3299, mrp: 4999 },
      { minQuantity: 50, price: 3099, mrp: 4999 },
    ],
    specs: [
      { label: "Colour", value: "Charcoal, Glacier White, Deep Sea Blue" },
      { label: "Connectivity", value: "Bluetooth, Wi-Fi, Alexa App" },
      { label: "Warranty", value: "1 Year Manufacturer" },
    ],
  },
  {
    name: "American Tourister Skyline 55cms Cabin Luggage",
    slug: "american-tourister-skyline-cabin-luggage",
    brand: "American Tourister",
    categories: ["bags-luggage", "trolley-suitcases"],
    image: "/images/american-tourister-skyline.webp",
    introtext:
      "Lightweight cabin trolley with TSA lock — ideal for frequent travellers.",
    description:
      "The Skyline cabin luggage from American Tourister combines durability with style. The lightweight polycarbonate shell, 360° spinner wheels and organised interiors make travel effortless.\n\nA memorable gift for top performers and travelling executives.",
    stock: 85,
    flags: ["bestseller"],
    tiers: [
      { minQuantity: 5, price: 4599, mrp: 6990 },
      { minQuantity: 20, price: 4299, mrp: 6990 },
      { minQuantity: 50, price: 3999, mrp: 6990 },
    ],
    specs: [
      { label: "Size", value: "55 cms Cabin" },
      { label: "Material", value: "Polycarbonate" },
      { label: "Lock", value: "TSA Approved" },
      { label: "Warranty", value: "3 Years Global" },
    ],
  },
  {
    name: "American Tourister TROT02 33L Laptop Backpack",
    slug: "at-trot02-laptop-backpack",
    brand: "American Tourister",
    categories: ["bags-luggage", "laptop-bags", "work-from-home"],
    image: "/images/at-trot02-laptop-backpack.webp",
    introtext: '33L work backpack with padded 15.6" laptop compartment.',
    description:
      "The TROT02 is built for the daily commute — a padded laptop sleeve, organised front pocket and breathable back panel keep everything comfortable and secure.\n\nCompany logo can be screen-printed or embroidered on the front panel.",
    stock: 420,
    flags: ["new"],
    tiers: [
      { minQuantity: 10, price: 1799, mrp: 2790 },
      { minQuantity: 50, price: 1649, mrp: 2790 },
      { minQuantity: 100, price: 1499, mrp: 2790 },
    ],
    specs: [
      { label: "Capacity", value: "33 Litres" },
      { label: "Laptop Fit", value: "Up to 15.6 inches" },
      { label: "Material", value: "Polyester 600D" },
      { label: "Warranty", value: "1 Year" },
    ],
  },
  {
    name: "boAt Airdopes 141 TWS Earbuds",
    slug: "boat-airdopes-141-tws",
    brand: "boAt",
    categories: ["electronics-tech", "earpods-audio"],
    image: "/images/boat-141-tws-airdopes.webp",
    introtext: "42-hour playback TWS buds with low-latency gaming mode.",
    description:
      "boAt Airdopes 141 deliver punchy sound, ENx environmental noise cancellation during calls and up to 42 hours of total playback. IPX4 water resistance makes them gym-ready.\n\nAvailable with custom gift-ready packaging and a branded insert card.",
    stock: 500,
    flags: ["featured", "bestseller"],
    tiers: [
      { minQuantity: 10, price: 1299, mrp: 2990 },
      { minQuantity: 50, price: 1199, mrp: 2990 },
      { minQuantity: 100, price: 1099, mrp: 2990 },
    ],
    specs: [
      { label: "Playback", value: "Up to 42 Hours (with case)" },
      { label: "Water Rating", value: "IPX4" },
      { label: "Colours", value: "Active Black, Cyan Cider" },
      { label: "Warranty", value: "1 Year" },
    ],
  },
  {
    name: "JBL Infinity Tranz700 Wireless Headphone",
    slug: "jbl-infinity-tranz700-headphone",
    brand: "JBL",
    categories: ["electronics-tech", "earpods-audio"],
    image: "/images/infinity-tranz700-headphone.webp",
    introtext: "70-hour battery over-ear headphones with deep bass drivers.",
    description:
      "The Infinity Tranz 700 packs 36mm dynamic drivers, dual-equaliser modes and a marathon 70-hour battery. Plush earcups keep listening comfortable through the longest calls.\n\nA premium tech gift that fits budgets better than flagship models.",
    stock: 150,
    tiers: [
      { minQuantity: 5, price: 2499, mrp: 3999 },
      { minQuantity: 25, price: 2299, mrp: 3999 },
      { minQuantity: 50, price: 2099, mrp: 3999 },
    ],
    specs: [
      { label: "Battery", value: "70 Hours Playback" },
      { label: "Driver", value: "36mm Dynamic" },
      { label: "Charging", value: "USB-C Fast Charge" },
    ],
  },
  {
    name: "Noise ColorFit Smart Watch",
    slug: "noise-colorfit-smart-watch",
    brand: "Noise",
    categories: ["electronics-tech", "smart-watches", "fitness-wellness"],
    image: "/images/noise-smart-watch.webp",
    introtext:
      '1.85" display, BT calling and 60+ sports modes — wellness gift that wow.',
    description:
      "The Noise ColorFit Pro keeps teams connected and healthy: Bluetooth calling, heart-rate and SpO2 tracking, sleep scores and a bright 1.85-inch display.\n\nTop choice for employee wellness programs and step challenges.",
    stock: 210,
    flags: ["new", "featured"],
    tiers: [
      { minQuantity: 10, price: 2799, mrp: 4999 },
      { minQuantity: 50, price: 2599, mrp: 4999 },
      { minQuantity: 100, price: 2399, mrp: 4999 },
    ],
    specs: [
      { label: "Display", value: '1.85" LCD' },
      { label: "Calling", value: "Bluetooth 5.3" },
      { label: "Battery", value: "Up to 7 Days" },
      { label: "Warranty", value: "1 Year" },
    ],
  },
  {
    name: "Portronics Luxcell 10K Power Bank",
    slug: "portronics-luxcell-powerbank",
    brand: "Portronics",
    categories: ["electronics-tech", "power-banks-chargers"],
    image: "/images/portronics-luxcell-powerbank.webp",
    introtext:
      "10000mAh slim power bank with 22.5W fast charging and dual outputs.",
    description:
      "The Luxcell 10K is slim enough for a pocket yet powerful enough for three full phone charges. 22.5W fast charging via USB-C PD gets devices back to 50% in half an hour.\n\nCustom sleeve packaging with your branding available.",
    stock: 480,
    flags: ["bestseller"],
    tiers: [
      { minQuantity: 10, price: 1199, mrp: 1999 },
      { minQuantity: 50, price: 1099, mrp: 1999 },
      { minQuantity: 100, price: 999, mrp: 1999 },
    ],
    specs: [
      { label: "Capacity", value: "10000 mAh" },
      { label: "Output", value: "22.5W (PD + QC)" },
      { label: "Ports", value: "USB-C, USB-A x2" },
    ],
  },
  {
    name: "Borosil Trek Stainless Steel Bottle 950ml",
    slug: "borosil-trek-steel-bottle",
    brand: "Borosil",
    categories: ["drinkwares", "bottles-sippers", "sustainable-gifts"],
    image: "/images/borosil-trek-bottle.webp",
    introtext:
      "Vacuum-insulated steel bottle — 24h cold, 24h hot, 100% leakproof.",
    description:
      "The Borosil Trek keeps drinks cold or hot for a full day in a rugged 304 stainless steel body. The leak-proof cap survives being tossed into any bag.\n\nLaser engraving of your logo creates a premium, permanent finish.",
    stock: 900,
    flags: ["featured", "bestseller"],
    pricingMode: "SINGLE",
    tiers: [{ minQuantity: 1, price: 899, mrp: 1450 }],
    specs: [
      { label: "Capacity", value: "950 ml" },
      { label: "Material", value: "304 Stainless Steel" },
      { label: "Branding", value: "Laser Engraving" },
      { label: "Colours", value: "Steel, Black, Blue" },
    ],
  },
  {
    name: "Ebony SS Vacuum Flask 750ml",
    slug: "ebony-ss-vacuum-flask",
    brand: "Swiss Military",
    categories: ["drinkwares", "bottles-sippers"],
    image: "/images/ebony-ss-water-bottle.webp",
    introtext: "Matte-finish vacuum flask with wide mouth and carry handle.",
    description:
      "A stylish matte vacuum flask that keeps beverages at temperature for 24 hours. The wide mouth fits ice cubes and makes cleaning easy.\n\nPopular for conference kits and hospitality gifting.",
    stock: 320,
    tiers: [
      { minQuantity: 25, price: 999, mrp: 1790 },
      { minQuantity: 100, price: 899, mrp: 1790 },
    ],
    specs: [
      { label: "Capacity", value: "750 ml" },
      { label: "Insulation", value: "Double Wall Vacuum" },
    ],
  },
  {
    name: "Cadbury Celebrations Premium Hamper",
    slug: "cadbury-celebrations-premium-hamper",
    brand: "Cadbury",
    categories: [
      "chocolates-dry-fruits",
      "curated-gift-hampers",
      "diwali-gift-hampers",
    ],
    image: "/images/diwali-gift-hampers.webp",
    introtext:
      "Festive chocolate hamper with branded sleeve — Diwali's safest bet.",
    description:
      "A curated Cadbury Celebrations hamper with assorted chocolates in premium festive packaging. Add a personalised greeting card and branded sleeve at no extra cost.\n\nOrder early for Diwali — slots fill fast!",
    stock: 1200,
    flags: ["bestseller"],
    tiers: [
      { minQuantity: 25, price: 599, mrp: 899 },
      { minQuantity: 100, price: 549, mrp: 899 },
      { minQuantity: 500, price: 499, mrp: 899 },
    ],
    specs: [
      { label: "Contents", value: "Assorted Cadbury chocolates" },
      { label: "Packaging", value: "Festive box with sleeve" },
      { label: "Customisation", value: "Logo sleeve + message card" },
    ],
  },
  {
    name: "Ferrero Rocher Grand Diwali Hamper",
    slug: "ferrero-rocher-grand-diwali-hamper",
    brand: "Ferrero Rocher",
    categories: ["chocolates-dry-fruits", "diwali-gift-hampers"],
    image: "/images/premium-diwali-celestia-gift-hamper-23-2023-08.webp",
    introtext: "Premium Ferrero Rocher collection in an elegant keepsake box.",
    description:
      "Ferrero Rocher's golden pralines arranged in a reusable premium box with dry fruits and a brass diya. Our most-loved executive Diwali gift.\n\nCustom lid branding available on 50+ pieces.",
    stock: 260,
    flags: ["featured"],
    tiers: [
      { minQuantity: 10, price: 2499, mrp: 3499 },
      { minQuantity: 50, price: 2299, mrp: 3499 },
    ],
    specs: [
      { label: "Contents", value: "Ferrero Rocher + Dry Fruits + Diya" },
      { label: "Box", value: "Reusable keepsake" },
    ],
  },
  {
    name: "Diwali Prestige Gift Hamper",
    slug: "diwali-prestige-gift-hamper",
    brand: "Procter Hampers",
    categories: ["diwali-gift-hampers", "curated-gift-hampers"],
    image: "/images/premium-diwali-prestige-gift-hamper-23-2023-08.webp",
    introtext:
      "Hand-curated festive hamper with gourmet treats and brass decor.",
    description:
      "A luxurious hamper combining artisanal sweets, roasted nuts, a brass tealight holder and a hand-written greeting card. Beautifully finished with organza and a branded tag.\n\nVolume discounts available for 100+ units.",
    stock: 180,
    flags: ["new"],
    pricingMode: "ENQUIRY",
    tiers: [],
    specs: [
      { label: "Contents", value: "Sweets, nuts, brass decor" },
      { label: "Lead Time", value: "5-7 working days" },
    ],
  },
  {
    name: "Diwali Serenity Gift Hamper",
    slug: "diwali-serenity-gift-hamper",
    brand: "Procter Hampers",
    categories: ["diwali-gift-hampers"],
    image: "/images/premium-diwali-serenity-gift-hamper-24-2023-08.webp",
    introtext:
      "Calming festive hamper with candles, dry fruits and artisanal tea.",
    description:
      "For teams that appreciate calm: aromatic candles, premium dry fruits and artisanal tea tins in a muted festive box. A sophisticated alternative to sweets.",
    stock: 140,
    tiers: [
      { minQuantity: 10, price: 2199, mrp: 3199 },
      { minQuantity: 50, price: 1999, mrp: 3199 },
    ],
    specs: [{ label: "Contents", value: "Candles, dry fruits, tea tins" }],
  },
  {
    name: "Diwali Trove Gift Hamper",
    slug: "diwali-trove-gift-hamper",
    brand: "Procter Hampers",
    categories: ["diwali-gift-hampers"],
    image: "/images/premium-diwali-trove-gift-hamper-70-2023-08.webp",
    introtext: "A treasure box of festive favourites under ₹2,000.",
    description:
      "The Trove hamper balances budget and impact — festive chocolates, a brass diya and dry fruits in a rigid magnetic box that clients keep on their desks.",
    stock: 220,
    tiers: [
      { minQuantity: 25, price: 1699, mrp: 2499 },
      { minQuantity: 100, price: 1549, mrp: 2499 },
    ],
    specs: [{ label: "Box", value: "Rigid magnetic-close box" }],
  },
  {
    name: "Diwali Heaven Gift Hamper",
    slug: "diwali-heaven-gift-hamper",
    brand: "Procter Hampers",
    categories: ["diwali-gift-hampers"],
    image: "/images/premium-diwali-heaven-gift-hamper-94-2023-09.webp",
    introtext: "Our flagship festive hamper with premium gourmet selection.",
    description:
      "Heaven is our top-of-line festive hamper: imported chocolates, premium mithai assortment, dry fruits and handcrafted decor in a luxury wooden casket.",
    stock: 90,
    flags: ["featured"],
    tiers: [
      { minQuantity: 10, price: 4499, mrp: 6499 },
      { minQuantity: 30, price: 4199, mrp: 6499 },
    ],
    specs: [{ label: "Box", value: "Luxury wooden casket" }],
  },
  {
    name: "Employee Joining Kit — Standard",
    slug: "employee-joining-kit-standard",
    brand: "Procter Hampers",
    categories: [
      "onboarding-joining-kits",
      "combo-gift-sets",
      "corporate-gifting",
    ],
    image: "/images/employee-joining-kits-2.webp",
    introtext:
      "Welcome new joiners with a branded kit: bottle, notebook, pen, ID lanyard.",
    description:
      "Set the tone on day one. This standard joining kit includes a steel bottle, A5 notebook, metal pen and an ID card lanyard — all branded with your logo, packed in a kraft sleeve.\n\nFully customisable; swap items to fit your budget.",
    stock: 750,
    flags: ["bestseller", "featured"],
    tiers: [
      { minQuantity: 25, price: 1099, mrp: 1699 },
      { minQuantity: 100, price: 949, mrp: 1699 },
      { minQuantity: 250, price: 849, mrp: 1699 },
    ],
    specs: [
      { label: "Contents", value: "Bottle, notebook, pen, lanyard" },
      { label: "Packaging", value: "Kraft sleeve + welcome card" },
      { label: "Lead Time", value: "7-10 working days" },
    ],
  },
  {
    name: "4-in-1 Tech Gift Set",
    slug: "4-in-1-tech-gift-set",
    brand: "Procter Hampers",
    categories: ["combo-gift-sets", "tech-gift-sets", "corporate-gifting"],
    image: "/images/4-in-1-gift-set.webp",
    introtext:
      "Wireless mouse, 8-in-1 hub, stylus pen and pouch in one gift box.",
    description:
      "A productivity-focused combo for tech teams: wireless mouse, multi-port USB hub, stylus pen and a travel pouch, presented in a magnetic gift box with foam insert.",
    stock: 300,
    flags: ["new"],
    tiers: [
      { minQuantity: 15, price: 1699, mrp: 2499 },
      { minQuantity: 60, price: 1549, mrp: 2499 },
    ],
    specs: [
      { label: "Contents", value: "Mouse, USB hub, stylus, pouch" },
      { label: "Box", value: "Magnetic gift box" },
    ],
  },
  {
    name: "6-in-1 Premium Gift Set",
    slug: "6-in-1-premium-gift-set",
    brand: "Procter Hampers",
    categories: ["combo-gift-sets", "corporate-gifting"],
    image: "/images/6-in-1-gift-set.webp",
    introtext:
      "Executive combo: flask, planner, pen, powerbank, earbuds case and more.",
    description:
      "Our flagship executive set bundles six premium daily-use items in a luxury rigid box. Ideal for CXO gifting, milestone awards and top-client thank-yous.",
    stock: 130,
    flags: ["featured"],
    tiers: [
      { minQuantity: 10, price: 3499, mrp: 4999 },
      { minQuantity: 40, price: 3249, mrp: 4999 },
    ],
    specs: [{ label: "Box", value: "Luxury rigid box, foam insert" }],
  },
  {
    name: "Eco-Friendly Sustainable Gift Set",
    slug: "eco-friendly-sustainable-gift-set",
    brand: "Procter Hampers",
    categories: ["sustainable-gifts", "combo-gift-sets"],
    image: "/images/eco-friendly-gift-set.webp",
    introtext:
      "Plastic-free gift set: bamboo bottle, jute pouch, seed paper notebook.",
    description:
      "Gift with purpose. This fully plastic-free set includes a bamboo-insulated bottle, a jute accessory pouch and a seed-paper notebook that grows into basil plants.\n\nIncludes an impact card quantifying CO₂ saved.",
    stock: 260,
    flags: ["new"],
    tiers: [
      { minQuantity: 25, price: 1499, mrp: 2199 },
      { minQuantity: 100, price: 1349, mrp: 2199 },
    ],
    specs: [
      {
        label: "Contents",
        value: "Bamboo bottle, jute pouch, seed paper notebook",
      },
      { label: "Packaging", value: "100% plastic-free" },
    ],
  },
  {
    name: "Caresmith Body Massager",
    slug: "caresmith-body-massager",
    brand: "Procter Hampers",
    categories: ["personal-lifestyle", "fitness-wellness"],
    image: "/images/caresmith-body-massager.webp",
    introtext: "Cordless deep-tissue massager for wellness gifting programs.",
    description:
      "The Caresmith percussion massager relieves muscle tension with 5 speed levels and 4 attachment heads. USB-C charging and 6-hour battery life.\n\nA thoughtful addition to employee wellness hampers.",
    stock: 95,
    tiers: [
      { minQuantity: 10, price: 2499, mrp: 3999 },
      { minQuantity: 40, price: 2299, mrp: 3999 },
    ],
    specs: [
      { label: "Speeds", value: "5 Levels" },
      { label: "Battery", value: "6 Hours / USB-C" },
    ],
  },
  {
    name: "Leatherite Duffle Bag 45L",
    slug: "leatherite-duffle-bag",
    brand: "VIP",
    categories: ["bags-luggage"],
    image: "/images/leatherite-duffle-bag.webp",
    introtext: "Premium vegan-leather duffle for weekend and gym trips.",
    description:
      "A polished 45L duffle in vegan leather with a detachable shoulder strap, shoe compartment and metal feet. Deboss your logo for a subtle executive finish.",
    stock: 110,
    tiers: [
      { minQuantity: 10, price: 2199, mrp: 3499 },
      { minQuantity: 40, price: 1999, mrp: 3499 },
    ],
    specs: [
      { label: "Capacity", value: "45 Litres" },
      { label: "Branding", value: "Deboss / Metal plate" },
    ],
  },
  {
    name: "Canvas Everyday Backpack",
    slug: "canvas-everyday-backpack",
    brand: "Wildcraft",
    categories: ["bags-luggage", "backpacks-haversacks"],
    image: "/images/canvas-backpack.webp",
    introtext: "Rugged 30L canvas backpack with laptop sleeve and rain cover.",
    description:
      'The Wildcraft canvas backpack blends retro styling with modern utility — padded 15" laptop sleeve, water-resistant canvas and an included rain cover.\n\nScreen print or embroidered branding on the front flap.',
    stock: 240,
    tiers: [
      { minQuantity: 25, price: 1599, mrp: 2395 },
      { minQuantity: 100, price: 1449, mrp: 2395 },
    ],
    specs: [
      { label: "Capacity", value: "30 Litres" },
      { label: "Extras", value: "Rain cover included" },
    ],
  },
  {
    name: "Gourmet Dry Fruit Box (Premium)",
    slug: "gourmet-dry-fruit-box-premium",
    brand: "Ferrero Rocher",
    categories: [
      "chocolates-dry-fruits",
      "dry-fruit-packs",
      "curated-gift-hampers",
    ],
    image: "/images/gourmet-gifting-ideas.webp",
    introtext:
      "Four-compartment premium dry fruit box with almonds, cashews, raisins, pistachios.",
    description:
      "Hand-sorted premium dry fruits in a four-compartment rigid box with a clear lid and branded sleeve. A classy, shelf-stable festive gift for vendors and clients.",
    stock: 380,
    flags: ["bestseller"],
    tiers: [
      { minQuantity: 25, price: 1199, mrp: 1799 },
      { minQuantity: 100, price: 1099, mrp: 1799 },
      { minQuantity: 300, price: 999, mrp: 1799 },
    ],
    specs: [
      { label: "Contents", value: "Almonds, cashews, raisins, pistachios" },
      { label: "Net Weight", value: "500 g" },
    ],
  },
  {
    name: "Gifts Under ₹1000 — Corporate Combo",
    slug: "gifts-under-1000-corporate-combo",
    brand: "Procter Hampers",
    categories: ["corporate-gifting", "combo-gift-sets"],
    image: "/images/gifts-under-1000-2.webp",
    introtext: "Budget-friendly branded combo for large teams.",
    description:
      "Volume gifting on a budget: branded mug, coaster set and gourmet cookies in a printed box — a crowd-pleaser for 100+ team events.",
    stock: 600,
    tiers: [
      { minQuantity: 50, price: 749, mrp: 999 },
      { minQuantity: 200, price: 679, mrp: 999 },
    ],
    specs: [{ label: "Contents", value: "Mug, coasters, cookies" }],
  },
  {
    name: "Gifts Under ₹2000 — Executive Combo",
    slug: "gifts-under-2000-executive-combo",
    brand: "Procter Hampers",
    categories: ["corporate-gifting", "combo-gift-sets"],
    image: "/images/gifts-under-2000.webp",
    introtext: "Step-up combo with power bank and steel bottle.",
    description:
      "The ₹2000 band unlocks premium tech: a 10000mAh power bank and vacuum steel bottle with laser engraving, boxed with a thank-you card.",
    stock: 340,
    tiers: [
      { minQuantity: 25, price: 1699, mrp: 2299 },
      { minQuantity: 100, price: 1549, mrp: 2299 },
    ],
    specs: [{ label: "Contents", value: "Power bank, steel bottle" }],
  },
  {
    name: "Popular Corporate Gifts Assortment",
    slug: "popular-corporate-gifts-assortment",
    brand: "Procter Hampers",
    categories: ["corporate-gifting", "curated-gift-hampers"],
    image: "/images/popular-corporate-gifts.webp",
    introtext: "Our best-sellers curated into one flexible assortment.",
    description:
      "Not sure what to pick? This assortment bundles our top-rated items across categories at a bundled price — swap any item before checkout.",
    stock: 200,
    flags: ["featured"],
    tiers: [
      { minQuantity: 25, price: 1899, mrp: 2799 },
      { minQuantity: 100, price: 1729, mrp: 2799 },
    ],
    specs: [{ label: "Customisation", value: "Item swaps allowed" }],
  },
  {
    name: "Sustainable Corporate Gift Box",
    slug: "sustainable-corporate-gift-box",
    brand: "Procter Hampers",
    categories: ["sustainable-gifts", "curated-gift-hampers"],
    image: "/images/sustainable-corporate-gifts.webp",
    introtext:
      "ESG-friendly gift box with recycled, reusable and plantable items.",
    description:
      "Designed for ESG-conscious companies: cork notebook, bamboo cutlery set, organic tea and plantable seed pencils — packed in recycled cardboard with soy ink printing.",
    stock: 175,
    flags: ["new"],
    tiers: [
      { minQuantity: 25, price: 1299, mrp: 1899 },
      { minQuantity: 100, price: 1179, mrp: 1899 },
    ],
    specs: [
      {
        label: "Contents",
        value: "Cork notebook, bamboo cutlery, tea, seed pencils",
      },
      { label: "Packaging", value: "Recycled, soy ink" },
    ],
  },
  {
    name: "Diwali Gifting Ideas Hamper — Starter",
    slug: "diwali-gifting-ideas-hamper-starter",
    brand: "Cadbury",
    categories: ["diwali-gift-hampers", "festive-gift-hampers"],
    image: "/images/diwali-gifting-ideas.webp",
    introtext:
      "Entry-level festive hamper for large-distribution Diwali gifting.",
    description:
      "Designed for 500+ unit distributions: chocolates, a diya and a message card in a compact festive box that ships flat and assembles in seconds.",
    stock: 1500,
    tiers: [
      { minQuantity: 100, price: 399, mrp: 599 },
      { minQuantity: 500, price: 359, mrp: 599 },
    ],
    specs: [{ label: "MOQ", value: "100 units" }],
  },
  {
    name: "Gift Hamper by Procter — Signature",
    slug: "gift-hamper-by-procter-signature",
    brand: "Procter Hampers",
    categories: ["curated-gift-hampers", "gourmet-hampers"],
    image: "/images/gift-hamper-by-procter.webp",
    introtext: "Signature gourmet hamper with premium snacks and beverages.",
    description:
      "The Procter signature hamper layers gourmet snacks, premium beverages and a scented candle in a woven keepsake basket. Our most gifted item for client visits.",
    stock: 160,
    flags: ["bestseller"],
    tiers: [
      { minQuantity: 15, price: 2599, mrp: 3599 },
      { minQuantity: 60, price: 2399, mrp: 3599 },
    ],
    specs: [{ label: "Basket", value: "Woven keepsake basket" }],
  },
  {
    name: "Drinkware Gift Set — Trio",
    slug: "drinkware-gift-set-trio",
    brand: "Borosil",
    categories: ["drinkwares", "combo-gift-sets", "work-from-home"],
    image: "/images/drinkwares.webp",
    introtext:
      "Bottle, tumbler and coaster trio for desk-to-commute hydration.",
    description:
      "A matched drinkware trio — vacuum bottle, ceramic-coated tumbler and a silicone coaster — in matte corporate colours with consistent logo placement.",
    stock: 280,
    tiers: [
      { minQuantity: 25, price: 1499, mrp: 2199 },
      { minQuantity: 100, price: 1349, mrp: 2199 },
    ],
    specs: [{ label: "Contents", value: "Bottle, tumbler, coaster" }],
  },
  {
    name: "Work From Home Comfort Kit",
    slug: "work-from-home-comfort-kit",
    brand: "Procter Hampers",
    categories: ["work-from-home", "combo-gift-sets"],
    image: "/images/product/themes/work-from-home-83-2024-09.webp",
    introtext:
      "WFH kit with laptop stand, notepad, coffee mug and stress ball.",
    description:
      "Make remote work comfortable: an adjustable laptop stand, A5 notepad, ceramic mug and a stress ball — branded and shipped direct-to-home across India.",
    stock: 230,
    flags: ["new"],
    tiers: [
      { minQuantity: 25, price: 1299, mrp: 1899 },
      { minQuantity: 100, price: 1179, mrp: 1899 },
    ],
    specs: [
      { label: "Contents", value: "Laptop stand, notepad, mug, stress ball" },
      { label: "Fulfilment", value: "Direct-to-home pan-India" },
    ],
  },
  {
    name: "Tech Gadgets Gift Set",
    slug: "tech-gadgets-gift-set",
    brand: "Portronics",
    categories: ["electronics-tech", "tech-gift-sets", "combo-gift-sets"],
    image: "/images/product/category/tech-gift-set-25-2024-04.webp",
    introtext: "Combo of power bank, wireless mouse and earbuds.",
    description:
      "A trio of everyday tech essentials bundled in one box — great for IT teams and tech-enabled field forces.",
    stock: 190,
    tiers: [
      { minQuantity: 15, price: 2199, mrp: 3199 },
      { minQuantity: 60, price: 1999, mrp: 3199 },
    ],
    specs: [{ label: "Contents", value: "Power bank, mouse, earbuds" }],
  },
  {
    name: "Executive Notebook & Pen Set",
    slug: "executive-notebook-pen-set",
    brand: "Cross",
    categories: ["office-stationery", "notebooks-notepads"],
    image: "/images/product/category/notebook-notepad-71-2024-04.webp",
    introtext: "A5 bonded-leather notebook with matching metal pen.",
    description:
      "A timeless executive pair: A5 notebook with 192 pages of bleed-proof paper and a weighted metal pen, both customisable with names and logos.",
    stock: 520,
    flags: ["bestseller"],
    tiers: [
      { minQuantity: 25, price: 899, mrp: 1399 },
      { minQuantity: 100, price: 799, mrp: 1399 },
    ],
    specs: [
      { label: "Pages", value: "192, bleed-proof 80gsm" },
      { label: "Branding", value: "Deboss + foil / laser on pen" },
    ],
  },
  {
    name: "Desktop Essentials Kit",
    slug: "desktop-essentials-kit",
    brand: "Procter Hampers",
    categories: ["office-stationery", "desktop-essentials"],
    image: "/images/product/category/desktop-items-80-2024-04.webp",
    introtext: "Desk organiser, wireless charger pad and sticky note set.",
    description:
      "Declutter in style: a bamboo desk organiser, a 15W wireless charging pad and a sticky-note set, branded with your logo.",
    stock: 210,
    tiers: [
      { minQuantity: 25, price: 1399, mrp: 1999 },
      { minQuantity: 100, price: 1279, mrp: 1999 },
    ],
    specs: [{ label: "Contents", value: "Organiser, charger, sticky notes" }],
  },
  {
    name: "Electric Kettle 1.5L — Stainless",
    slug: "electric-kettle-1-5l-stainless",
    brand: "Borosil",
    categories: ["kitchenware-appliances", "electric-kettles"],
    image: "/images/product/category/electric-kettle-73-2024-04.webp",
    introtext:
      "Fast-boil stainless kettle with auto cut-off for office pantries.",
    description:
      "A 1.5L stainless steel kettle that boils in under 6 minutes with dry-boil protection. Ideal for office pantry and new-home gifts.",
    stock: 160,
    tiers: [
      { minQuantity: 10, price: 1099, mrp: 1695 },
      { minQuantity: 50, price: 999, mrp: 1695 },
    ],
    specs: [
      { label: "Capacity", value: "1.5 Litres" },
      { label: "Warranty", value: "2 Years" },
    ],
  },
  {
    name: "Fitness Tracker Band",
    slug: "fitness-tracker-band",
    brand: "Noise",
    categories: ["personal-lifestyle", "fitness-wellness"],
    image: "/images/product/category/fitness-tracker-band-23-2024-04.webp",
    introtext: "Slim band with heart-rate, SpO2 and 14-day battery.",
    description:
      "A lightweight fitness band that tracks steps, heart rate and sleep for 14 days on a single charge. The perfect starter device for wellness challenges.",
    stock: 400,
    tiers: [
      { minQuantity: 25, price: 1299, mrp: 2499 },
      { minQuantity: 100, price: 1149, mrp: 2499 },
    ],
    specs: [{ label: "Battery", value: "14 Days" }],
  },
  {
    name: "Bluetooth Party Speaker 20W",
    slug: "bluetooth-party-speaker-20w",
    brand: "boAt",
    categories: ["electronics-tech", "bluetooth-speakers"],
    image: "/images/product/category/bluetooth-speakers-31-2024-04.webp",
    introtext: "20W TWS party speaker with RGB lights and IPX6.",
    description:
      "Bring energy to team offsites — 20W stereo output, RGB light sync and IPX6 splash resistance with 8-hour playback.",
    stock: 130,
    tiers: [
      { minQuantity: 10, price: 1899, mrp: 2990 },
      { minQuantity: 40, price: 1749, mrp: 2990 },
    ],
    specs: [{ label: "Output", value: "20W RMS" }],
  },
  {
    name: "Collar Neck Polo — Corporate Uniform",
    slug: "collar-neck-polo-corporate-uniform",
    brand: "Marks & Spencer",
    categories: ["apparels-clothing", "uniforms"],
    image: "/images/product/category/collar-neck-t-shirt-06-2024-04.webp",
    introtext: "Tailored polo in 8 corporate colours, sizes S–5XL.",
    description:
      "A retail-quality polo with a tailored collar and side vents, available in extended sizes and eight corporate colourways. Bulk pricing from 25 pieces.",
    stock: 700,
    tiers: [
      { minQuantity: 25, price: 799, mrp: 1199 },
      { minQuantity: 100, price: 719, mrp: 1199 },
    ],
    specs: [{ label: "Sizes", value: "S – 5XL" }],
    options: [
      { name: "Colour", values: ["Navy", "Black", "Sky Blue"] },
      { name: "Size", values: APPAREL_SIZES },
    ],
  },
  {
    name: "Jacket & Hoodie Combo",
    slug: "jacket-hoodie-combo",
    brand: "Jack & Jones",
    categories: ["apparels-clothing", "jackets-hoodies"],
    image: "/images/product/category/jacket-hoodie-29-2024-04.webp",
    introtext: "Winter combo of fleece hoodie and quilted jacket.",
    description:
      "Beat the Delhi winter with a coordinated hoodie + quilted jacket combo, both embroidery-ready. Corporate pricing on 50+ sets.",
    stock: 180,
    tiers: [
      { minQuantity: 25, price: 2799, mrp: 4198 },
      { minQuantity: 100, price: 2599, mrp: 4198 },
    ],
    specs: [{ label: "Colours", value: "Black, Navy, Olive" }],
    options: [
      { name: "Colour", values: ["Black", "Navy", "Olive"] },
      { name: "Size", values: ["S", "M", "L", "XL", "XXL"] },
    ],
    variantOverrides: {
      "Black / XXL": { priceDelta: 60 },
      "Navy / XXL": { priceDelta: 60 },
      "Olive / XXL": { priceDelta: 60 },
    },
  },
  {
    name: "Smart Home Starter Kit",
    slug: "smart-home-starter-kit",
    brand: "Google",
    categories: ["electronics-tech", "smart-home-devices"],
    image: "/images/product/category/smart-home-devices-54-2024-04.webp",
    introtext: "Smart bulb + plug combo controllable from any phone.",
    description:
      "A plug-and-play smart home duo: a 9W colour bulb and a 16A smart plug that work with Google Assistant and Alexa. Premium gifting at a smart price.",
    stock: 120,
    tiers: [
      { minQuantity: 10, price: 1799, mrp: 2798 },
      { minQuantity: 40, price: 1649, mrp: 2798 },
    ],
    specs: [{ label: "Works with", value: "Google Home, Alexa" }],
  },
  {
    name: "Accessories Gift Set — Traveller",
    slug: "accessories-gift-set-traveller",
    brand: "Safari",
    categories: ["bags-luggage", "laptop-bags", "combo-gift-sets"],
    image: "/images/product/category/accessories-gift-set-89-2024-04.webp",
    introtext: "Laptop sleeve, cable organiser, passport wallet combo.",
    description:
      "For teams that travel: a padded laptop sleeve, a cable organiser roll and a passport wallet in matched PU leather with tonal logo embossing.",
    stock: 150,
    tiers: [
      { minQuantity: 25, price: 1399, mrp: 2099 },
      { minQuantity: 100, price: 1279, mrp: 2099 },
    ],
    specs: [{ label: "Branding", value: "Tonal emboss" }],
  },
];

const BLOGS = [
  {
    title: "10 Sustainable Corporate Gift Ideas Your Team Will Love",
    slug: "sustainable-corporate-gift-ideas",
    image: "/images/blog-banner-sustainable.webp",
    excerpt:
      "ESG-friendly gifting is no longer a niche. Here are ten sustainable corporate gift ideas that are premium, practical and planet-positive.",
    content:
      "Sustainability has moved from a buzzword to a boardroom mandate. When your gift is plastic-free, reusable or plantable, it tells employees and clients that your values are real.\n\nStart with materials. Bamboo, cork, recycled cardboard and jute look premium and age beautifully. A bamboo bottle or cork notebook communicates thoughtfulness far better than another plastic power bank.\n\nThink lifecycle. The best gifts get used daily and eventually composted or replanted. Seed-paper notebooks that grow into basil plants are our most-repeated gift for a reason — they keep giving months after the hamper is opened.\n\nPackaging is half the battle. Ask your gifting partner for recycled cardboard with soy-based inks and skip the plastic lamination. At KCS G-Mart, our sustainable range ships 100% plastic-free by default.\n\nMeasure the impact. Include an impact card in each box quantifying CO₂ saved versus conventional alternatives. It turns a nice gesture into a story your comms team can share.\n\nFinally, buy local. Made-in-India sustainable products cut transport emissions and support artisan livelihoods — a narrative that lands well with both employees and customers.",
  },
  {
    title: "The Ultimate Guide to Employee Onboarding Kits",
    slug: "employee-onboarding-kits-guide",
    image: "/images/blog-banner-swag-items.webp",
    excerpt:
      "A great joining kit turns day-one nerves into day-one pride. Here's how to build onboarding kits that new hires actually photograph and post.",
    content:
      "First impressions are formed in the first ten minutes. A well-designed joining kit waiting on the desk tells a new hire: we prepared for you.\n\nAnchor the kit around your brand colours, not your logo count. One tastefully embroidered item beats five screen-printed ones. A steel bottle with laser engraving will outlive the cardboard box it came in.\n\nBalance utility and delight. The core should be daily-use items — bottle, notebook, pen, lanyard — and one delightful wildcard like a snack pack or desk plant.\n\nPersonalise where it counts. A welcome card with the joiner's name and a handwritten note from their manager outperforms any premium swag item in our surveys.\n\nPlan your logistics early. For bulk hiring waves, direct-to-home shipping keeps HR teams sane. We fulfil kits to 19,000+ pin codes with individual tracking.\n\nBudget smartly: the ₹800–₹1,200 band hits the sweet spot of perceived value and per-head cost for most Indian tech firms.",
  },
  {
    title: "Top Corporate Gift Trends for 2026",
    slug: "top-corporate-gift-trends-2026",
    image: "/images/blog-banner-top-products.webp",
    excerpt:
      "From AI-powered gadgets to experience vouchers — the corporate gifting landscape is evolving fast. These are the trends shaping 2026.",
    content:
      "Every year the gifting bar rises. Based on thousands of orders across India, here is what we see defining 2026.\n\nWellness wins. Massagers, fitness bands and mindfulness kits are outselling mugs two-to-one as companies invest in employee wellbeing.\n\nTech gets smarter and smaller. TWS earbuds have become the new mug — expected, appreciated and now affordable at bulk tiers. Smart watches lead premium budgets.\n\nPersonalisation at scale is table stakes. Laser engraving, name-embroidery and custom sleeves are now cost-effective even at 50-unit volumes.\n\nSustainable is standard. Procurement teams increasingly require plastic-free packaging and recycled materials in their RFQs.\n\nExperience add-ons grow. Gift boxes paired with workshop vouchers or donation-to-charity cards create layered, memorable gifting moments.\n\nThe meta-trend? Thoughtfulness per rupee. Companies are buying fewer, better things — and partners who can brand, pack and ship them reliably are winning the year.",
  },
  {
    title: "How to Plan Diwali Corporate Gifting Without the Last-Minute Panic",
    slug: "plan-diwali-corporate-gifting",
    image: "/images/diwali-gift-hampers.webp",
    excerpt:
      "Diwali gifting season rewards the early. A step-by-step timeline to plan festive hampers for 10 or 10,000 recipients.",
    content:
      "Every October we hear the same story: procurement realised too late that Diwali hampers need three weeks. Here's the timeline that avoids the panic.\n\nSix weeks out: freeze your budget bands and recipient lists. Segmentation matters — CXO hampers, employee hampers and vendor hampers should differ in value.\n\nFive weeks out: finalise the hamper design and place your order. Popular items sell out, and custom sleeves need print lead time.\n\nFour weeks out: approve samples. Check branding quality, packaging strength and — importantly — taste the food items.\n\nTwo weeks out: lock addresses and delivery slots. For remote employees, direct-to-home shipping with individual tracking removes HR's biggest headache.\n\nOne week out: keep a 5% buffer stock for the inevitable last-minute additions.\n\nThe teams that follow this timeline don't just avoid stress — they get better pricing, first pick of premium stock and their choice of delivery dates.",
  },
  {
    title: "Branded Merchandise: What Actually Gets Used?",
    slug: "branded-merchandise-what-gets-used",
    image: "/images/popular-corporate-gifts.webp",
    excerpt:
      "We analysed re-order patterns across thousands of corporate orders. These are the branded items that earn permanent desk space.",
    content:
      "Branded merchandise only works if it survives the first week. After analysing repeat orders across our catalogue, clear winners emerge.\n\nDrinkware dominates. Vacuum bottles are the single most reordered corporate item in India — used 4+ times daily and carried to meetings, gyms and airports.\n\nBags carry your brand furthest. Laptop backpacks log hundreds of commutes, turning every journey into an impression.\n\nDesk items earn tenure. Notebooks and desk organisers stay within arm's reach for a full work year.\n\nApparel needs quality gates. A scratchy t-shirt goes to the back of the wardrobe; a retail-grade polo becomes weekend wear with your logo on it.\n\nTech is the fastest-growing category, but pick devices people already want — a good rule of thumb is 'would I buy this myself at this price?'\n\nThe pattern is simple: utility drives longevity, and longevity drives brand recall. Choose items that earn their place in daily life.",
  },
  {
    title: "Client Gifting Etiquette: A Practical Guide for Indian Businesses",
    slug: "client-gifting-etiquette-guide",
    image: "/images/gift-hamper-by-procter.webp",
    excerpt:
      "Gifting clients is a minefield of budgets, policies and cultural nuance. A practical playbook for getting it right every time.",
    content:
      "Client gifting in India sits at the intersection of relationship-building and compliance. Done right, it deepens partnerships; done wrong, it creates awkwardness.\n\nRespect gifting policies. Many corporates cap gift values (often ₹500–₹2,000) for compliance. When in doubt, ask — it shows professionalism, not ignorance.\n\nMatch the milestone. A ₹500 hamper for a ₹50 lakh contract renewal feels thin; the same hamper as a Diwali gesture feels generous. Context sets the value.\n\nFestive beats arbitrary. Diwali, New Year and company anniversaries give your gift a reason. Unsolicited gifts can feel transactional.\n\nPersonalise the card, not the gift. A handwritten note referencing the partnership's specific wins outperforms premium upgrades.\n\nAvoid alcohol and overly personal items unless you know the client well. Gourmet dry fruits, premium pens and quality drinkware are universally safe.\n\nFinally, deliver to the office with discretion — and never make the client carry it home from a meeting you invited them to.",
  },
];

async function main() {
  console.log(
    `🌱 Seeding KCS G-Mart… (${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`,
  );

  // Fail fast with a readable message if the database is unreachable or the
  // credentials in DATABASE_URL are wrong — otherwise Prisma only surfaces
  // this as an opaque P2028 transaction timeout on the first query.
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("❌ Could not connect to the database.");
    console.error(
      `   Tried: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
    );
    console.error(
      "   Check DATABASE_URL in .env, and that MySQL/MariaDB is running",
    );
    console.error("   with that user allowed to access the database.");
    throw error;
  }

  // Wipe (dev convenience)
  await prisma.$transaction(
    [
      prisma.orderItem.deleteMany(),
      prisma.order.deleteMany(),
      prisma.review.deleteMany(),
      prisma.variantPrice.deleteMany(),
      prisma.productVariant.deleteMany(),
      prisma.productOption.deleteMany(),
      prisma.shippingRate.deleteMany(),
      prisma.shippingZone.deleteMany(),
      prisma.storeSetting.deleteMany(),
      prisma.productCategory.deleteMany(),
      prisma.productSpec.deleteMany(),
      prisma.productPrice.deleteMany(),
      prisma.productImage.deleteMany(),
      prisma.product.deleteMany(),
      prisma.category.deleteMany(),
      prisma.brand.deleteMany(),
      prisma.blogPost.deleteMany(),
      prisma.bulkEnquiry.deleteMany(),
      prisma.meetingBooking.deleteMany(),
      prisma.contactMessage.deleteMany(),
      prisma.newsletterSubscriber.deleteMany(),
      prisma.user.deleteMany(),
    ],
    // Generous budget for slow local machines / cold connections (Prisma
    // defaults to 5s, which can expire before the pool ever connects).
    { timeout: 30_000, maxWait: 15_000 },
  );

  // Users
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@kcsgmart.in";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";
  const admin = await prisma.user.create({
    data: {
      firstName: process.env.SEED_ADMIN_NAME ?? "KCS",
      lastName: "Admin",
      email: adminEmail.toLowerCase(),
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
      emailVerifiedAt: new Date(),
      phone: "9876543210",
    },
  });

  const demo = await prisma.user.create({
    data: {
      firstName: "Demo",
      lastName: "Customer",
      email: "demo@kcsgmart.in",
      passwordHash: await bcrypt.hash("Demo@12345", 10),
      role: "CUSTOMER",
      emailVerifiedAt: new Date(),
      phone: "9812345678",
      companyName: "Acme Technologies Pvt. Ltd.",
      gstNo: "07ABCDE1234F1Z5",
      billingAddress: "4th Floor, Cyber Tower, Sector 62",
      billingCity: "Noida",
      billingState: "Uttar Pradesh",
      billingPincode: "201309",
      shippingAddress: "4th Floor, Cyber Tower, Sector 62",
      shippingCity: "Noida",
      shippingState: "Uttar Pradesh",
      shippingPincode: "201309",
    },
  });

  const riya = await prisma.user.create({
    data: {
      firstName: "Riya",
      lastName: "Malhotra",
      email: "riya@brightlabs.in",
      passwordHash: await bcrypt.hash("Riya@12345", 10),
      role: "CUSTOMER",
      emailVerifiedAt: new Date(),
      phone: "9898989898",
      companyName: "Bright Labs",
    },
  });

  // Categories (parents then children)
  const categoryIds = new Map<string, number>();
  for (const cat of CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        title: cat.title,
        slug: cat.slug,
        image: cat.image,
        isSpecial: cat.isSpecial ?? false,
        sortOrder: cat.sortOrder ?? 0,
      },
    });
    categoryIds.set(cat.slug, created.id);

    for (const [index, child] of (cat.children ?? []).entries()) {
      const createdChild = await prisma.category.create({
        data: {
          title: child.title,
          slug: child.slug,
          image: child.image,
          parentId: created.id,
          sortOrder: index + 1,
        },
      });
      categoryIds.set(child.slug, createdChild.id);
    }
  }
  console.log(`  ✓ ${categoryIds.size} categories`);

  // Brands
  const brandIds = new Map<string, number>();
  for (const [index, brand] of BRANDS.entries()) {
    const created = await prisma.brand.create({
      data: { ...brand, sortOrder: index + 1 },
    });
    brandIds.set(brand.name, created.id);
  }
  console.log(`  ✓ ${brandIds.size} brands`);

  // Store settings + shipping zones (rate card)
  await prisma.storeSetting.create({
    data: {
      id: 1,
      freeShippingThreshold: 1000,
      volumetricDivisor: 5000,
      sellerName: "KCS G-Mart",
      sellerGstin: "07AAACK1234A1Z5",
      sellerPan: "AAACK1234A",
      sellerAddress: "Plot 12, Okhla Industrial Area Phase II, New Delhi 110020",
      sellerStateCode: "07",
      sellerEmail: "accounts@kcsgmart.in",
      sellerPhone: "+91 98110 00000",
      invoicePrefix: "KCS/INV",
      invoiceCounter: 0,
      extraPer500g: Object.fromEntries(DEFAULT_ZONES.map((z) => [z.code, z.extraPer500g])),
    },
  });
  for (const [i, zone] of DEFAULT_ZONES.entries()) {
    await prisma.shippingZone.create({
      data: {
        code: zone.code,
        name: zone.name,
        states: zone.states,
        etaDays: zone.etaDays,
        sortOrder: i,
        rates: { create: zone.rates.map((r) => ({ uptoGrams: r.uptoGrams, price: r.price })) },
      },
    });
  }
  const shippingConfig: ShippingConfig = { zones: DEFAULT_ZONES, freeShippingThreshold: 1000, volumetricDivisor: 5000 };
  console.log(`  ✓ store settings + ${DEFAULT_ZONES.length} shipping zones`);

  // Products
  const productIds: string[] = [];
  /** productIndex → variants (for demo orders). */
  const productVariants = new Map<number, { id: string; label: string; sku: string; price: number; weightGrams: number }[]>();
  let variantTotal = 0;
  for (const [index, seed] of P.entries()) {
    const sortedTiers = seed.tiers.slice().sort((a, b) => a.minQuantity - b.minQuantity);
    const lg = logistics(seed);
    const hasVariants = !!seed.options?.length && (seed.pricingMode ?? "BULK") !== "ENQUIRY";
    const combos = hasVariants ? combinations(seed.options!) : [];
    const skuBase = `KCS-${String(1000 + index)}`;
    const variantRows = combos.map((attrs, vi) => {
      const label = variantLabel(attrs, seed.options);
      const override = seed.variantOverrides?.[label] ?? {};
      const delta = override.priceDelta ?? 0;
      const prices = sortedTiers.map((t) => ({ minQuantity: t.minQuantity, price: t.price + delta, mrp: t.mrp + delta }));
      const stock = override.stock ?? Math.max(20, Math.round(seed.stock / Math.max(1, combos.length)) + ((vi * 37) % 60));
      const sku =
        override.sku ??
        `${skuBase}-${Object.values(attrs)
          .map((v) => v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 4))
          .join("-")}`;
      return {
        attributes: attrs,
        label,
        sku,
        image: override.image ?? null,
        stock,
        isActive: override.isActive ?? true,
        sortOrder: vi,
        basePrice: prices[0]?.price ?? 0,
        baseMrp: prices[0]?.mrp ?? 0,
        // XXL pieces are a touch heavier — demonstrates per-variant weight.
        weightGrams: attrs.Size === "XXL" ? Math.round(lg.weightGrams * 1.15) : null,
        prices,
      };
    });
    const created = await prisma.product.create({
      data: {
        name: seed.name,
        slug: seed.slug,
        sku: skuBase,
        brandId: brandIds.get(seed.brand) ?? null,
        introtext: seed.introtext,
        description: seed.description,
        image: seed.image,
        delivery:
          "Dispatch in 3–5 working days. Pan-India delivery. Shipping calculated by zone and weight at checkout.",
        stock: hasVariants ? variantRows.filter((v) => v.isActive).reduce((sum, v) => sum + v.stock, 0) : seed.stock,
        pricingMode: seed.pricingMode ?? "BULK",
        basePrice: sortedTiers[0]?.price ?? 0,
        baseMrp: sortedTiers[0]?.mrp ?? 0,
        hsnCode: lg.hsnCode,
        gstRate: lg.gstRate,
        weightGrams: lg.weightGrams,
        lengthCm: lg.dims[0],
        widthCm: lg.dims[1],
        heightCm: lg.dims[2],
        hasVariants,
        isActive: true,
        isNew: seed.flags?.includes("new") ?? false,
        isFeatured: seed.flags?.includes("featured") ?? false,
        isBestSeller: seed.flags?.includes("bestseller") ?? false,
        prices: { create: seed.tiers },
        specs: { create: seed.specs },
        categories: {
          create: seed.categories
            .map((slug) => categoryIds.get(slug))
            .filter((id): id is number => id !== undefined)
            .map((categoryId) => ({ categoryId })),
        },
        options: hasVariants
          ? { create: seed.options!.map((o, oi) => ({ name: o.name, values: o.values, sortOrder: oi })) }
          : undefined,
        variants: hasVariants
          ? {
              create: variantRows.map(({ prices, ...v }) => ({
                ...v,
                prices: { create: prices },
              })),
            }
          : undefined,
      },
      include: { variants: { select: { id: true, label: true, sku: true, basePrice: true, weightGrams: true } } },
    });
    productIds.push(created.id);
    if (created.variants.length) {
      variantTotal += created.variants.length;
      productVariants.set(
        index,
        created.variants.map((v) => ({
          id: v.id,
          label: v.label,
          sku: v.sku ?? "",
          price: Number(v.basePrice),
          weightGrams: v.weightGrams ?? lg.weightGrams,
        })),
      );
    }
  }
  console.log(`  ✓ ${productIds.length} products (${variantTotal} variants)`);

  // Reviews on a few products
  const reviewData = [
    {
      productIndex: 0,
      name: "Ananya Verma",
      rating: 5,
      title: "Great quality tees",
      comment:
        "Ordered 200 for our offsite — fabric quality is genuinely retail-grade. Logo embroidery was crisp.",
    },
    {
      productIndex: 0,
      name: "Rahul Khanna",
      rating: 4,
      title: "Good, size chart runs slightly small",
      comment:
        "Colour matched our brand palette perfectly. Consider ordering one size up for broader builds.",
    },
    {
      productIndex: 5,
      name: "Sneha Iyer",
      rating: 5,
      title: "Everyone loved them",
      comment:
        "The boAt earbuds were a hit in our wellness hampers. Packaging with the branded insert looked premium.",
    },
    {
      productIndex: 8,
      name: "Vikram Singh",
      rating: 5,
      title: "Bottles after 6 months",
      comment:
        "Six months of daily use and the laser logo still looks new. Reordering for our new office.",
    },
    {
      productIndex: 17,
      name: "Meera Joshi",
      rating: 4,
      title: "Joining kits on time",
      comment:
        "Delivered 250 kits direct-to-home in under two weeks. New joiners posted them on LinkedIn!",
    },
  ];
  for (const review of reviewData) {
    await prisma.review.create({
      data: {
        productId: productIds[review.productIndex],
        userId: demo.id,
        authorName: review.name,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        isApproved: true,
      },
    });
  }
  await prisma.review.create({
    data: {
      productId: productIds[1],
      userId: riya.id,
      authorName: "Arjun Nair",
      rating: 5,
      title: "Awaiting moderation sample",
      comment:
        "This is a pending review — approve it from the admin panel to see it live.",
      isApproved: false,
    },
  });

  // Blog posts
  for (const [index, blog] of BLOGS.entries()) {
    await prisma.blogPost.create({
      data: {
        ...blog,
        author: index % 2 === 0 ? "KCS G-Mart Team" : "Gifting Insights Desk",
        isPublished: true,
        publishedAt: new Date(Date.now() - index * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`  ✓ ${BLOGS.length} blog posts`);

  // Demo orders for the dashboard
  const demoOrders = [
    {
      userId: demo.id,
      status: "CONFIRMED" as const,
      daysAgo: 1,
      customer: {
        name: "Demo Customer",
        email: "demo@kcsgmart.in",
        phone: "9812345678",
      },
      items: [
        {
          productIndex: 8,
          qty: 100,
          name: "Borosil Trek Stainless Steel Bottle 950ml",
        },
        { productIndex: 32, qty: 25, name: "Executive Notebook & Pen Set" },
      ],
    },
    {
      userId: demo.id,
      status: "PENDING" as const,
      daysAgo: 3,
      customer: {
        name: "Demo Customer",
        email: "demo@kcsgmart.in",
        phone: "9812345678",
      },
      items: [
        { productIndex: 17, qty: 250, name: "Employee Joining Kit — Standard" },
      ],
    },
    {
      userId: demo.id,
      status: "SHIPPED" as const,
      daysAgo: 6,
      customer: {
        name: "Demo Customer",
        email: "demo@kcsgmart.in",
        phone: "9812345678",
      },
      // Apparel with variants — mixed sizes of the same tee on one order.
      items: [
        { productIndex: 0, qty: 60, name: "Adidas Dry-Fit Round Neck T-Shirt", variantLabel: "Black / M" },
        { productIndex: 0, qty: 40, name: "Adidas Dry-Fit Round Neck T-Shirt", variantLabel: "Black / L" },
        { productIndex: 1, qty: 30, name: "Puma Cotton Polo T-Shirt", variantLabel: "White / XL" },
      ],
    },
    {
      userId: riya.id,
      status: "DELIVERED" as const,
      daysAgo: 12,
      customer: {
        name: "Riya Malhotra",
        email: "riya@brightlabs.in",
        phone: "9898989898",
      },
      items: [
        { productIndex: 5, qty: 50, name: "boAt Airdopes 141 TWS Earbuds" },
        {
          productIndex: 11,
          qty: 25,
          name: "Cadbury Celebrations Premium Hamper",
        },
      ],
    },
    {
      userId: riya.id,
      status: "SHIPPED" as const,
      daysAgo: 5,
      customer: {
        name: "Riya Malhotra",
        email: "riya@brightlabs.in",
        phone: "9898989898",
      },
      items: [
        {
          productIndex: 3,
          qty: 20,
          name: "American Tourister Skyline 55cms Cabin Luggage",
        },
      ],
    },
  ];

  let orderCounter = 1;
  let invoiceCounter = 0;
  const fyStart = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  const fy = `${String(fyStart).slice(-2)}-${String(fyStart + 1).slice(-2)}`;
  const DEMO_COURIERS = [
    { name: "Delhivery", url: (awb: string) => `https://www.delhivery.com/track/package/${awb}` },
    { name: "Blue Dart", url: (awb: string) => `https://www.bluedart.com/tracking?trackFor=0&trackNo=${awb}` },
    { name: "DTDC", url: (awb: string) => `https://www.dtdc.in/tracking.asp?strCnno=${awb}` },
  ];
  for (const [oi, order] of demoOrders.entries()) {
    const isDemoUser = order.userId === demo.id;
    // Demo user is a GST-registered UP company (inter-state from Delhi → IGST);
    // the other buyer is an unregistered Delhi customer (CGST + SGST).
    const gstNo = isDemoUser ? "09AABCA1234B1ZK" : null;
    const state = isDemoUser ? "Uttar Pradesh" : "Delhi";
    const city = isDemoUser ? "Noida" : "New Delhi";
    const pincode = isDemoUser ? "201309" : "110020";
    const interState = isDemoUser;

    const lines = order.items.map((item) => {
      const seed = P[item.productIndex];
      const lg = logistics(seed);
      const variants = productVariants.get(item.productIndex);
      const wanted = (item as { variantLabel?: string }).variantLabel;
      const variant = variants ? (variants.find((v) => v.label === wanted) ?? variants[(oi * 7 + item.qty) % variants.length]) : undefined;
      const tier =
        [...seed.tiers]
          .sort((a, b) => b.minQuantity - a.minQuantity)
          .find((t) => item.qty >= t.minQuantity) ?? seed.tiers[0];
      const unitPrice = tier.price + (variant ? variant.price - seed.tiers.slice().sort((a, b) => a.minQuantity - b.minQuantity)[0].price : 0);
      const lineTotal = unitPrice * item.qty;
      const weightGrams = variant?.weightGrams ?? lg.weightGrams;
      return {
        productId: productIds[item.productIndex],
        variantId: variant?.id ?? null,
        variantLabel: variant?.label ?? null,
        sku: variant?.sku ?? `KCS-${String(1000 + item.productIndex)}`,
        name: item.name,
        image: seed.image,
        unitPrice,
        quantity: item.qty,
        lineTotal,
        hsnCode: lg.hsnCode,
        gstRate: lg.gstRate,
        taxAmount: splitInclusive(lineTotal, lg.gstRate).tax,
        weightGrams,
        _dims: lg.dims,
      };
    });
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const quote = quoteShipping(
      lines.map((l) => ({ quantity: l.quantity, weightGrams: l.weightGrams, lengthCm: l._dims[0], widthCm: l._dims[1], heightCm: l._dims[2] })),
      state,
      subtotal,
      shippingConfig,
    );
    const shipping = quote.amount;
    const tax = summariseTax(
      lines.map((l) => ({ lineTotal: l.lineTotal, gstRate: l.gstRate })),
      interState,
      shipping,
    );
    const createdAt = new Date(Date.now() - order.daysAgo * 24 * 60 * 60 * 1000);
    const cancelled = (order.status as string) === "CANCELLED";
    const shipped = order.status === "SHIPPED" || order.status === "DELIVERED";
    const courier = DEMO_COURIERS[oi % DEMO_COURIERS.length];
    const awb = shipped ? `${String(1400000000 + oi * 91733)}` : null;
    const shippedAt = shipped ? new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) : null;
    const invoiceNumber = cancelled ? null : `KCS/INV/${fy}/${String(++invoiceCounter).padStart(6, "0")}`;

    await prisma.order.create({
      data: {
        orderNumber: `KCS-DEMO-${String(orderCounter++).padStart(4, "0")}`,
        userId: order.userId,
        status: order.status,
        customerName: order.customer.name,
        customerEmail: order.customer.email,
        customerPhone: order.customer.phone,
        companyName: isDemoUser ? "Acme Technologies Pvt. Ltd." : "Bright Labs",
        gstNo,
        billingAddress: isDemoUser ? "4th Floor, Cyber Tower, Sector 62" : "B-14, Okhla Phase I",
        billingCity: city,
        billingState: state,
        billingPincode: pincode,
        shippingAddress: isDemoUser ? "4th Floor, Cyber Tower, Sector 62" : "B-14, Okhla Phase I",
        shippingCity: city,
        shippingState: state,
        shippingPincode: pincode,
        subtotal,
        shipping,
        total: subtotal + shipping,
        taxableAmount: tax.taxableAmount,
        cgst: tax.cgst,
        sgst: tax.sgst,
        igst: tax.igst,
        placeOfSupply: isDemoUser ? "09" : "07",
        shippingZone: quote.zone?.name ?? null,
        chargeableWeight: quote.chargeableWeight,
        shippingMethod: quote.method,
        invoiceNumber,
        invoicedAt: invoiceNumber ? createdAt : null,
        courierName: shipped ? courier.name : null,
        trackingNumber: awb,
        trackingUrl: awb ? courier.url(awb) : null,
        shippedAt,
        expectedAt: shippedAt ? new Date(shippedAt.getTime() + 4 * 24 * 60 * 60 * 1000) : null,
        deliveredAt: order.status === "DELIVERED" && shippedAt ? new Date(shippedAt.getTime() + 3 * 24 * 60 * 60 * 1000) : null,
        shipmentNote: shipped && oi % 2 === 0 ? "Dispatched in 2 cartons. Please keep a photo ID ready at delivery." : null,
        createdAt,
        items: {
          create: lines.map((line) => {
            const { _dims, ...rest } = line;
            void _dims;
            return rest;
          }),
        },
      },
    });
  }
  await prisma.storeSetting.update({ where: { id: 1 }, data: { invoiceCounter } });
  console.log(`  ✓ ${demoOrders.length} demo orders (${invoiceCounter} invoices)`);

  // Leads
  await prisma.bulkEnquiry.createMany({
    data: [
      {
        name: "Karan Mehta",
        email: "karan@zenithsoft.com",
        phone: "9871234567",
        companyName: "Zenith Soft",
        productId: productIds[17],
        productName: "Employee Joining Kit — Standard",
        quantity: 300,
        message:
          "We're onboarding 300 engineers this quarter. Need branded joining kits with logo embroidery, delivered to Bengaluru and Pune offices.",
        status: "NEW",
      },
      {
        name: "Priyanka Rao",
        email: "priyanka@fintechindia.in",
        phone: "9865043210",
        companyName: "FinTech India",
        productId: productIds[2],
        productName: "Amazon Echo Dot (5th Gen)",
        quantity: 45,
        message:
          "Looking for premium client gifts for our top 45 accounts. Echo Dot with custom sleeve branding. Budget around ₹3,500/unit.",
        status: "CONTACTED",
      },
      {
        name: "Aditya Bose",
        email: "aditya@northstarhr.com",
        phone: "9845678901",
        companyName: "NorthStar HR",
        productId: productIds[13],
        productName: "Diwali Prestige Gift Hamper",
        quantity: 120,
        message:
          "Need Diwali hampers for 120 employees with direct-to-home delivery. Please share catalogue and per-unit pricing.",
        status: "CLOSED",
      },
    ],
  });

  await prisma.contactMessage.createMany({
    data: [
      {
        name: "Sana Qureshi",
        email: "sana@brightbrands.co",
        phone: "9812312312",
        subject: "Bulk order for conference",
        message:
          "We need 500 branded notebooks and pens for our annual conference in November. Can you share a quote?",
      },
      {
        name: "Deepak Nair",
        email: "deepak@traveltech.io",
        phone: "9876501234",
        subject: "Partnership enquiry",
        message:
          "We run a corporate travel platform and would like to explore gifting partnerships for our premium clients.",
        isRead: true,
      },
    ],
  });

  // Meeting bookings (upcoming week)
  const day = 24 * 60 * 60 * 1000;
  await prisma.meetingBooking.createMany({
    data: [
      {
        name: "Nisha Kapoor",
        email: "nisha@edtechgiant.com",
        phone: "9811122233",
        company: "EdTech Giant",
        date: new Date(Date.now() + 2 * day),
        timeSlot: "11:00am",
        notes:
          "Want to discuss Diwali gifting for 2000+ employees across 4 cities.",
        status: "PENDING",
      },
      {
        name: "Rohit Bansal",
        email: "rohit@retailplus.in",
        phone: "9898981212",
        company: "Retail Plus",
        date: new Date(Date.now() + 4 * day),
        timeSlot: "3:30pm",
        notes:
          "Loyalty program rewards — need catalog for 10k point redemption.",
        status: "CONFIRMED",
      },
    ],
  });

  await prisma.newsletterSubscriber.createMany({
    data: [
      { email: "hr.head@acmetech.in" },
      { email: "marketing@brightlabs.in" },
      { email: "admin@zenithsoft.com" },
      { email: "gifting@fintechindia.in" },
      { email: "priya@northstarhr.com" },
      { email: "sana@brightbrands.co" },
    ],
  });
  console.log("  ✓ enquiries, messages, bookings, subscribers");

  console.log("\n✅ Seed complete!");
  console.log(`   Admin login:   ${adminEmail} / ${adminPassword}`);
  console.log("   Customer demo: demo@kcsgmart.in / Demo@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
