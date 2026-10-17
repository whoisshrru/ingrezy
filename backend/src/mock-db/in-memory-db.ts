import bcrypt from "bcryptjs";
import {
  Role,
  DietaryType,
  Decimal,
} from "../types/database";

// In-Memory Collections
export class InMemoryDatabase {
  users: any[] = [];
  addresses: any[] = [];
  stores: any[] = [];
  products: any[] = [];
  categories: any[] = [];
  inventories: any[] = [];
  recipes: any[] = [];
  recipeIngredients: any[] = [];
  carts: any[] = [];
  cartItems: any[] = [];
  orders: any[] = [];
  orderItems: any[] = [];
  deliveries: any[] = [];
  idempotencyRecords: any[] = [];

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    const passwordHash = bcrypt.hashSync("Password@123", 10);
    const now = new Date();

    // 1. Seed Users
    const adminUser = {
      id: "user-admin-001",
      email: "admin@ingrezy.com",
      password: passwordHash,
      name: "Ingrezy Super Admin",
      phoneNumber: "9876543210",
      role: Role.ADMIN,
      isActive: true,
      deliveries: [],
      createdAt: now,
      updatedAt: now,
    };

    const retailerUser = {
      id: "user-retailer-001",
      email: "retailer@ingrezy.com",
      password: passwordHash,
      name: "Pune Hub Manager",
      phoneNumber: "9876543211",
      role: Role.RETAILER,
      isActive: true,
      deliveries: [],
      createdAt: now,
      updatedAt: now,
    };

    const deliveryUser = {
      id: "user-delivery-001",
      email: "delivery@ingrezy.com",
      password: passwordHash,
      name: "Ramesh Rider",
      phoneNumber: "9876543212",
      role: Role.DELIVERY_PARTNER,
      isActive: true,
      deliveries: [],
      createdAt: now,
      updatedAt: now,
    };

    const customerUser = {
      id: "user-customer-001",
      email: "customer@ingrezy.com",
      password: passwordHash,
      name: "Pooja Sharma",
      phoneNumber: "9876543213",
      role: Role.CUSTOMER,
      isActive: true,
      deliveries: [],
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(adminUser, retailerUser, deliveryUser, customerUser);

    // 2. Seed Store
    const darkStore = {
      id: "store-pune-001",
      name: "Ingrezy Pune Central Dark Store",
      managerId: retailerUser.id,
      address: "Lane 5, Koregaon Park",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411001",
      latitude: 18.5362,
      longitude: 73.8940,
      serviceRadiusKm: 10.0,
      isActive: true,
      inventory: [],
      createdAt: now,
      updatedAt: now,
    };
    this.stores.push(darkStore);

    // 3. Seed Address
    const address = {
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
      createdAt: now,
      updatedAt: now,
    };
    this.addresses.push(address);

    // 4. Seed Categories
    this.categories.push(
      { id: "cat-1", name: "Vegetables", slug: "vegetables" },
      { id: "cat-2", name: "Dairy & Cheese", slug: "dairy-cheese" },
      { id: "cat-3", name: "Spices & Seasoning", slug: "spices-seasoning" },
      { id: "cat-4", name: "Oils & Ghee", slug: "oils-ghee" }
    );

    // 5. Seed Products
    const productsList = [
      {
        id: "prod-paneer-001",
        name: "Fresh Malai Paneer 200g",
        slug: "fresh-malai-paneer-200g",
        description: "Soft and fresh farm malai paneer",
        category: "Dairy & Cheese",
        unit: "pack",
        basePrice: new Decimal(95.0),
        imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7",
        dietaryType: DietaryType.VEG,
        isActive: true,
        inventory: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "prod-tomato-001",
        name: "Hybrid Tomato 500g",
        slug: "hybrid-tomato-500g",
        description: "Fresh juicy tomatoes",
        category: "Vegetables",
        unit: "kg",
        basePrice: new Decimal(30.0),
        imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea",
        dietaryType: DietaryType.VEG,
        isActive: true,
        inventory: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "prod-butter-001",
        name: "Salted Butter 100g",
        slug: "salted-butter-100g",
        description: "Rich creamy butter",
        category: "Dairy & Cheese",
        unit: "pack",
        basePrice: new Decimal(56.0),
        imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d",
        dietaryType: DietaryType.VEG,
        isActive: true,
        inventory: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "prod-garam-masala-001",
        name: "Special Garam Masala 100g",
        slug: "special-garam-masala-100g",
        description: "Aromatic blend of ground spices",
        category: "Spices & Seasoning",
        unit: "pack",
        basePrice: new Decimal(70.0),
        imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d",
        dietaryType: DietaryType.VEG,
        isActive: true,
        inventory: [],
        createdAt: now,
        updatedAt: now,
      },
    ];
    this.products.push(...productsList);

    // 6. Seed Inventory for Dark Store
    productsList.forEach((prod) => {
      this.inventories.push({
        id: `inv-${prod.id}`,
        storeId: darkStore.id,
        productId: prod.id,
        stockQuantity: 100,
        price: prod.basePrice,
        isAvailable: true,
        store: darkStore,
        product: prod,
        createdAt: now,
        updatedAt: now,
      });
    });

    // 7. Seed Recipe & Ingredients
    const recipe = {
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
      ingredients: [] as any[],
      createdAt: now,
      updatedAt: now,
    };
    this.recipes.push(recipe);

    const ing1 = {
      id: "rec-ing-1",
      recipeId: recipe.id,
      productId: "prod-paneer-001",
      ingredientName: "Paneer",
      rawMeasure: "200g",
      quantity: 1,
      unit: "pack",
      isMandatory: true,
      notes: "Cut into 1-inch cubes",
      product: productsList[0],
      createdAt: now,
      updatedAt: now,
    };

    const ing2 = {
      id: "rec-ing-2",
      recipeId: recipe.id,
      productId: "prod-tomato-001",
      ingredientName: "Tomato",
      rawMeasure: "500g",
      quantity: 1,
      unit: "kg",
      isMandatory: true,
      notes: "Pureed",
      product: productsList[1],
      createdAt: now,
      updatedAt: now,
    };

    const ing3 = {
      id: "rec-ing-3",
      recipeId: recipe.id,
      productId: "prod-butter-001",
      ingredientName: "Butter",
      rawMeasure: "50g",
      quantity: 1,
      unit: "pack",
      isMandatory: true,
      notes: "Unsalted or salted",
      product: productsList[2],
      createdAt: now,
      updatedAt: now,
    };

    this.recipeIngredients.push(ing1, ing2, ing3);
    recipe.ingredients.push(ing1, ing2, ing3);

    // 8. Seed Customer Cart
    this.carts.push({
      id: "cart-cust-001",
      userId: customerUser.id,
      storeId: darkStore.id,
      items: [],
      createdAt: now,
      updatedAt: now,
    });
  }
}

// Global In-Memory Instance
export const inMemoryDb = new InMemoryDatabase();
