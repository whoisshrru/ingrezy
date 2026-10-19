import { PrismaClient, Role, DietaryType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Ingrezy database...");

  const passwordHash = await bcrypt.hash("Password@123", 10);

  // 1. Seed Users
  const adminUser = await prisma.user.upsert({
    where: { phoneNumber: "9876543210" },
    update: {},
    create: {
      id: "user-admin-001",
      email: "admin@ingrezy.com",
      password: passwordHash,
      name: "Ingrezy Super Admin",
      phoneNumber: "9876543210",
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const retailerUser = await prisma.user.upsert({
    where: { phoneNumber: "9876543211" },
    update: {},
    create: {
      id: "user-retailer-001",
      email: "retailer@ingrezy.com",
      password: passwordHash,
      name: "Pune Hub Manager",
      phoneNumber: "9876543211",
      role: Role.RETAILER,
      isActive: true,
    },
  });

  const deliveryUser = await prisma.user.upsert({
    where: { phoneNumber: "9876543212" },
    update: {},
    create: {
      id: "user-delivery-001",
      email: "delivery@ingrezy.com",
      password: passwordHash,
      name: "Ramesh Rider",
      phoneNumber: "9876543212",
      role: Role.DELIVERY_PARTNER,
      isActive: true,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { phoneNumber: "9876543213" },
    update: {},
    create: {
      id: "user-customer-001",
      email: "customer@ingrezy.com",
      password: passwordHash,
      name: "Pooja Sharma",
      phoneNumber: "9876543213",
      role: Role.CUSTOMER,
      isActive: true,
    },
  });

  console.log("✓ Seeded Users (Admin, Retailer, Delivery, Customer)");

  // 2. Seed Store
  const darkStore = await prisma.store.upsert({
    where: { id: "store-pune-001" },
    update: {},
    create: {
      id: "store-pune-001",
      name: "Ingrezy Pune Central Dark Store",
      managerId: retailerUser.id,
      address: "Lane 5, Koregaon Park",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411001",
      latitude: 18.5362,
      longitude: 73.894,
      serviceRadiusKm: 10.0,
      isActive: true,
    },
  });

  console.log("✓ Seeded Dark Store");

  // 3. Seed Address
  await prisma.address.upsert({
    where: { id: "address-cust-001" },
    update: {},
    create: {
      id: "address-cust-001",
      userId: customerUser.id,
      label: "Home",
      addressLine1: "Flat 402, Sunshine Heights",
      addressLine2: "Koregaon Park Road",
      landmark: "Near German Bakery",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411001",
      latitude: 18.5365,
      longitude: 73.8945,
      isDefault: true,
    },
  });

  console.log("✓ Seeded Customer Address");

  // 4. Seed Products
  const products = [
    {
      id: "prod-paneer-001",
      name: "Fresh Malai Paneer 200g",
      slug: "fresh-malai-paneer-200g",
      description: "Soft and fresh farm malai paneer",
      category: "Dairy & Cheese",
      unit: "pack",
      basePrice: 95.0,
      imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7",
      dietaryType: DietaryType.VEG,
      isActive: true,
    },
    {
      id: "prod-tomato-001",
      name: "Hybrid Tomato 500g",
      slug: "hybrid-tomato-500g",
      description: "Fresh juicy tomatoes",
      category: "Vegetables",
      unit: "kg",
      basePrice: 30.0,
      imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea",
      dietaryType: DietaryType.VEG,
      isActive: true,
    },
    {
      id: "prod-butter-001",
      name: "Salted Butter 100g",
      slug: "salted-butter-100g",
      description: "Rich creamy butter",
      category: "Dairy & Cheese",
      unit: "pack",
      basePrice: 56.0,
      imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d",
      dietaryType: DietaryType.VEG,
      isActive: true,
    },
    {
      id: "prod-garam-masala-001",
      name: "Special Garam Masala 100g",
      slug: "special-garam-masala-100g",
      description: "Aromatic blend of ground spices",
      category: "Spices & Seasoning",
      unit: "pack",
      basePrice: 70.0,
      imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d",
      dietaryType: DietaryType.VEG,
      isActive: true,
    },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: {},
      create: prod,
    });

    await prisma.inventory.upsert({
      where: {
        storeId_productId: {
          storeId: darkStore.id,
          productId: prod.id,
        },
      },
      update: { stockQuantity: 100, isAvailable: true },
      create: {
        storeId: darkStore.id,
        productId: prod.id,
        stockQuantity: 100,
        price: prod.basePrice,
        isAvailable: true,
      },
    });
  }

  console.log("✓ Seeded Products & Inventories");

  // 5. Seed Recipe
  const recipe = await prisma.recipe.upsert({
    where: { id: "rec-paneer-butter-masala" },
    update: {},
    create: {
      id: "rec-paneer-butter-masala",
      externalId: "themealdb-52855",
      source: "SYSTEM",
      title: "Restaurant Style Paneer Butter Masala",
      slug: "restaurant-style-paneer-butter-masala",
      description: "A rich and creamy dish of paneer cooked in tomato and butter gravy",
      prepTimeMinutes: 15,
      cookTimeMinutes: 25,
      servings: 2,
      difficulty: "MEDIUM",
      dietaryType: DietaryType.VEG,
      cuisine: "North Indian",
      instructions:
        "1. Saute onions and tomatoes. 2. Blend into smooth gravy. 3. Simmer with butter, spices and paneer cubes.",
      imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7",
      authorId: adminUser.id,
      isActive: true,
    },
  });

  const ingredients = [
    {
      id: "rec-ing-1",
      recipeId: recipe.id,
      productId: "prod-paneer-001",
      ingredientName: "Paneer",
      rawMeasure: "200g",
      quantity: 1,
      unit: "pack",
      isMandatory: true,
      notes: "Cut into 1-inch cubes",
    },
    {
      id: "rec-ing-2",
      recipeId: recipe.id,
      productId: "prod-tomato-001",
      ingredientName: "Tomato",
      rawMeasure: "500g",
      quantity: 1,
      unit: "kg",
      isMandatory: true,
      notes: "Pureed",
    },
    {
      id: "rec-ing-3",
      recipeId: recipe.id,
      productId: "prod-butter-001",
      ingredientName: "Butter",
      rawMeasure: "50g",
      quantity: 1,
      unit: "pack",
      isMandatory: true,
      notes: "Unsalted or salted",
    },
  ];

  for (const ing of ingredients) {
    await prisma.recipeIngredient.upsert({
      where: { id: ing.id },
      update: {},
      create: ing,
    });
  }

  console.log("✓ Seeded Recipe & Ingredients");

  // 6. Seed Customer Cart
  await prisma.cart.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      storeId: darkStore.id,
    },
  });

  console.log("✓ Seeded Customer Cart");
  console.log("\nDatabase seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
