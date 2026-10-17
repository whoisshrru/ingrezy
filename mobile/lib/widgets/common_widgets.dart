import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../l10n/generated/app_localizations.dart';
import '../models/order_model.dart';
import '../models/product_model.dart';

String getLocalizedOrderStatus(OrderStatus status, AppLocalizations l10n) {
  switch (status) {
    case OrderStatus.PLACED:
      return l10n.statusPlaced;
    case OrderStatus.CONFIRMED:
      return l10n.statusConfirmed;
    case OrderStatus.PREPARING:
      return l10n.statusPreparing;
    case OrderStatus.READY_FOR_PICKUP:
      return l10n.statusReadyForPickup;
    case OrderStatus.OUT_FOR_DELIVERY:
      return l10n.statusOutForDelivery;
    case OrderStatus.DELIVERED:
      return l10n.statusDelivered;
    case OrderStatus.CANCELLED:
      return l10n.statusCancelled;
  }
}

String getLocalizedDietaryType(DietaryType type, AppLocalizations l10n) {
  switch (type) {
    case DietaryType.VEG:
    case DietaryType.VEGAN:
      return l10n.dietaryVeg;
    case DietaryType.NON_VEG:
      return l10n.dietaryNonVeg;
    case DietaryType.CONTAINS_EGG:
      return l10n.dietaryEgg;
  }
}

String getLocalizedCategory(String category, AppLocalizations l10n) {
  switch (category.trim().toLowerCase()) {
    case 'all':
      return l10n.allProducts;
    case 'vegetables':
      return l10n.categoryVegetables;
    case 'meat':
      return l10n.categoryMeat;
    case 'dairy':
      return l10n.categoryDairy;
    case 'bakery':
      return l10n.categoryBakery;
    case 'pantry':
      return l10n.categoryPantry;
    case 'grains':
      return l10n.categoryGrains;
    case 'fruits':
      return l10n.categoryFruits;
    case 'beverages':
      return l10n.categoryBeverages;
    case 'snacks':
      return l10n.categorySnacks;
    default:
      return category;
  }
}

class LoadingView extends StatelessWidget {
  final String? message;
  const LoadingView({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(
            color: AppTheme.spiceOrange,
            strokeWidth: 3,
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: const TextStyle(
                color: AppTheme.textMuted,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class ErrorStateView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  final String? title;
  final String? retryLabel;

  const ErrorStateView({
    super.key,
    required this.message,
    required this.onRetry,
    this.title,
    this.retryLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppTheme.spiceOrangeSoft,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.wifi_off_rounded,
                color: AppTheme.spiceOrange,
                size: 38,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title ?? 'Oops! Something went wrong',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppTheme.cocoaBrown,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.textMuted,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: Text(retryLabel ?? 'Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}

class EmptyStateView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyStateView({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.creamBeigeLight,
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.creamBeige, width: 2),
              ),
              child: Icon(
                icon,
                color: AppTheme.cocoaBrown,
                size: 42,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppTheme.cocoaBrown,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.textMuted,
              ),
              textAlign: TextAlign.center,
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 22),
              ElevatedButton(
                onPressed: onAction,
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class StatusBadge extends StatelessWidget {
  final String text;
  final Color backgroundColor;
  final Color textColor;
  final IconData? icon;

  const StatusBadge({
    super.key,
    required this.text,
    required this.backgroundColor,
    required this.textColor,
    this.icon,
  });

  factory StatusBadge.fromOrderStatus(OrderStatus status, {String? label}) {
    switch (status) {
      case OrderStatus.PLACED:
        return StatusBadge(
          text: label ?? 'Order Placed',
          backgroundColor: const Color(0xFFF6EEDC),
          textColor: const Color(0xFF6B4E1B),
          icon: Icons.receipt_long_outlined,
        );
      case OrderStatus.CONFIRMED:
        return StatusBadge(
          text: label ?? 'Confirmed',
          backgroundColor: const Color(0xFFEBE9D6),
          textColor: const Color(0xFF595328),
          icon: Icons.check_circle_outline,
        );
      case OrderStatus.PREPARING:
        return StatusBadge(
          text: label ?? 'Packing',
          backgroundColor: const Color(0xFFFDE8DD),
          textColor: const Color(0xFF9E421B),
          icon: Icons.inventory_2_outlined,
        );
      case OrderStatus.READY_FOR_PICKUP:
        return StatusBadge(
          text: label ?? 'Ready for Pickup',
          backgroundColor: const Color(0xFFFBF1D5),
          textColor: const Color(0xFF8A5A1B),
          icon: Icons.local_shipping_outlined,
        );
      case OrderStatus.OUT_FOR_DELIVERY:
        return StatusBadge(
          text: label ?? 'Out for Delivery',
          backgroundColor: const Color(0xFFFBE8CF),
          textColor: const Color(0xFF9E4E16),
          icon: Icons.directions_bike,
        );
      case OrderStatus.DELIVERED:
        return StatusBadge(
          text: label ?? 'Delivered',
          backgroundColor: const Color(0xFFE5ECCF),
          textColor: const Color(0xFF455823),
          icon: Icons.done_all,
        );
      case OrderStatus.CANCELLED:
        return StatusBadge(
          text: label ?? 'Cancelled',
          backgroundColor: const Color(0xFFF8DFD8),
          textColor: const Color(0xFF963625),
          icon: Icons.cancel_outlined,
        );
    }
  }

  factory StatusBadge.fromDietaryType(DietaryType type, {String? label}) {
    switch (type) {
      case DietaryType.VEG:
        return StatusBadge(
          text: label ?? 'Veg',
          backgroundColor: const Color(0xFFE5ECCF),
          textColor: const Color(0xFF455823),
        );
      case DietaryType.NON_VEG:
        return StatusBadge(
          text: label ?? 'Non-Veg',
          backgroundColor: const Color(0xFFF8DFD8),
          textColor: const Color(0xFF963625),
        );
      case DietaryType.VEGAN:
        return StatusBadge(
          text: label ?? 'Vegan',
          backgroundColor: const Color(0xFFE8EFE8),
          textColor: const Color(0xFF38573D),
        );
      case DietaryType.CONTAINS_EGG:
        return StatusBadge(
          text: label ?? 'Egg',
          backgroundColor: const Color(0xFFFBF1D5),
          textColor: const Color(0xFF8A5A1B),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withOpacity(0.18), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: TextStyle(
              color: textColor,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
