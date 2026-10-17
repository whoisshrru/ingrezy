import 'package:flutter_test/flutter_test.dart';
import 'package:ingrezy_mobile/models/product_model.dart';
import 'package:ingrezy_mobile/models/recipe_model.dart';
import 'package:ingrezy_mobile/models/themealdb_adapter.dart';
import 'package:ingrezy_mobile/services/recipe_service.dart';
import 'package:ingrezy_mobile/utils/content_localizer.dart';

void main() {
  group('TheMealDbAdapter Unit Tests', () {
    final sampleMealDbJson = {
      'idMeal': '52772',
      'strMeal': 'Teriyaki Chicken Casserole',
      'strCategory': 'Chicken',
      'strArea': 'Japanese',
      'strInstructions':
          'Preheat oven to 350° F. Combine soy sauce, 1/2 cup water, brown sugar, ginger and garlic in a small saucepan...',
      'strMealThumb': 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
      'strIngredient1': 'soy sauce',
      'strIngredient2': 'water',
      'strIngredient3': 'brown sugar',
      'strIngredient4': 'ground ginger',
      'strIngredient5': 'minced garlic',
      'strIngredient6': 'cornstarch',
      'strIngredient7': 'chicken breasts',
      'strIngredient8': 'stir-fry vegetables',
      'strIngredient9': 'brown rice',
      'strIngredient10': '',
      'strIngredient11': '   ',
      'strIngredient12': '',
      'strIngredient13': '',
      'strIngredient14': '',
      'strIngredient15': '',
      'strIngredient16': null,
      'strIngredient17': 'null',
      'strIngredient18': null,
      'strIngredient19': null,
      'strIngredient20': null,
      'strMeasure1': '3/4 cup',
      'strMeasure2': '1/2 cup',
      'strMeasure3': '1/4 cup',
      'strMeasure4': '1/2 teaspoon',
      'strMeasure5': '1/2 teaspoon',
      'strMeasure6': '4 Tablespoons',
      'strMeasure7': '2',
      'strMeasure8': '1 (12 oz.)',
      'strMeasure9': '3 cups',
      'strMeasure10': '',
      'strMeasure11': '',
      'strMeasure12': '',
      'strMeasure13': '',
      'strMeasure14': '',
      'strMeasure15': '',
      'strMeasure16': null,
      'strMeasure17': null,
      'strMeasure18': null,
      'strMeasure19': null,
      'strMeasure20': null,
    };

    test('isMealDbJson accurately identifies TheMealDB payloads', () {
      expect(TheMealDbAdapter.isMealDbJson(sampleMealDbJson), isTrue);
      expect(TheMealDbAdapter.isMealDbJson({'meals': [sampleMealDbJson]}), isTrue);
      expect(TheMealDbAdapter.isMealDbJson({'strMeal': 'Pasta'}), isTrue);
      expect(TheMealDbAdapter.isMealDbJson({'strIngredient1': 'Salt'}), isTrue);

      // Ingrezy catalog recipe should NOT match TheMealDB format
      final ingrezyJson = {
        'id': 'recipe-123',
        'title': 'Paneer Butter Masala',
        'slug': 'paneer-butter-masala',
        'ingredients': [
          {'productId': 'prod-1', 'name': 'Paneer', 'quantity': 200, 'unit': 'g'}
        ],
      };
      expect(TheMealDbAdapter.isMealDbJson(ingrezyJson), isFalse);
    });

    test('Converts TheMealDB JSON to full RecipeModel without losing data', () {
      final recipe = TheMealDbAdapter.toRecipeModel(sampleMealDbJson);

      expect(recipe.id, '52772');
      expect(recipe.title, 'Teriyaki Chicken Casserole');
      expect(recipe.cuisine, 'Japanese');
      expect(recipe.dietaryType, DietaryType.NON_VEG);
      expect(recipe.imageUrl, 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg');
      expect(recipe.instructions, startsWith('Preheat oven to 350° F.'));
      expect(recipe.ingredients.length, 9);
    });

    test('RecipeModel.fromJson seamlessly dispatches TheMealDB JSON', () {
      final recipe = RecipeModel.fromJson(sampleMealDbJson);
      expect(recipe.id, '52772');
      expect(recipe.ingredients.length, 9);
      expect(recipe.ingredients[0].name, 'soy sauce');
      expect(recipe.ingredients[0].formattedQuantity, '3/4 cup');
    });

    test('RecipeModel.fromJson handles TheMealDB payload wrapped in {"meals": [...]}', () {
      final wrappedJson = {'meals': [sampleMealDbJson]};
      final recipe = RecipeModel.fromJson(wrappedJson);
      expect(recipe.id, '52772');
      expect(recipe.title, 'Teriyaki Chicken Casserole');
      expect(recipe.ingredients.length, 9);
    });

    test('Preserves original measurement text exactly without inventing numbers or units', () {
      final customJson = {
        'idMeal': '99999',
        'strMeal': 'Special Roast',
        'strIngredient1': 'Flour',
        'strMeasure1': '1 pound',
        'strIngredient2': 'Milk',
        'strMeasure2': '1/4 cup',
        'strIngredient3': 'Cinnamon',
        'strMeasure3': 'sprinkling',
        'strIngredient4': 'Salt',
        'strMeasure4': 'to taste',
        'strIngredient5': 'Nutmeg',
        'strMeasure5': 'pinch',
        'strIngredient6': 'Sugar',
        'strMeasure6': '  2 tbsp  ', // Leading/trailing whitespace should be trimmed
      };

      final ingredients = TheMealDbAdapter.parseIngredients(customJson);

      expect(ingredients.length, 6);

      expect(ingredients[0].name, 'Flour');
      expect(ingredients[0].rawMeasure, '1 pound');
      expect(ingredients[0].formattedQuantity, '1 pound');
      expect(ingredients[0].quantity, 0.0);
      expect(ingredients[0].unit, '');

      expect(ingredients[1].name, 'Milk');
      expect(ingredients[1].rawMeasure, '1/4 cup');
      expect(ingredients[1].formattedQuantity, '1/4 cup');

      expect(ingredients[2].name, 'Cinnamon');
      expect(ingredients[2].rawMeasure, 'sprinkling');
      expect(ingredients[2].formattedQuantity, 'sprinkling');

      expect(ingredients[3].name, 'Salt');
      expect(ingredients[3].rawMeasure, 'to taste');
      expect(ingredients[3].formattedQuantity, 'to taste');

      expect(ingredients[4].name, 'Nutmeg');
      expect(ingredients[4].rawMeasure, 'pinch');
      expect(ingredients[4].formattedQuantity, 'pinch');

      expect(ingredients[5].name, 'Sugar');
      expect(ingredients[5].rawMeasure, '2 tbsp');
      expect(ingredients[5].formattedQuantity, '2 tbsp');
    });

    test('Handles empty strings, whitespace, and null values in ingredients', () {
      final edgeCaseJson = {
        'idMeal': '11111',
        'strMeal': 'Edge Case Meal',
        'strIngredient1': '', // empty string
        'strMeasure1': '1 cup',
        'strIngredient2': '   ', // whitespace only
        'strMeasure2': '2 cups',
        'strIngredient3': '\t\n', // tabs and newlines
        'strMeasure3': '3 cups',
        'strIngredient4': null, // null
        'strMeasure4': '4 cups',
        'strIngredient5': 'null', // string "null"
        'strMeasure5': '5 cups',
        'strIngredient6': 'NULL', // uppercase "NULL"
        'strMeasure6': '6 cups',
        'strIngredient7': 'Valid Onion',
        'strMeasure7': '2 pieces',
      };

      final ingredients = TheMealDbAdapter.parseIngredients(edgeCaseJson);

      // Only 'Valid Onion' should be included
      expect(ingredients.length, 1);
      expect(ingredients.first.name, 'Valid Onion');
      expect(ingredients.first.rawMeasure, '2 pieces');
      expect(ingredients.first.formattedQuantity, '2 pieces');
    });

    test('Handles null, empty, whitespace, and "null" measurements cleanly', () {
      final measureEdgeCases = {
        'idMeal': '22222',
        'strMeal': 'Measure Edge Cases',
        'strIngredient1': 'Ginger',
        'strMeasure1': null, // null measure
        'strIngredient2': 'Garlic',
        'strMeasure2': '', // empty string measure
        'strIngredient3': 'Chilli',
        'strMeasure3': '    ', // whitespace only
        'strIngredient4': 'Coriander',
        'strMeasure4': 'null', // string "null"
        'strIngredient5': 'Turmeric',
        'strMeasure5': 'NULL', // string "NULL"
      };

      final ingredients = TheMealDbAdapter.parseIngredients(measureEdgeCases);

      expect(ingredients.length, 5);
      for (final ing in ingredients) {
        expect(ing.rawMeasure, isNull);
        expect(ing.formattedQuantity, isEmpty);
      }
    });

    test('Guarantees unmatched external ingredients do not invent product IDs or catalog matches', () {
      final ingredients = TheMealDbAdapter.parseIngredients(sampleMealDbJson);

      for (final ing in ingredients) {
        expect(ing.productId, isEmpty);
        expect(ing.product, isNull);
        expect(ing.hasLinkedProduct, isFalse);
      }
    });

    test('Serving scaling does not invent numbers or corrupt raw measurement text', () {
      final recipe = TheMealDbAdapter.toRecipeModel(sampleMealDbJson);

      final scaledRecipe = recipe.withServings(6); // base is 2

      expect(scaledRecipe.servings, 6);
      expect(scaledRecipe.ingredients.length, 9);

      // Raw measures must remain completely intact
      expect(scaledRecipe.ingredients[0].rawMeasure, '3/4 cup');
      expect(scaledRecipe.ingredients[0].formattedQuantity, '3/4 cup');
      expect(scaledRecipe.ingredients[2].rawMeasure, '1/4 cup');
      expect(scaledRecipe.ingredients[2].formattedQuantity, '1/4 cup');
      expect(scaledRecipe.ingredients[5].rawMeasure, '4 Tablespoons');
      expect(scaledRecipe.ingredients[5].formattedQuantity, '4 Tablespoons');
    });

    test('Ingrezy catalog recipes remain 100% backward compatible', () {
      final ingrezyJson = {
        'id': 'rec-db-1',
        'title': 'Kolhapuri Misal Pav',
        'slug': 'kolhapuri-misal-pav',
        'servings': 2,
        'baseServings': 2,
        'ingredients': [
          {
            'id': 'ing-1',
            'productId': 'prod-onion-123',
            'name': 'Farm Fresh Onions',
            'quantity': 200.0,
            'baseQuantity': 200.0,
            'unit': 'g',
            'product': {
              'id': 'prod-onion-123',
              'name': 'Farm Fresh Onions',
              'unit': 'g',
              'basePrice': 40.0,
            },
          },
          {
            'id': 'ing-2',
            'productId': 'prod-pav-456',
            'name': 'Fresh Ladi Pav Bread',
            'quantity': 4.0,
            'baseQuantity': 4.0,
            'unit': 'pieces',
          },
        ],
      };

      final recipe = RecipeModel.fromJson(ingrezyJson);

      expect(recipe.id, 'rec-db-1');
      expect(recipe.ingredients.length, 2);
      expect(recipe.ingredients[0].hasLinkedProduct, isTrue);
      expect(recipe.ingredients[0].productId, 'prod-onion-123');
      expect(recipe.ingredients[0].product, isNotNull);
      expect(recipe.ingredients[0].rawMeasure, isNull);
      expect(recipe.ingredients[0].formattedQuantity, '200 g');

      // Scaling works mathematically for catalog recipes
      final scaled = recipe.withServings(4);
      expect(scaled.ingredients[0].quantity, 400.0);
      expect(scaled.ingredients[0].formattedQuantity, '400 g');
      expect(scaled.ingredients[1].quantity, 8.0);
      expect(scaled.ingredients[1].formattedQuantity, '8 pieces');
    });

    test('ContentLocalizer formats Devanagari numerals for rawMeasure in Marathi and Hindi', () {
      final ing1 = RecipeIngredientModel(
        id: '1',
        productId: '',
        name: 'Sugar',
        quantity: 0,
        baseQuantity: 0,
        unit: '',
        rawMeasure: '1/4 cup',
      );

      final ing2 = RecipeIngredientModel(
        id: '2',
        productId: '',
        name: 'Salt',
        quantity: 0,
        baseQuantity: 0,
        unit: '',
        rawMeasure: 'sprinkling',
      );

      final ing3 = RecipeIngredientModel(
        id: '3',
        productId: '',
        name: 'Flour',
        quantity: 0,
        baseQuantity: 0,
        unit: '',
        rawMeasure: '1 pound',
      );

      // In English, text is untouched
      expect(ContentLocalizer.formatDigits(ing1.rawMeasure!, 'en'), '1/4 cup');
      expect(ContentLocalizer.formatDigits(ing2.rawMeasure!, 'en'), 'sprinkling');
      expect(ContentLocalizer.formatDigits(ing3.rawMeasure!, 'en'), '1 pound');

      // In Marathi / Hindi, numerals convert to Devanagari while preserving wording
      expect(ContentLocalizer.formatDigits(ing1.rawMeasure!, 'mr'), '१/४ cup');
      expect(ContentLocalizer.formatDigits(ing2.rawMeasure!, 'mr'), 'sprinkling');
      expect(ContentLocalizer.formatDigits(ing3.rawMeasure!, 'mr'), '१ pound');

      expect(ContentLocalizer.formatDigits(ing1.rawMeasure!, 'hi'), '१/४ cup');
      expect(ContentLocalizer.formatDigits(ing2.rawMeasure!, 'hi'), 'sprinkling');
      expect(ContentLocalizer.formatDigits(ing3.rawMeasure!, 'hi'), '१ pound');
    });

    test('Recipe 52771 (Spicy Arrabiata Penne) parses correctly with 1 pound, 1/4 cup, sprinkling', () {
      final penneJson = {
        'idMeal': '52771',
        'strMeal': 'Spicy Arrabiata Penne',
        'strCategory': 'Vegetarian',
        'strArea': 'Italian',
        'strInstructions': 'Bring a large pot of water to a boil. Add kosher salt to the boiling water, then add the pasta...',
        'strMealThumb': 'https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg',
        'strIngredient1': 'penne rigate',
        'strIngredient2': 'olive oil',
        'strIngredient3': 'garlic',
        'strIngredient4': 'chopped tomatoes',
        'strIngredient5': 'red chilli flakes',
        'strIngredient6': 'italian seasoning',
        'strIngredient7': 'basil',
        'strIngredient8': 'Parmigiano-Reggiano',
        'strIngredient9': '',
        'strMeasure1': '1 pound',
        'strMeasure2': '1/4 cup',
        'strMeasure3': '3 cloves',
        'strMeasure4': '1 tin ',
        'strMeasure5': '1/2 teaspoon',
        'strMeasure6': '1/2 teaspoon',
        'strMeasure7': '6 leaves',
        'strMeasure8': 'sprinkling',
        'strMeasure9': '',
      };

      final recipe = RecipeModel.fromJson(penneJson);

      expect(recipe.id, '52771');
      expect(recipe.title, 'Spicy Arrabiata Penne');
      expect(recipe.cuisine, 'Italian');
      expect(recipe.dietaryType, DietaryType.VEG);
      expect(recipe.imageUrl, 'https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg');
      expect(recipe.instructions, startsWith('Bring a large pot of water to a boil.'));
      expect(recipe.ingredients.length, 8);

      expect(recipe.ingredients[0].name, 'penne rigate');
      expect(recipe.ingredients[0].formattedQuantity, '1 pound');
      expect(recipe.ingredients[0].hasLinkedProduct, isFalse);

      expect(recipe.ingredients[1].name, 'olive oil');
      expect(recipe.ingredients[1].formattedQuantity, '1/4 cup');

      expect(recipe.ingredients[7].name, 'Parmigiano-Reggiano');
      expect(recipe.ingredients[7].formattedQuantity, 'sprinkling');
    });

    test('RecipeService.getMealDbRecipeById fetches and parses 52771 live from TheMealDB', () async {
      final res = await RecipeService.getMealDbRecipeById('52771');

      expect(res.isSuccess, isTrue);
      expect(res.data, isNotNull);

      final recipe = res.data!;
      expect(recipe.id, '52771');
      expect(recipe.title, 'Spicy Arrabiata Penne');
      expect(recipe.ingredients.length, 8);
      expect(recipe.ingredients[0].formattedQuantity, '1 pound');
      expect(recipe.ingredients[1].formattedQuantity, '1/4 cup');
      expect(recipe.ingredients[7].formattedQuantity, 'sprinkling');
    });

    test('RecipeService.getRecipeById seamlessly resolves numeric external ID 52771', () async {
      final res = await RecipeService.getRecipeById('52771');

      expect(res.isSuccess, isTrue);
      expect(res.data, isNotNull);

      final recipe = res.data!;
      expect(recipe.id.isNotEmpty, isTrue);
      expect(recipe.externalId == 'themealdb:52771' || recipe.id == '52771', isTrue);
      expect(recipe.title, 'Spicy Arrabiata Penne');
      expect(recipe.instructions, isNotEmpty);
      expect(recipe.imageUrl, isNotEmpty);
    });

    test('RecipeService.searchMealDb returns Spicy Arrabiata Penne with Italian cuisine and strMealThumb', () async {
      final results = await RecipeService.searchMealDb('Arrabiata');

      expect(results.isNotEmpty, isTrue);
      final arrabiata = results.firstWhere((r) => r.id == '52771');
      expect(arrabiata.title, 'Spicy Arrabiata Penne');
      expect(arrabiata.cuisine, 'Italian');
      expect(arrabiata.imageUrl, 'https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg');
      expect(arrabiata.dietaryType, DietaryType.VEG);
    });

    test('RecipeModel.fromJson fallback maps strArea to Italian and does not default to Indian', () {
      final json = {
        'idMeal': '99999',
        'strMeal': 'Special Penne',
        'strMealThumb': 'https://example.com/penne.jpg',
        'strArea': 'Italian',
        'ingredients': <Map<String, dynamic>>[],
      };

      final recipe = RecipeModel.fromJson(json);
      expect(recipe.id, '99999');
      expect(recipe.title, 'Special Penne');
      expect(recipe.cuisine, 'Italian');
      expect(recipe.imageUrl, 'https://example.com/penne.jpg');
    });

    test('RecipeModel.fromJson defaults unknown external cuisine to International, not Indian', () {
      final json = {
        'idMeal': '88888',
        'strMeal': 'Mystery Soup',
        'strArea': 'Unknown',
        'ingredients': <Map<String, dynamic>>[],
      };

      final recipe = RecipeModel.fromJson(json);
      expect(recipe.cuisine, 'International');
    });
  });
}
