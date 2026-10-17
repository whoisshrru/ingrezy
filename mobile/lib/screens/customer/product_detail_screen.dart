import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../models/cart_model.dart';
import '../../models/product_model.dart';
import '../../providers/cart_provider.dart';
import '../../providers/product_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../utils/content_localizer.dart';
import 'cart_screen.dart';

class ProductDetailScreen extends StatelessWidget {
  final ProductModel product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(product.localizedName(context)),
        actions: [
          StatusBadge.fromDietaryType(
            product.dietaryType,
            label: getLocalizedDietaryType(product.dietaryType, l10n),
          ),
          Consumer<CartProvider>(
            builder: (context, cartProv, _) {
              return IconButton(
                tooltip: l10n.navCart,
                icon: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Icon(Icons.shopping_bag_outlined),
                    if (cartProv.itemCount > 0)
                      Positioned(
                        right: -4,
                        top: -4,
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(
                            color: AppTheme.accentOrange,
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                          child: Text(
                            '${cartProv.itemCount}',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CartScreen()),
                  );
                },
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Consumer2<CartProvider, ProductProvider>(
        builder: (context, cartProv, prodProv, child) {
          final currentQty = cartProv.getProductQuantityInCart(product.id);
          final effectiveStoreId = (cartProv.itemCount > 0 &&
                  cartProv.cart?.storeId != null &&
                  cartProv.cart!.storeId!.isNotEmpty)
              ? cartProv.cart!.storeId!
              : (prodProv.selectedStoreId ??
                  (prodProv.stores.isNotEmpty ? prodProv.stores.first['id'] as String? : null) ??
                  '');

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Product Image Banner
                      AspectRatio(
                        aspectRatio: 1.25,
                        child: Container(
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFF1F5F9)),
                          ),
                          clipBehavior: Clip.antiAlias,
                          padding: const EdgeInsets.all(16),
                          child: product.imageUrl != null && product.imageUrl!.isNotEmpty
                              ? Image.network(
                                  product.imageUrl!,
                                  width: double.infinity,
                                  height: double.infinity,
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, __, ___) => const Center(
                                    child: Icon(Icons.shopping_bag_outlined, size: 64, color: Color(0xFFCBD5E1)),
                                  ),
                                )
                              : const Center(
                                  child: Icon(Icons.shopping_bag_outlined, size: 64, color: Color(0xFFCBD5E1)),
                                ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Name, Category, and Unit
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  product.localizedName(context),
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.textDark,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${getLocalizedCategory(product.category, l10n)} • ${product.localizedUnit(context)}',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: AppTheme.textMuted,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            '₹${product.displayPrice.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      const Divider(color: Color(0xFFEEEEEE)),
                      const SizedBox(height: 12),

                      // Description
                      Text(
                        l10n.productOverview,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textDark,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        product.localizedDescription(context) ?? l10n.defaultProductDesc,
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppTheme.textMuted,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Delivery Promise Banner
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppTheme.mintLight,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFC8E6C9)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: const BoxDecoration(
                                color: AppTheme.primaryGreen,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.flash_on_rounded,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    l10n.deliveryPromiseHeader,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13,
                                      color: AppTheme.primaryGreen,
                                    ),
                                  ),
                                  Text(
                                    l10n.deliveryPromiseDesc,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: AppTheme.textDark,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Bottom Sticky Add / Quantity Bar
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -4),
                    ),
                  ],
                ),
                child: SafeArea(
                  child: currentQty == 0
                      ? ElevatedButton(
                          onPressed: () async {
                            if (effectiveStoreId.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(l10n.selectStorePrompt),
                                  backgroundColor: Colors.orange,
                                ),
                              );
                              return;
                            }
                            if (!product.inStock) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('${product.name} ${l10n.outOfStock}'),
                                  backgroundColor: Colors.redAccent,
                                ),
                              );
                              return;
                            }

                            final success = await cartProv.addItem(
                              productId: product.id,
                              storeId: effectiveStoreId,
                              quantity: 1,
                            );

                            if (!success && context.mounted) {
                              if (cartProv.errorMessage?.contains('another store') == true) {
                                final confirm = await showDialog<bool>(
                                  context: context,
                                  builder: (ctx) => AlertDialog(
                                    title: Text(l10n.switchStoreTitle),
                                    content: Text(cartProv.errorMessage ?? l10n.switchStoreCartMsg),
                                    actions: [
                                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l10n.cancel)),
                                      ElevatedButton(
                                        onPressed: () => Navigator.pop(ctx, true),
                                        child: Text(l10n.clearAndSwitchStore),
                                      ),
                                    ],
                                  ),
                                );
                                if (confirm == true) {
                                  await cartProv.addItem(
                                    productId: product.id,
                                    storeId: effectiveStoreId,
                                    quantity: 1,
                                    clearPrevious: true,
                                  );
                                }
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(cartProv.errorMessage ?? l10n.somethingWentWrong),
                                    backgroundColor: Colors.redAccent,
                                  ),
                                );
                              }
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size.fromHeight(50),
                          ),
                          child: Text(
                            product.inStock
                                ? l10n.addToCartPrice(product.displayPrice.toStringAsFixed(0))
                                : l10n.outOfStock,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  l10n.totalInCart,
                                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                ),
                                Text(
                                  '₹${(product.displayPrice * currentQty).toStringAsFixed(0)}',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.textDark,
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                Container(
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryGreen,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    children: [
                                      IconButton(
                                        icon: Icon(
                                          currentQty <= 1 ? Icons.delete_outline : Icons.remove,
                                          color: Colors.white,
                                        ),
                                        onPressed: () {
                                          final cartItem = (cartProv.cart?.items ?? [])
                                              .cast<CartItemModel?>()
                                              .firstWhere((i) => i?.productId == product.id, orElse: () => null);
                                          if (cartItem != null) {
                                            if (currentQty <= 1) {
                                              cartProv.removeItem(cartItem.id, storeId: effectiveStoreId);
                                            } else {
                                              cartProv.updateQuantity(
                                                itemId: cartItem.id,
                                                quantity: currentQty - 1,
                                                storeId: effectiveStoreId,
                                              );
                                            }
                                          }
                                        },
                                      ),
                                      Text(
                                        '$currentQty',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 16,
                                        ),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.add, color: Colors.white),
                                        onPressed: () {
                                          final cartItem = (cartProv.cart?.items ?? [])
                                              .cast<CartItemModel?>()
                                              .firstWhere((i) => i?.productId == product.id, orElse: () => null);
                                          if (cartItem != null) {
                                            cartProv.updateQuantity(
                                              itemId: cartItem.id,
                                              quantity: currentQty + 1,
                                              storeId: effectiveStoreId,
                                            );
                                          } else {
                                            cartProv.addItem(
                                              productId: product.id,
                                              storeId: effectiveStoreId,
                                              quantity: 1,
                                            );
                                          }
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                ElevatedButton(
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (_) => const CartScreen()),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primaryDark,
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  child: Text(l10n.viewCart, style: const TextStyle(fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          ],
                        ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

