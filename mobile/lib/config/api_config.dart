import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  static const String _prefKeyBaseUrl = 'ingrezy_custom_base_url';

  // Default host per platform
  static String get defaultBaseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000';
    }
    // Android: uses http://localhost:5000 via 'adb reverse tcp:5000 tcp:5000' over USB
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://localhost:5000';
    }
    // Windows / macOS / Linux / iOS simulator
    return 'http://localhost:5000';
  }

  static String _currentBaseUrl = defaultBaseUrl;

  static String get baseUrl => _currentBaseUrl;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final savedUrl = prefs.getString(_prefKeyBaseUrl);
    if (savedUrl != null && savedUrl.trim().isNotEmpty) {
      _currentBaseUrl = savedUrl.trim();
    } else {
      _currentBaseUrl = defaultBaseUrl;
    }
  }

  static Future<void> setCustomBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    final trimmed = url.trim();
    if (trimmed.isEmpty) {
      _currentBaseUrl = defaultBaseUrl;
      await prefs.remove(_prefKeyBaseUrl);
    } else {
      // Normalize trailing slash
      _currentBaseUrl = trimmed.endsWith('/')
          ? trimmed.substring(0, trimmed.length - 1)
          : trimmed;
      await prefs.setString(_prefKeyBaseUrl, _currentBaseUrl);
    }
  }

  // Endpoints
  static String get health => '$baseUrl/api/health';
  static String get authRegister => '$baseUrl/api/auth/register';
  static String get authLogin => '$baseUrl/api/auth/login';
  static String get authProfile => '$baseUrl/api/auth/me';

  static String get products => '$baseUrl/api/products';
  static String get recipes => '$baseUrl/api/recipes';
  static String get stores => '$baseUrl/api/stores';
  static String get cart => '$baseUrl/api/cart';
  static String get addresses => '$baseUrl/api/addresses';
  static String get orders => '$baseUrl/api/orders';

  static String get retailerStore => '$baseUrl/api/retailer/store';
  static String get retailerOrders => '$baseUrl/api/retailer/orders';

  static String get deliveryProfile => '$baseUrl/api/delivery/profile';
  static String get deliveryAssignments => '$baseUrl/api/delivery/assignments';
  static String get deliveryLocation => '$baseUrl/api/delivery/location';
}
