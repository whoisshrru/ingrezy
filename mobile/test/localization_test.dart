import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:ingrezy_mobile/l10n/generated/app_localizations.dart';
import 'package:ingrezy_mobile/l10n/generated/app_localizations_en.dart';
import 'package:ingrezy_mobile/l10n/generated/app_localizations_hi.dart';
import 'package:ingrezy_mobile/l10n/generated/app_localizations_mr.dart';
import 'package:ingrezy_mobile/models/order_model.dart';
import 'package:ingrezy_mobile/models/product_model.dart';
import 'package:ingrezy_mobile/providers/locale_provider.dart';
import 'package:ingrezy_mobile/utils/content_localizer.dart';
import 'package:ingrezy_mobile/widgets/common_widgets.dart';
import 'package:ingrezy_mobile/widgets/language_selector_sheet.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('LocaleProvider Unit & Persistence Tests', () {
    test('Default locale is English (en) when no preference is stored', () async {
      SharedPreferences.setMockInitialValues({});
      final provider = LocaleProvider();
      await provider.loadSavedLocale();

      expect(provider.locale.languageCode, 'en');
      expect(provider.localeCode, 'en');
      expect(provider.localeDisplayName, 'English');
    });

    test('Loads persisted Marathi locale (mr) from SharedPreferences', () async {
      SharedPreferences.setMockInitialValues({'app_locale_code': 'mr'});
      final provider = LocaleProvider();
      await provider.loadSavedLocale();

      expect(provider.locale.languageCode, 'mr');
      expect(provider.localeCode, 'mr');
      expect(provider.localeDisplayName, 'मराठी');
    });

    test('Loads persisted Hindi locale (hi) from SharedPreferences', () async {
      SharedPreferences.setMockInitialValues({'app_locale_code': 'hi'});
      final provider = LocaleProvider();
      await provider.loadSavedLocale();

      expect(provider.locale.languageCode, 'hi');
      expect(provider.localeCode, 'hi');
      expect(provider.localeDisplayName, 'हिंदी');
    });

    test('Falls back safely to English when persisted code is unsupported', () async {
      SharedPreferences.setMockInitialValues({'app_locale_code': 'fr'});
      final provider = LocaleProvider();
      await provider.loadSavedLocale();

      expect(provider.locale.languageCode, 'en');
    });

    test('setLocale switches locale and persists to SharedPreferences', () async {
      SharedPreferences.setMockInitialValues({});
      final provider = LocaleProvider();
      await provider.loadSavedLocale();

      bool notified = false;
      provider.addListener(() => notified = true);

      await provider.setLocale(const Locale('mr'));
      expect(provider.locale.languageCode, 'mr');
      expect(notified, isTrue);

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('app_locale_code'), 'mr');

      // Switch to Hindi
      await provider.setLocale(const Locale('hi'));
      expect(provider.locale.languageCode, 'hi');
      expect(prefs.getString('app_locale_code'), 'hi');

      // Switch back to English
      await provider.setLocale(const Locale('en'));
      expect(provider.locale.languageCode, 'en');
      expect(prefs.getString('app_locale_code'), 'en');
    });

    test('supportedLocales contains en, mr, and hi', () {
      final supported = LocaleProvider.supportedLocales;
      final codes = supported.map((l) => l.languageCode).toList();

      expect(codes, containsAll(['en', 'mr', 'hi']));
      expect(codes.length, 3);
    });
  });

  group('ARB Translations Catalog Verification', () {
    final en = AppLocalizationsEn();
    final mr = AppLocalizationsMr();
    final hi = AppLocalizationsHi();

    test('Core Brand and Navigation Labels', () {
      expect(en.appName, 'Ingrezy');
      expect(mr.appName, 'इंग्रेझी');
      expect(hi.appName, 'इंग्रेज़ी');

      expect(en.navGrocery, 'Grocery');
      expect(mr.navGrocery, 'किराणा');
      expect(hi.navGrocery, 'किराना');

      expect(en.navRecipes, 'Recipes');
      expect(mr.navRecipes, 'पाककृती');
      expect(hi.navRecipes, 'रेसिपीज़');

      expect(en.navCart, 'Cart');
      expect(mr.navCart, 'कार्ट');
      expect(hi.navCart, 'कार्ट');

      expect(en.navOrders, 'Orders');
      expect(mr.navOrders, 'ऑर्डर्स');
      expect(hi.navOrders, 'ऑर्डर्स');
    });

    test('Customer Shopping & Smart Recipe Strings', () {
      expect(en.smartRecipes, 'Smart Recipes');
      expect(mr.smartRecipes, 'स्मार्ट पाककृती');
      expect(hi.smartRecipes, 'स्मार्ट रेसिपीज़');

      expect(en.iHaveThis, 'I have this');
      expect(mr.iHaveThis, 'माझ्याकडे आहे');
      expect(hi.iHaveThis, 'मेरे पास है');

      expect(en.tenMinsDelivery, '10 MINS DELIVERY');
      expect(mr.tenMinsDelivery, '१० मिनिटांत डिलिव्हरी');
      expect(hi.tenMinsDelivery, '१० मिनट में डिलीवरी');

      expect(en.free, 'FREE');
      expect(mr.free, 'मोफत');
      expect(hi.free, 'मुफ्त');
    });

    test('Order Status Strings Across All Locales', () {
      expect(en.statusPlaced, 'Order Placed');
      expect(mr.statusPlaced, 'ऑर्डर नोंदवली');
      expect(hi.statusPlaced, 'ऑर्डर दर्ज हुआ');

      expect(en.statusConfirmed, 'Confirmed');
      expect(mr.statusConfirmed, 'पुष्टी झाली');
      expect(hi.statusConfirmed, 'पुष्टि हुई');

      expect(en.statusPreparing, 'Preparing');
      expect(mr.statusPreparing, 'पॅकिंग होत आहे');
      expect(hi.statusPreparing, 'पैक हो रहा है');

      expect(en.statusReadyForPickup, 'Ready for Pickup');
      expect(mr.statusReadyForPickup, 'उचलण्यासाठी तयार');
      expect(hi.statusReadyForPickup, 'उठाने के लिए तैयार');

      expect(en.statusOutForDelivery, 'Out for Delivery');
      expect(mr.statusOutForDelivery, 'डिलिव्हरीसाठी निघाले');
      expect(hi.statusOutForDelivery, 'डिलीवरी के लिए निकला');

      expect(en.statusDelivered, 'Delivered');
      expect(mr.statusDelivered, 'डिलिव्हर झाले');
      expect(hi.statusDelivered, 'डिलीवर हो गया');

      expect(en.statusCancelled, 'Cancelled');
      expect(mr.statusCancelled, 'रद्द झाले');
      expect(hi.statusCancelled, 'रद्द हुआ');
    });

    test('Retailer & Delivery Partner Hub Strings', () {
      expect(en.retailerHub, 'Dark Store Retailer Hub');
      expect(mr.retailerHub, 'डार्क स्टोअर विक्रेता केंद्र');
      expect(hi.retailerHub, 'डार्क स्टोर रिटेलर हब');

      expect(en.deliveryHub, 'Delivery Partner Hub');
      expect(mr.deliveryHub, 'डिलिव्हरी पार्टनर केंद्र');
      expect(hi.deliveryHub, 'डिलीवरी पार्टनर हब');

      expect(en.verifyOtpTitle, 'Verify Customer OTP');
      expect(mr.verifyOtpTitle, 'ग्राहकाचा OTP पडताळा');
      expect(hi.verifyOtpTitle, 'ग्राहक का OTP सत्यापित करें');

      expect(en.acceptTaskAction, 'Accept Delivery Task');
      expect(mr.acceptTaskAction, 'डिलिव्हरी स्वीकारा');
      expect(hi.acceptTaskAction, 'डिलीवरी स्वीकार करें');
    });

    test('Interpolated Strings With Dynamic Placeholders', () {
      expect(en.baseRecipeServes(4), 'Base recipe serves 4 • Quantities auto-scale');
      expect(mr.baseRecipeServes(4), 'मूळ रेसिपी 4 लोकांसाठी आहे • प्रमाण आपोआप बदलेल');
      expect(hi.baseRecipeServes(4), 'मूल रेसिपी 4 व्यक्तियों के लिए है • मात्रा स्वतः बदल जाएगी');

      expect(en.inPantryBadge(2), '2 in pantry');
      expect(mr.inPantryBadge(2), '2 घरात उपलब्ध');
      expect(hi.inPantryBadge(2), '2 घर पर उपलब्ध');

      expect(en.orderNumber('ING-1234'), 'Order #ING-1234');
      expect(mr.orderNumber('ING-1234'), 'ऑर्डर #ING-1234');
      expect(hi.orderNumber('ING-1234'), 'ऑर्डर #ING-1234');

      expect(en.pickupFromStore('Kothrud Store'), 'Pickup: Kothrud Store');
      expect(mr.pickupFromStore('Kothrud Store'), 'पिकअप: Kothrud Store');
      expect(hi.pickupFromStore('Kothrud Store'), 'पिकअप: Kothrud Store');
    });
  });

  group('Localized Status & Dietary Helpers Tests', () {
    test('getLocalizedOrderStatus returns correct string for every OrderStatus', () {
      final en = AppLocalizationsEn();
      final mr = AppLocalizationsMr();
      final hi = AppLocalizationsHi();

      for (final status in OrderStatus.values) {
        final enLabel = getLocalizedOrderStatus(status, en);
        final mrLabel = getLocalizedOrderStatus(status, mr);
        final hiLabel = getLocalizedOrderStatus(status, hi);

        expect(enLabel.isNotEmpty, isTrue);
        expect(mrLabel.isNotEmpty, isTrue);
        expect(hiLabel.isNotEmpty, isTrue);
      }
    });

    test('getLocalizedDietaryType returns correct badge string', () {
      final en = AppLocalizationsEn();
      final mr = AppLocalizationsMr();

      expect(getLocalizedDietaryType(DietaryType.VEG, en), 'VEG');
      expect(getLocalizedDietaryType(DietaryType.NON_VEG, en), 'NON-VEG');
      expect(getLocalizedDietaryType(DietaryType.CONTAINS_EGG, en), 'EGG');

      expect(getLocalizedDietaryType(DietaryType.VEG, mr), 'शाकाहारी');
      expect(getLocalizedDietaryType(DietaryType.NON_VEG, mr), 'मांसाहारी');
      expect(getLocalizedDietaryType(DietaryType.CONTAINS_EGG, mr), 'अंडी');
    });
  });

  group('Widget & Interactive Locale Switching Tests', () {
    testWidgets('App reacts to locale change dynamically without restart', (tester) async {
      SharedPreferences.setMockInitialValues({});
      final localeProvider = LocaleProvider();
      await localeProvider.loadSavedLocale();

      await tester.pumpWidget(
        ChangeNotifierProvider<LocaleProvider>.value(
          value: localeProvider,
          child: Consumer<LocaleProvider>(
            builder: (context, prov, _) {
              return MaterialApp(
                locale: prov.locale,
                localizationsDelegates: AppLocalizations.localizationsDelegates,
                supportedLocales: AppLocalizations.supportedLocales,
                home: Builder(
                  builder: (ctx) {
                    final l10n = AppLocalizations.of(ctx);
                    return Scaffold(
                      appBar: AppBar(
                        title: Text(l10n.appName),
                        actions: const [LanguageSelectorButton()],
                      ),
                      body: Column(
                        children: [
                          Text(l10n.navGrocery),
                          Text(l10n.smartRecipes),
                          Text(l10n.statusDelivered),
                        ],
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Initial state is English
      expect(find.text('Ingrezy'), findsOneWidget);
      expect(find.text('Grocery'), findsOneWidget);
      expect(find.text('Smart Recipes'), findsOneWidget);
      expect(find.text('Delivered'), findsOneWidget);
      expect(find.text('EN'), findsOneWidget);

      // Switch to Marathi via provider
      await localeProvider.setLocale(const Locale('mr'));
      await tester.pumpAndSettle();

      // Verified live reactive switch to Marathi
      expect(find.text('किराणा'), findsOneWidget);
      expect(find.text('स्मार्ट पाककृती'), findsOneWidget);
      expect(find.text('डिलिव्हर झाले'), findsOneWidget);
      expect(find.text('MR'), findsOneWidget);

      // Switch to Hindi via provider
      await localeProvider.setLocale(const Locale('hi'));
      await tester.pumpAndSettle();

      // Verified live reactive switch to Hindi
      expect(find.text('किराना'), findsOneWidget);
      expect(find.text('स्मार्ट रेसिपीज़'), findsOneWidget);
      expect(find.text('डिलीवर हो गया'), findsOneWidget);
      expect(find.text('HI'), findsOneWidget);
    });

    testWidgets('LanguageSelectorSheet opens and displays all three options', (tester) async {
      SharedPreferences.setMockInitialValues({});
      final localeProvider = LocaleProvider();
      await localeProvider.loadSavedLocale();

      await tester.pumpWidget(
        ChangeNotifierProvider<LocaleProvider>.value(
          value: localeProvider,
          child: Consumer<LocaleProvider>(
            builder: (context, prov, _) {
              return MaterialApp(
                locale: prov.locale,
                localizationsDelegates: AppLocalizations.localizationsDelegates,
                supportedLocales: AppLocalizations.supportedLocales,
                home: Scaffold(
                  appBar: AppBar(
                    actions: const [LanguageSelectorButton()],
                  ),
                ),
              );
            },
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Tap LanguageSelectorButton to open modal bottom sheet
      await tester.tap(find.byType(LanguageSelectorButton));
      await tester.pumpAndSettle();

      // Check bottom sheet contents
      expect(find.byType(LanguageSelectorSheet), findsOneWidget);
      expect(find.text('English'), findsOneWidget);
      expect(find.text('मराठी'), findsOneWidget);
      expect(find.text('हिंदी'), findsOneWidget);

      // Tap on Marathi option in sheet
      await tester.tap(find.text('मराठी'));
      await tester.pumpAndSettle();

      // Provider locale must now be Marathi and sheet dismissed
      expect(localeProvider.locale.languageCode, 'mr');
      expect(find.byType(LanguageSelectorSheet), findsNothing);
      expect(find.text('MR'), findsOneWidget);
    });
  });

  group('Dynamic Content Localizer Tests', () {
    test('Product name localization across locales', () {
      expect(ContentLocalizer.productName('Farm Fresh Onions', 'mr'), 'ताजे कांदे');
      expect(ContentLocalizer.productName('Farm Fresh Onions', 'hi'), 'ताजा प्याज');
      expect(ContentLocalizer.productName('Farm Fresh Onions', 'en'), 'Farm Fresh Onions');

      expect(ContentLocalizer.productName('Fresh Chicken Curry Cut', 'mr'), 'ताजे चिकन करी कट');
      expect(ContentLocalizer.productName('Fresh Chicken Curry Cut', 'hi'), 'ताजा चिकन करी कट');

      expect(ContentLocalizer.productName('Amul Table Butter', 'mr'), 'अमुल टेबल बटर');
      expect(ContentLocalizer.productName('Amul Table Butter', 'hi'), 'अमूल टेबल बटर');

      expect(ContentLocalizer.productName('Fresh Ladi Pav Bread', 'mr'), 'ताजा लादी पाव');
      expect(ContentLocalizer.productName('Fresh Ladi Pav Bread', 'hi'), 'ताजा लादी पाव');

      expect(ContentLocalizer.productName('Veg Hakka Noodles', 'mr'), 'व्हेज हक्का नूडल्स');
      expect(ContentLocalizer.productName('Veg Hakka Noodles', 'hi'), 'वेज हक्का नूडल्स');
    });

    test('Unit & packaging localization across locales', () {
      expect(ContentLocalizer.unit('1kg', 'mr'), '१ किलो');
      expect(ContentLocalizer.unit('1kg', 'hi'), '१ किग्रा');
      expect(ContentLocalizer.unit('1kg', 'en'), '1kg');

      expect(ContentLocalizer.unit('500g tray', 'mr'), '५०० ग्रॅम ट्रे');
      expect(ContentLocalizer.unit('500g tray', 'hi'), '५०० ग्राम ट्रे');

      expect(ContentLocalizer.unit('Pack of 6', 'mr'), '६ चा पॅक');
      expect(ContentLocalizer.unit('Pack of 6', 'hi'), '६ का पैक');

      expect(ContentLocalizer.unit('500ml pouch', 'mr'), '५०० मिली पाऊच');
      expect(ContentLocalizer.unit('500ml pouch', 'hi'), '५०० मिली पाउच');
    });

    test('Recipe title & cuisine localization across locales', () {
      expect(ContentLocalizer.recipeTitle('Paneer Butter Masala', 'mr'), 'पनीर बटर मसाला');
      expect(ContentLocalizer.recipeTitle('Paneer Butter Masala', 'hi'), 'पनीर बटर मसाला');
      expect(ContentLocalizer.recipeTitle('Paneer Butter Masala', 'en'), 'Paneer Butter Masala');

      expect(ContentLocalizer.recipeTitle('Kolhapuri Misal Pav', 'mr'), 'कोल्हापुरी मिसळ पाव');
      expect(ContentLocalizer.recipeTitle('Kolhapuri Misal Pav', 'hi'), 'कोल्हापुरी मिसल पाव');

      expect(ContentLocalizer.recipeCuisine('South Indian', 'mr'), 'दाक्षिणात्य');
      expect(ContentLocalizer.recipeCuisine('South Indian', 'hi'), 'दक्षिण भारतीय');
      expect(ContentLocalizer.recipeCuisine('Maharashtrian', 'mr'), 'महाराष्ट्रीयन');
    });

    test('Recipe description & instructions localization across locales', () {
      final descMr = ContentLocalizer.recipeDescription(
        'Rich and creamy cottage cheese curry in a velvety tomato-butter gravy.',
        'mr',
        recipeTitle: 'Paneer Butter Masala',
      );
      expect(descMr, contains('पनीर'));

      final instMr = ContentLocalizer.recipeInstructions(
        '1. Heat butter in a pan.',
        'mr',
        recipeTitle: 'Paneer Butter Masala',
      );
      expect(instMr, contains('पॅनमध्ये बटर'));
    });

    test('Ingredient formatted quantities and notes localization', () {
      expect(ContentLocalizer.ingredientQuantity(300, 'g', 'mr'), '३०० ग्रॅम');
      expect(ContentLocalizer.ingredientQuantity(300, 'g', 'hi'), '३०० ग्राम');
      expect(ContentLocalizer.ingredientQuantity(300, 'g', 'en'), '300 g');

      expect(ContentLocalizer.ingredientQuantity(2, 'pieces', 'mr'), '२ नग');
      expect(ContentLocalizer.ingredientQuantity(2, 'pieces', 'hi'), '२ नग');

      expect(ContentLocalizer.ingredientNotes('Pureed fresh', 'mr'), 'ताजी प्युरी केलेले');
      expect(ContentLocalizer.ingredientNotes('Salted butter', 'mr'), 'खारवलेले बटर');
    });
  });
}
