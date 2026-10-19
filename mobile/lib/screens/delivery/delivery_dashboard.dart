import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../models/delivery_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/delivery_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/language_selector_sheet.dart';
import '../customer/profile_screen.dart';

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
        backgroundColor: AppTheme.warmWhite,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.verified_user_outlined, color: AppTheme.spiceOrange),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                l10n.verifyOtpTitle,
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17, color: AppTheme.cocoaBrown),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              l10n.verifyOtpSubtitle,
              style: const TextStyle(fontSize: 13, color: AppTheme.cocoaBrownLight),
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
                color: AppTheme.cocoaBrown,
              ),
              decoration: InputDecoration(
                counterText: '',
                hintText: '• • • • • •',
                hintStyle: const TextStyle(color: AppTheme.cocoaBrownLight),
                filled: true,
                fillColor: AppTheme.creamBeigeLight,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.cardBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.cardBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.spiceOrange, width: 1.5),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l10n.cancel, style: const TextStyle(color: AppTheme.cocoaBrownLight)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.spiceOrange,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
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
                      backgroundColor: AppTheme.oliveGreen,
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
          backgroundColor: success ? AppTheme.oliveGreen : Colors.redAccent,
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
          backgroundColor: AppTheme.warmWhite,
          appBar: AppBar(
            backgroundColor: AppTheme.warmWhite,
            title: Text(
              l10n.deliveryHub,
              style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.cocoaBrown),
            ),
            actions: [
              const LanguageSelectorButton(),
              IconButton(
                tooltip: l10n.simulateGps,
                icon: const Icon(Icons.my_location, color: AppTheme.spiceOrange),
                onPressed: () => _simulateLocationUpdate(context, delProv),
              ),
              const SizedBox(width: 4),
              // Rider Profile Button
              MouseRegion(
                cursor: SystemMouseCursors.click,
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ProfileScreen()),
                    );
                  },
                  child: Tooltip(
                    message: l10n.profile,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppTheme.oliveGreen,
                          width: 1.5,
                        ),
                      ),
                      child: CircleAvatar(
                        radius: 16,
                        backgroundColor: AppTheme.creamBeigeLight,
                        child: Text(
                          authProv.user?.name.isNotEmpty == true
                              ? authProv.user!.name.substring(0, 1).toUpperCase()
                              : 'D',
                          style: const TextStyle(
                            color: AppTheme.cocoaBrown,
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: () => delProv.loadDashboard(),
            color: AppTheme.spiceOrange,
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
                                color: AppTheme.warmWhite,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppTheme.cardBorder),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppTheme.cocoaBrown.withValues(alpha: 0.04),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 24,
                                    backgroundColor: AppTheme.creamBeigeLight,
                                    child: const Icon(Icons.directions_bike, color: AppTheme.spiceOrange, size: 28),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          authProv.user?.name ?? l10n.deliveryPartner,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w800,
                                            fontSize: 16,
                                            color: AppTheme.cocoaBrown,
                                          ),
                                        ),
                                        Text(
                                          authProv.user?.phoneNumber ?? '',
                                          style: const TextStyle(fontSize: 12, color: AppTheme.cocoaBrownLight),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppTheme.oliveGreenSoft,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      l10n.onlineStatus,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.oliveGreen,
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
                                    color: AppTheme.cocoaBrown,
                                  ),
                                ),
                                Text(
                                  l10n.activeTasksCount(delProv.activeDeliveries.length),
                                  style: const TextStyle(fontSize: 13, color: AppTheme.cocoaBrownLight),
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
                                      color: AppTheme.warmWhite,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: AppTheme.cardBorder),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppTheme.cocoaBrown.withValues(alpha: 0.03),
                                          blurRadius: 6,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              order?.orderNumber ?? 'Delivery #${delivery.id.substring(0, 8)}',
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w800,
                                                fontSize: 15,
                                                color: AppTheme.cocoaBrown,
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: AppTheme.creamBeigeLight,
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                _getLocalizedDeliveryStatus(delivery.status, l10n),
                                                style: const TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                  color: AppTheme.cocoaBrown,
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
                                            const Icon(Icons.storefront, size: 16, color: AppTheme.cocoaBrownLight),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                l10n.pickupFromStore(order?.storeName ?? l10n.ingrezyStore),
                                                style: const TextStyle(fontSize: 13, color: AppTheme.cocoaBrown),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        if (order?.address != null)
                                          Row(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const Icon(Icons.location_on, size: 16, color: AppTheme.spiceOrange),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  l10n.dropAtLocation(order!.address!.formattedAddress),
                                                  style: const TextStyle(fontSize: 13, color: AppTheme.cocoaBrown),
                                                ),
                                              ),
                                            ],
                                          ),
                                        const Divider(height: 20, color: AppTheme.cardBorder),

                                        // Action Stepper Buttons
                                        if (delivery.status == DeliveryStatus.ASSIGNED) ...[
                                          ElevatedButton(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppTheme.spiceOrange,
                                              foregroundColor: Colors.white,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                              minimumSize: const Size.fromHeight(44),
                                            ),
                                            onPressed: () => delProv.acceptDelivery(delivery.id),
                                            child: Text(l10n.acceptTaskAction, style: const TextStyle(fontWeight: FontWeight.w700)),
                                          ),
                                        ] else if (delivery.status == DeliveryStatus.ACCEPTED) ...[
                                          ElevatedButton.icon(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppTheme.oliveGreen,
                                              foregroundColor: Colors.white,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                              minimumSize: const Size.fromHeight(44),
                                            ),
                                            icon: const Icon(Icons.inventory),
                                            label: Text(l10n.confirmStorePickupAction, style: const TextStyle(fontWeight: FontWeight.w700)),
                                            onPressed: () => delProv.pickupDelivery(delivery.id),
                                          ),
                                        ] else if (delivery.status == DeliveryStatus.PICKED_UP ||
                                            delivery.status == DeliveryStatus.ARRIVED_AT_LOCATION) ...[
                                          ElevatedButton.icon(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppTheme.spiceOrange,
                                              foregroundColor: Colors.white,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                              minimumSize: const Size.fromHeight(44),
                                            ),
                                            icon: const Icon(Icons.pin),
                                            label: Text(l10n.verifyOtpAction, style: const TextStyle(fontWeight: FontWeight.w700)),
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

