import type {
  ProductDataProvider,
  SourcedProduct,
  ProductSearchResult,
  ProductCategory,
} from "./index";

// ---------------------------------------------------------------------------
// 500+ product demo catalog — generated from templates with variations
// ---------------------------------------------------------------------------

function img(seed: string): string {
  return `https://picsum.photos/seed/${seed}/400/400`;
}

function ship(hasFast = false): SourcedProduct["shippingOptions"] {
  const opts: SourcedProduct["shippingOptions"] = [
    { carrier: "AliExpress Standard Shipping", cost: 0, days: "15-25" },
  ];
  if (hasFast) {
    opts.push({ carrier: "ePacket", cost: 2.49, days: "10-18" });
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Template definitions per category
// ---------------------------------------------------------------------------

interface ProductTemplate {
  titleParts: string[][];
  priceMin: number;
  priceMax: number;
  ratingMin: number;
  ratingMax: number;
  ordersMin: number;
  ordersMax: number;
  variantSets: string[][];
  hasFastShipping: boolean;
}

const TEMPLATES: Record<string, ProductTemplate[]> = {
  electronics: [
    { titleParts: [["TWS Wireless", "Bluetooth 5.3", "Mini"], ["Earbuds", "Headphones", "In-Ear Earphones"], ["Active Noise Cancelling", "HiFi Stereo", "Sport Waterproof", "30H Battery"]], priceMin: 4, priceMax: 18, ratingMin: 4.2, ratingMax: 4.9, ordersMin: 800, ordersMax: 45000, variantSets: [["Black", "White", "Blue"], ["Black", "Pink"]], hasFastShipping: true },
    { titleParts: [["Shockproof Clear", "Silicone Matte", "Leather Magnetic"], ["Phone Case", "Cover", "Protective Case"], ["iPhone 15 Pro Max", "Samsung Galaxy S24", "iPhone 14 Pro", "Pixel 8"]], priceMin: 1.5, priceMax: 6, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 5000, ordersMax: 60000, variantSets: [["Transparent", "Black", "Navy"], ["Frosted White", "Frosted Black"]], hasFastShipping: false },
    { titleParts: [["Smart Watch", "Fitness Tracker", "Sport Watch"], ["1.85\" HD", "1.96\" AMOLED", "1.43\" Round"], ["Bluetooth Call", "Heart Rate SpO2", "100+ Sport Modes", "IP68 Waterproof"]], priceMin: 8, priceMax: 22, ratingMin: 4.1, ratingMax: 4.6, ordersMin: 2000, ordersMax: 25000, variantSets: [["Black Silicone", "Silver Metal Band", "Rose Gold"], ["Army Green", "Blue"]], hasFastShipping: true },
    { titleParts: [["RGB LED", "WiFi Smart", "USB Powered"], ["Strip Lights", "Neon Lights", "Fairy Lights"], ["5M", "10M", "20M"], ["Music Sync Room Decor", "App Control", "Remote Control"]], priceMin: 3, priceMax: 12, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 3000, ordersMax: 40000, variantSets: [["5m WiFi", "10m WiFi", "5m Bluetooth"], ["5m USB", "10m USB"]], hasFastShipping: false },
    { titleParts: [["65W GaN", "20W Mini", "100W Dual"], ["USB C", "PD3.0", "QC4.0"], ["Fast Charger", "Wall Charger", "Charging Block"], ["Foldable Plug"]], priceMin: 4, priceMax: 16, ratingMin: 4.5, ratingMax: 4.9, ordersMin: 5000, ordersMax: 30000, variantSets: [["White - US Plug", "Black - US Plug", "White - EU Plug"]], hasFastShipping: true },
    { titleParts: [["Portable", "Mini", "Outdoor"], ["Bluetooth Speaker", "Wireless Speaker", "Sound Bar"], ["Waterproof IPX7", "RGB Light", "Bass Boost", "TWS Pair"]], priceMin: 5, priceMax: 18, ratingMin: 4.2, ratingMax: 4.7, ordersMin: 1500, ordersMax: 28000, variantSets: [["Black", "Blue", "Red", "Army Green"]], hasFastShipping: true },
    { titleParts: [["USB 3.0", "Type-C", "7-in-1"], ["Hub", "Dock Station", "Adapter"], ["HDMI 4K", "SD Card Reader", "Ethernet", "PD Charging"]], priceMin: 5, priceMax: 20, ratingMin: 4.3, ratingMax: 4.8, ordersMin: 2000, ordersMax: 18000, variantSets: [["4-in-1 Gray", "7-in-1 Silver", "4-in-1 Black"]], hasFastShipping: true },
    { titleParts: [["1080P HD", "2K Auto Focus", "4K Ultra"], ["Webcam", "Web Camera", "Streaming Camera"], ["Built-in Mic", "Ring Light", "Wide Angle", "Privacy Cover"]], priceMin: 6, priceMax: 22, ratingMin: 4.1, ratingMax: 4.6, ordersMin: 1000, ordersMax: 15000, variantSets: [["1080P Black", "2K Black", "1080P White"]], hasFastShipping: true },
    { titleParts: [["20000mAh", "10000mAh", "30000mAh"], ["Portable Charger", "Power Bank", "Battery Pack"], ["PD 22.5W Fast Charging", "Slim Design", "LED Display", "Wireless"]], priceMin: 7, priceMax: 19, ratingMin: 4.3, ratingMax: 4.8, ordersMin: 4000, ordersMax: 35000, variantSets: [["10000mAh White", "20000mAh White", "10000mAh Black", "20000mAh Black"]], hasFastShipping: true },
    { titleParts: [["USB C to Lightning", "Braided Nylon", "Fast Charging"], ["Cable", "Cord", "Data Cable"], ["1m", "2m", "3m"], ["for iPhone Samsung"]], priceMin: 1.5, priceMax: 5, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 8000, ordersMax: 55000, variantSets: [["1m White", "2m White", "2m Black", "3m Black"]], hasFastShipping: false },
  ],
  fashion: [
    { titleParts: [["Polarized", "Vintage", "Oversized", "Cat Eye"], ["Sunglasses", "Shades", "Sun Glasses"], ["Women Men", "Unisex", "Fashion"], ["UV400 Protection"]], priceMin: 2, priceMax: 8, ratingMin: 4.3, ratingMax: 4.8, ordersMin: 5000, ordersMax: 45000, variantSets: [["Black", "Tortoiseshell", "Pink", "Blue"], ["Gold Frame", "Silver Frame"]], hasFastShipping: false },
    { titleParts: [["925 Sterling Silver", "Gold Plated", "Minimalist"], ["Necklace", "Pendant", "Choker"], ["Dainty Chain", "Heart Pendant", "Bar Pendant", "Layered"]], priceMin: 2, priceMax: 12, ratingMin: 4.4, ratingMax: 4.9, ordersMin: 3000, ordersMax: 30000, variantSets: [["Silver 40cm", "Silver 45cm", "Gold 40cm", "Gold 45cm"]], hasFastShipping: false },
    { titleParts: [["Minimalist", "Luxury", "Casual"], ["Watch", "Wristwatch", "Quartz Watch"], ["Ultra Thin", "Leather Strap", "Mesh Band", "Stainless Steel"]], priceMin: 5, priceMax: 18, ratingMin: 4.2, ratingMax: 4.7, ordersMin: 2000, ordersMax: 20000, variantSets: [["Black Leather", "Brown Leather", "Silver Mesh", "Rose Gold Mesh"]], hasFastShipping: true },
    { titleParts: [["Crossbody", "Shoulder", "Messenger"], ["Bag", "Purse", "Satchel"], ["PU Leather", "Canvas", "Nylon"], ["Small Mini Women"]], priceMin: 4, priceMax: 15, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 4000, ordersMax: 35000, variantSets: [["Black", "Brown", "Beige", "Pink"]], hasFastShipping: false },
    { titleParts: [["Silk Satin", "Chiffon", "Cotton"], ["Scarf", "Shawl", "Bandana"], ["Print", "Solid Color", "Floral"], ["70x70cm Square"]], priceMin: 2, priceMax: 8, ratingMin: 4.4, ratingMax: 4.8, ordersMin: 2000, ordersMax: 18000, variantSets: [["Floral Pink", "Geometric Blue", "Solid Black", "Solid Beige"]], hasFastShipping: false },
    { titleParts: [["Genuine Leather", "PU Leather", "Canvas"], ["Belt", "Waist Belt", "Dress Belt"], ["Automatic Buckle", "Pin Buckle", "Reversible"], ["Men Women Unisex"]], priceMin: 3, priceMax: 10, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 3000, ordersMax: 22000, variantSets: [["Black S", "Black M", "Black L", "Brown M", "Brown L"]], hasFastShipping: false },
    { titleParts: [["Acrylic", "Metal", "Pearl"], ["Hair Clips", "Hair Claws", "Barrettes"], ["Set", "Pack of 6", "Pack of 10"], ["Women Girls Korean Style"]], priceMin: 1.5, priceMax: 5, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 6000, ordersMax: 50000, variantSets: [["Neutral Set", "Pastel Set", "Bold Colors", "Pearl Set"]], hasFastShipping: false },
    { titleParts: [["Baseball", "Bucket", "Beanie"], ["Cap", "Hat", "Sun Hat"], ["Embroidered", "Plain", "Vintage Washed"], ["Unisex Adjustable"]], priceMin: 3, priceMax: 9, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 3000, ordersMax: 25000, variantSets: [["Black", "White", "Navy", "Khaki", "Pink"]], hasFastShipping: false },
    { titleParts: [["Ankle", "Crew", "No-Show"], ["Socks", "Athletic Socks", "Compression Socks"], ["5 Pairs", "10 Pairs"], ["Cotton Breathable Men Women"]], priceMin: 2, priceMax: 7, ratingMin: 4.4, ratingMax: 4.8, ordersMin: 8000, ordersMax: 60000, variantSets: [["Black 5-Pack", "White 5-Pack", "Mixed 5-Pack", "Black 10-Pack"]], hasFastShipping: false },
  ],
  home: [
    { titleParts: [["Multifunctional", "Stainless Steel", "Silicone"], ["Kitchen Gadget", "Kitchen Tool", "Cooking Utensil"], ["Peeler", "Grater", "Can Opener", "Garlic Press"]], priceMin: 2, priceMax: 8, ratingMin: 4.3, ratingMax: 4.8, ordersMin: 5000, ordersMax: 40000, variantSets: [["Silver", "Black", "Green"]], hasFastShipping: false },
    { titleParts: [["LED", "Touch Sensor", "USB Rechargeable"], ["Night Light", "Bedside Lamp", "Wall Light"], ["Warm White", "RGB Color", "Motion Sensor", "Dimmable"]], priceMin: 3, priceMax: 12, ratingMin: 4.4, ratingMax: 4.8, ordersMin: 4000, ordersMax: 35000, variantSets: [["Warm White", "Cool White", "RGB", "Warm + Cool"]], hasFastShipping: false },
    { titleParts: [["Bathroom", "Shower", "Wall Mounted"], ["Organizer", "Shelf", "Caddy", "Storage Rack"], ["No Drill", "Adhesive", "Stainless Steel"], ["Space Saving"]], priceMin: 3, priceMax: 12, ratingMin: 4.2, ratingMax: 4.7, ordersMin: 3000, ordersMax: 25000, variantSets: [["White 1-Tier", "White 2-Tier", "Black 1-Tier", "Black 2-Tier"]], hasFastShipping: false },
    { titleParts: [["Ceramic", "Self-Watering", "Minimalist"], ["Plant Pot", "Planter", "Flower Pot"], ["Indoor", "with Drainage", "with Tray", "Succulent Pot"]], priceMin: 2, priceMax: 10, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 3000, ordersMax: 28000, variantSets: [["Small White", "Medium White", "Small Black", "Large Terracotta"]], hasFastShipping: false },
    { titleParts: [["Floating", "Invisible", "Industrial"], ["Wall Shelf", "Book Shelf", "Display Shelf"], ["Set of 3", "Single", "Corner"], ["Wood Metal Modern"]], priceMin: 4, priceMax: 15, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 2000, ordersMax: 18000, variantSets: [["Natural Wood Set 3", "Black Set 3", "White Set 3", "Walnut Single"]], hasFastShipping: true },
    { titleParts: [["Electric", "USB Rechargeable", "Handheld"], ["Milk Frother", "Coffee Whisk", "Foam Maker"], ["3-Speed", "Double Whisk", "Stainless Steel"]], priceMin: 3, priceMax: 9, ratingMin: 4.4, ratingMax: 4.8, ordersMin: 5000, ordersMax: 32000, variantSets: [["Black", "White", "Silver"]], hasFastShipping: true },
    { titleParts: [["Mesh", "Bamboo", "Acrylic"], ["Desk Organizer", "Pen Holder", "File Organizer"], ["Multi-Compartment", "Drawer Type", "Rotating"], ["Office Home"]], priceMin: 3, priceMax: 12, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 2000, ordersMax: 20000, variantSets: [["Black", "White", "Rose Gold", "Wood"]], hasFastShipping: false },
    { titleParts: [["Ceramic", "Glass", "Stainless Steel"], ["Coffee Mug", "Tea Cup", "Travel Mug"], ["with Lid", "Double Wall", "Insulated", "Large 400ml"]], priceMin: 3, priceMax: 10, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 4000, ordersMax: 30000, variantSets: [["White", "Black", "Pink", "Green"]], hasFastShipping: false },
    { titleParts: [["Magnetic", "Rotating", "Bamboo"], ["Spice Rack", "Spice Jars Set", "Seasoning Organizer"], ["12-Pack", "6-Pack"], ["Stainless Steel Labels"]], priceMin: 5, priceMax: 14, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 1000, ordersMax: 12000, variantSets: [["6-pack Silver", "12-pack Silver", "6-pack Black"]], hasFastShipping: true },
  ],
  beauty: [
    { titleParts: [["Ice Roller", "Jade Roller", "Gua Sha"], ["Face Massager", "Facial Tool", "Skin Care Tool"], ["Stainless Steel", "Natural Stone", "Rose Quartz"], ["Anti-Puffiness"]], priceMin: 2, priceMax: 8, ratingMin: 4.5, ratingMax: 4.9, ordersMin: 8000, ordersMax: 50000, variantSets: [["Silver", "Rose Gold", "Jade Green", "Rose Quartz"]], hasFastShipping: false },
    { titleParts: [["Professional", "Premium", "Vegan"], ["Makeup Brush Set", "Cosmetic Brushes", "Foundation Brushes"], ["15-Piece", "10-Piece", "20-Piece"], ["with PU Case"]], priceMin: 4, priceMax: 14, ratingMin: 4.4, ratingMax: 4.8, ordersMin: 5000, ordersMax: 35000, variantSets: [["Black 15pc + Case", "Pink 15pc + Case", "Black 10pc", "White 20pc"]], hasFastShipping: true },
    { titleParts: [["Ceramic", "Titanium", "Tourmaline"], ["Hair Straightener", "Flat Iron", "Hair Curler"], ["2-in-1", "Fast Heat", "Digital Display", "Mini Travel"]], priceMin: 8, priceMax: 22, ratingMin: 4.2, ratingMax: 4.7, ordersMin: 3000, ordersMax: 25000, variantSets: [["Black", "Pink", "Purple", "White"]], hasFastShipping: true },
    { titleParts: [["Nail Art", "Gel Polish", "Acrylic"], ["Kit", "Set", "Supplies"], ["36 Colors", "UV LED Lamp", "Starter Kit", "Sticker Set"]], priceMin: 3, priceMax: 15, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 4000, ordersMax: 30000, variantSets: [["12 Color Set", "24 Color Set", "36 Color Set", "Lamp + 6 Colors"]], hasFastShipping: false },
    { titleParts: [["Blackhead Remover", "Pore Cleaner", "Facial Steamer"], ["Electric", "Vacuum", "USB Rechargeable"], ["LED Display", "5 Suction Levels", "3 Heads"]], priceMin: 5, priceMax: 16, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 3000, ordersMax: 22000, variantSets: [["White", "Pink", "Black"]], hasFastShipping: true },
    { titleParts: [["Mini", "Portable", "Professional"], ["Massage Gun", "Fascia Gun", "Muscle Massager"], ["Deep Tissue", "6 Heads", "USB-C Rechargeable", "LCD Display"]], priceMin: 10, priceMax: 24, ratingMin: 4.3, ratingMax: 4.8, ordersMin: 5000, ordersMax: 35000, variantSets: [["Black", "Silver", "Pink", "Green"]], hasFastShipping: true },
    { titleParts: [["Silk", "Gel", "3D Contoured"], ["Sleep Eye Mask", "Eye Cover", "Sleeping Mask"], ["Blackout", "Cooling", "Heated"], ["Adjustable Strap"]], priceMin: 2, priceMax: 7, ratingMin: 4.4, ratingMax: 4.8, ordersMin: 6000, ordersMax: 40000, variantSets: [["Black", "Pink", "Purple", "Gray", "Lavender"]], hasFastShipping: false },
    { titleParts: [["Silk Satin", "Cotton", "Velvet"], ["Scrunchies", "Hair Ties", "Ponytail Holders"], ["Large Size", "12-Pack", "6-Pack"], ["Women Girls"]], priceMin: 1.5, priceMax: 5, ratingMin: 4.5, ratingMax: 4.9, ordersMin: 10000, ordersMax: 55000, variantSets: [["Neutral 6-Pack", "Pastel 6-Pack", "Bold 12-Pack", "Black 6-Pack"]], hasFastShipping: false },
  ],
  sports: [
    { titleParts: [["Non-Slip", "Extra Thick", "Travel Foldable"], ["Yoga Mat", "Exercise Mat", "Fitness Mat"], ["6mm", "8mm", "10mm"], ["with Carrying Strap"]], priceMin: 5, priceMax: 16, ratingMin: 4.3, ratingMax: 4.8, ordersMin: 4000, ordersMax: 30000, variantSets: [["Purple 6mm", "Black 8mm", "Blue 6mm", "Pink 8mm", "Gray 10mm"]], hasFastShipping: true },
    { titleParts: [["Latex", "Fabric", "Mini Loop"], ["Resistance Bands", "Exercise Bands", "Booty Bands"], ["Set of 5", "Set of 3", "Heavy Duty"], ["Home Gym Workout"]], priceMin: 3, priceMax: 10, ratingMin: 4.4, ratingMax: 4.8, ordersMin: 6000, ordersMax: 45000, variantSets: [["Latex 5-Set", "Fabric 3-Set", "Latex Heavy 3-Set", "Mini Loop 5-Set"]], hasFastShipping: false },
    { titleParts: [["Insulated", "Motivational", "Stainless Steel"], ["Water Bottle", "Sports Bottle", "Gym Bottle"], ["1L", "750ml", "500ml"], ["BPA Free Leak-Proof"]], priceMin: 3, priceMax: 12, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 5000, ordersMax: 35000, variantSets: [["Black 750ml", "White 1L", "Blue 500ml", "Green 750ml", "Pink 500ml"]], hasFastShipping: false },
    { titleParts: [["Rechargeable", "Solar", "Mini"], ["Camping Light", "LED Lantern", "Headlamp"], ["Waterproof", "3 Modes", "Emergency Light", "Portable"]], priceMin: 3, priceMax: 12, ratingMin: 4.2, ratingMax: 4.7, ordersMin: 2000, ordersMax: 20000, variantSets: [["White Light", "Warm Light", "RGB", "Solar Black"]], hasFastShipping: false },
    { titleParts: [["Smart", "Activity", "Heart Rate"], ["Fitness Tracker", "Sport Band", "Health Monitor"], ["Step Counter", "Sleep Monitor", "Blood Oxygen", "IP68"]], priceMin: 6, priceMax: 18, ratingMin: 4.1, ratingMax: 4.6, ordersMin: 3000, ordersMax: 25000, variantSets: [["Black", "Blue", "Pink", "Green"]], hasFastShipping: true },
    { titleParts: [["Speed", "Weighted", "Tangle-Free"], ["Jump Rope", "Skipping Rope", "Boxing Rope"], ["Adjustable Length", "Ball Bearing", "Counter Display"]], priceMin: 2, priceMax: 8, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 4000, ordersMax: 28000, variantSets: [["Black", "Blue", "Red", "Green"]], hasFastShipping: false },
    { titleParts: [["Weightlifting", "CrossFit", "Anti-Slip"], ["Gym Gloves", "Workout Gloves", "Training Gloves"], ["Full Finger", "Half Finger", "Wrist Support"]], priceMin: 3, priceMax: 10, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 3000, ordersMax: 22000, variantSets: [["Black S", "Black M", "Black L", "Black XL", "Gray M"]], hasFastShipping: false },
    { titleParts: [["Ab Roller", "Push Up Board", "Grip Strength"], ["Trainer", "Exercise Equipment", "Fitness Accessory"], ["Core Workout", "with Knee Pad", "Adjustable Resistance"]], priceMin: 4, priceMax: 14, ratingMin: 4.2, ratingMax: 4.7, ordersMin: 2000, ordersMax: 18000, variantSets: [["Black", "Blue", "Red"]], hasFastShipping: true },
  ],
  toys: [
    { titleParts: [["Pop", "Squeeze", "Infinity Cube"], ["Fidget Toy", "Stress Relief", "Sensory Toy"], ["Pack of 5", "Pack of 10", "Mega Pack"], ["Kids Adults ADHD"]], priceMin: 2, priceMax: 8, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 8000, ordersMax: 55000, variantSets: [["Rainbow 5-Pack", "Pastel 5-Pack", "Neon 10-Pack", "Mega Pack"]], hasFastShipping: false },
    { titleParts: [["1:24 Scale", "Mini", "4WD Off-Road"], ["RC Car", "Remote Control Car", "Racing Car"], ["High Speed", "LED Lights", "Drift Mode", "Rechargeable"]], priceMin: 6, priceMax: 20, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 2000, ordersMax: 18000, variantSets: [["Red", "Blue", "Black", "Green"]], hasFastShipping: true },
    { titleParts: [["3D", "Wooden", "Crystal"], ["Puzzle", "Jigsaw", "Brain Teaser"], ["Animal", "Architecture", "Mechanical"], ["DIY Assembly"]], priceMin: 3, priceMax: 14, ratingMin: 4.4, ratingMax: 4.8, ordersMin: 3000, ordersMax: 25000, variantSets: [["Easy", "Medium", "Hard", "Expert"]], hasFastShipping: false },
    { titleParts: [["150-Piece", "Professional", "Watercolor"], ["Art Supplies Set", "Drawing Kit", "Painting Set"], ["Colored Pencils", "Markers", "Crayons"], ["Kids Adults"]], priceMin: 5, priceMax: 18, ratingMin: 4.4, ratingMax: 4.8, ordersMin: 4000, ordersMax: 30000, variantSets: [["150pc Deluxe", "72pc Pencils", "48pc Markers", "Art Easel Set"]], hasFastShipping: true },
    { titleParts: [["Magnetic", "Classic", "Electric"], ["Building Blocks", "Construction Set", "Tile Set"], ["100+ Pieces", "200+ Pieces"], ["STEM Educational"]], priceMin: 5, priceMax: 22, ratingMin: 4.3, ratingMax: 4.8, ordersMin: 3000, ordersMax: 25000, variantSets: [["100pc Standard", "150pc Deluxe", "200pc Mega", "50pc Starter"]], hasFastShipping: true },
    { titleParts: [["DIY", "Galaxy", "Fluffy"], ["Slime Kit", "Putty Set", "Clay Kit"], ["12 Colors", "24 Colors", "with Add-ins"], ["Non-Toxic Safe"]], priceMin: 3, priceMax: 12, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 5000, ordersMax: 35000, variantSets: [["12 Color Basic", "24 Color Deluxe", "Galaxy Kit", "Fluffy Kit"]], hasFastShipping: false },
    { titleParts: [["Family", "Strategy", "Party"], ["Card Game", "Board Game", "Trivia Game"], ["for 2-6 Players", "Travel Size", "Waterproof"], ["Fun Night"]], priceMin: 3, priceMax: 12, ratingMin: 4.4, ratingMax: 4.8, ordersMin: 4000, ordersMax: 28000, variantSets: [["Standard", "Expansion Pack", "Travel Mini", "Deluxe"]], hasFastShipping: false },
    { titleParts: [["Montessori", "Wooden", "Educational"], ["Learning Toy", "Activity Board", "Shape Sorter"], ["Numbers Letters", "Colors Shapes", "Clock Calendar"], ["Toddler 1-3"]], priceMin: 4, priceMax: 15, ratingMin: 4.5, ratingMax: 4.9, ordersMin: 3000, ordersMax: 22000, variantSets: [["Numbers", "Letters", "Shapes", "Clock"]], hasFastShipping: false },
  ],
  pets: [
    { titleParts: [["Interactive", "Automatic", "Feather"], ["Cat Toy", "Kitten Toy", "Cat Teaser"], ["Ball Track", "Laser Pointer", "Mouse Toy", "Tunnel"]], priceMin: 2, priceMax: 10, ratingMin: 4.3, ratingMax: 4.8, ordersMin: 6000, ordersMax: 45000, variantSets: [["Blue", "Pink", "Green", "Orange"]], hasFastShipping: false },
    { titleParts: [["Nylon", "Reflective", "Personalized"], ["Dog Collar", "Pet Collar", "Puppy Collar"], ["Adjustable", "Quick Release", "Engraved Name Tag"]], priceMin: 2, priceMax: 8, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 5000, ordersMax: 35000, variantSets: [["Black S", "Black M", "Black L", "Red M", "Blue M"]], hasFastShipping: false },
    { titleParts: [["Self-Cleaning", "Deshedding", "Gentle"], ["Pet Brush", "Grooming Brush", "Slicker Brush"], ["for Dogs Cats", "Long Hair", "Short Hair"]], priceMin: 3, priceMax: 10, ratingMin: 4.4, ratingMax: 4.8, ordersMin: 4000, ordersMax: 30000, variantSets: [["Small Blue", "Medium Green", "Large Pink", "Small Gray"]], hasFastShipping: false },
    { titleParts: [["Realistic", "Glowing", "Aquarium"], ["Fish Tank Decoration", "Plant", "Ornament"], ["Coral Reef", "Driftwood", "Castle", "LED Bubble"]], priceMin: 2, priceMax: 10, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 2000, ordersMax: 18000, variantSets: [["Coral Set", "Plant Set", "Castle", "LED Bubble Stone"]], hasFastShipping: false },
    { titleParts: [["Soft Plush", "Donut", "Orthopedic"], ["Pet Bed", "Dog Bed", "Cat Bed"], ["Small", "Medium", "Washable Cover", "Anti-Anxiety"]], priceMin: 5, priceMax: 18, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 3000, ordersMax: 25000, variantSets: [["Gray S", "Gray M", "Brown S", "Brown M", "Pink S"]], hasFastShipping: true },
    { titleParts: [["Retractable", "Heavy Duty", "Reflective"], ["Dog Leash", "Pet Leash", "Walking Leash"], ["5m", "8m", "Hands-Free", "Double Handle"]], priceMin: 3, priceMax: 12, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 4000, ordersMax: 28000, variantSets: [["5m Black", "5m Blue", "8m Black", "5m Pink"]], hasFastShipping: false },
    { titleParts: [["Sisal Rope", "Corrugated Cardboard", "Wall Mounted"], ["Cat Scratcher", "Scratching Post", "Scratch Pad"], ["with Ball", "with Catnip", "Lounge Bed"]], priceMin: 3, priceMax: 14, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 3000, ordersMax: 22000, variantSets: [["Small Natural", "Medium Natural", "Wall Mount", "Lounge"]], hasFastShipping: true },
    { titleParts: [["Automatic", "Smart", "Gravity"], ["Pet Feeder", "Water Fountain", "Food Dispenser"], ["Stainless Steel", "3.8L", "with Filter", "Timer"]], priceMin: 5, priceMax: 18, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 2000, ordersMax: 20000, variantSets: [["White Feeder", "White Fountain", "Gray Feeder", "Blue Fountain"]], hasFastShipping: true },
  ],
  auto: [
    { titleParts: [["Magnetic", "Gravity", "Dashboard"], ["Car Phone Mount", "Phone Holder", "Phone Stand"], ["360° Rotation", "One-Hand", "Vent Clip", "Suction Cup"]], priceMin: 2, priceMax: 8, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 8000, ordersMax: 55000, variantSets: [["Black Vent", "Black Dashboard", "Silver Magnetic", "Black Suction"]], hasFastShipping: false },
    { titleParts: [["Handheld", "Cordless", "120W"], ["Car Vacuum", "Mini Vacuum", "Portable Vacuum"], ["Wet Dry", "HEPA Filter", "USB-C Rechargeable"]], priceMin: 8, priceMax: 22, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 3000, ordersMax: 22000, variantSets: [["Black", "White", "Silver"]], hasFastShipping: true },
    { titleParts: [["1080P", "4K", "Dual Lens"], ["Dash Cam", "Car Camera", "DVR Recorder"], ["Night Vision", "WiFi", "GPS", "Parking Monitor"]], priceMin: 10, priceMax: 25, ratingMin: 4.2, ratingMax: 4.7, ordersMin: 2000, ordersMax: 18000, variantSets: [["1080P Front", "1080P Dual", "4K Front", "4K + Rear"]], hasFastShipping: true },
    { titleParts: [["Natural", "Hanging", "Vent Clip"], ["Car Air Freshener", "Car Perfume", "Car Diffuser"], ["Long Lasting", "Refillable", "Essential Oil"]], priceMin: 2, priceMax: 7, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 5000, ordersMax: 35000, variantSets: [["Ocean", "Lavender", "New Car", "Forest", "Vanilla"]], hasFastShipping: false },
    { titleParts: [["Collapsible", "Heavy Duty", "Waterproof"], ["Trunk Organizer", "Car Storage Box", "Cargo Organizer"], ["Multi-Compartment", "with Lid", "Foldable"]], priceMin: 5, priceMax: 15, ratingMin: 4.3, ratingMax: 4.7, ordersMin: 3000, ordersMax: 22000, variantSets: [["Black Standard", "Black Large", "Gray Standard", "Black with Cooler"]], hasFastShipping: true },
    { titleParts: [["Leather", "Carbon Fiber", "Plush"], ["Steering Wheel Cover", "Wheel Protector", "Grip Cover"], ["Universal 15\"", "Anti-Slip", "Breathable"]], priceMin: 3, priceMax: 10, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 4000, ordersMax: 28000, variantSets: [["Black Leather", "Black Carbon", "Red Stitch", "Brown Leather"]], hasFastShipping: false },
    { titleParts: [["Interior", "Underglow", "Door Logo"], ["Car LED", "LED Light", "Ambient Light"], ["Strip Kit", "Projector", "USB Powered", "App Control"]], priceMin: 3, priceMax: 14, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 3000, ordersMax: 25000, variantSets: [["Blue Strip", "RGB Strip", "White Door Logo", "RGB Underglow"]], hasFastShipping: false },
    { titleParts: [["Universal", "Digital", "Tire"], ["Pressure Gauge", "Inflator", "Emergency Kit"], ["LCD Display", "Portable Compressor", "12V"]], priceMin: 4, priceMax: 18, ratingMin: 4.2, ratingMax: 4.6, ordersMin: 2000, ordersMax: 15000, variantSets: [["Gauge Only", "Gauge + Inflator", "Emergency Kit", "Digital Gauge"]], hasFastShipping: true },
  ],
};

// ---------------------------------------------------------------------------
// Seeded pseudo-random for deterministic generation
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------------
// Generate products from templates
// ---------------------------------------------------------------------------

function generateProducts(): SourcedProduct[] {
  const products: SourcedProduct[] = [];
  const rand = seededRandom(42);

  const categories = Object.keys(TEMPLATES);

  for (const category of categories) {
    const templates = TEMPLATES[category];
    let catIndex = 0;

    for (let ti = 0; ti < templates.length; ti++) {
      const tpl = templates[ti];
      // Generate multiple products per template using different part combos
      const combosPerTemplate = Math.max(7, Math.ceil(65 / templates.length));

      for (let combo = 0; combo < combosPerTemplate; combo++) {
        catIndex++;
        const prefix = category.slice(0, 4);
        const id = `${prefix}-${String(catIndex).padStart(3, "0")}`;

        // Pick title parts
        const titleWords = tpl.titleParts.map((parts) => {
          const idx = Math.floor(rand() * parts.length);
          return parts[idx];
        });
        const title = titleWords.join(" ");

        // Price
        const price = +(tpl.priceMin + rand() * (tpl.priceMax - tpl.priceMin)).toFixed(2);
        const hasDiscount = rand() > 0.3;
        const originalPrice = hasDiscount
          ? +(price * (1.5 + rand() * 1.5)).toFixed(2)
          : undefined;

        // Rating and orders
        const rating = +(tpl.ratingMin + rand() * (tpl.ratingMax - tpl.ratingMin)).toFixed(1);
        const orders = Math.round(tpl.ordersMin + rand() * (tpl.ordersMax - tpl.ordersMin));

        // Variants
        const variantSet = tpl.variantSets[Math.floor(rand() * tpl.variantSets.length)];
        const variants = variantSet.map((name, vi) => ({
          id: `${id}-v${vi + 1}`,
          name,
          price: +(price + (rand() - 0.5) * 2).toFixed(2),
          stock: Math.round(500 + rand() * 9000),
          image: img(`${id}-v${vi + 1}`),
        }));

        const imageCount = 1 + Math.floor(rand() * 3);
        const images = Array.from({ length: imageCount }, (_, i) =>
          img(`${id}-img${i}`),
        );

        const isTrending = orders > 15000 || rand() > 0.75;
        const isNewArrival = orders < 3000 || rand() > 0.85;

        products.push({
          externalId: id,
          sourceUrl: `https://www.aliexpress.com/item/demo-${id}.html`,
          title,
          description: `High quality ${title.toLowerCase()}. Fast shipping, great value. Satisfaction guaranteed.`,
          images,
          price,
          originalPrice,
          currency: "USD",
          rating,
          totalOrders: orders,
          category,
          shippingOptions: ship(tpl.hasFastShipping),
          variants,
          isTrending,
          isNewArrival,
        });
      }
    }
  }

  return products;
}

// Generate once at module load
const PRODUCTS: SourcedProduct[] = generateProducts();

// ---------------------------------------------------------------------------
// Category meta
// ---------------------------------------------------------------------------
const CATEGORY_MAP: Record<string, string> = {
  electronics: "Electronics",
  fashion: "Fashion",
  home: "Home & Garden",
  beauty: "Beauty & Health",
  sports: "Sports & Outdoors",
  toys: "Toys & Hobbies",
  pets: "Pets",
  auto: "Auto",
};

const PAGE_SIZE = 12;

// ---------------------------------------------------------------------------
// DemoProvider implementation
// ---------------------------------------------------------------------------
export class DemoProvider implements ProductDataProvider {
  async searchProducts(
    query: string,
    page = 1,
    category?: string,
  ): Promise<ProductSearchResult> {
    const q = query.toLowerCase();
    let filtered = PRODUCTS.filter((p) => {
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const matchesCategory = !category || category === "all" || p.category === category;
      return matchesQuery && matchesCategory;
    });

    const total = filtered.length;
    const start = (page - 1) * PAGE_SIZE;
    filtered = filtered.slice(start, start + PAGE_SIZE);

    return { products: filtered, total, page, pageSize: PAGE_SIZE };
  }

  async getProductDetails(productId: string): Promise<SourcedProduct | null> {
    return PRODUCTS.find((p) => p.externalId === productId) ?? null;
  }

  async getTrendingProducts(
    category?: string,
    page = 1,
  ): Promise<ProductSearchResult> {
    let trending = PRODUCTS.filter((p) => {
      const matchesCat = !category || category === "all" || p.category === category;
      return matchesCat && (p.isTrending || p.totalOrders > 15000);
    }).sort((a, b) => b.totalOrders - a.totalOrders);

    const total = trending.length;
    const start = (page - 1) * PAGE_SIZE;
    trending = trending.slice(start, start + PAGE_SIZE);

    return { products: trending, total, page, pageSize: PAGE_SIZE };
  }

  async getCategories(): Promise<{ id: string; name: string; count: number }[]> {
    const counts: Record<string, number> = {};
    for (const p of PRODUCTS) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
    return Object.entries(counts).map(([id, count]) => ({
      id,
      name: CATEGORY_MAP[id] ?? id,
      count,
    }));
  }
}

/** Expose product count for tests or debugging */
export const DEMO_PRODUCT_COUNT = PRODUCTS.length;
