import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../models/delivery_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/delivery_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/language_selector_sheet.dart';

class DeliveryDashboard extends StatefulWidget {
  const DeliveryDashboard({super.key});

  @override
  State<DeliveryDashboard> createState() => _DeliveryDashboardState();
}

class _DeliveryDashboardState extends State<DeliveryDashboard> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<DeliveryProvider>(context, listen: false).loadDashboard();
    });
  }

  String _getLocalizedDeliveryStatus(DeliveryStatus status, AppLocalizations l10n) {
    switch (status) {
      case DeliveryStatus.ASSIGNED:
        return l10n.partnerAssigned;
      case DeliveryStatus.ACCEPTED:
        return l10n.statusConfirmed;
      case DeliveryStatus.PICKED_UP:
        return l10n.statusOutForDelivery;
      case DeliveryStatus.ARRIVED_AT_LOCATION:
        return l10n.arrivedLocationAction;
      case DeliveryStatus.DELIVERED:
        return l10n.statusDelivered;
      case DeliveryStatus.FAILED:
        return l10n.statusFailed;
    }
  }

  void _showOtpVerificationDialog(BuildContext context, DeliveryProvider delProv, String deliveryId) {
    final l10n = AppLocalizations.of(context);
    final otpCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.verified_user_outlined, color: AppTheme.primaryGreen),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                l10n.verifyOtpTitle,
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              l10n.verifyOtpSubtitle,
              style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 18),
            TextField(
              controller: otpCtrl,
              keyboardType: TextInputType.number,
              maxLength: 6,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: 6,
                color: AppTheme.primaryDark,
              ),
              decoration: const InputDecoration(
                counterText: '',
                hintText: '• • • • • •',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(l10n.cancel)),
          ElevatedButton(
            onPressed: () async {
              final otp = otpCtrl.text.trim();
              if (otp.length != 6) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(l10n.enterOtpDigits), backgroundColor: Colors.orange),
                );
                return;
              }
              Navigator.pop(ctx);
              final success = await delProv.completeWithOtp(deliveryId: deliveryId, otp: otp);
              if (mounted) {
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(l10n.otpVerifiedSuccess),
                      backgroundColor: AppTheme.primaryGreen,
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(delProv.errorMessage ?? l10n.somethingWentWrong),
                      backgroundColor: Colors.redAccent,
                    ),
                  );
                }
              }
            },
            child: Text(l10n.verifyAndComplete),
          ),
        ],
      ),
    );
  }

  void _simulateLocationUpdate(BuildContext context, DeliveryProvider delProv) async {
    final l10n = AppLocalizations.of(context);
    final success = await delProv.updateGpsCoordinates(18.5204, 73.8567);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? l10n.gpsLocationBroadcasted : l10n.somethingWentWrong),
          backgroundColor: success ? AppTheme.primaryGreen : Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Consumer2<DeliveryProvider, AuthProvider>(
      builder: (context, delProv, authProv, child) {
        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            title: Text(l10n.deliveryHub),
            actions: [
              const LanguageSelectorButton(),
              IconButton(
                tooltip: l10n.simulateGps,
                icon: const Icon(Icons.my_location, color: AppTheme.primaryGreen),
                onPressed: () => _simulateLocationUpdate(context, delProv),
              ),
              IconButton(
                tooltip: l10n.logOut,
                icon: const Icon(Icons.logout, color: AppTheme.textMuted),
                onPressed: () => authProv.logout(),
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: () => delProv.loadDashboard(),
            color: AppTheme.primaryGreen,
            child: delProv.isLoading && delProv.assignments.isEmpty
                ? LoadingView(message: l10n.loading)
                : delProv.errorMessage != null && delProv.assignments.isEmpty
                    ? ErrorStateView(
                        message: delProv.errorMessage!,
                        onRetry: () => delProv.loadDashboard(),
                        retryLabel: l10n.retry,
                      )
                    : SingleChildScrollView(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Partner Profile & Stats Card
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFEEEEEE)),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 24,
                                    backgroundColor: AppTheme.mintLight,
                                    child: const Icon(Icons.directions_bike, color: AppTheme.primaryGreen, size: 28),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          authProv.user?.name ?? l10n.deliveryPartner,
                                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                                        ),
                                        Text(
                                          authProv.user?.phoneNumber ?? '',
                                          style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppTheme.mintLight,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      l10n.onlineStatus,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.primaryGreen,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Active Tasks Header
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  l10n.assignedTasks,
                                  style: const TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.textDark,
                                  ),
                                ),
                                Text(
                                  l10n.activeTasksCount(delProv.activeDeliveries.length),
                                  style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            if (delProv.activeDeliveries.isEmpty)
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 40),
                                child: EmptyStateView(
                                  icon: Icons.check_circle_outline,
                                  title: l10n.allCaughtUp,
                                  description: l10n.allCaughtUpDesc,
                                ),
                              )
                            else
                              ListView.separated(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: delProv.activeDeliveries.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 12),
                                itemBuilder: (context, idx) {
                                  final delivery = delProv.activeDeliveries[idx];
                                  final order = delivery.order;

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
                                              order?.orderNumber ?? 'Delivery #${delivery.id.substring(0, 8)}',
                                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: AppTheme.mintLight,
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                _getLocalizedDeliveryStatus(delivery.status, l10n),
                                                style: const TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                  color: AppTheme.primaryDark,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 10),

                                        // Store & Drop Details
                                        Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Icon(Icons.storefront, size: 16, color: AppTheme.textMuted),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                l10n.pickupFromStore(order?.storeName ?? l10n.ingrezyStore),
                                                style: const TextStyle(fontSize: 13, color: AppTheme.textDark),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        if (order?.address != null)
                                          Row(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const Icon(Icons.location_on, size: 16, color: AppTheme.primaryGreen),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  l10n.dropAtLocation(order!.address!.formattedAddress),
                                                  style: const TextStyle(fontSize: 13, color: AppTheme.textDark),
                                                ),
                                              ),
                                            ],
                                          ),
                                        const Divider(height: 20, color: Color(0xFFF1F5F9)),

                                        // Action Stepper Buttons
                                        if (delivery.status == DeliveryStatus.ASSIGNED) ...[
                                          ElevatedButton(
                                            style: ElevatedButton.styleFrom(
                                              minimumSize: const Size.fromHeight(44),
                                            ),
                                            onPressed: () => delProv.acceptDelivery(delivery.id),
                                            child: Text(l10n.acceptTaskAction),
                                          ),
                                        ] else if (delivery.status == DeliveryStatus.ACCEPTED) ...[
                                          ElevatedButton.icon(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: const Color(0xFFC2410C),
                                              minimumSize: const Size.fromHeight(44),
                                            ),
                                            icon: const Icon(Icons.inventory),
                                            label: Text(l10n.confirmStorePickupAction),
                                            onPressed: () => delProv.pickupDelivery(delivery.id),
                                          ),
                                        ] else if (delivery.status == DeliveryStatus.PICKED_UP ||
                                            delivery.status == DeliveryStatus.ARRIVED_AT_LOCATION) ...[
                                          ElevatedButton.icon(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppTheme.primaryGreen,
                                              minimumSize: const Size.fromHeight(44),
                                            ),
                                            icon: const Icon(Icons.pin),
                                            label: Text(l10n.verifyOtpAction),
                                            onPressed: () => _showOtpVerificationDialog(context, delProv, delivery.id),
                                          ),
                                        ],
                                      ],
                                    ),
                                  );
                                },
                              ),
                          ],
                        ),
                      ),
          ),
        );
      },
    );
  }
}

