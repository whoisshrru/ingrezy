import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../l10n/generated/app_localizations.dart';
import '../models/cart_model.dart';
import '../models/product_model.dart';
import '../providers/cart_provider.dart';
import '../providers/product_provider.dart';
import '../screens/customer/product_detail_screen.dart';
import '../utils/content_localizer.dart';

class ProductCard extends StatelessWidget {
  final ProductModel product;

  const ProductCard({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Consumer2<CartProvider, ProductProvider>(
      builder: (context, cartProv, prodProv, child) {
        final currentQty = cartProv.getProductQuantityInCart(product.id);
        final effectiveStoreId = (cartProv.itemCount > 0 &&
                cartProv.cart?.storeId != null &&
                cartProv.cart!.storeId!.isNotEmpty)
            ? cartProv.cart!.storeId!
            : (prodProv.selectedStoreId ??
                (prodProv.stores.isNotEmpty ? prodProv.stores.first['id'] as String? : null) ??
                '');

        return InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ProductDetailScreen(product: product),
              ),
            );
          },
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              color: AppTheme.warmWhite,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.cardBorder, width: 1),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.cocoaBrown.withOpacity(0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Product Image Container with 4:3 AspectRatio and clean BoxFit.cover
                AspectRatio(
                  aspectRatio: 4 / 3,
                  child: Stack(
                    children: [
                      Container(
                        width: double.infinity,
                        height: double.infinity,
                        decoration: BoxDecoration(
                          color: AppTheme.creamBeigeSoft,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: product.imageUrl != null && product.imageUrl!.isNotEmpty
                            ? Image.network(
                                product.imageUrl!,
                                width: double.infinity,
                                height: double.infinity,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => _buildPlaceholderIcon(),
                              )
                            : _buildPlaceholderIcon(),
                      ),
                      Positioned(
                        top: 5,
                        left: 5,
                        child: _buildDietaryDot(product.dietaryType),
                      ),
                      if (!product.inStock)
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              color: AppTheme.warmWhite.withOpacity(0.82),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            alignment: Alignment.center,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppTheme.cocoaBrown,
                                borderRadius: BorderRadius.circular(5),
                              ),
                              child: Text(
                                l10n.outOfStock.toUpperCase(),
                                style: const TextStyle(
                                  color: AppTheme.warmWhite,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),

                // Name with compact uniform height for consistent card alignment
                SizedBox(
                  height: 30,
                  child: Text(
                    product.localizedName(context),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.cocoaBrown,
                      height: 1.2,
                    ),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  product.localizedUnit(context),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.textMuted,
                    fontWeight: FontWeight.w600,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 6),

                // Price & Add Button Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '₹${product.displayPrice.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.cocoaBrown,
                      ),
                    ),
                    if (currentQty == 0)
                      SizedBox(
                        height: 28,
                        child: OutlinedButton(
                          onPressed: () async {
                            if (effectiveStoreId.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(l10n.selectStoreTitle),
                                  backgroundColor: AppTheme.spiceOrange,
                                ),
                              );
                              return;
                            }
                            if (!product.inStock) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('${product.localizedName(context)} - ${l10n.outOfStock}'),
                                  backgroundColor: const Color(0xFFC0392B),
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
                                    content: Text(cartProv.errorMessage ?? l10n.switchStoreRecipeMessage),
                                    actions: [
                                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l10n.cancel)),
                                      ElevatedButton(
                                        onPressed: () => Navigator.pop(ctx, true),
                                        child: Text(l10n.switchStoreAndAdd),
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
                                    backgroundColor: const Color(0xFFC0392B),
                                  ),
                                );
                              }
                            }
                          },
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppTheme.spiceOrange, width: 1.5),
                            backgroundColor: AppTheme.spiceOrangeSoft,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: Text(
                            l10n.add,
                            style: const TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.spiceOrange,
                            ),
                          ),
                        ),
                      )
                    else
                      Container(
                        height: 28,
                        decoration: BoxDecoration(
                          color: AppTheme.spiceOrange,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.spiceOrange.withOpacity(0.3),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            InkWell(
                              onTap: () {
                                final items = cartProv.cart?.items ?? [];
                                final cartItem = items.cast<CartItemModel?>().firstWhere(
                                      (i) => i?.productId == product.id,
                                      orElse: () => null,
                                    );
                                if (cartItem != null) {
                                  if (currentQty <= 1) {
                                    cartProv.removeItem(
                                      cartItem.id,
                                      storeId: effectiveStoreId,
                                    );
                                  } else {
                                    cartProv.updateQuantity(
                                      itemId: cartItem.id,
                                      quantity: currentQty - 1,
                                      storeId: effectiveStoreId,
                                    );
                                  }
                                }
                              },
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                child: Icon(
                                  currentQty <= 1 ? Icons.delete_outline : Icons.remove,
                                  size: 16,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            Text(
                              '$currentQty',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 13,
                              ),
                            ),
                            InkWell(
                              onTap: () {
                                final items = cartProv.cart?.items ?? [];
                                final cartItem = items.cast<CartItemModel?>().firstWhere(
                                      (i) => i?.productId == product.id,
                                      orElse: () => null,
                                    );
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
                              child: const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 8),
                                child: Icon(Icons.add, size: 16, color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildPlaceholderIcon() {
    return const Center(
      child: Icon(
        Icons.shopping_bag_outlined,
        size: 38,
        color: AppTheme.creamBeige,
      ),
    );
  }

  Widget _buildDietaryDot(DietaryType type) {
    Color color = AppTheme.oliveGreen;
    if (type == DietaryType.NON_VEG) color = const Color(0xFFB91C1C);
    if (type == DietaryType.CONTAINS_EGG) color = const Color(0xFFD97706);

    return Container(
      width: 14,
      height: 14,
      decoration: BoxDecoration(
        color: AppTheme.warmWhite,
        border: Border.all(color: color, width: 1.5),
        borderRadius: BorderRadius.circular(4),
      ),
      alignment: Alignment.center,
      child: Container(
        width: 6,
        height: 6,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}
