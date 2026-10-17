import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ingrezy_mobile/l10n/generated/app_localizations.dart';
import 'package:ingrezy_mobile/models/product_model.dart';
import 'package:ingrezy_mobile/models/recipe_model.dart';
import 'package:ingrezy_mobile/screens/customer/recipes_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Recipe Card Rendering & Visibility Tests', () {
    testWidgets('RecipeGridCard renders recipe title, servings, and items even when imageUrl is null/placeholder', (tester) async {
      final recipe = RecipeModel(
        id: '52771',
        title: 'Spicy Arrabiata Penne',
        slug: 'spicy-arrabiata-penne',
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 2,
        baseServings: 2,
        difficulty: 'MEDIUM',
        dietaryType: DietaryType.VEG,
        cuisine: 'Italian',
        instructions: 'Cook pasta in salted water...',
        imageUrl: null, // Forces placeholder
        ingredients: [
          RecipeIngredientModel(
            id: 'ing-1',
            productId: '',
            name: 'penne rigate',
            quantity: 0,
            baseQuantity: 0,
            unit: '',
            rawMeasure: '1 pound',
          ),
          RecipeIngredientModel(
            id: 'ing-2',
            productId: '',
            name: 'olive oil',
            quantity: 0,
            baseQuantity: 0,
            unit: '',
            rawMeasure: '1/4 cup',
          ),
        ],
      );

      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          locale: const Locale('en'),
          home: Scaffold(
            body: Center(
              child: SizedBox(
                width: 300,
                child: RecipeGridCard(recipe: recipe),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Card title is visible
      expect(find.text('Spicy Arrabiata Penne'), findsWidgets);
      // Servings is visible
      expect(find.text('2 Servings'), findsOneWidget);
      // Item count is visible
      expect(find.text('2 Items'), findsOneWidget);
      // Veg status badge is rendered
      expect(find.text('Veg'), findsOneWidget);
      // Placeholder icon is rendered
      expect(find.byIcon(Icons.restaurant_menu_rounded), findsOneWidget);
    });

    testWidgets('RecipeGridCard renders recipe card details with external image URL', (tester) async {
      final recipe = RecipeModel(
        id: '52771',
        title: 'Spicy Arrabiata Penne',
        slug: 'spicy-arrabiata-penne',
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        servings: 4,
        baseServings: 4,
        difficulty: 'MEDIUM',
        dietaryType: DietaryType.VEG,
        cuisine: 'Italian',
        instructions: 'Cook pasta...',
        imageUrl: 'https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg',
        ingredients: [
          RecipeIngredientModel(
            id: 'ing-1',
            productId: '',
            name: 'penne rigate',
            quantity: 0,
            baseQuantity: 0,
            unit: '',
            rawMeasure: '1 pound',
          ),
        ],
      );

      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          locale: const Locale('en'),
          home: Scaffold(
            body: Center(
              child: SizedBox(
                width: 300,
                child: RecipeGridCard(recipe: recipe),
              ),
            ),
          ),
        ),
      );
      await tester.pump();

      // Verify title is rendered
      expect(find.text('Spicy Arrabiata Penne'), findsWidgets);
      // Servings is visible
      expect(find.text('4 Servings'), findsOneWidget);
      // Items count is visible
      expect(find.text('1 Items'), findsOneWidget);
      // Total time pill is visible
      expect(find.text('40m'), findsOneWidget);
    });
  });
}
