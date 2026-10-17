import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/api_config.dart';
import 'config/theme.dart';
import 'l10n/generated/app_localizations.dart';
import 'models/user_model.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/delivery_provider.dart';
import 'providers/locale_provider.dart';
import 'providers/order_provider.dart';
import 'providers/product_provider.dart';
import 'providers/recipe_provider.dart';
import 'providers/retailer_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/customer/cart_screen.dart';
import 'screens/customer/customer_main_nav.dart';
import 'screens/delivery/delivery_dashboard.dart';
import 'screens/retailer/retailer_dashboard.dart';
import 'widgets/common_widgets.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiConfig.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LocaleProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()..init()),
        ChangeNotifierProvider(create: (_) => ProductProvider()),
        ChangeNotifierProvider(create: (_) => RecipeProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
        ChangeNotifierProvider(create: (_) => RetailerProvider()),
        ChangeNotifierProvider(create: (_) => DeliveryProvider()),
      ],
      child: const IngrezyApp(),
    ),
  );
}

class IngrezyApp extends StatelessWidget {
  const IngrezyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final localeProv = Provider.of<LocaleProvider>(context);

    return MaterialApp(
      title: 'Ingrezy',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      locale: localeProv.locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      home: const RootRoleRouter(),
      routes: {
        '/cart': (context) => const CartScreen(),
        '/home': (context) => const CustomerMainNav(),
      },
    );
  }
}

class RootRoleRouter extends StatelessWidget {
  const RootRoleRouter({super.key});

  @override
  Widget build(BuildContext context) {
    final authProv = Provider.of<AuthProvider>(context);

    if (authProv.isLoading) {
      return const Scaffold(
        body: LoadingView(message: 'Initializing Ingrezy...'),
      );
    }

    if (!authProv.isAuthenticated) {
      return const LoginScreen();
    }

    // Role-based main screen routing
    switch (authProv.currentRole) {
      case UserRole.RETAILER:
        return const RetailerDashboard();
      case UserRole.DELIVERY_PARTNER:
        return const DeliveryDashboard();
      case UserRole.ADMIN:
      case UserRole.CUSTOMER:
        return const CustomerMainNav();
    }
  }
}
