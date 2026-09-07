/**
 * Global site constants for KCS G-Mart.
 */

export const SITE = {
  name: "KCS G-Mart",
  tagline: "Store of preeminence at marked down.",
  description:
    "Most Trusted Corporate Gifting Company in India — branded gifts, hampers, joining kits and promotional merchandise with pan-India delivery.",
  phone: "+91 78 3815 2753",
  phoneHref: "tel:+917838152753",
  email: "info@digitalfueled.com",
  address: "L2 A/4, Mohan Garden, Uttam Nagar, Delhi 110059",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export const IMAGES = {
  logo: "/images/logo.webp",
  panIndia: "/images/PAN-India.jpg",
  drinkware: "/images/apprals.jpeg",
  videoPoster: "/images/video.jpeg",
  contentBanner: "/images/ph-banner.webp",
  homeBanners: [
    "/images/KCS/Home-Banner/home-banner-0.jpg",
    "/images/KCS/Home-Banner/home-banner-1-3.jpg",
    "/images/KCS/Home-Banner/home-banner-2.jpg",
  ],
  homeGrid: {
    diwali: "/images/KCS/cat/Diwali-Gift-Hampers.jpg",
    mfi: "/images/KCS/cat/MFI-Cross-Selling.jpg",
    ngo: "/images/KCS/cat/NGO-CSR-Requirement.jpg",
    pharma: "/images/KCS/cat/Pharma-gifting-&-promotion.jpg",
    trade: "/images/KCS/cat/Trade-Schemes.jpg",
    gourmet: "/images/KCS/cat/Gourmet-Range.jpg",
    corporate: "/images/KCS/cat/Corporate-Gifting.jpg",
  },
  featuredCategories: [
    { src: "/images/Featured-cat/Bags.jpg", alt: "Bags", label: "Bags", href: "/category/bags-luggage" },
    { src: "/images/Featured-cat/Apparels.jpg", alt: "Apparels", label: "Apparels", href: "/category/apparels-clothing" },
    {
      src: "/images/Featured-cat/Electronics-&-appliances.jpg",
      alt: "Electronics & appliances",
      label: "Electronics & appliances",
      href: "/category/electronics-tech",
    },
    {
      src: "/images/Featured-cat/Kitchenware-&-utensils.jpg",
      alt: "Kitchenware & utensils",
      label: "Kitchenware & utensils",
      href: "/category/kitchenware-appliances",
    },
    {
      src: "/images/Featured-cat/Mobile-&-Laptop-Accessories.jpg",
      alt: "Mobile & laptop accessories",
      label: "Mobile & laptop accessories",
      href: "/category/mobile-laptop-accessories",
    },
    { src: "/images/Featured-cat/Stationary.jpg", alt: "Stationery", label: "Stationery", href: "/category/office-stationery" },
  ],
  paymentIcons: [
    "/images/KCS/Payment-icon/1.png",
    "/images/KCS/Payment-icon/2.png",
    "/images/KCS/Payment-icon/3.png",
    "/images/KCS/Payment-icon/4.png",
    "/images/KCS/Payment-icon/5.png",
  ],
  socials: {
    facebook: "/images/SVGS/facebook.svg",
    instagram: "/images/SVGS/instagram.svg",
    linkedin: "/images/SVGS/linkedin.svg",
    whatsapp: "/images/SVGS/Whatsapp.svg",
  },
  whyUs: {
    automation: "/images/automation.jpg",
    promptSales: "/images/prompt-sales.png",
    training: "/images/training-development.jpg",
    lmd: "/images/LMD-Services.jpg",
  },
} as const;

export const MOST_TRUSTED_ITEMS = [
  { key: "gift-hampers", label: "Gift Hampers" },
  { key: "diwali-gifts", label: "Diwali Gifts" },
  { key: "tech-gadgets", label: "Tech Gadgets" },
  { key: "home-living", label: "Home Living" },
  { key: "bags-luggage", label: "Bags And Luggage" },
  { key: "joining-kits", label: "Joining Kits" },
  { key: "gift-combo", label: "Gift Combo Sets" },
  { key: "t-shirts", label: "Logo Printed T-Shirts" },
  { key: "all-products", label: "All Product" },
] as const;

/** Category slugs behind the "most trusted" strip. `null` → /product */
export const MOST_TRUSTED_HREFS: Record<string, string> = {
  "gift-hampers": "/category/curated-gift-hampers",
  "diwali-gifts": "/category/diwali-gift-hampers",
  "tech-gadgets": "/category/electronics-tech",
  "home-living": "/category/personal-lifestyle",
  "bags-luggage": "/category/bags-luggage",
  "joining-kits": "/category/onboarding-joining-kits",
  "gift-combo": "/category/combo-gift-sets",
  "t-shirts": "/category/apparels-clothing",
  "all-products": "/product",
};

export const PRICE_FILTER_OPTIONS = [
  { label: "Below Rs. 500", min: 0, max: 500 },
  { label: "Rs. 500 - Rs. 1000", min: 500, max: 1000 },
  { label: "Rs. 1000 - Rs. 2000", min: 1000, max: 2000 },
  { label: "Above Rs. 2000", min: 2000, max: null },
] as const;

export const ITEMS_PER_PAGE = 12;

export const MEETING_TIME_SLOTS = [
  "9:30am",
  "10:00am",
  "10:30am",
  "11:00am",
  "11:30am",
  "12:00pm",
  "12:30pm",
  "1:00pm",
  "1:30pm",
  "2:00pm",
  "2:30pm",
  "3:00pm",
  "3:30pm",
  "4:00pm",
  "4:30pm",
  "5:00pm",
] as const;

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export const ENQUIRY_STATUSES = ["NEW", "CONTACTED", "CLOSED"] as const;
export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
] as const;
