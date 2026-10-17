import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../l10n/generated/app_localizations.dart';
import '../providers/locale_provider.dart';

class LanguageSelectorSheet extends StatelessWidget {
  const LanguageSelectorSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      backgroundColor: AppTheme.warmWhite,
      builder: (_) => const LanguageSelectorSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final localeProv = Provider.of<LocaleProvider>(context);
    final currentCode = localeProv.locale.languageCode;

    final languages = [
      {'code': 'en', 'native': 'English', 'sub': 'English (Default)', 'badge': 'EN'},
      {'code': 'mr', 'native': 'मराठी', 'sub': 'Marathi', 'badge': 'MR'},
      {'code': 'hi', 'native': 'हिंदी', 'sub': 'Hindi', 'badge': 'HI'},
    ];

    return SafeArea(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.cardBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.creamBeigeLight,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.translate_rounded,
                      color: AppTheme.spiceOrange,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.selectLanguage,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.cocoaBrown,
                          ),
                        ),
                        Text(
                          l10n.language,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              ...languages.map((item) {
                final code = item['code']!;
                final isSelected = currentCode == code;

                return Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Material(
                    color: isSelected ? AppTheme.spiceOrangeSoft : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () async {
                        await localeProv.setLanguageCode(code);
                        if (context.mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                code == 'mr'
                                    ? 'भाषा मराठीमध्ये बदलली'
                                    : code == 'hi'
                                        ? 'भाषा हिंदी में बदली गई'
                                        : 'Language set to English',
                              ),
                              duration: const Duration(seconds: 2),
                              backgroundColor: AppTheme.spiceOrange,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? AppTheme.spiceOrange : AppTheme.cardBorder,
                            width: isSelected ? 1.5 : 1.0,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: isSelected ? AppTheme.spiceOrange : AppTheme.creamBeigeSoft,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                item['badge']!,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: isSelected ? Colors.white : AppTheme.cocoaBrown,
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item['native']!,
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                      color: isSelected ? AppTheme.spiceOrange : AppTheme.cocoaBrown,
                                    ),
                                  ),
                                  Text(
                                    item['sub']!,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isSelected
                                          ? AppTheme.spiceOrange.withOpacity(0.85)
                                          : AppTheme.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (isSelected)
                              const Icon(
                                Icons.check_circle_rounded,
                                color: AppTheme.spiceOrange,
                                size: 24,
                              )
                            else
                              Icon(
                                Icons.radio_button_unchecked_rounded,
                                color: AppTheme.cardBorder,
                                size: 22,
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }
}

class LanguageSelectorButton extends StatelessWidget {
  final Color? color;
  final bool showLabel;

  const LanguageSelectorButton({
    super.key,
    this.color,
    this.showLabel = false,
  });

  @override
  Widget build(BuildContext context) {
    final localeProv = Provider.of<LocaleProvider>(context);
    final code = localeProv.locale.languageCode.toUpperCase();

    if (showLabel) {
      return OutlinedButton.icon(
        onPressed: () => LanguageSelectorSheet.show(context),
        icon: const Icon(Icons.language_rounded, size: 18),
        label: Text(code),
        style: OutlinedButton.styleFrom(
          foregroundColor: AppTheme.cocoaBrown,
          side: const BorderSide(color: AppTheme.cardBorder),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
      );
    }

    return IconButton(
      tooltip: 'Change Language / भाषा बदला',
      icon: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(Icons.language_rounded, color: color ?? AppTheme.cocoaBrown),
          Positioned(
            right: -6,
            bottom: -4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: BoxDecoration(
                color: AppTheme.spiceOrange,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                code,
                style: const TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
      onPressed: () => LanguageSelectorSheet.show(context),
    );
  }
}
