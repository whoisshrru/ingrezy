import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../providers/auth_provider.dart';
import '../../providers/order_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/language_selector_sheet.dart';
import 'order_detail_screen.dart';

class OrdersScreen extends StatefulWidget {
  final VoidCallback? onStartShopping;
  const OrdersScreen({super.key, this.onStartShopping});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<OrderProvider>(context, listen: false).fetchOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Consumer2<OrderProvider, AuthProvider>(
      builder: (context, orderProv, authProv, child) {
        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            title: Text(l10n.myOrders),
            actions: [
              const LanguageSelectorButton(),
              IconButton(
                tooltip: l10n.logOut,
                icon: const Icon(Icons.logout, color: AppTheme.textMuted),
                onPressed: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: Text(l10n.logOutConfirmTitle),
                      content: Text(l10n.logOutConfirmMessage),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l10n.cancel)),
                        ElevatedButton(
                          onPressed: () => Navigator.pop(ctx, true),
                          child: Text(l10n.logOut),
                        ),
                      ],
                    ),
                  );
                  if (confirm == true) {
                    authProv.logout();
                  }
                },
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: () => orderProv.fetchOrders(),
            color: AppTheme.primaryGreen,
            child: orderProv.isLoading && orderProv.orders.isEmpty
                ? LoadingView(message: l10n.loading)
                : orderProv.errorMessage != null && orderProv.orders.isEmpty
                    ? ErrorStateView(
                        message: orderProv.errorMessage!,
                        onRetry: () => orderProv.fetchOrders(),
                        retryLabel: l10n.retry,
                      )
                    : orderProv.orders.isEmpty
                        ? EmptyStateView(
                            icon: Icons.receipt_long_outlined,
                            title: l10n.noOrdersYet,
                            description: l10n.noOrdersDesc,
                            actionLabel: l10n.startShopping,
                            onAction: widget.onStartShopping,
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: orderProv.orders.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final order = orderProv.orders[index];
                              return InkWell(
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => OrderDetailScreen(orderId: order.id),
                                    ),
                                  );
                                },
                                borderRadius: BorderRadius.circular(16),
                                child: Container(
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
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w800,
                                              fontSize: 15,
                                              color: AppTheme.textDark,
                                            ),
                                          ),
                                          StatusBadge.fromOrderStatus(
                                            order.orderStatus,
                                            label: getLocalizedOrderStatus(order.orderStatus, l10n),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        '${order.items.length} ${l10n.items} • ${order.storeName ?? l10n.ingrezyStore}',
                                        style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                                      ),
                                      const SizedBox(height: 12),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            '₹${order.totalAmount.toStringAsFixed(0)}',
                                            style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w900,
                                              color: AppTheme.primaryGreen,
                                            ),
                                          ),
                                          Row(
                                            children: [
                                              Text(
                                                l10n.trackOrder,
                                                style: const TextStyle(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w700,
                                                  color: AppTheme.primaryGreen,
                                                ),
                                              ),
                                              const SizedBox(width: 4),
                                              const Icon(Icons.arrow_forward_ios, size: 12, color: AppTheme.primaryGreen),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
          ),
        );
      },
    );
  }
}

