import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/delivery_provider.dart';
import '../../providers/locale_provider.dart';
import '../../providers/order_provider.dart';
import '../../providers/product_provider.dart';
import '../../providers/retailer_provider.dart';
import '../../services/auth_service.dart';
import '../../widgets/language_selector_sheet.dart';
import '../retailer/retailer_inventory_screen.dart';
import 'address_screen.dart';
import 'cart_screen.dart';
import 'orders_screen.dart';

class ProfileScreen extends StatefulWidget {
  final Function(int)? onNavigateTab;
  const ProfileScreen({super.key, this.onNavigateTab});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshProfile();
      final authProv = Provider.of<AuthProvider>(context, listen: false);
      if (authProv.currentRole == UserRole.CUSTOMER) {
        final orderProv = Provider.of<OrderProvider>(context, listen: false);
        if (orderProv.orders.isEmpty) {
          orderProv.fetchOrders();
        }
      } else if (authProv.currentRole == UserRole.DELIVERY_PARTNER) {
        final delProv = Provider.of<DeliveryProvider>(context, listen: false);
        if (delProv.assignments.isEmpty) {
          delProv.loadDashboard();
        }
      } else if (authProv.currentRole == UserRole.RETAILER) {
        final retProv = Provider.of<RetailerProvider>(context, listen: false);
        if (retProv.store == null) {
          retProv.loadDashboard();
        }
      }
    });
  }

  Future<void> _refreshProfile() async {
    try {
      await AuthService.getProfile();
    } catch (_) {}
  }

  void _showStoreSelector(BuildContext context, ProductProvider prodProv) {
    final l10n = AppLocalizations.of(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.warmWhite,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.selectStoreTitle,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppTheme.cocoaBrown,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              l10n.selectStoreSubtitle,
              style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 16),
            if (prodProv.stores.isEmpty)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Center(
                  child: Text(
                    l10n.noActiveStores,
                    style: const TextStyle(color: AppTheme.textMuted),
                  ),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                itemCount: prodProv.stores.length,
                itemBuilder: (context, index) {
                  final s = prodProv.stores[index];
                  final isSelected = prodProv.selectedStoreId == s['id'];
                  return Material(
                    color: Colors.transparent,
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isSelected ? AppTheme.creamBeigeLight : AppTheme.creamBeigeSoft,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.storefront_outlined,
                          color: isSelected ? AppTheme.oliveGreen : AppTheme.textMuted,
                        ),
                      ),
                      title: Text(
                        s['name'] ?? l10n.ingrezyStore,
                        style: TextStyle(
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                          color: isSelected ? AppTheme.cocoaBrown : AppTheme.textDark,
                        ),
                      ),
                      subtitle: Text(
                        '${s['address']}, ${s['city']}',
                        style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                      ),
                      trailing: isSelected
                          ? const Icon(Icons.check_circle, color: AppTheme.oliveGreen)
                          : null,
                      onTap: () {
                        prodProv.selectStore(s['id']);
                        Provider.of<CartProvider>(context, listen: false)
                            .loadCart(storeId: s['id']);
                        Navigator.pop(ctx);
                      },
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  void _showSupportDialog(BuildContext context, UserRole role) {
    String title = 'Ingrezy Customer Support';
    String subtitle = '10-Minute Delivery Assistance';
    if (role == UserRole.DELIVERY_PARTNER) {
      title = 'Ingrezy Rider Support';
      subtitle = 'Delivery Partner & Fleet Dispatch Support';
    } else if (role == UserRole.RETAILER) {
      title = 'Ingrezy Retailer Helpdesk';
      subtitle = 'Dark Store Inventory & Fulfillment Support';
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.warmWhite,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(
                    color: AppTheme.creamBeigeLight,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.support_agent_rounded, color: AppTheme.oliveGreen, size: 24),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.cocoaBrown,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const CircleAvatar(
                backgroundColor: AppTheme.creamBeigeSoft,
                child: Icon(Icons.phone_rounded, color: AppTheme.cocoaBrown),
              ),
              title: const Text('Direct Helpline', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: const Text('+91 98765 43210 (Toll Free / 24x7)'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textMuted),
              onTap: () => Navigator.pop(ctx),
            ),
            const Divider(),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const CircleAvatar(
                backgroundColor: AppTheme.creamBeigeSoft,
                child: Icon(Icons.email_outlined, color: AppTheme.cocoaBrown),
              ),
              title: const Text('Priority Support Email', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: const Text('support@ingrezy.com'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textMuted),
              onTap: () => Navigator.pop(ctx),
            ),
            const Divider(),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const CircleAvatar(
                backgroundColor: AppTheme.creamBeigeSoft,
                child: Icon(Icons.chat_bubble_outline_rounded, color: AppTheme.oliveGreen),
              ),
              title: const Text('WhatsApp Dispatch Desk', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: const Text('+91 98765 43210 (Quick response)'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textMuted),
              onTap: () => Navigator.pop(ctx),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.warmWhite,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: AppTheme.spiceOrangeSoft,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.flash_on, color: AppTheme.spiceOrange, size: 24),
            ),
            const SizedBox(width: 12),
            const Text(
              'About Ingrezy',
              style: TextStyle(fontWeight: FontWeight.w800, color: AppTheme.cocoaBrown),
            ),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Ingrezy Quick Commerce v1.0.0',
              style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.cocoaBrown),
            ),
            SizedBox(height: 8),
            Text(
              'Instant 10-Minute Grocery Delivery and Smart Recipe Bundling application powered by localized micro-warehouses and dark stores.',
              style: TextStyle(fontSize: 13, color: AppTheme.textMuted, height: 1.4),
            ),
            SizedBox(height: 12),
            Text(
              'Serving Pune & Satara regions with farm-fresh produce, pantry essentials, and curated meal ingredient kits.',
              style: TextStyle(fontSize: 13, color: AppTheme.textMuted, height: 1.4),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close', style: TextStyle(color: AppTheme.spiceOrange, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Future<void> _handleLogout(BuildContext context, AuthProvider authProv, AppLocalizations l10n) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.warmWhite,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFC0392B).withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.logout_rounded, color: Color(0xFFC0392B), size: 22),
            ),
            const SizedBox(width: 10),
            Text(
              l10n.logOutConfirmTitle,
              style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.cocoaBrown),
            ),
          ],
        ),
        content: Text(
          l10n.logOutConfirmMessage,
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 14, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              l10n.cancel,
              style: const TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.w600),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFC0392B),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l10n.logOut, style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await authProv.logout();
      if (context.mounted) {
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final authProv = Provider.of<AuthProvider>(context);
    final cartProv = Provider.of<CartProvider>(context);
    final orderProv = Provider.of<OrderProvider>(context);
    final prodProv = Provider.of<ProductProvider>(context);
    final delProv = Provider.of<DeliveryProvider>(context);
    final retProv = Provider.of<RetailerProvider>(context);
    final localeProv = Provider.of<LocaleProvider>(context);

    final user = authProv.user;
    final role = user?.role ?? UserRole.CUSTOMER;

    final currentStore = prodProv.stores.firstWhere(
      (s) => s['id'] == prodProv.selectedStoreId,
      orElse: () => {'name': l10n.ingrezyStore, 'city': 'Pune', 'address': 'Hub'},
    );

    String currentLanguageName = 'English';
    if (localeProv.locale.languageCode == 'mr') {
      currentLanguageName = 'मराठी (Marathi)';
    } else if (localeProv.locale.languageCode == 'hi') {
      currentLanguageName = 'हिंदी (Hindi)';
    }

    final bool canPop = Navigator.canPop(context);

    return Scaffold(
      backgroundColor: AppTheme.warmWhite,
      appBar: AppBar(
        backgroundColor: AppTheme.warmWhite,
        elevation: 0,
        automaticallyImplyLeading: false,
        leading: canPop
            ? IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, color: AppTheme.cocoaBrown, size: 20),
                onPressed: () => Navigator.pop(context),
              )
            : null,
        title: Text(
          l10n.profile,
          style: const TextStyle(
            color: AppTheme.cocoaBrown,
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
        actions: [
          const LanguageSelectorButton(),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        color: AppTheme.spiceOrange,
        onRefresh: () async {
          await _refreshProfile();
          if (role == UserRole.CUSTOMER) {
            await orderProv.fetchOrders();
            await prodProv.fetchStores();
          } else if (role == UserRole.DELIVERY_PARTNER) {
            await delProv.loadDashboard();
          } else if (role == UserRole.RETAILER) {
            await retProv.loadDashboard();
          }
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Profile Banner Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFF9F2), Color(0xFFFAF3EB)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.cardBorder),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.cocoaBrown.withOpacity(0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Avatar with ring
                        Container(
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.oliveGreen, width: 2),
                          ),
                          child: CircleAvatar(
                            radius: 32,
                            backgroundColor: AppTheme.creamBeigeLight,
                            child: Text(
                              user?.name.isNotEmpty == true
                                  ? user!.name.substring(0, 1).toUpperCase()
                                  : (role == UserRole.DELIVERY_PARTNER
                                      ? 'D'
                                      : role == UserRole.RETAILER
                                          ? 'R'
                                          : 'U'),
                              style: const TextStyle(
                                fontSize: 26,
                                color: AppTheme.cocoaBrown,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        // Name and phone
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user?.name ?? 'Ingrezy User',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 19,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.cocoaBrown,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.phone_iphone_rounded, size: 14, color: AppTheme.textMuted),
                                  const SizedBox(width: 4),
                                  Text(
                                    user?.phoneNumber.isNotEmpty == true
                                        ? user!.phoneNumber
                                        : 'No phone',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                              if (user?.email != null && user!.email!.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    const Icon(Icons.email_outlined, size: 14, color: AppTheme.textMuted),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        user.email!,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Divider(color: AppTheme.cardBorder, height: 1),
                    const SizedBox(height: 12),
                    // Badges row: Role & Active status
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.oliveGreen.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                role == UserRole.DELIVERY_PARTNER
                                    ? Icons.two_wheeler_rounded
                                    : role == UserRole.RETAILER
                                        ? Icons.storefront_rounded
                                        : Icons.verified,
                                size: 14,
                                color: AppTheme.oliveGreen,
                              ),
                              const SizedBox(width: 5),
                              Text(
                                role.toDisplayString(),
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.oliveGreen,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.circle, size: 8, color: Colors.green),
                              SizedBox(width: 5),
                              Text(
                                'Active Account',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.green,
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

              const SizedBox(height: 16),

              // Role-specific Quick Shortcuts
              if (role == UserRole.DELIVERY_PARTNER) ...[
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.two_wheeler_rounded,
                        iconColor: AppTheme.spiceOrange,
                        bgColor: AppTheme.spiceOrangeSoft,
                        count: '${delProv.activeDeliveries.length}',
                        label: 'Active Trips',
                        onTap: () {
                          if (canPop) Navigator.pop(context);
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.check_circle_outline,
                        iconColor: AppTheme.oliveGreen,
                        bgColor: AppTheme.creamBeigeLight,
                        count: '${delProv.completedDeliveries.length}',
                        label: 'Delivered',
                        onTap: () {
                          if (canPop) Navigator.pop(context);
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.flash_on,
                        iconColor: Colors.teal,
                        bgColor: Colors.teal.withOpacity(0.1),
                        count: 'Online',
                        label: 'Duty Status',
                        onTap: () {},
                      ),
                    ),
                  ],
                ),
              ] else if (role == UserRole.RETAILER) ...[
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.storefront_rounded,
                        iconColor: AppTheme.oliveGreen,
                        bgColor: AppTheme.creamBeigeLight,
                        count: retProv.storeName,
                        label: 'Dark Store',
                        onTap: () {},
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.inventory_2_outlined,
                        iconColor: AppTheme.spiceOrange,
                        bgColor: AppTheme.spiceOrangeSoft,
                        count: '${retProv.inventory.length}',
                        label: 'Products',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const RetailerInventoryScreen()),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.receipt_long_outlined,
                        iconColor: AppTheme.cocoaBrown,
                        bgColor: AppTheme.creamBeigeSoft,
                        count: '${retProv.orders.length}',
                        label: 'Orders',
                        onTap: () {
                          if (canPop) Navigator.pop(context);
                        },
                      ),
                    ),
                  ],
                ),
              ] else ...[
                // Customer shortcuts
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.receipt_long_outlined,
                        iconColor: AppTheme.cocoaBrown,
                        bgColor: AppTheme.creamBeigeLight,
                        count: '${orderProv.orders.length}',
                        label: l10n.navOrders,
                        onTap: () {
                          if (widget.onNavigateTab != null) {
                            widget.onNavigateTab!(3);
                          } else {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => OrdersScreen(onStartShopping: () => widget.onNavigateTab?.call(0)),
                              ),
                            );
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.shopping_bag_outlined,
                        iconColor: AppTheme.spiceOrange,
                        bgColor: AppTheme.spiceOrangeSoft,
                        count: '${cartProv.itemCount}',
                        label: l10n.navCart,
                        onTap: () {
                          if (widget.onNavigateTab != null) {
                            widget.onNavigateTab!(2);
                          } else {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => CartScreen(onBrowseGroceries: () => widget.onNavigateTab?.call(0)),
                              ),
                            );
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.storefront_outlined,
                        iconColor: AppTheme.oliveGreen,
                        bgColor: AppTheme.creamBeigeSoft,
                        count: currentStore['city'] ?? 'Pune',
                        label: 'Dark Store',
                        onTap: () => _showStoreSelector(context, prodProv),
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 22),

              // Section 1: Settings
              const Text(
                'Account Settings',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.cocoaBrown,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 10),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: Column(
                  children: [
                    if (role == UserRole.CUSTOMER) ...[
                      _buildSettingsTile(
                        icon: Icons.location_on_outlined,
                        iconColor: AppTheme.spiceOrange,
                        title: l10n.savedAddresses,
                        subtitle: 'Manage saved delivery addresses',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const AddressScreen()),
                          );
                        },
                      ),
                      const Divider(height: 1, indent: 56),
                      _buildSettingsTile(
                        icon: Icons.storefront_rounded,
                        iconColor: AppTheme.oliveGreen,
                        title: l10n.selectStoreTitle,
                        subtitle: '${currentStore['name']} • ${currentStore['city'] ?? ''}',
                        onTap: () => _showStoreSelector(context, prodProv),
                      ),
                      const Divider(height: 1, indent: 56),
                    ] else if (role == UserRole.RETAILER) ...[
                      _buildSettingsTile(
                        icon: Icons.inventory_2_outlined,
                        iconColor: AppTheme.spiceOrange,
                        title: 'Manage Dark Store Stock',
                        subtitle: 'Update product prices, stock & availability',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const RetailerInventoryScreen()),
                          );
                        },
                      ),
                      const Divider(height: 1, indent: 56),
                    ] else if (role == UserRole.DELIVERY_PARTNER) ...[
                      _buildSettingsTile(
                        icon: Icons.my_location_rounded,
                        iconColor: AppTheme.spiceOrange,
                        title: 'Broadcast GPS Coordinates',
                        subtitle: 'Simulate live location update to dispatch center',
                        onTap: () async {
                          final success = await delProv.updateGpsCoordinates(18.5204, 73.8567);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(success ? l10n.gpsLocationBroadcasted : l10n.somethingWentWrong),
                                backgroundColor: success ? AppTheme.oliveGreen : Colors.redAccent,
                              ),
                            );
                          }
                        },
                      ),
                      const Divider(height: 1, indent: 56),
                    ],
                    _buildSettingsTile(
                      icon: Icons.translate_rounded,
                      iconColor: AppTheme.cocoaBrown,
                      title: l10n.language,
                      subtitle: currentLanguageName,
                      onTap: () => LanguageSelectorSheet.show(context),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 22),

              // Section 2: Support & App Info
              const Text(
                'Support & Information',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.cocoaBrown,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 10),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: Column(
                  children: [
                    _buildSettingsTile(
                      icon: Icons.headset_mic_outlined,
                      iconColor: Colors.teal,
                      title: role == UserRole.DELIVERY_PARTNER
                          ? 'Rider Helpline & Dispatch Desk'
                          : role == UserRole.RETAILER
                              ? 'Store Manager Helpdesk'
                              : 'Help & Customer Care',
                      subtitle: '24x7 instant assistance',
                      onTap: () => _showSupportDialog(context, role),
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildSettingsTile(
                      icon: Icons.info_outline_rounded,
                      iconColor: Colors.blueGrey,
                      title: 'About Ingrezy',
                      subtitle: 'Version 1.0.0 • Terms & Quick Commerce info',
                      onTap: () => _showAboutDialog(context),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Section 3: Logout Action
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => _handleLogout(context, authProv, l10n),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFDE8E8),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFF8B4B4)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.logout_rounded,
                            color: Color(0xFFC0392B),
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                l10n.logOut,
                                style: const TextStyle(
                                  color: Color(0xFFC0392B),
                                  fontWeight: FontWeight.w900,
                                  fontSize: 16,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Sign out of your Ingrezy ${role.toDisplayString()} account',
                                style: const TextStyle(
                                  color: Color(0xFF9B1C1C),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.arrow_forward_ios,
                          size: 16,
                          color: Color(0xFFC0392B),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required String count,
    required String label,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.cardBorder),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: bgColor,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(height: 8),
              Text(
                count,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                  color: AppTheme.cocoaBrown,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: iconColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: iconColor, size: 22),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 14,
            color: AppTheme.cocoaBrown,
          ),
        ),
        subtitle: Text(
          subtitle,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 12,
            color: AppTheme.textMuted,
          ),
        ),
        trailing: const Icon(
          Icons.arrow_forward_ios,
          size: 14,
          color: AppTheme.textMuted,
        ),
      ),
    );
  }
}
