import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../providers/retailer_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../utils/content_localizer.dart';

class RetailerInventoryScreen extends StatefulWidget {
  const RetailerInventoryScreen({super.key});

  @override
  State<RetailerInventoryScreen> createState() => _RetailerInventoryScreenState();
}

class _RetailerInventoryScreenState extends State<RetailerInventoryScreen> {
  final _searchCtrl = TextEditingController();
  String _searchFilter = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _showEditPriceDialog(BuildContext context, RetailerProvider retProv, String productId, double currentPrice) {
    final l10n = AppLocalizations.of(context);
    final priceCtrl = TextEditingController(text: currentPrice.toStringAsFixed(0));
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.updateSellingPrice),
        content: TextField(
          controller: priceCtrl,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: l10n.storeSellingPrice,
            prefixText: '₹ ',
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(l10n.cancel)),
          ElevatedButton(
            onPressed: () async {
              final newPrice = double.tryParse(priceCtrl.text);
              if (newPrice != null && newPrice >= 0) {
                Navigator.pop(ctx);
                await retProv.updateStock(productId: productId, price: newPrice);
              }
            },
            child: Text(l10n.save),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Consumer<RetailerProvider>(
      builder: (context, retProv, child) {
        final filtered = retProv.inventory.where((item) {
          if (_searchFilter.isEmpty) return true;
          return item.name.toLowerCase().contains(_searchFilter.toLowerCase()) ||
              item.category.toLowerCase().contains(_searchFilter.toLowerCase());
        }).toList();

        return Scaffold(
          appBar: AppBar(
            title: Text(l10n.storeInventoryTitle),
          ),
          body: Column(
            children: [
              // Search input
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(16),
                child: TextField(
                  controller: _searchCtrl,
                  onChanged: (val) => setState(() => _searchFilter = val),
                  decoration: InputDecoration(
                    hintText: l10n.searchInventoryHint,
                    prefixIcon: const Icon(Icons.search, color: AppTheme.textMuted),
                    suffixIcon: _searchFilter.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchCtrl.clear();
                              setState(() => _searchFilter = '');
                            },
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  ),
                ),
              ),

              // Inventory items list
              Expanded(
                child: retProv.isLoading && retProv.inventory.isEmpty
                    ? LoadingView(message: l10n.loading)
                    : filtered.isEmpty
                        ? EmptyStateView(
                            icon: Icons.inventory_2_outlined,
                            title: l10n.noInventoryItems,
                            description: l10n.noInventoryDesc,
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, idx) {
                              final item = filtered[idx];
                              final inStock = item.inStock;

                              return Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: inStock ? const Color(0xFFEEEEEE) : Colors.red.shade100,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item.localizedName(context),
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w700,
                                              fontSize: 15,
                                              color: AppTheme.textDark,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '${getLocalizedCategory(item.category, l10n)} • ${item.localizedUnit(context)}',
                                            style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                          ),
                                          const SizedBox(height: 6),
                                          GestureDetector(
                                            onTap: () => _showEditPriceDialog(
                                              context,
                                              retProv,
                                              item.id,
                                              item.displayPrice,
                                            ),
                                            child: Row(
                                              children: [
                                                Text(
                                                  '${l10n.price}: ₹${item.displayPrice.toStringAsFixed(0)}',
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 14,
                                                    color: AppTheme.primaryGreen,
                                                  ),
                                                ),
                                                const SizedBox(width: 4),
                                                const Icon(Icons.edit, size: 13, color: AppTheme.primaryGreen),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),

                                    // Quick Quantity Stepper
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Row(
                                          children: [
                                            IconButton(
                                              icon: const Icon(Icons.remove_circle_outline, color: AppTheme.textMuted),
                                              onPressed: (item.stockQuantity ?? 0) > 0
                                                  ? () => retProv.updateStock(
                                                        productId: item.id,
                                                        stockQuantity: (item.stockQuantity ?? 0) - 1,
                                                      )
                                                  : null,
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFF1F5F9),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                '${item.stockQuantity ?? 0}',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w800,
                                                  fontSize: 15,
                                                  color: AppTheme.textDark,
                                                ),
                                              ),
                                            ),
                                            IconButton(
                                              icon: const Icon(Icons.add_circle_outline, color: AppTheme.primaryGreen),
                                              onPressed: () => retProv.updateStock(
                                                productId: item.id,
                                                stockQuantity: (item.stockQuantity ?? 0) + 1,
                                              ),
                                            ),
                                          ],
                                        ),
                                        // Availability Toggle Switch
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              (item.isAvailable ?? true) ? l10n.available : l10n.disabled,
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                                color: (item.isAvailable ?? true) ? AppTheme.primaryGreen : Colors.red,
                                              ),
                                            ),
                                            Transform.scale(
                                              scale: 0.7,
                                              child: Switch(
                                                value: item.isAvailable ?? true,
                                                activeColor: AppTheme.primaryGreen,
                                                onChanged: (val) {
                                                  retProv.updateStock(productId: item.id, isAvailable: val);
                                                },
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
              ),
            ],
          ),
        );
      },
    );
  }
}

