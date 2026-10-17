import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../models/address_model.dart';
import '../../services/address_service.dart';
import '../../widgets/common_widgets.dart';

class AddressScreen extends StatefulWidget {
  final Function(AddressModel)? onSelectAddress;
  const AddressScreen({super.key, this.onSelectAddress});

  @override
  State<AddressScreen> createState() => _AddressScreenState();
}

class _AddressScreenState extends State<AddressScreen> {
  List<AddressModel> _addresses = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  Future<void> _loadAddresses() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await AddressService.getAddresses();
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (res.isSuccess && res.data != null) {
          _addresses = res.data!;
        } else {
          _errorMessage = res.message;
        }
      });
    }
  }

  void _showAddAddressDialog() {
    final l10n = AppLocalizations.of(context);
    final formKey = GlobalKey<FormState>();
    final labelCtrl = TextEditingController(text: 'Home');
    final line1Ctrl = TextEditingController();
    final landmarkCtrl = TextEditingController();
    final cityCtrl = TextEditingController(text: 'Pune');
    final stateCtrl = TextEditingController(text: 'Maharashtra');
    final pinCtrl = TextEditingController(text: '411001');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  l10n.addNewAddress,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.textDark),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: labelCtrl,
                  decoration: InputDecoration(labelText: l10n.addressLabel),
                  validator: (v) => v == null || v.isEmpty ? l10n.requiredField : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: line1Ctrl,
                  decoration: InputDecoration(labelText: l10n.addressLine1),
                  validator: (v) => v == null || v.length < 5 ? l10n.requiredField : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: landmarkCtrl,
                  decoration: InputDecoration(labelText: l10n.landmark),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: cityCtrl,
                        decoration: InputDecoration(labelText: l10n.city),
                        validator: (v) => v == null || v.isEmpty ? l10n.requiredField : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: pinCtrl,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(labelText: l10n.postalCode),
                        validator: (v) => v == null || v.length != 6 ? l10n.requiredField : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () async {
                    if (!formKey.currentState!.validate()) return;
                    Navigator.pop(ctx);
                    final res = await AddressService.createAddress(
                      label: labelCtrl.text,
                      addressLine1: line1Ctrl.text,
                      landmark: landmarkCtrl.text,
                      city: cityCtrl.text,
                      state: stateCtrl.text,
                      postalCode: pinCtrl.text,
                      isDefault: true,
                    );
                    if (res.isSuccess && mounted) {
                      _loadAddresses();
                    } else if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(res.message), backgroundColor: Colors.redAccent),
                      );
                    }
                  },
                  child: Text(l10n.saveAddress),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.savedAddresses),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: AppTheme.primaryGreen),
            onPressed: _showAddAddressDialog,
          ),
        ],
      ),
      body: _isLoading
          ? LoadingView(message: l10n.loading)
          : _errorMessage != null && _addresses.isEmpty
              ? ErrorStateView(
                  message: _errorMessage!,
                  onRetry: _loadAddresses,
                  retryLabel: l10n.retry,
                )
              : _addresses.isEmpty
                  ? EmptyStateView(
                      icon: Icons.location_off_outlined,
                      title: l10n.noAddressesYet,
                      description: l10n.selectDeliveryAddress,
                      actionLabel: l10n.addNewAddress,
                      onAction: _showAddAddressDialog,
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _addresses.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, idx) {
                        final addr = _addresses[idx];
                        return InkWell(
                          onTap: () {
                            if (widget.onSelectAddress != null) {
                              widget.onSelectAddress!(addr);
                              Navigator.pop(context);
                            }
                          },
                          borderRadius: BorderRadius.circular(14),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: addr.isDefault ? AppTheme.primaryGreen : const Color(0xFFEEEEEE),
                                width: addr.isDefault ? 1.5 : 1.0,
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: const BoxDecoration(
                                    color: AppTheme.mintLight,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.location_on, color: AppTheme.primaryGreen),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Text(
                                            addr.label,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w800,
                                              fontSize: 15,
                                              color: AppTheme.textDark,
                                            ),
                                          ),
                                          if (addr.isDefault) ...[
                                            const SizedBox(width: 8),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: AppTheme.mintLight,
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                l10n.defaultBadge,
                                                style: const TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                  color: AppTheme.primaryGreen,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        addr.formattedAddress,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          color: AppTheme.textMuted,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
        onPressed: _showAddAddressDialog,
        icon: const Icon(Icons.add_location_alt_outlined),
        label: Text(l10n.addNewAddress),
      ),
    );
  }
}

