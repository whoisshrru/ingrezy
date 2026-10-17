import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../providers/order_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../utils/content_localizer.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<OrderProvider>(context, listen: false)
          .fetchOrderDetails(widget.orderId);
    });
  }

  void _showOtpDialog(BuildContext context, String orderId) async {
    final l10n = AppLocalizations.of(context);
    final orderProv = Provider.of<OrderProvider>(context, listen: false);
    final otpData = await orderProv.fetchDeliveryOtp(orderId);

    if (!context.mounted) return;

    if (otpData != null && otpData['otp'] != null) {
      final otp = otpData['otp'].toString();
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              const Icon(Icons.shield_outlined, color: AppTheme.primaryGreen),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  l10n.securityOtpTitle,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                l10n.otpInstruction,
                style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                decoration: BoxDecoration(
                  color: AppTheme.mintLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.primaryGreen, width: 2),
                ),
                child: Text(
                  otp,
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 8,
                    color: AppTheme.primaryDark,
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                l10n.otpExpiresNotice,
                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(l10n.close),
            ),
          ],
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.otpPartnerNotAssigned),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(l10n.orderTrackingTitle),
      ),
      body: Consumer<OrderProvider>(
        builder: (context, orderProv, child) {
          if (orderProv.isLoading && orderProv.selectedOrder == null) {
            return LoadingView(message: l10n.loading);
          }

          if (orderProv.selectedOrder == null) {
            return EmptyStateView(
              icon: Icons.error_outline,
              title: l10n.orderNotFound,
              description: l10n.orderNotFoundDesc,
              actionLabel: l10n.refresh,
              onAction: () => orderProv.fetchOrderDetails(widget.orderId),
            );
          }

          final order = orderProv.selectedOrder!;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Live Tracking Status Card
                Container(
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
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                order.orderNumber,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.textDark,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${order.createdAt.hour}:${order.createdAt.minute.toString().padLeft(2, '0')} • ${order.storeName ?? l10n.ingrezyStore}',
                                style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                              ),
                            ],
                          ),
                          StatusBadge.fromOrderStatus(
                            order.orderStatus,
                            label: getLocalizedOrderStatus(order.orderStatus, l10n),
                          ),
                        ],
                      ),
                      const Divider(height: 24, color: Color(0xFFEEEEEE)),

                      // Delivery Partner & OTP Button
                      if (order.deliveryPartnerName != null) ...[
                        Row(
                          children: [
                            const CircleAvatar(
                              backgroundColor: AppTheme.mintLight,
                              child: Icon(Icons.delivery_dining, color: AppTheme.primaryGreen),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    order.deliveryPartnerName!,
                                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                                  ),
                                  Text(
                                    order.deliveryPartnerPhone ?? l10n.deliveryPartner,
                                    style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Customer OTP Retrieval Action
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.mintLight,
                          foregroundColor: AppTheme.primaryDark,
                          elevation: 0,
                          minimumSize: const Size.fromHeight(44),
                        ),
                        onPressed: () => _showOtpDialog(context, order.id),
                        icon: const Icon(Icons.pin, size: 18),
                        label: Text(l10n.viewDeliveryOtp),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Order Items Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFEEEEEE)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.itemsOrdered,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textDark,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: order.items.length,
                        separatorBuilder: (_, __) => const Divider(height: 16, color: Color(0xFFF1F5F9)),
                        itemBuilder: (context, idx) {
                          final item = order.items[idx];
                          return Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  '${item.quantity}x ${ContentLocalizer.productName(item.productName, Localizations.localeOf(context).languageCode)}',
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                ),
                              ),
                              Text(
                                '₹${item.subtotal.toStringAsFixed(0)}',
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                              ),
                            ],
                          );
                        },
                      ),
                      const Divider(height: 24, color: Color(0xFFEEEEEE)),

                      // Total Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            l10n.grandTotal,
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                          ),
                          Text(
                            '₹${order.totalAmount.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Delivery Address Card
                if (order.address != null)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFEEEEEE)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.deliveryLocation,
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.textDark),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${order.address!.label}: ${order.address!.formattedAddress}',
                          style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

