import 'package:flutter/material.dart';

class AppTheme {
  // =========================================================================
  // CORE COLOR TOKENS (Warm, Earthy Food-Inspired Palette)
  // =========================================================================
  static const Color cocoaBrown = Color(0xFF504932);
  static const Color spiceOrange = Color(0xFFB34E22);
  static const Color creamBeige = Color(0xFFEBD3AA);
  static const Color oliveGreen = Color(0xFF6A6332);
  static const Color warmWhite = Color(0xFFFFFCF5);

  // =========================================================================
  // REFINED TONAL & SEMANTIC VARIANTS
  // =========================================================================
  static const Color cocoaBrownDark = Color(0xFF383323);
  static const Color cocoaBrownLight = Color(0xFF6E6548);
  static const Color spiceOrangeDark = Color(0xFF8F3E1A);
  static const Color spiceOrangeLight = Color(0xFFCC5E2D);
  static const Color spiceOrangeSoft = Color(0xFFFDEEE7);
  static const Color creamBeigeDark = Color(0xFFD8BC8C);
  static const Color creamBeigeLight = Color(0xFFF5E6CC);
  static const Color creamBeigeSoft = Color(0xFFFAF2E4);
  static const Color oliveGreenLight = Color(0xFF837B42);
  static const Color oliveGreenSoft = Color(0xFFF2EFE2);

  // Surface & Neutral Tokens
  static const Color background = warmWhite;
  static const Color surface = Colors.white;
  static const Color surfaceWarm = Color(0xFFFFFDF8);
  static const Color cardBorder = Color(0xFFEFE8D8);
  static const Color cardBorderSubtle = Color(0xFFF5EFE3);
  static const Color textDark = cocoaBrown;
  static const Color textMuted = Color(0xFF7A735E);
  static const Color textLight = Color(0xFFA69F8B);

  // =========================================================================
  // BACKWARDS COMPATIBILITY ALIASES
  // =========================================================================
  static const Color primaryGreen = oliveGreen;
  static const Color primaryDark = cocoaBrown;
  static const Color accentOrange = spiceOrange;
  static const Color mintLight = creamBeigeSoft;
  static const Color softGrey = warmWhite;
  static const Color borderGrey = cardBorder;

  // =========================================================================
  // FLUTTER THEME DATA
  // =========================================================================
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: spiceOrange,
        primary: spiceOrange,
        secondary: oliveGreen,
        tertiary: creamBeige,
        surface: surface,
        surfaceTint: Colors.transparent,
      ),
      scaffoldBackgroundColor: warmWhite,
      fontFamily: null, // Clean system typography
      appBarTheme: const AppBarTheme(
        backgroundColor: warmWhite,
        foregroundColor: cocoaBrown,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: cocoaBrown,
          fontSize: 18,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.3,
        ),
        iconTheme: IconThemeData(color: cocoaBrown),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: cardBorder, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: spiceOrange,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.2,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: spiceOrange,
          side: const BorderSide(color: spiceOrange, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: cardBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: cardBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: spiceOrange, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFC0392B)),
        ),
        labelStyle: const TextStyle(color: textMuted),
        hintStyle: const TextStyle(color: textLight),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: warmWhite,
        selectedItemColor: spiceOrange,
        unselectedItemColor: textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 6,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
        unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
      ),
      dividerTheme: const DividerThemeData(
        color: cardBorder,
        thickness: 1,
        space: 1,
      ),
    );
  }
}
