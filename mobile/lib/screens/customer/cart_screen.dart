import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../models/address_model.dart';
import '../../providers/cart_provider.dart';
import '../../providers/order_provider.dart';
import '../../providers/product_provider.dart';
import '../../services/address_service.dart';
import '../../widgets/common_widgets.dart';
import '../../utils/content_localizer.dart';
import 'address_screen.dart';
import 'order_detail_screen.dart';

class CartScreen extends StatefulWidget {
  final VoidCallback? onBrowseGroceries;
  const CartScreen({super.key, this.onBrowseGroceries});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  AddressModel? _selectedAddress;
  String _paymentMethod = 'COD';
  final _instructionsController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDefaultAddress();
      final prodProv = Provider.of<ProductProvider>(context, listen: false);
      Provider.of<CartProvider>(context, listen: false)
          .loadCart(storeId: prodProv.selectedStoreId);
    });
  }

  @override
  void dispose() {
    _instructionsController.dispose();
    super.dispose();
  }

  Future<void> _loadDefaultAddress() async {
    final res = await AddressService.getAddresses();
    if (mounted) {
      setState(() {
        if (res.isSuccess && res.data != null && res.data!.isNotEmpty) {
          _selectedAddress = res.data!.firstWhere(
            (a) => a.isDefault,
            orElse: () => res.data!.first,
          );
        }
      });
    }
  }

  Future<void> _handleCheckout() async {
    final l10n = AppLocalizations.of(context);
    if (_selectedAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.noAddressSelected),
          backgroundColor: AppTheme.spiceOrange,
        ),
      );
      _openAddressPicker();
      return;
    }

    final orderProv = Provider.of<OrderProvider>(context, listen: false);
    final cartProv = Provider.of<CartProvider>(context, listen: false);

    final newOrder = await orderProv.checkout(
      addressId: _selectedAddress!.id,
      paymentMethod: _paymentMethod,
      specialInstructions: _instructionsController.text,
    );

    if (mounted) {
      if (newOrder != null) {
        // Refresh/clear local cart
        await cartProv.clearCart();

        // Navigate to Order Details
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => OrderDetailScreen(orderId: newOrder.id),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(orderProv.errorMessage ?? l10n.somethingWentWrong),
            backgroundColor: const Color(0xFFC0392B),
          ),
        );
      }
    }
  }

  void _openAddressPicker() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AddressScreen(
          onSelectAddress: (addr) {
            setState(() => _selectedAddress = addr);
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Consumer<CartProvider>(
      builder: (context, cartProv, child) {
        if (cartProv.isLoading && cartProv.cart == null) {
          return Scaffold(
            backgroundColor: AppTheme.warmWhite,
            appBar: AppBar(
              backgroundColor: AppTheme.warmWhite,
              title: Text(l10n.myCart, style: const TextStyle(color: AppTheme.cocoaBrown, fontWeight: FontWeight.w800)),
              leading: Navigator.canPop(context)
                  ? IconButton(
                      icon: const Icon(Icons.arrow_back, color: AppTheme.cocoaBrown),
                      onPressed: () => Navigator.pop(context),
                    )
                  : null,
            ),
            body: LoadingView(message: l10n.loading),
          );
        }

        if (cartProv.errorMessage != null && cartProv.cart == null) {
          return Scaffold(
            backgroundColor: AppTheme.warmWhite,
            appBar: AppBar(
              backgroundColor: AppTheme.warmWhite,
              title: Text(l10n.myCart, style: const TextStyle(color: AppTheme.cocoaBrown, fontWeight: FontWeight.w800)),
              leading: Navigator.canPop(context)
                  ? IconButton(
                      icon: const Icon(Icons.arrow_back, color: AppTheme.cocoaBrown),
                      onPressed: () => Navigator.pop(context),
                    )
                  : null,
            ),
            body: ErrorStateView(
              message: cartProv.errorMessage!,
              title: l10n.somethingWentWrong,
              retryLabel: l10n.retry,
              onRetry: () {
                final prodProv = Provider.of<ProductProvider>(context, listen: false);
                cartProv.loadCart(storeId: prodProv.selectedStoreId);
              },
            ),
          );
        }

        if (cartProv.isEmpty) {
          return Scaffold(
            backgroundColor: AppTheme.warmWhite,
            appBar: AppBar(
              backgroundColor: AppTheme.warmWhite,
              title: Text(l10n.myCart, style: const TextStyle(color: AppTheme.cocoaBrown, fontWeight: FontWeight.w800)),
              leading: Navigator.canPop(context)
                  ? IconButton(
                      icon: const Icon(Icons.arrow_back, color: AppTheme.cocoaBrown),
                      onPressed: () => Navigator.pop(context),
                    )
                  : null,
            ),
            body: EmptyStateView(
              icon: Icons.remove_shopping_cart_outlined,
              title: l10n.cartEmptyTitle,
              description: l10n.cartEmptyDesc,
              actionLabel: l10n.browseGroceries,
              onAction: () {
                if (widget.onBrowseGroceries != null) {
                  widget.onBrowseGroceries!();
                } else if (Navigator.canPop(context)) {
                  Navigator.pop(context);
                }
              },
            ),
          );
        }

        final cart = cartProv.cart!;

        return Scaffold(
          backgroundColor: AppTheme.warmWhite,
          appBar: AppBar(
            backgroundColor: AppTheme.warmWhite,
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.myCart, style: const TextStyle(color: AppTheme.cocoaBrown, fontWeight: FontWeight.w800)),
                Text(
                  '${cart.totalItemCount} ${l10n.items} • ${cart.storeName ?? l10n.ingrezyStore}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
              ],
            ),
            actions: [
              IconButton(
                tooltip: l10n.delete,
                icon: const Icon(Icons.delete_sweep_outlined, color: Color(0xFFC0392B)),
                onPressed: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      backgroundColor: AppTheme.warmWhite,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      title: Text(l10n.clearCartTitle, style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.cocoaBrown)),
                      content: Text(l10n.clearCartMessage, style: const TextStyle(color: AppTheme.textMuted)),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: Text(l10n.cancel, style: const TextStyle(color: AppTheme.textMuted)),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFC0392B)),
                          onPressed: () => Navigator.pop(ctx, true),
                          child: Text(l10n.delete),
                        ),
                      ],
                    ),
                  );
                  if (confirm == true) {
                    cartProv.clearCart();
                  }
                },
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: () => cartProv.loadCart(storeId: cart.storeId),
            color: AppTheme.spiceOrange,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 10-Minute Dark Store Banner
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppTheme.creamBeigeLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.cardBorder),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.flash_on, color: AppTheme.spiceOrange, size: 20),
                        const SizedBox(width: 10),
                        Text(
                          l10n.standardDelivery,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.cocoaBrown,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Cart Items List Card
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.cardBorder),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.items,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.cocoaBrown,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: cart.items.length,
                          separatorBuilder: (_, __) => const Divider(height: 20, color: AppTheme.cardBorder),
                          itemBuilder: (context, idx) {
                            final item = cart.items[idx];
                            return Row(
                              children: [
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: AppTheme.creamBeigeSoft,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  clipBehavior: Clip.antiAlias,
                                  child: item.product.imageUrl != null && item.product.imageUrl!.isNotEmpty
                                      ? Image.network(
                                          item.product.imageUrl!,
                                          width: 48,
                                          height: 48,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) => const Icon(
                                            Icons.shopping_bag_outlined,
                                            color: AppTheme.creamBeige,
                                            size: 22,
                                          ),
                                        )
                                      : const Icon(Icons.shopping_bag_outlined, color: AppTheme.creamBeige, size: 22),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.product.localizedName(context),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.cocoaBrown,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        item.quantity > 1
                                            ? '₹${item.effectiveUnitPrice.toStringAsFixed(0)} each • ${item.product.localizedUnit(context)}'
                                            : '₹${item.effectiveUnitPrice.toStringAsFixed(0)} • ${item.product.localizedUnit(context)}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: AppTheme.textMuted,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                // Counter Stepper
                                Container(
                                  height: 30,
                                  decoration: BoxDecoration(
                                    color: AppTheme.spiceOrange,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    children: [
                                      InkWell(
                                        onTap: cartProv.isLoading
                                            ? null
                                            : () {
                                                if (item.quantity <= 1) {
                                                  cartProv.removeItem(item.id, storeId: cart.storeId);
                                                } else {
                                                  cartProv.updateQuantity(
                                                    itemId: item.id,
                                                    quantity: item.quantity - 1,
                                                    storeId: cart.storeId,
                                                  );
                                                }
                                              },
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          child: Icon(
                                            item.quantity <= 1 ? Icons.delete_outline : Icons.remove,
                                            size: 15,
                                            color: Colors.white,
                                          ),
                                        ),
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 4),
                                        child: Text(
                                          '${item.quantity}',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ),
                                      InkWell(
                                        onTap: cartProv.isLoading
                                            ? null
                                            : () => cartProv.updateQuantity(
                                                  itemId: item.id,
                                                  quantity: item.quantity + 1,
                                                  storeId: cart.storeId,
                                                ),
                                        child: const Padding(
                                          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          child: Icon(Icons.add, size: 15, color: Colors.white),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                SizedBox(
                                  width: 56,
                                  child: Text(
                                    '₹${item.effectiveSubtotal.toStringAsFixed(0)}',
                                    textAlign: TextAlign.right,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 14,
                                      color: AppTheme.cocoaBrown,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.close, size: 16, color: AppTheme.textLight),
                                  padding: const EdgeInsets.only(left: 6),
                                  constraints: const BoxConstraints(),
                                  tooltip: 'Remove item',
                                  onPressed: cartProv.isLoading
                                      ? null
                                      : () => cartProv.removeItem(item.id, storeId: cart.storeId),
                                ),
                              ],
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Delivery Address Card
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.cardBorder),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.location_on_outlined, size: 20, color: AppTheme.spiceOrange),
                                const SizedBox(width: 6),
                                Text(
                                  l10n.deliveryAddress,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.cocoaBrown,
                                  ),
                                ),
                              ],
                            ),
                            TextButton(
                              onPressed: _openAddressPicker,
                              child: Text(
                                _selectedAddress != null ? l10n.change : l10n.addAddress,
                                style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.spiceOrange),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        if (_selectedAddress != null)
                          Text(
                            '${_selectedAddress!.label}: ${_selectedAddress!.formattedAddress}',
                            style: const TextStyle(fontSize: 13, color: AppTheme.cocoaBrown),
                          )
                        else
                          Text(
                            l10n.noAddressSelected,
                            style: const TextStyle(fontSize: 13, color: Color(0xFFC0392B)),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Bill Details Card
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.cardBorder),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.billDetails,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.cocoaBrown,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(l10n.itemTotal, style: const TextStyle(color: AppTheme.textMuted)),
                            Text('₹${cart.subtotal.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.cocoaBrown)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(l10n.deliveryFee, style: const TextStyle(color: AppTheme.textMuted)),
                            Text(
                              cart.deliveryFee == 0 ? l10n.free : '₹${cart.deliveryFee.toStringAsFixed(0)}',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: cart.deliveryFee == 0 ? AppTheme.oliveGreen : AppTheme.cocoaBrown,
                              ),
                            ),
                          ],
                        ),
                        if (cart.deliveryFee > 0 && cart.subtotal > 0 && cart.subtotal < 500) ...[
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.creamBeigeLight,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.cardBorder),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.local_shipping_outlined, size: 16, color: AppTheme.oliveGreen),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    l10n.freeDeliveryNotice((500 - cart.subtotal).clamp(0, 500).toInt()),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.cocoaBrown,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        const Divider(height: 24, color: AppTheme.cardBorder),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              l10n.toPay,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.cocoaBrown),
                            ),
                            Text(
                              '₹${cart.totalAmount.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: AppTheme.spiceOrange,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Payment Method
                  Material(
                    color: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: const BorderSide(color: AppTheme.cardBorder),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l10n.paymentMethod,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.cocoaBrown),
                          ),
                          const SizedBox(height: 8),
                          RadioListTile<String>(
                            contentPadding: EdgeInsets.zero,
                            value: 'COD',
                            groupValue: _paymentMethod,
                            title: Text(l10n.cashOnDelivery, style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.cocoaBrown)),
                            subtitle: const Text('Pay when order is delivered to your doorstep', style: TextStyle(color: AppTheme.textMuted)),
                            activeColor: AppTheme.spiceOrange,
                            onChanged: (v) => setState(() => _paymentMethod = v!),
                          ),
                          RadioListTile<String>(
                            contentPadding: EdgeInsets.zero,
                            value: 'ONLINE',
                            groupValue: _paymentMethod,
                            title: const Text('Online Payment / UPI', style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.cocoaBrown)),
                            subtitle: const Text('Credit/Debit card, Netbanking or UPI', style: TextStyle(color: AppTheme.textMuted)),
                            activeColor: AppTheme.spiceOrange,
                            onChanged: (v) => setState(() => _paymentMethod = v!),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 110),
                ],
              ),
            ),
          ),
          bottomSheet: Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: AppTheme.warmWhite,
              border: Border(top: BorderSide(color: AppTheme.cardBorder, width: 1)),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l10n.toPay, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
                      Text(
                        '₹${cart.totalAmount.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.cocoaBrown,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _handleCheckout,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.spiceOrange,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: Text(l10n.proceedToCheckout),
                    ),
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
