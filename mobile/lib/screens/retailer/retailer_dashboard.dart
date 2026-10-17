import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/retailer_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/language_selector_sheet.dart';
import '../../utils/content_localizer.dart';
import 'retailer_inventory_screen.dart';

class RetailerDashboard extends StatefulWidget {
  const RetailerDashboard({super.key});

  @override
  State<RetailerDashboard> createState() => _RetailerDashboardState();
}

class _RetailerDashboardState extends State<RetailerDashboard> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<RetailerProvider>(context, listen: false).loadDashboard();
    });
  }

  void _showOrderActionDialog(BuildContext context, RetailerProvider retProv, OrderModel order) {
    final l10n = AppLocalizations.of(context);
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  l10n.orderNumber(order.orderNumber),
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                ),
                StatusBadge.fromOrderStatus(
                  order.orderStatus,
                  label: getLocalizedOrderStatus(order.orderStatus, l10n),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              l10n.selectNextStep,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 12),

            if (order.orderStatus == OrderStatus.PLACED) ...[
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
                icon: const Icon(Icons.check_circle_outline),
                label: Text(l10n.confirmOrderAction),
                onPressed: () async {
                  Navigator.pop(ctx);
                  await retProv.updateOrderStatus(orderId: order.id, newStatus: 'CONFIRMED');
                },
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(foregroundColor: Colors.redAccent),
                icon: const Icon(Icons.cancel_outlined),
                label: Text(l10n.cancelAndRestock),
                onPressed: () async {
                  Navigator.pop(ctx);
                  await retProv.updateOrderStatus(orderId: order.id, newStatus: 'CANCELLED');
                },
              ),
            ] else if (order.orderStatus == OrderStatus.CONFIRMED) ...[
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFC2410C)),
                icon: const Icon(Icons.inventory_2_outlined),
                label: Text(l10n.startPackingGroceries),
                onPressed: () async {
                  Navigator.pop(ctx);
                  await retProv.updateOrderStatus(orderId: order.id, newStatus: 'PREPARING');
                },
              ),
            ] else if (order.orderStatus == OrderStatus.PREPARING) ...[
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7E22CE)),
                icon: const Icon(Icons.local_shipping_outlined),
                label: Text(l10n.markReadyAction),
                onPressed: () async {
                  Navigator.pop(ctx);
                  await retProv.updateOrderStatus(orderId: order.id, newStatus: 'READY_FOR_PICKUP');
                },
              ),
            ] else ...[
              Padding(
                padding: const EdgeInsets.all(12),
                child: Text(
                  l10n.orderHandedOff,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppTheme.textMuted),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Consumer2<RetailerProvider, AuthProvider>(
      builder: (context, retProv, authProv, child) {
        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.storeManagerPortal),
                Text(
                  retProv.storeName,
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
              ],
            ),
            actions: [
              const LanguageSelectorButton(),
              IconButton(
                tooltip: l10n.stockManagement,
                icon: const Icon(Icons.inventory_2_outlined, color: AppTheme.primaryGreen),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const RetailerInventoryScreen()),
                  );
                },
              ),
              IconButton(
                tooltip: l10n.logOut,
                icon: const Icon(Icons.logout, color: AppTheme.textMuted),
                onPressed: () => authProv.logout(),
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: () => retProv.loadDashboard(),
            color: AppTheme.primaryGreen,
            child: retProv.isLoading && retProv.store == null
                ? LoadingView(message: l10n.loading)
                : retProv.errorMessage != null && retProv.store == null
                    ? ErrorStateView(
                        message: retProv.errorMessage!,
                        onRetry: () => retProv.loadDashboard(),
                        retryLabel: l10n.retry,
                      )
                    : Column(
                        children: [
                          // Store Overview Banner
                          Container(
                            color: Colors.white,
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppTheme.mintLight,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(Icons.storefront, color: AppTheme.primaryGreen, size: 28),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        retProv.storeName,
                                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                                      ),
                                      Text(
                                        '${retProv.store?['address']}, ${retProv.store?['city']}',
                                        style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                      ),
                                    ],
                                  ),
                                ),
                                OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                  ),
                                  icon: const Icon(Icons.edit_note, size: 16),
                                  label: Text(l10n.stockManagement, style: const TextStyle(fontSize: 12)),
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (_) => const RetailerInventoryScreen()),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ),

                          // Filter Tabs (All, Placed, Preparing, Ready)
                          Container(
                            color: Colors.white,
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: [
                                  _buildTabChip(retProv, 'ALL', l10n.allOrdersTab(retProv.orders.length)),
                                  const SizedBox(width: 8),
                                  _buildTabChip(retProv, 'PLACED', l10n.newPlacedTab),
                                  const SizedBox(width: 8),
                                  _buildTabChip(retProv, 'CONFIRMED', l10n.confirmedTab),
                                  const SizedBox(width: 8),
                                  _buildTabChip(retProv, 'PREPARING', l10n.packingTab),
                                  const SizedBox(width: 8),
                                  _buildTabChip(retProv, 'READY_FOR_PICKUP', l10n.readyTab),
                                ],
                              ),
                            ),
                          ),

                          // Orders List
                          Expanded(
                            child: retProv.filteredOrders.isEmpty
                                ? EmptyStateView(
                                    icon: Icons.assignment_turned_in_outlined,
                                    title: l10n.noOrdersForStatus,
                                    description: '',
                                  )
                                : ListView.separated(
                                    padding: const EdgeInsets.all(16),
                                    itemCount: retProv.filteredOrders.length,
                                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                                    itemBuilder: (context, idx) {
                                      final order = retProv.filteredOrders[idx];
                                      return Container(
                                        padding: const EdgeInsets.all(16),
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(16),
                                          border: Border.all(color: const Color(0xFFEEEEEE)),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Text(
                                                  order.orderNumber,
                                                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                                                ),
                                                StatusBadge.fromOrderStatus(
                                                  order.orderStatus,
                                                  label: getLocalizedOrderStatus(order.orderStatus, l10n),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            // Items preview
                                            Text(
                                              order.items.map((i) => '${i.quantity}x ${ContentLocalizer.productName(i.productName, Localizations.localeOf(context).languageCode)}').join(', '),
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(fontSize: 13, color: AppTheme.textDark),
                                            ),
                                            const Divider(height: 20, color: Color(0xFFF1F5F9)),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Text(
                                                  '₹${order.totalAmount.toStringAsFixed(0)} • ${order.paymentMethod}',
                                                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                                                ),
                                                ElevatedButton(
                                                  style: ElevatedButton.styleFrom(
                                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                                  ),
                                                  onPressed: () => _showOrderActionDialog(context, retProv, order),
                                                  child: Text(l10n.updateStatus, style: const TextStyle(fontSize: 12)),
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
          ),
        );
      },
    );
  }

  Widget _buildTabChip(RetailerProvider retProv, String tabKey, String label) {
    final isSelected = retProv.activeTab == tabKey;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppTheme.primaryGreen,
      backgroundColor: const Color(0xFFF1F5F9),
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppTheme.textDark,
        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        fontSize: 12,
      ),
      onSelected: (val) {
        if (val) retProv.setActiveTab(tabKey);
      },
    );
  }
}

