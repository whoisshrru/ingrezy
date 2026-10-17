import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/product_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/language_selector_sheet.dart';
import '../../widgets/product_card.dart';
import 'cart_screen.dart';

class HomeScreen extends StatefulWidget {
  final Function(int)? onNavigateTab;
  const HomeScreen({super.key, this.onNavigateTab});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final prodProv = Provider.of<ProductProvider>(context, listen: false);
      final cartProv = Provider.of<CartProvider>(context, listen: false);
      prodProv.fetchStores().then((_) {
        prodProv.fetchProducts();
        if (prodProv.selectedStoreId != null) {
          cartProv.loadCart(storeId: prodProv.selectedStoreId);
        }
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showStoreSelector(BuildContext context, ProductProvider prodProv) {
    final l10n = AppLocalizations.of(context);
    showModalBottomSheet(
      context: context,
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
                color: AppTheme.textDark,
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
                child: Center(child: Text(l10n.noActiveStores)),
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
                          color: isSelected ? AppTheme.mintLight : const Color(0xFFF1F5F9),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.storefront_outlined,
                          color: isSelected ? AppTheme.primaryGreen : AppTheme.textMuted,
                        ),
                      ),
                      title: Text(
                        s['name'] ?? l10n.ingrezyStore,
                        style: TextStyle(
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                          color: isSelected ? AppTheme.primaryGreen : AppTheme.textDark,
                        ),
                      ),
                      subtitle: Text('${s['address']}, ${s['city']}'),
                      trailing: isSelected
                          ? const Icon(Icons.check_circle, color: AppTheme.primaryGreen)
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

  @override
  Widget build(BuildContext context) {
    return Consumer3<ProductProvider, CartProvider, AuthProvider>(
      builder: (context, prodProv, cartProv, authProv, child) {
        final l10n = AppLocalizations.of(context);
        final currentStore = prodProv.stores.firstWhere(
          (s) => s['id'] == prodProv.selectedStoreId,
          orElse: () => {'name': l10n.ingrezyStore, 'city': 'Pune'},
        );

        final screenWidth = MediaQuery.of(context).size.width;
        final int crossAxisCount = screenWidth >= 1280
            ? 6
            : screenWidth >= 1024
                ? 5
                : screenWidth >= 768
                    ? 4
                    : screenWidth >= 520
                        ? 3
                        : 2;

        const double gridPadding = 16.0 * 2;
        final double totalSpacing = (crossAxisCount - 1) * 12.0;
        final double colWidth = (screenWidth - gridPadding - totalSpacing) / crossAxisCount;
        final double cardHeight = (colWidth - 20.0) * 0.75 + 106.0;

        return Scaffold(
          body: SafeArea(
            child: RefreshIndicator(
              color: AppTheme.primaryGreen,
              onRefresh: () async {
                await prodProv.fetchStores();
                await prodProv.fetchProducts();
                if (prodProv.selectedStoreId != null) {
                  await cartProv.loadCart(storeId: prodProv.selectedStoreId);
                }
              },
              child: CustomScrollView(
                slivers: [
                  // Quick Commerce Header Bar
                  SliverToBoxAdapter(
                    child: Container(
                      color: Colors.white,
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => _showStoreSelector(context, prodProv),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                       Icon(
                                        Icons.flash_on,
                                        size: 16,
                                        color: AppTheme.accentOrange,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        l10n.tenMinsDelivery,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w900,
                                          color: AppTheme.accentOrange,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      const Icon(
                                        Icons.keyboard_arrow_down,
                                        size: 16,
                                        color: AppTheme.textMuted,
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${currentStore['name']} • ${currentStore['city'] ?? ''}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.textDark,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const LanguageSelectorButton(),
                          const SizedBox(width: 4),
                          // Cart icon with count badge
                          IconButton(
                            tooltip: l10n.navCart,
                            padding: const EdgeInsets.all(6),
                            constraints: const BoxConstraints(),
                            icon: Stack(
                              clipBehavior: Clip.none,
                              children: [
                                const Icon(Icons.shopping_bag_outlined, color: AppTheme.textDark, size: 24),
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
                              if (widget.onNavigateTab != null) {
                                widget.onNavigateTab!(2);
                              } else {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const CartScreen()),
                                );
                              }
                            },
                          ),
                          const SizedBox(width: 8),
                          // User profile / initial avatar
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: AppTheme.mintLight,
                            child: Text(
                              authProv.user?.name.substring(0, 1).toUpperCase() ?? 'U',
                              style: const TextStyle(
                                color: AppTheme.primaryGreen,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Sticky Search Bar & Filter Row
                  SliverToBoxAdapter(
                    child: Container(
                      color: Colors.white,
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                      child: Column(
                        children: [
                          // Search field
                          TextField(
                            controller: _searchController,
                            onChanged: (val) => prodProv.setSearchQuery(val),
                            decoration: InputDecoration(
                              hintText: l10n.searchHint,
                              prefixIcon: const Icon(Icons.search, color: AppTheme.textMuted),
                              suffixIcon: _searchController.text.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear, size: 18),
                                      onPressed: () {
                                        _searchController.clear();
                                        prodProv.setSearchQuery('');
                                      },
                                    )
                                  : null,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Category horizontal chips
                          SizedBox(
                            height: 36,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: prodProv.categories.length,
                              separatorBuilder: (_, __) => const SizedBox(width: 8),
                              itemBuilder: (context, idx) {
                                final cat = prodProv.categories[idx];
                                final isSelected = prodProv.selectedCategory == cat;
                                final displayLabel = getLocalizedCategory(cat, l10n);
                                return ChoiceChip(
                                  label: Text(displayLabel),
                                  selected: isSelected,
                                  selectedColor: AppTheme.primaryGreen,
                                  backgroundColor: const Color(0xFFF1F5F9),
                                  labelStyle: TextStyle(
                                    color: isSelected ? Colors.white : AppTheme.textDark,
                                    fontSize: 12,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                  ),
                                  onSelected: (val) {
                                    if (val) prodProv.setCategory(cat);
                                  },
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Recipe Bundling Promo Banner
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
                      child: InkWell(
                        onTap: () {
                          if (widget.onNavigateTab != null) {
                            widget.onNavigateTab!(1); // Go to recipes tab
                          }
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF0E7A4A), Color(0xFF1B5E20)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(
                                  Icons.menu_book_rounded,
                                  color: Colors.white,
                                  size: 28,
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      l10n.smartRecipes,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      l10n.recipesSubtitle,
                                      style: const TextStyle(
                                        color: Colors.white70,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(
                                Icons.arrow_forward_ios,
                                color: Colors.white70,
                                size: 14,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Products Grid or Status State
                  if (prodProv.isLoading)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: LoadingView(message: l10n.loading),
                    )
                  else if (prodProv.errorMessage != null && prodProv.products.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: ErrorStateView(
                        message: prodProv.errorMessage!,
                        title: l10n.somethingWentWrong,
                        retryLabel: l10n.retry,
                        onRetry: () => prodProv.fetchProducts(),
                      ),
                    )
                  else if (prodProv.products.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: EmptyStateView(
                        icon: Icons.search_off_rounded,
                        title: l10n.noProductsFound,
                        description: l10n.noProductsInCategory,
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                      sliver: SliverGrid(
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: crossAxisCount,
                          mainAxisExtent: cardHeight,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            return ProductCard(product: prodProv.products[index]);
                          },
                          childCount: prodProv.products.length,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          bottomSheet: cartProv.itemCount > 0
              ? Container(
                  margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryDark,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.18),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${cartProv.itemCount} ${l10n.inCart.toUpperCase()}',
                            style: const TextStyle(
                              color: Color(0xFFBBF7D0),
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            '₹${cartProv.cart?.totalAmount.toStringAsFixed(0) ?? "0"}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                      InkWell(
                        onTap: () {
                          if (widget.onNavigateTab != null) {
                            widget.onNavigateTab!(2);
                          } else {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const CartScreen()),
                            );
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryGreen,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: [
                              Text(
                                l10n.viewCart,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              SizedBox(width: 4),
                              Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 16),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              : null,
        );
      },
    );
  }
}
