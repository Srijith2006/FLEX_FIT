import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/database.js";
import { User, Vendor, Product } from "../models/index.js";

dotenv.config();

async function seed() {
  await connectDB();
  console.log("Connected to DB");

  // Clean up old demo data
  await Vendor.deleteMany({ businessName: { $in: ["NutriPro Supplements", "FreshFuel Meals", "FlexGear Equipment"] } });

  // Create vendor users if not exist
  const vendorData = [
    {
      user: { name: "NutriPro Supplements", email: "nutripro@vendor.com", password: "vendor123", role: "vendor" },
      vendor: { businessName: "NutriPro Supplements", businessType: "supplements", description: "Premium sports nutrition — whey protein, creatine, BCAAs and more. Lab-tested, FSSAI certified.", city: "Mumbai", phone: "+91 9876543210", verificationStatus: "approved" },
      products: [
        { name: "Whey Protein Isolate 1kg", category: "supplement", price: 2499, originalPrice: 2999, description: "Cold-processed whey isolate, 27g protein per serving. Chocolate & Vanilla flavors.", calories: 120, protein: 27, carbs: 3, fat: 1, unit: "1kg tub", stock: 50, groupBuyEnabled: true, groupBuyThreshold: 5, groupBuyDiscount: 15 },
        { name: "Creatine Monohydrate 250g", category: "supplement", price: 799, originalPrice: 999, description: "100% pure micronized creatine monohydrate for strength and power.", calories: 0, protein: 0, carbs: 0, fat: 0, unit: "250g", stock: 80, groupBuyEnabled: true, groupBuyThreshold: 8, groupBuyDiscount: 12 },
        { name: "BCAA 2:1:1 300g", category: "supplement", price: 1299, originalPrice: 1599, description: "Branched-chain amino acids for muscle recovery. Watermelon & Mango flavors.", calories: 10, protein: 5, carbs: 0, fat: 0, unit: "300g", stock: 60 },
        { name: "Mass Gainer 3kg", category: "supplement", price: 2199, originalPrice: 2799, description: "High-calorie gainer with 50g protein and 250g carbs per serving.", calories: 400, protein: 50, carbs: 250, fat: 5, unit: "3kg", stock: 30, groupBuyEnabled: true, groupBuyThreshold: 4, groupBuyDiscount: 18 },
        { name: "Multivitamin + Omega3 Combo", category: "supplement", price: 699, originalPrice: 899, description: "Daily essential vitamins + fish oil capsules for overall health.", calories: 15, protein: 0, carbs: 0, fat: 1.5, unit: "60 caps each", stock: 100 },
      ]
    },
    {
      user: { name: "FreshFuel Meals", email: "freshfuel@vendor.com", password: "vendor123", role: "vendor" },
      vendor: { businessName: "FreshFuel Meals", businessType: "meal_kitchen", description: "Chef-prepared macro-tracked meals delivered fresh daily. No preservatives. Fits your fitness goals perfectly.", city: "Bangalore", phone: "+91 9876500001", verificationStatus: "approved" },
      products: [
        { name: "Grilled Chicken + Brown Rice Bowl", category: "meal", price: 249, description: "250g grilled chicken breast, 150g brown rice, steamed broccoli & carrots. Chef's signature.", calories: 480, protein: 45, carbs: 40, fat: 8, unit: "meal box", stock: 999, groupBuyEnabled: false },
        { name: "Paneer Tikka + Quinoa Bowl", category: "meal", price: 229, description: "Marinated paneer tikka, quinoa, cucumber raita. Vegetarian power meal.", calories: 420, protein: 28, carbs: 38, fat: 14, unit: "meal box", stock: 999 },
        { name: "Egg White Omelette + Toast", category: "meal", price: 149, description: "6 egg whites, multigrain toast, sautéed spinach. Perfect high-protein breakfast.", calories: 310, protein: 32, carbs: 22, fat: 5, unit: "meal box", stock: 999 },
        { name: "Greek Yogurt Parfait", category: "meal", price: 129, description: "200g Greek yogurt, mixed berries, granola, honey drizzle. Pre/post workout snack.", calories: 280, protein: 18, carbs: 35, fat: 4, unit: "cup", stock: 999 },
        { name: "Weekly Meal Prep Pack (5 days)", category: "meal", price: 999, originalPrice: 1245, description: "5 lunch + 5 dinner boxes. Customized to your macros. Fresh delivered Monday.", calories: 480, protein: 42, carbs: 38, fat: 8, unit: "10 meal boxes", stock: 50, groupBuyEnabled: true, groupBuyThreshold: 3, groupBuyDiscount: 10 },
        { name: "High-Protein Breakfast Pack", category: "meal", price: 599, description: "5 breakfast boxes (Mon–Fri). Egg bowls, protein pancakes, overnight oats rotation.", calories: 350, protein: 30, carbs: 28, fat: 8, unit: "5 boxes", stock: 50 },
      ]
    },
    {
      user: { name: "FlexGear Equipment", email: "flexgear@vendor.com", password: "vendor123", role: "vendor" },
      vendor: { businessName: "FlexGear Equipment", businessType: "equipment", description: "Premium home gym equipment. Resistance bands, dumbbells, yoga mats and accessories.", city: "Delhi", phone: "+91 9876500002", verificationStatus: "approved" },
      products: [
        { name: "Resistance Band Set (5 levels)", category: "equipment", price: 799, originalPrice: 1299, description: "5 resistance bands: 10/20/30/40/50 lbs. Perfect for home workouts.", unit: "set", stock: 200, groupBuyEnabled: true, groupBuyThreshold: 10, groupBuyDiscount: 20 },
        { name: "Adjustable Dumbbell 5–25kg", category: "equipment", price: 4999, originalPrice: 6999, description: "Space-saving adjustable dumbbell. Replaces 9 pairs. Quick-select dial.", unit: "pair", stock: 25 },
        { name: "Premium Yoga Mat 6mm", category: "equipment", price: 899, description: "Non-slip, eco-friendly cork + TPE mat. 183cm × 61cm.", unit: "piece", stock: 150, groupBuyEnabled: true, groupBuyThreshold: 8, groupBuyDiscount: 15 },
      ]
    }
  ];

  for (const data of vendorData) {
    // Upsert vendor user
    let vendorUser = await User.findOne({ email: data.user.email });
    if (!vendorUser) {
      const bcrypt = await import("bcryptjs");
      const hashed = await bcrypt.default.hash(data.user.password, 10);
      vendorUser = await User.create({ ...data.user, password: hashed });
    }

    // Create vendor profile
    const vendor = await Vendor.create({ user: vendorUser._id, ...data.vendor });
    console.log(`✅ Created vendor: ${vendor.businessName}`);

    // Create products
    for (const prod of data.products) {
      await Product.create({ vendor: vendor._id, isAvailable: true, ...prod });
    }
    console.log(`   → ${data.products.length} products added`);
  }

  console.log("\n🎉 Marketplace seeded successfully!");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });