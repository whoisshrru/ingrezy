import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleProvider extends ChangeNotifier {
  static const String _prefKey = 'app_locale_code';
  static const List<Locale> supportedLocales = [
    Locale('en'),
    Locale('mr'),
    Locale('hi'),
  ];

  Locale _locale = const Locale('en');
  bool _isInitialized = false;

  Locale get locale => _locale;
  String get localeCode => _locale.languageCode;
  String get localeDisplayName => getLanguageDisplayName(_locale.languageCode);
  bool get isInitialized => _isInitialized;

  LocaleProvider() {
    loadSavedLocale();
  }

  Future<void> loadSavedLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedCode = prefs.getString(_prefKey);
      if (savedCode != null && isSupported(savedCode)) {
        _locale = Locale(savedCode);
      }
    } catch (_) {
      // Fallback safely to English
      _locale = const Locale('en');
    } finally {
      _isInitialized = true;
      notifyListeners();
    }
  }

  Future<void> setLocale(Locale newLocale) async {
    if (!isSupported(newLocale.languageCode)) return;
    if (_locale.languageCode == newLocale.languageCode) return;

    _locale = newLocale;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefKey, newLocale.languageCode);
    } catch (_) {
      // Non-fatal if preference writing fails
    }
  }

  Future<void> setLanguageCode(String languageCode) async {
    await setLocale(Locale(languageCode));
  }

  bool isSupported(String code) {
    return supportedLocales.any((loc) => loc.languageCode == code);
  }

  static String getLanguageDisplayName(String code) {
    switch (code) {
      case 'mr':
        return 'मराठी';
      case 'hi':
        return 'हिंदी';
      case 'en':
      default:
        return 'English';
    }
  }

  static String getLanguageSubtitle(String code) {
    switch (code) {
      case 'mr':
        return 'Marathi';
      case 'hi':
        return 'Hindi';
      case 'en':
      default:
        return 'English';
    }
  }
}
