import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_hi.dart';
import 'app_localizations_mr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('hi'),
    Locale('mr'),
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'Ingrezy'**
  String get appName;

  /// No description provided for @appTagline.
  ///
  /// In en, this message translates to:
  /// **'Instant 10-Minute Grocery & Smart Recipe Bundling'**
  String get appTagline;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @ok.
  ///
  /// In en, this message translates to:
  /// **'OK'**
  String get ok;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @edit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get edit;

  /// No description provided for @close.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get close;

  /// No description provided for @confirm.
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get confirm;

  /// No description provided for @back.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get back;

  /// No description provided for @search.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get search;

  /// No description provided for @viewAll.
  ///
  /// In en, this message translates to:
  /// **'See All'**
  String get viewAll;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading...'**
  String get loading;

  /// No description provided for @error.
  ///
  /// In en, this message translates to:
  /// **'Error'**
  String get error;

  /// No description provided for @somethingWentWrong.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong'**
  String get somethingWentWrong;

  /// No description provided for @noInternet.
  ///
  /// In en, this message translates to:
  /// **'No internet connection'**
  String get noInternet;

  /// No description provided for @success.
  ///
  /// In en, this message translates to:
  /// **'Success'**
  String get success;

  /// No description provided for @warning.
  ///
  /// In en, this message translates to:
  /// **'Warning'**
  String get warning;

  /// No description provided for @requiredField.
  ///
  /// In en, this message translates to:
  /// **'This field is required'**
  String get requiredField;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @selectLanguage.
  ///
  /// In en, this message translates to:
  /// **'Select Language'**
  String get selectLanguage;

  /// No description provided for @english.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get english;

  /// No description provided for @marathi.
  ///
  /// In en, this message translates to:
  /// **'मराठी (Marathi)'**
  String get marathi;

  /// No description provided for @hindi.
  ///
  /// In en, this message translates to:
  /// **'हिंदी (Hindi)'**
  String get hindi;

  /// No description provided for @languageChanged.
  ///
  /// In en, this message translates to:
  /// **'Language changed successfully'**
  String get languageChanged;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @logOut.
  ///
  /// In en, this message translates to:
  /// **'Log Out'**
  String get logOut;

  /// No description provided for @logOutConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Log Out'**
  String get logOutConfirmTitle;

  /// No description provided for @logOutConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to log out of Ingrezy?'**
  String get logOutConfirmMessage;

  /// No description provided for @navGrocery.
  ///
  /// In en, this message translates to:
  /// **'Grocery'**
  String get navGrocery;

  /// No description provided for @navRecipes.
  ///
  /// In en, this message translates to:
  /// **'Recipes'**
  String get navRecipes;

  /// No description provided for @navCart.
  ///
  /// In en, this message translates to:
  /// **'Cart'**
  String get navCart;

  /// No description provided for @navOrders.
  ///
  /// In en, this message translates to:
  /// **'Orders'**
  String get navOrders;

  /// No description provided for @welcomeBack.
  ///
  /// In en, this message translates to:
  /// **'Welcome Back'**
  String get welcomeBack;

  /// No description provided for @loginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Log in to your Ingrezy account'**
  String get loginSubtitle;

  /// No description provided for @phoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Phone Number'**
  String get phoneNumber;

  /// No description provided for @phoneHint.
  ///
  /// In en, this message translates to:
  /// **'Enter 10-digit mobile number'**
  String get phoneHint;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @passwordHint.
  ///
  /// In en, this message translates to:
  /// **'Enter your password'**
  String get passwordHint;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Log In'**
  String get login;

  /// No description provided for @loggingIn.
  ///
  /// In en, this message translates to:
  /// **'Logging In...'**
  String get loggingIn;

  /// No description provided for @dontHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account?'**
  String get dontHaveAccount;

  /// No description provided for @signUp.
  ///
  /// In en, this message translates to:
  /// **'Sign Up'**
  String get signUp;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get createAccount;

  /// No description provided for @registerSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Join Ingrezy for 10-minute grocery delivery & smart recipes'**
  String get registerSubtitle;

  /// No description provided for @fullName.
  ///
  /// In en, this message translates to:
  /// **'Full Name'**
  String get fullName;

  /// No description provided for @nameHint.
  ///
  /// In en, this message translates to:
  /// **'Enter your full name'**
  String get nameHint;

  /// No description provided for @emailOptional.
  ///
  /// In en, this message translates to:
  /// **'Email Address (Optional)'**
  String get emailOptional;

  /// No description provided for @emailHint.
  ///
  /// In en, this message translates to:
  /// **'Enter email address'**
  String get emailHint;

  /// No description provided for @passwordCreateHint.
  ///
  /// In en, this message translates to:
  /// **'Create a secure password'**
  String get passwordCreateHint;

  /// No description provided for @selectRole.
  ///
  /// In en, this message translates to:
  /// **'Select Account Type'**
  String get selectRole;

  /// No description provided for @roleCustomer.
  ///
  /// In en, this message translates to:
  /// **'Customer'**
  String get roleCustomer;

  /// No description provided for @roleRetailer.
  ///
  /// In en, this message translates to:
  /// **'Dark Store Retailer'**
  String get roleRetailer;

  /// No description provided for @roleDelivery.
  ///
  /// In en, this message translates to:
  /// **'Delivery Partner'**
  String get roleDelivery;

  /// No description provided for @register.
  ///
  /// In en, this message translates to:
  /// **'Register'**
  String get register;

  /// No description provided for @registering.
  ///
  /// In en, this message translates to:
  /// **'Registering...'**
  String get registering;

  /// No description provided for @alreadyHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account?'**
  String get alreadyHaveAccount;

  /// No description provided for @invalidPhone.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid 10-digit phone number'**
  String get invalidPhone;

  /// No description provided for @invalidPassword.
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 6 characters'**
  String get invalidPassword;

  /// No description provided for @fillAllFields.
  ///
  /// In en, this message translates to:
  /// **'Please fill in all required fields'**
  String get fillAllFields;

  /// No description provided for @loginFailed.
  ///
  /// In en, this message translates to:
  /// **'Login failed. Please check your credentials.'**
  String get loginFailed;

  /// No description provided for @registrationFailed.
  ///
  /// In en, this message translates to:
  /// **'Registration failed. Please try again.'**
  String get registrationFailed;

  /// No description provided for @tenMinsDelivery.
  ///
  /// In en, this message translates to:
  /// **'10 MINS DELIVERY'**
  String get tenMinsDelivery;

  /// No description provided for @selectStoreTitle.
  ///
  /// In en, this message translates to:
  /// **'Select Nearest Dark Store'**
  String get selectStoreTitle;

  /// No description provided for @selectStoreSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Groceries and prices adapt to store micro-warehouse availability.'**
  String get selectStoreSubtitle;

  /// No description provided for @noActiveStores.
  ///
  /// In en, this message translates to:
  /// **'No active stores found'**
  String get noActiveStores;

  /// No description provided for @ingrezyStore.
  ///
  /// In en, this message translates to:
  /// **'Ingrezy Store'**
  String get ingrezyStore;

  /// No description provided for @searchHint.
  ///
  /// In en, this message translates to:
  /// **'Search groceries, dairy, spices...'**
  String get searchHint;

  /// No description provided for @shopByCategory.
  ///
  /// In en, this message translates to:
  /// **'Shop by Category'**
  String get shopByCategory;

  /// No description provided for @allProducts.
  ///
  /// In en, this message translates to:
  /// **'All Products'**
  String get allProducts;

  /// No description provided for @popularGroceries.
  ///
  /// In en, this message translates to:
  /// **'Popular Groceries'**
  String get popularGroceries;

  /// No description provided for @noProductsFound.
  ///
  /// In en, this message translates to:
  /// **'No products found matching your search'**
  String get noProductsFound;

  /// No description provided for @noProductsInCategory.
  ///
  /// In en, this message translates to:
  /// **'No products available in this category'**
  String get noProductsInCategory;

  /// No description provided for @categoryVegetables.
  ///
  /// In en, this message translates to:
  /// **'Vegetables'**
  String get categoryVegetables;

  /// No description provided for @categoryMeat.
  ///
  /// In en, this message translates to:
  /// **'Meat'**
  String get categoryMeat;

  /// No description provided for @categoryDairy.
  ///
  /// In en, this message translates to:
  /// **'Dairy'**
  String get categoryDairy;

  /// No description provided for @categoryBakery.
  ///
  /// In en, this message translates to:
  /// **'Bakery'**
  String get categoryBakery;

  /// No description provided for @categoryPantry.
  ///
  /// In en, this message translates to:
  /// **'Pantry'**
  String get categoryPantry;

  /// No description provided for @categoryGrains.
  ///
  /// In en, this message translates to:
  /// **'Grains'**
  String get categoryGrains;

  /// No description provided for @categoryFruits.
  ///
  /// In en, this message translates to:
  /// **'Fruits'**
  String get categoryFruits;

  /// No description provided for @categoryBeverages.
  ///
  /// In en, this message translates to:
  /// **'Beverages'**
  String get categoryBeverages;

  /// No description provided for @categorySnacks.
  ///
  /// In en, this message translates to:
  /// **'Snacks'**
  String get categorySnacks;

  /// No description provided for @add.
  ///
  /// In en, this message translates to:
  /// **'ADD'**
  String get add;

  /// No description provided for @added.
  ///
  /// In en, this message translates to:
  /// **'Added'**
  String get added;

  /// No description provided for @inCart.
  ///
  /// In en, this message translates to:
  /// **'In Cart'**
  String get inCart;

  /// No description provided for @outOfStock.
  ///
  /// In en, this message translates to:
  /// **'Out of Stock'**
  String get outOfStock;

  /// No description provided for @discontinued.
  ///
  /// In en, this message translates to:
  /// **'Discontinued'**
  String get discontinued;

  /// No description provided for @price.
  ///
  /// In en, this message translates to:
  /// **'Price'**
  String get price;

  /// No description provided for @unitPrice.
  ///
  /// In en, this message translates to:
  /// **'Unit Price'**
  String get unitPrice;

  /// No description provided for @category.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get category;

  /// No description provided for @freshGuarantee.
  ///
  /// In en, this message translates to:
  /// **'100% Quality & Freshness Guarantee'**
  String get freshGuarantee;

  /// No description provided for @standardDelivery.
  ///
  /// In en, this message translates to:
  /// **'Standard Delivery: 10 mins'**
  String get standardDelivery;

  /// No description provided for @productDetails.
  ///
  /// In en, this message translates to:
  /// **'Product Details'**
  String get productDetails;

  /// No description provided for @relatedProducts.
  ///
  /// In en, this message translates to:
  /// **'You Might Also Need'**
  String get relatedProducts;

  /// No description provided for @smartRecipes.
  ///
  /// In en, this message translates to:
  /// **'Smart Recipes'**
  String get smartRecipes;

  /// No description provided for @recipesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Explore delicious dishes and bundle required fresh ingredients in 1 tap.'**
  String get recipesSubtitle;

  /// No description provided for @searchRecipesHint.
  ///
  /// In en, this message translates to:
  /// **'Search recipes by name or cuisine...'**
  String get searchRecipesHint;

  /// No description provided for @cuisine.
  ///
  /// In en, this message translates to:
  /// **'Cuisine'**
  String get cuisine;

  /// No description provided for @difficulty.
  ///
  /// In en, this message translates to:
  /// **'Difficulty'**
  String get difficulty;

  /// No description provided for @allCuisines.
  ///
  /// In en, this message translates to:
  /// **'All Cuisines'**
  String get allCuisines;

  /// No description provided for @allDifficulties.
  ///
  /// In en, this message translates to:
  /// **'All Difficulties'**
  String get allDifficulties;

  /// No description provided for @prepTime.
  ///
  /// In en, this message translates to:
  /// **'Prep Time'**
  String get prepTime;

  /// No description provided for @cookTime.
  ///
  /// In en, this message translates to:
  /// **'Cook Time'**
  String get cookTime;

  /// No description provided for @totalTime.
  ///
  /// In en, this message translates to:
  /// **'Total Time'**
  String get totalTime;

  /// No description provided for @servings.
  ///
  /// In en, this message translates to:
  /// **'Servings'**
  String get servings;

  /// No description provided for @portionAndServings.
  ///
  /// In en, this message translates to:
  /// **'Portion & Servings'**
  String get portionAndServings;

  /// No description provided for @baseRecipeServes.
  ///
  /// In en, this message translates to:
  /// **'Base recipe serves {baseServings} • Quantities auto-scale'**
  String baseRecipeServes(int baseServings);

  /// No description provided for @ingredients.
  ///
  /// In en, this message translates to:
  /// **'Ingredients'**
  String get ingredients;

  /// No description provided for @scaledFor.
  ///
  /// In en, this message translates to:
  /// **'Scaled for {servings} {personText}'**
  String scaledFor(int servings, String personText);

  /// No description provided for @person.
  ///
  /// In en, this message translates to:
  /// **'person'**
  String get person;

  /// No description provided for @people.
  ///
  /// In en, this message translates to:
  /// **'people'**
  String get people;

  /// No description provided for @preparationSteps.
  ///
  /// In en, this message translates to:
  /// **'Preparation Steps'**
  String get preparationSteps;

  /// No description provided for @markInPantryHelp.
  ///
  /// In en, this message translates to:
  /// **'Mark ingredients you already have at home'**
  String get markInPantryHelp;

  /// No description provided for @inPantryBadge.
  ///
  /// In en, this message translates to:
  /// **'{count} in pantry'**
  String inPantryBadge(int count);

  /// No description provided for @inPantry.
  ///
  /// In en, this message translates to:
  /// **'In Pantry'**
  String get inPantry;

  /// No description provided for @iHaveThis.
  ///
  /// In en, this message translates to:
  /// **'I have this'**
  String get iHaveThis;

  /// No description provided for @haveIt.
  ///
  /// In en, this message translates to:
  /// **'Have it?'**
  String get haveIt;

  /// No description provided for @addAllToCart.
  ///
  /// In en, this message translates to:
  /// **'Add All Ingredients to Cart ({count})'**
  String addAllToCart(int count);

  /// No description provided for @addRemainingToCart.
  ///
  /// In en, this message translates to:
  /// **'Add Remaining ({count}) to Cart'**
  String addRemainingToCart(int count);

  /// No description provided for @allInPantryBtn.
  ///
  /// In en, this message translates to:
  /// **'All in Pantry (Nothing to Buy)'**
  String get allInPantryBtn;

  /// No description provided for @addingToCart.
  ///
  /// In en, this message translates to:
  /// **'Adding Ingredients to Cart...'**
  String get addingToCart;

  /// No description provided for @switchStoreTitle.
  ///
  /// In en, this message translates to:
  /// **'Switch Store?'**
  String get switchStoreTitle;

  /// No description provided for @switchStoreRecipeMessage.
  ///
  /// In en, this message translates to:
  /// **'Your cart contains items from another store. Adding this recipe will clear existing items to bundle from the selected store. Proceed?'**
  String get switchStoreRecipeMessage;

  /// No description provided for @switchStoreAndAdd.
  ///
  /// In en, this message translates to:
  /// **'Switch Store & Add'**
  String get switchStoreAndAdd;

  /// No description provided for @partialRecipeBundle.
  ///
  /// In en, this message translates to:
  /// **'Partial Recipe Bundle'**
  String get partialRecipeBundle;

  /// No description provided for @partialBundleMessage.
  ///
  /// In en, this message translates to:
  /// **'Added {count} available ingredients to your cart ({excluded} marked in pantry).\n\nThe following items could not be added:'**
  String partialBundleMessage(int count, int excluded);

  /// No description provided for @allInPantrySnack.
  ///
  /// In en, this message translates to:
  /// **'All ingredients are in your pantry! Nothing was added to cart.'**
  String get allInPantrySnack;

  /// No description provided for @recipeAddedSnack.
  ///
  /// In en, this message translates to:
  /// **'{count} ingredients added to cart ({excluded} in pantry) 🛒'**
  String recipeAddedSnack(int count, int excluded);

  /// No description provided for @allRecipeAddedSnack.
  ///
  /// In en, this message translates to:
  /// **'All {count} recipe ingredients added to your cart! 🛒'**
  String allRecipeAddedSnack(int count);

  /// No description provided for @itemsUnavailableTitle.
  ///
  /// In en, this message translates to:
  /// **'Items Unavailable'**
  String get itemsUnavailableTitle;

  /// No description provided for @itemsUnavailableMessage.
  ///
  /// In en, this message translates to:
  /// **'No ingredients could be added. The remaining required items are currently out of stock at this store:'**
  String get itemsUnavailableMessage;

  /// No description provided for @noRecipesFound.
  ///
  /// In en, this message translates to:
  /// **'No recipes found'**
  String get noRecipesFound;

  /// No description provided for @myCart.
  ///
  /// In en, this message translates to:
  /// **'My Cart'**
  String get myCart;

  /// No description provided for @clearCartTitle.
  ///
  /// In en, this message translates to:
  /// **'Clear Cart?'**
  String get clearCartTitle;

  /// No description provided for @clearCartMessage.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to remove all items from your cart?'**
  String get clearCartMessage;

  /// No description provided for @cartEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'Your cart is empty'**
  String get cartEmptyTitle;

  /// No description provided for @cartEmptyDesc.
  ///
  /// In en, this message translates to:
  /// **'Add groceries or recipe bundles to get started with instant delivery.'**
  String get cartEmptyDesc;

  /// No description provided for @browseGroceries.
  ///
  /// In en, this message translates to:
  /// **'Browse Groceries'**
  String get browseGroceries;

  /// No description provided for @deliveryAddress.
  ///
  /// In en, this message translates to:
  /// **'Delivery Address'**
  String get deliveryAddress;

  /// No description provided for @selectDeliveryAddress.
  ///
  /// In en, this message translates to:
  /// **'Select Delivery Address'**
  String get selectDeliveryAddress;

  /// No description provided for @change.
  ///
  /// In en, this message translates to:
  /// **'Change'**
  String get change;

  /// No description provided for @addAddress.
  ///
  /// In en, this message translates to:
  /// **'Add Address'**
  String get addAddress;

  /// No description provided for @noAddressSelected.
  ///
  /// In en, this message translates to:
  /// **'Please select or add a delivery address to proceed'**
  String get noAddressSelected;

  /// No description provided for @billDetails.
  ///
  /// In en, this message translates to:
  /// **'Bill Details'**
  String get billDetails;

  /// No description provided for @itemTotal.
  ///
  /// In en, this message translates to:
  /// **'Item Total'**
  String get itemTotal;

  /// No description provided for @deliveryFee.
  ///
  /// In en, this message translates to:
  /// **'Delivery Fee'**
  String get deliveryFee;

  /// No description provided for @free.
  ///
  /// In en, this message translates to:
  /// **'FREE'**
  String get free;

  /// No description provided for @toPay.
  ///
  /// In en, this message translates to:
  /// **'To Pay'**
  String get toPay;

  /// No description provided for @proceedToCheckout.
  ///
  /// In en, this message translates to:
  /// **'Proceed to Checkout'**
  String get proceedToCheckout;

  /// No description provided for @placingOrder.
  ///
  /// In en, this message translates to:
  /// **'Placing Order...'**
  String get placingOrder;

  /// No description provided for @orderSuccessTitle.
  ///
  /// In en, this message translates to:
  /// **'Order Placed Successfully! 🎉'**
  String get orderSuccessTitle;

  /// No description provided for @orderSuccessMessage.
  ///
  /// In en, this message translates to:
  /// **'Your 10-minute instant delivery is being prepped at the store.'**
  String get orderSuccessMessage;

  /// No description provided for @viewOrder.
  ///
  /// In en, this message translates to:
  /// **'View Order'**
  String get viewOrder;

  /// No description provided for @viewCart.
  ///
  /// In en, this message translates to:
  /// **'VIEW CART'**
  String get viewCart;

  /// No description provided for @itemRemoved.
  ///
  /// In en, this message translates to:
  /// **'Item removed from cart'**
  String get itemRemoved;

  /// No description provided for @freeDeliveryNotice.
  ///
  /// In en, this message translates to:
  /// **'Add items worth ₹{amount} more for FREE delivery'**
  String freeDeliveryNotice(int amount);

  /// No description provided for @savedAddresses.
  ///
  /// In en, this message translates to:
  /// **'Saved Addresses'**
  String get savedAddresses;

  /// No description provided for @addNewAddress.
  ///
  /// In en, this message translates to:
  /// **'Add New Address'**
  String get addNewAddress;

  /// No description provided for @addressLabel.
  ///
  /// In en, this message translates to:
  /// **'Address Label (e.g. Home, Work)'**
  String get addressLabel;

  /// No description provided for @addressLine1.
  ///
  /// In en, this message translates to:
  /// **'Flat / House No. / Building / Street'**
  String get addressLine1;

  /// No description provided for @addressLine2.
  ///
  /// In en, this message translates to:
  /// **'Area / Sector / Locality (Optional)'**
  String get addressLine2;

  /// No description provided for @landmark.
  ///
  /// In en, this message translates to:
  /// **'Landmark (Optional)'**
  String get landmark;

  /// No description provided for @city.
  ///
  /// In en, this message translates to:
  /// **'City'**
  String get city;

  /// No description provided for @state.
  ///
  /// In en, this message translates to:
  /// **'State'**
  String get state;

  /// No description provided for @postalCode.
  ///
  /// In en, this message translates to:
  /// **'PIN Code'**
  String get postalCode;

  /// No description provided for @setAsDefault.
  ///
  /// In en, this message translates to:
  /// **'Set as Default Address'**
  String get setAsDefault;

  /// No description provided for @saveAddress.
  ///
  /// In en, this message translates to:
  /// **'Save Address'**
  String get saveAddress;

  /// No description provided for @saving.
  ///
  /// In en, this message translates to:
  /// **'Saving...'**
  String get saving;

  /// No description provided for @deleteAddressTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete Address?'**
  String get deleteAddressTitle;

  /// No description provided for @deleteAddressMessage.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to remove this address?'**
  String get deleteAddressMessage;

  /// No description provided for @noAddressesYet.
  ///
  /// In en, this message translates to:
  /// **'No addresses saved yet. Add your delivery location.'**
  String get noAddressesYet;

  /// No description provided for @myOrders.
  ///
  /// In en, this message translates to:
  /// **'My Orders'**
  String get myOrders;

  /// No description provided for @noOrdersYet.
  ///
  /// In en, this message translates to:
  /// **'No orders yet'**
  String get noOrdersYet;

  /// No description provided for @noOrdersDesc.
  ///
  /// In en, this message translates to:
  /// **'When you place a grocery or recipe bundle order, you will see it here with live tracking.'**
  String get noOrdersDesc;

  /// No description provided for @startShopping.
  ///
  /// In en, this message translates to:
  /// **'Start Shopping'**
  String get startShopping;

  /// No description provided for @orderDetails.
  ///
  /// In en, this message translates to:
  /// **'Order Details'**
  String get orderDetails;

  /// No description provided for @orderNumber.
  ///
  /// In en, this message translates to:
  /// **'Order #{number}'**
  String orderNumber(String number);

  /// No description provided for @placedOn.
  ///
  /// In en, this message translates to:
  /// **'Placed On'**
  String get placedOn;

  /// No description provided for @orderStatus.
  ///
  /// In en, this message translates to:
  /// **'Order Status'**
  String get orderStatus;

  /// No description provided for @deliveryStatus.
  ///
  /// In en, this message translates to:
  /// **'Delivery Status'**
  String get deliveryStatus;

  /// No description provided for @items.
  ///
  /// In en, this message translates to:
  /// **'Items'**
  String get items;

  /// No description provided for @paymentMethod.
  ///
  /// In en, this message translates to:
  /// **'Payment Method'**
  String get paymentMethod;

  /// No description provided for @paymentStatus.
  ///
  /// In en, this message translates to:
  /// **'Payment Status'**
  String get paymentStatus;

  /// No description provided for @cashOnDelivery.
  ///
  /// In en, this message translates to:
  /// **'Cash on Delivery'**
  String get cashOnDelivery;

  /// No description provided for @deliveryPartner.
  ///
  /// In en, this message translates to:
  /// **'Delivery Partner'**
  String get deliveryPartner;

  /// No description provided for @partnerAssigned.
  ///
  /// In en, this message translates to:
  /// **'Assigned'**
  String get partnerAssigned;

  /// No description provided for @partnerNotAssigned.
  ///
  /// In en, this message translates to:
  /// **'Not assigned yet'**
  String get partnerNotAssigned;

  /// No description provided for @securityOtpTitle.
  ///
  /// In en, this message translates to:
  /// **'Delivery Security Code (OTP)'**
  String get securityOtpTitle;

  /// No description provided for @securityOtpDesc.
  ///
  /// In en, this message translates to:
  /// **'Share this OTP with your delivery partner at the time of delivery to confirm drop-off.'**
  String get securityOtpDesc;

  /// No description provided for @statusPlaced.
  ///
  /// In en, this message translates to:
  /// **'Order Placed'**
  String get statusPlaced;

  /// No description provided for @statusConfirmed.
  ///
  /// In en, this message translates to:
  /// **'Confirmed'**
  String get statusConfirmed;

  /// No description provided for @statusPreparing.
  ///
  /// In en, this message translates to:
  /// **'Preparing'**
  String get statusPreparing;

  /// No description provided for @statusReadyForPickup.
  ///
  /// In en, this message translates to:
  /// **'Ready for Pickup'**
  String get statusReadyForPickup;

  /// No description provided for @statusOutForDelivery.
  ///
  /// In en, this message translates to:
  /// **'Out for Delivery'**
  String get statusOutForDelivery;

  /// No description provided for @statusDelivered.
  ///
  /// In en, this message translates to:
  /// **'Delivered'**
  String get statusDelivered;

  /// No description provided for @statusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get statusCancelled;

  /// No description provided for @statusPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get statusPending;

  /// No description provided for @statusCompleted.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get statusCompleted;

  /// No description provided for @statusFailed.
  ///
  /// In en, this message translates to:
  /// **'Failed'**
  String get statusFailed;

  /// No description provided for @dietaryVeg.
  ///
  /// In en, this message translates to:
  /// **'VEG'**
  String get dietaryVeg;

  /// No description provided for @dietaryNonVeg.
  ///
  /// In en, this message translates to:
  /// **'NON-VEG'**
  String get dietaryNonVeg;

  /// No description provided for @dietaryEgg.
  ///
  /// In en, this message translates to:
  /// **'EGG'**
  String get dietaryEgg;

  /// No description provided for @retailerHub.
  ///
  /// In en, this message translates to:
  /// **'Dark Store Retailer Hub'**
  String get retailerHub;

  /// No description provided for @storeOverview.
  ///
  /// In en, this message translates to:
  /// **'Store Overview'**
  String get storeOverview;

  /// No description provided for @stockManagement.
  ///
  /// In en, this message translates to:
  /// **'Manage Stock'**
  String get stockManagement;

  /// No description provided for @allOrdersTab.
  ///
  /// In en, this message translates to:
  /// **'All Orders ({count})'**
  String allOrdersTab(int count);

  /// No description provided for @newPlacedTab.
  ///
  /// In en, this message translates to:
  /// **'New Placed'**
  String get newPlacedTab;

  /// No description provided for @confirmedTab.
  ///
  /// In en, this message translates to:
  /// **'Confirmed'**
  String get confirmedTab;

  /// No description provided for @packingTab.
  ///
  /// In en, this message translates to:
  /// **'Packing'**
  String get packingTab;

  /// No description provided for @readyTab.
  ///
  /// In en, this message translates to:
  /// **'Ready'**
  String get readyTab;

  /// No description provided for @confirmOrderAction.
  ///
  /// In en, this message translates to:
  /// **'Confirm Order'**
  String get confirmOrderAction;

  /// No description provided for @startPackingAction.
  ///
  /// In en, this message translates to:
  /// **'Start Packing'**
  String get startPackingAction;

  /// No description provided for @markReadyAction.
  ///
  /// In en, this message translates to:
  /// **'Mark Ready for Pickup'**
  String get markReadyAction;

  /// No description provided for @updateStockTitle.
  ///
  /// In en, this message translates to:
  /// **'Update Inventory Stock'**
  String get updateStockTitle;

  /// No description provided for @currentStock.
  ///
  /// In en, this message translates to:
  /// **'Current Stock: {qty}'**
  String currentStock(int qty);

  /// No description provided for @unitPriceLabel.
  ///
  /// In en, this message translates to:
  /// **'Unit Price: ₹{price}'**
  String unitPriceLabel(String price);

  /// No description provided for @saveStock.
  ///
  /// In en, this message translates to:
  /// **'Save Stock Changes'**
  String get saveStock;

  /// No description provided for @noOrdersForStatus.
  ///
  /// In en, this message translates to:
  /// **'No orders in this status right now.'**
  String get noOrdersForStatus;

  /// No description provided for @deliveryHub.
  ///
  /// In en, this message translates to:
  /// **'Delivery Partner Hub'**
  String get deliveryHub;

  /// No description provided for @activeDeliveries.
  ///
  /// In en, this message translates to:
  /// **'Active Assignment'**
  String get activeDeliveries;

  /// No description provided for @completedDrops.
  ///
  /// In en, this message translates to:
  /// **'Completed Drops: {count}'**
  String completedDrops(int count);

  /// No description provided for @simulateGps.
  ///
  /// In en, this message translates to:
  /// **'Simulate GPS Update'**
  String get simulateGps;

  /// No description provided for @acceptTaskAction.
  ///
  /// In en, this message translates to:
  /// **'Accept Delivery Task'**
  String get acceptTaskAction;

  /// No description provided for @pickupOrderAction.
  ///
  /// In en, this message translates to:
  /// **'Pick Up Order from Store'**
  String get pickupOrderAction;

  /// No description provided for @arrivedLocationAction.
  ///
  /// In en, this message translates to:
  /// **'Arrived at Customer Location'**
  String get arrivedLocationAction;

  /// No description provided for @verifyOtpAction.
  ///
  /// In en, this message translates to:
  /// **'Verify OTP & Complete Delivery'**
  String get verifyOtpAction;

  /// No description provided for @verifyOtpTitle.
  ///
  /// In en, this message translates to:
  /// **'Verify Customer OTP'**
  String get verifyOtpTitle;

  /// No description provided for @verifyOtpSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Ask customer for their 6-digit delivery security code to complete this drop-off.'**
  String get verifyOtpSubtitle;

  /// No description provided for @enterOtpDigits.
  ///
  /// In en, this message translates to:
  /// **'Please enter all 6 digits'**
  String get enterOtpDigits;

  /// No description provided for @otpVerifiedSuccess.
  ///
  /// In en, this message translates to:
  /// **'OTP Verified! Delivery marked as completed.'**
  String get otpVerifiedSuccess;

  /// No description provided for @customerContact.
  ///
  /// In en, this message translates to:
  /// **'Customer Contact'**
  String get customerContact;

  /// No description provided for @deliveryLocation.
  ///
  /// In en, this message translates to:
  /// **'Delivery Location'**
  String get deliveryLocation;

  /// No description provided for @noActiveDeliveries.
  ///
  /// In en, this message translates to:
  /// **'No active delivery assignments. Stand by for orders!'**
  String get noActiveDeliveries;

  /// No description provided for @trackOrder.
  ///
  /// In en, this message translates to:
  /// **'Track Order'**
  String get trackOrder;

  /// No description provided for @orderTrackingTitle.
  ///
  /// In en, this message translates to:
  /// **'Order Tracking & Details'**
  String get orderTrackingTitle;

  /// No description provided for @viewDeliveryOtp.
  ///
  /// In en, this message translates to:
  /// **'View Delivery OTP (For Delivery Partner)'**
  String get viewDeliveryOtp;

  /// No description provided for @otpInstruction.
  ///
  /// In en, this message translates to:
  /// **'Share this 6-digit OTP with your delivery partner only after receiving all grocery packages.'**
  String get otpInstruction;

  /// No description provided for @otpExpiresNotice.
  ///
  /// In en, this message translates to:
  /// **'Expires in 15 minutes • Single Use'**
  String get otpExpiresNotice;

  /// No description provided for @otpPartnerNotAssigned.
  ///
  /// In en, this message translates to:
  /// **'OTP is only available when an active delivery partner is assigned.'**
  String get otpPartnerNotAssigned;

  /// No description provided for @grandTotal.
  ///
  /// In en, this message translates to:
  /// **'Grand Total'**
  String get grandTotal;

  /// No description provided for @itemsOrdered.
  ///
  /// In en, this message translates to:
  /// **'Items Ordered'**
  String get itemsOrdered;

  /// No description provided for @orderNotFound.
  ///
  /// In en, this message translates to:
  /// **'Order not found'**
  String get orderNotFound;

  /// No description provided for @orderNotFoundDesc.
  ///
  /// In en, this message translates to:
  /// **'Could not find details for the requested order.'**
  String get orderNotFoundDesc;

  /// No description provided for @refresh.
  ///
  /// In en, this message translates to:
  /// **'Refresh'**
  String get refresh;

  /// No description provided for @defaultBadge.
  ///
  /// In en, this message translates to:
  /// **'DEFAULT'**
  String get defaultBadge;

  /// No description provided for @storeManagerPortal.
  ///
  /// In en, this message translates to:
  /// **'Store Manager Portal'**
  String get storeManagerPortal;

  /// No description provided for @selectNextStep.
  ///
  /// In en, this message translates to:
  /// **'Select Next Order Processing Step:'**
  String get selectNextStep;

  /// No description provided for @cancelAndRestock.
  ///
  /// In en, this message translates to:
  /// **'Cancel & Restock Inventory'**
  String get cancelAndRestock;

  /// No description provided for @startPackingGroceries.
  ///
  /// In en, this message translates to:
  /// **'Start Packing Groceries (PREPARING)'**
  String get startPackingGroceries;

  /// No description provided for @orderHandedOff.
  ///
  /// In en, this message translates to:
  /// **'This order is handed off to delivery partner or completed.'**
  String get orderHandedOff;

  /// No description provided for @updateStatus.
  ///
  /// In en, this message translates to:
  /// **'Update Status'**
  String get updateStatus;

  /// No description provided for @storeInventoryTitle.
  ///
  /// In en, this message translates to:
  /// **'Store Inventory & Stock'**
  String get storeInventoryTitle;

  /// No description provided for @searchInventoryHint.
  ///
  /// In en, this message translates to:
  /// **'Search inventory items...'**
  String get searchInventoryHint;

  /// No description provided for @updateSellingPrice.
  ///
  /// In en, this message translates to:
  /// **'Update Selling Price'**
  String get updateSellingPrice;

  /// No description provided for @storeSellingPrice.
  ///
  /// In en, this message translates to:
  /// **'Store Selling Price (₹)'**
  String get storeSellingPrice;

  /// No description provided for @available.
  ///
  /// In en, this message translates to:
  /// **'Available'**
  String get available;

  /// No description provided for @disabled.
  ///
  /// In en, this message translates to:
  /// **'Disabled'**
  String get disabled;

  /// No description provided for @noInventoryItems.
  ///
  /// In en, this message translates to:
  /// **'No inventory items'**
  String get noInventoryItems;

  /// No description provided for @noInventoryDesc.
  ///
  /// In en, this message translates to:
  /// **'No products match your inventory search.'**
  String get noInventoryDesc;

  /// No description provided for @assignedTasks.
  ///
  /// In en, this message translates to:
  /// **'Assigned Tasks'**
  String get assignedTasks;

  /// No description provided for @activeTasksCount.
  ///
  /// In en, this message translates to:
  /// **'{count} active'**
  String activeTasksCount(int count);

  /// No description provided for @allCaughtUp.
  ///
  /// In en, this message translates to:
  /// **'All caught up!'**
  String get allCaughtUp;

  /// No description provided for @allCaughtUpDesc.
  ///
  /// In en, this message translates to:
  /// **'New 10-minute grocery delivery assignments will notify you automatically.'**
  String get allCaughtUpDesc;

  /// No description provided for @onlineStatus.
  ///
  /// In en, this message translates to:
  /// **'ONLINE'**
  String get onlineStatus;

  /// No description provided for @pickupFromStore.
  ///
  /// In en, this message translates to:
  /// **'Pickup: {store}'**
  String pickupFromStore(String store);

  /// No description provided for @dropAtLocation.
  ///
  /// In en, this message translates to:
  /// **'Drop: {address}'**
  String dropAtLocation(String address);

  /// No description provided for @confirmStorePickupAction.
  ///
  /// In en, this message translates to:
  /// **'Confirm Dark Store Pickup (OUT FOR DELIVERY)'**
  String get confirmStorePickupAction;

  /// No description provided for @verifyAndComplete.
  ///
  /// In en, this message translates to:
  /// **'Verify & Complete'**
  String get verifyAndComplete;

  /// No description provided for @gpsLocationBroadcasted.
  ///
  /// In en, this message translates to:
  /// **'Live GPS Location broadcasted to customer! 🛰️'**
  String get gpsLocationBroadcasted;

  /// No description provided for @productOverview.
  ///
  /// In en, this message translates to:
  /// **'Product Overview'**
  String get productOverview;

  /// No description provided for @totalInCart.
  ///
  /// In en, this message translates to:
  /// **'Total in cart'**
  String get totalInCart;

  /// No description provided for @defaultProductDesc.
  ///
  /// In en, this message translates to:
  /// **'Fresh, quality checked grocery item sourced directly from trusted dark stores for ultra-fast 10-minute delivery.'**
  String get defaultProductDesc;

  /// No description provided for @deliveryPromiseHeader.
  ///
  /// In en, this message translates to:
  /// **'10-Minute Dark Store Delivery'**
  String get deliveryPromiseHeader;

  /// No description provided for @deliveryPromiseDesc.
  ///
  /// In en, this message translates to:
  /// **'Packed fresh at nearest micro-warehouse with tamper-proof seal.'**
  String get deliveryPromiseDesc;

  /// No description provided for @clearAndSwitchStore.
  ///
  /// In en, this message translates to:
  /// **'Clear & Switch Store'**
  String get clearAndSwitchStore;

  /// No description provided for @switchStoreCartMsg.
  ///
  /// In en, this message translates to:
  /// **'Your cart contains items from another store. Clear cart to add from this store?'**
  String get switchStoreCartMsg;

  /// No description provided for @selectStorePrompt.
  ///
  /// In en, this message translates to:
  /// **'Please select a dark store before adding items.'**
  String get selectStorePrompt;

  /// No description provided for @addToCartPrice.
  ///
  /// In en, this message translates to:
  /// **'Add to Cart • ₹{price}'**
  String addToCartPrice(String price);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'hi', 'mr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'hi':
      return AppLocalizationsHi();
    case 'mr':
      return AppLocalizationsMr();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
