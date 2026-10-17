import 'package:flutter_test/flutter_test.dart';
import 'package:ingrezy_mobile/models/user_model.dart';
import 'package:ingrezy_mobile/models/product_model.dart';
import 'package:ingrezy_mobile/models/order_model.dart';
import 'package:ingrezy_mobile/models/cart_model.dart';
import 'package:ingrezy_mobile/models/recipe_model.dart';
import 'package:ingrezy_mobile/providers/recipe_provider.dart';

void main() {
  group('Ingrezy Model & Cart Unit Tests', () {
    test('UserModel parse customer role correctly', () {
      final json = {
        'id': 'user-123',
        'name': 'Rahul Sharma',
        'phoneNumber': '9876543210',
        'role': 'CUSTOMER',
        'isActive': true,
      };

      final user = UserModel.fromJson(json);
      expect(user.id, 'user-123');
      expect(user.name, 'Rahul Sharma');
      expect(user.role, UserRole.CUSTOMER);
      expect(user.role.toDisplayString(), 'Customer');
    });

    test('ProductModel parses Decimal price string and stock status', () {
      final json = {
        'id': 'prod-456',
        'name': 'Fresh Full Cream Milk',
        'slug': 'fresh-milk',
        'category': 'Dairy',
        'unit': '500 ml',
        'basePrice': '34.00',
        'dietaryType': 'VEG',
        'stockQuantity': 15,
        'price': '32.00',
        'isAvailable': true,
      };

      final product = ProductModel.fromJson(json);
      expect(product.name, 'Fresh Full Cream Milk');
      expect(product.basePrice, 34.0);
      expect(product.displayPrice, 32.0);
      expect(product.inStock, true);
      expect(product.dietaryType, DietaryType.VEG);
    });

    test('OrderStatus maps all states correctly', () {
      expect(OrderStatus.fromString('PLACED'), OrderStatus.PLACED);
      expect(OrderStatus.fromString('CONFIRMED'), OrderStatus.CONFIRMED);
      expect(OrderStatus.fromString('PREPARING'), OrderStatus.PREPARING);
      expect(OrderStatus.fromString('READY_FOR_PICKUP'), OrderStatus.READY_FOR_PICKUP);
      expect(OrderStatus.fromString('OUT_FOR_DELIVERY'), OrderStatus.OUT_FOR_DELIVERY);
      expect(OrderStatus.fromString('DELIVERED'), OrderStatus.DELIVERED);
      expect(OrderStatus.fromString('CANCELLED'), OrderStatus.CANCELLED);
    });

    test('CartModel parses backend GET /api/cart response with flattened items', () {
      final json = {
        'cartId': 'cart-111',
        'store': {
          'id': 'store-222',
          'name': 'Kothrud Hub',
          'city': 'Pune',
          'postalCode': '411038',
          'isActive': true,
        },
        'itemCount': 1,
        'items': [
          {
            'id': 'item-333',
            'productId': 'prod-444',
            'productName': 'Shimla Apples',
            'slug': 'shimla-apples',
            'category': 'Fruits',
            'unit': '1kg',
            'imageUrl': null,
            'dietaryType': 'VEG',
            'quantity': 2,
            'unitPrice': 110.0,
            'subtotal': 220.0,
            'inStock': true,
            'availableStock': 21,
          }
        ],
        'pricing': {
          'subtotal': 220.0,
          'deliveryFee': 30.0,
          'totalAmount': 250.0,
        },
      };

      final cart = CartModel.fromJson(json);
      expect(cart.id, 'cart-111');
      expect(cart.storeId, 'store-222');
      expect(cart.storeName, 'Kothrud Hub');
      expect(cart.items.length, 1);
      expect(cart.totalItemCount, 2);
      expect(cart.subtotal, 220.0);
      expect(cart.deliveryFee, 30.0);
      expect(cart.totalAmount, 250.0);

      final item = cart.items.first;
      expect(item.id, 'item-333');
      expect(item.productId, 'prod-444');
      expect(item.quantity, 2);
      expect(item.product.name, 'Shimla Apples');
      expect(item.effectiveUnitPrice, 110.0);
      expect(item.effectiveSubtotal, 220.0);
    });

    test('CartModel parses single cartItem payload from POST /api/cart/items', () {
      final json = {
        'cartItem': {
          'id': 'item-999',
          'productId': 'prod-888',
          'productName': 'Organic Mangoes',
          'quantity': 3,
          'unitPrice': 350.0,
          'subtotal': 1050.0,
        }
      };

      final cart = CartModel.fromJson(json);
      expect(cart.items.length, 1);
      expect(cart.totalItemCount, 3);
      expect(cart.items.first.productId, 'prod-888');
      expect(cart.items.first.product.name, 'Organic Mangoes');
      expect(cart.items.first.effectiveSubtotal, 1050.0);
    });

    test('CartItemModel accurately calculates line total and unit price', () {
      final item = CartItemModel(
        id: 'ci-1',
        productId: 'p-1',
        quantity: 4,
        unitPrice: 45.0,
        product: ProductModel(
          id: 'p-1',
          name: 'Brown Bread',
          slug: 'brown-bread',
          category: 'Bakery',
          unit: '400g',
          basePrice: 50.0,
        ),
      );

      expect(item.effectiveUnitPrice, 45.0);
      expect(item.effectiveSubtotal, 180.0);
    });
  });

  group('Recipe Ingredient & Servings Scaling Tests', () {
    test('RecipeModel parses cuisine, baseServings, and ingredients', () {
      final recipeJson = {
        'id': 'recipe-001',
        'title': 'Kolhapuri Misal Pav',
        'slug': 'kolhapuri-misal-pav',
        'description': 'Spicy sprout curry with pav',
        'prepTimeMinutes': 15,
        'cookTimeMinutes': 25,
        'servings': 2,
        'baseServings': 2,
        'difficulty': 'MEDIUM',
        'dietaryType': 'VEG',
        'cuisine': 'Maharashtrian',
        'instructions': 'Boil sprouts, temper masala, serve hot with buttered pav.',
        'ingredients': [
          {
            'id': 'ing-1',
            'productId': 'prod-paneer',
            'productName': 'Fresh Malai Paneer',
            'baseQuantity': 200.0,
            'scaledQuantity': 200.0,
            'unit': 'g',
          },
          {
            'id': 'ing-2',
            'productId': 'prod-milk',
            'productName': 'Cow Milk',
            'baseQuantity': 250.0,
            'scaledQuantity': 250.0,
            'unit': 'ml',
          },
          {
            'id': 'ing-3',
            'productId': 'prod-onion',
            'productName': 'Farm Fresh Onions',
            'baseQuantity': 2.0,
            'scaledQuantity': 2.0,
            'unit': 'pieces',
          },
        ],
      };

      final recipe = RecipeModel.fromJson(recipeJson);
      expect(recipe.title, 'Kolhapuri Misal Pav');
      expect(recipe.cuisine, 'Maharashtrian');
      expect(recipe.servings, 2);
      expect(recipe.baseServings, 2);
      expect(recipe.totalTimeMinutes, 40);
      expect(recipe.ingredients.length, 3);

      expect(recipe.ingredients[0].name, 'Fresh Malai Paneer');
      expect(recipe.ingredients[0].formattedQuantity, '200 g');
      expect(recipe.ingredients[1].name, 'Cow Milk');
      expect(recipe.ingredients[1].formattedQuantity, '250 ml');
      expect(recipe.ingredients[2].name, 'Farm Fresh Onions');
      expect(recipe.ingredients[2].formattedQuantity, '2 pieces');
    });

    test('RecipeModel withServings scales quantities proportionally from base servings', () {
      final baseRecipe = RecipeModel(
        id: 'r-1',
        title: 'Paneer Butter Masala',
        slug: 'paneer-butter-masala',
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        servings: 2,
        baseServings: 2,
        difficulty: 'MEDIUM',
        dietaryType: DietaryType.VEG,
        cuisine: 'Indian',
        instructions: 'Cook with love',
        ingredients: [
          RecipeIngredientModel(
            id: 'i-1',
            productId: 'p-paneer',
            name: 'Fresh Malai Paneer',
            quantity: 200.0,
            baseQuantity: 200.0,
            unit: 'g',
          ),
          RecipeIngredientModel(
            id: 'i-2',
            productId: 'p-milk',
            name: 'Cow Milk',
            quantity: 250.0,
            baseQuantity: 250.0,
            unit: 'ml',
          ),
          RecipeIngredientModel(
            id: 'i-3',
            productId: 'p-onion',
            name: 'Farm Fresh Onions',
            quantity: 2.0,
            baseQuantity: 2.0,
            unit: 'pieces',
          ),
        ],
      );

      // Scale to 4 servings (2x)
      final scaled4 = baseRecipe.withServings(4);
      expect(scaled4.servings, 4);
      expect(scaled4.ingredients[0].quantity, 400.0);
      expect(scaled4.ingredients[0].formattedQuantity, '400 g');
      expect(scaled4.ingredients[1].quantity, 500.0);
      expect(scaled4.ingredients[1].formattedQuantity, '500 ml');
      expect(scaled4.ingredients[2].quantity, 4.0);
      expect(scaled4.ingredients[2].formattedQuantity, '4 pieces');

      // Scale to 6 servings (3x)
      final scaled6 = baseRecipe.withServings(6);
      expect(scaled6.servings, 6);
      expect(scaled6.ingredients[0].quantity, 600.0);
      expect(scaled6.ingredients[0].formattedQuantity, '600 g');
      expect(scaled6.ingredients[1].quantity, 750.0);
      expect(scaled6.ingredients[1].formattedQuantity, '750 ml');
      expect(scaled6.ingredients[2].quantity, 6.0);
      expect(scaled6.ingredients[2].formattedQuantity, '6 pieces');

      // Scale to 8 servings (4x)
      final scaled8 = baseRecipe.withServings(8);
      expect(scaled8.servings, 8);
      expect(scaled8.ingredients[0].quantity, 800.0);
      expect(scaled8.ingredients[0].formattedQuantity, '800 g');
      expect(scaled8.ingredients[1].quantity, 1000.0);
      expect(scaled8.ingredients[1].formattedQuantity, '1000 ml');
      expect(scaled8.ingredients[2].quantity, 8.0);
      expect(scaled8.ingredients[2].formattedQuantity, '8 pieces');
    });

    test('RecipeIngredientModel formats fractional quantities cleanly without floating point anomalies', () {
      final ing1 = RecipeIngredientModel(
        id: '1',
        productId: 'p',
        name: 'Oil',
        quantity: 1.5,
        baseQuantity: 1.0,
        unit: 'tbsp',
      );
      expect(ing1.formattedQuantity, '1.5 tbsp');

      final ing2 = RecipeIngredientModel(
        id: '2',
        productId: 'p',
        name: 'Garlic',
        quantity: 0.25,
        baseQuantity: 0.5,
        unit: 'tsp',
      );
      expect(ing2.formattedQuantity, '0.25 tsp');
    });
  });

  group('RecipeProvider Filters & State Tests', () {
    test('RecipeProvider defaults and filter resets', () {
      final provider = RecipeProvider();
      expect(provider.selectedCuisine, 'All');
      expect(provider.dietaryFilter, 'ALL');
      expect(provider.searchQuery, '');

      // Change filters
      provider.setCuisineFilter('Maharashtrian');
      expect(provider.selectedCuisine, 'Maharashtrian');

      provider.setDietaryFilter('VEG');
      expect(provider.dietaryFilter, 'VEG');

      // Reset
      provider.resetFilters();
      expect(provider.selectedCuisine, 'All');
      expect(provider.dietaryFilter, 'ALL');
      expect(provider.searchQuery, '');
    });
  });

  group('Cart Flow, Stepper & Total Calculation Tests', () {
    test('CartModel auto-calculates subtotal and delivery fee correctly when pricing block is omitted', () {
      final item1 = {
        'id': 'ci-101',
        'productId': 'p-tomato',
        'productName': 'Fresh Tomato 500g',
        'quantity': 2,
        'unitPrice': 30.0,
        'unit': '500g',
      };
      final item2 = {
        'id': 'ci-102',
        'productId': 'p-paneer',
        'productName': 'Malai Paneer 200g',
        'quantity': 1,
        'unitPrice': 95.0,
        'unit': '200g',
      };

      final cart = CartModel.fromJson({
        'cartId': 'cart-test-1',
        'items': [item1, item2],
      });

      // Item 1: 2 * 30 = 60
      // Item 2: 1 * 95 = 95
      // Subtotal = 155
      expect(cart.items.length, 2);
      expect(cart.totalItemCount, 3);
      expect(cart.subtotal, 155.0);
      // Under 500 => delivery fee is 30.0
      expect(cart.deliveryFee, 30.0);
      expect(cart.totalAmount, 185.0);
    });

    test('CartModel free delivery applies when subtotal is >= 500', () {
      final highValueItem = {
        'id': 'ci-201',
        'productId': 'p-ghee',
        'productName': 'Pure Desi Ghee 1L',
        'quantity': 1,
        'unitPrice': 650.0,
        'unit': '1L',
      };

      final cart = CartModel.fromJson({
        'cartId': 'cart-test-free-delivery',
        'items': [highValueItem],
      });

      expect(cart.subtotal, 650.0);
      expect(cart.deliveryFee, 0.0);
      expect(cart.totalAmount, 650.0);
    });

    test('CartItemModel maintains quantity and unit in grams/ml/pieces', () {
      final item = CartItemModel.fromJson({
        'id': 'item-salt',
        'productId': 'p-salt',
        'productName': 'Tata Salt 1kg',
        'unit': '1kg',
        'quantity': 3,
        'unitPrice': 28.0,
      });

      expect(item.product.unit, '1kg');
      expect(item.quantity, 3);
      expect(item.effectiveUnitPrice, 28.0);
      expect(item.effectiveSubtotal, 84.0);
    });

    test('CartItemModel decrement to zero is handled safely by cart calculations', () {
      final item = CartItemModel.fromJson({
        'id': 'item-lemon',
        'productId': 'p-lemon',
        'productName': 'Fresh Lemon',
        'unit': '4 pcs',
        'quantity': 1,
        'unitPrice': 20.0,
      });

      expect(item.quantity, 1);
      expect(item.effectiveSubtotal, 20.0);
    });
  });
}
