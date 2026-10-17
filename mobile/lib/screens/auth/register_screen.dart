import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/language_selector_sheet.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  UserRole _selectedRole = UserRole.CUSTOMER;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    final l10n = AppLocalizations.of(context);
    final authProv = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProv.register(
      name: _nameController.text,
      phoneNumber: _phoneController.text,
      password: _passwordController.text,
      email: _emailController.text,
      role: _selectedRole,
    );

    if (success && mounted) {
      Navigator.pop(context); // Return or root router switches automatically
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProv.errorMessage ?? l10n.registrationFailed),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final authProv = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(l10n.createAccount),
        actions: const [
          LanguageSelectorButton(),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  '${l10n.appName} - ${l10n.createAccount}',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textDark,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  l10n.registerSubtitle,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.textMuted,
                  ),
                ),
                const SizedBox(height: 24),

                // Role Selector Chips
                Text(
                  l10n.selectRole,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textDark,
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  children: [
                    ChoiceChip(
                      label: Text(l10n.roleCustomer),
                      selected: _selectedRole == UserRole.CUSTOMER,
                      selectedColor: AppTheme.mintLight,
                      labelStyle: TextStyle(
                        color: _selectedRole == UserRole.CUSTOMER
                            ? AppTheme.primaryGreen
                            : AppTheme.textMuted,
                        fontWeight: FontWeight.w600,
                      ),
                      onSelected: (val) {
                        if (val) setState(() => _selectedRole = UserRole.CUSTOMER);
                      },
                    ),
                    ChoiceChip(
                      label: Text(l10n.roleRetailer),
                      selected: _selectedRole == UserRole.RETAILER,
                      selectedColor: AppTheme.mintLight,
                      labelStyle: TextStyle(
                        color: _selectedRole == UserRole.RETAILER
                            ? AppTheme.primaryGreen
                            : AppTheme.textMuted,
                        fontWeight: FontWeight.w600,
                      ),
                      onSelected: (val) {
                        if (val) setState(() => _selectedRole = UserRole.RETAILER);
                      },
                    ),
                    ChoiceChip(
                      label: Text(l10n.roleDelivery),
                      selected: _selectedRole == UserRole.DELIVERY_PARTNER,
                      selectedColor: AppTheme.mintLight,
                      labelStyle: TextStyle(
                        color: _selectedRole == UserRole.DELIVERY_PARTNER
                            ? AppTheme.primaryGreen
                            : AppTheme.textMuted,
                        fontWeight: FontWeight.w600,
                      ),
                      onSelected: (val) {
                        if (val) setState(() => _selectedRole = UserRole.DELIVERY_PARTNER);
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Name
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: l10n.fullName,
                    hintText: l10n.nameHint,
                    prefixIcon: const Icon(Icons.badge_outlined, color: AppTheme.textMuted),
                  ),
                  validator: (val) {
                    if (val == null || val.trim().isEmpty) {
                      return l10n.requiredField;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Phone Number
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: l10n.phoneNumber,
                    prefixIcon: const Icon(Icons.phone_outlined, color: AppTheme.textMuted),
                    hintText: l10n.phoneHint,
                  ),
                  validator: (val) {
                    if (val == null || val.trim().length < 10) {
                      return l10n.invalidPhone;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Email (optional)
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: l10n.emailOptional,
                    hintText: l10n.emailHint,
                    prefixIcon: const Icon(Icons.email_outlined, color: AppTheme.textMuted),
                  ),
                ),
                const SizedBox(height: 16),

                // Password
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: l10n.password,
                    hintText: l10n.passwordCreateHint,
                    prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.textMuted),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                        color: AppTheme.textMuted,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                  ),
                  validator: (val) {
                    if (val == null || val.length < 6) {
                      return l10n.invalidPassword;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 28),

                // Submit Button
                ElevatedButton(
                  onPressed: authProv.isLoading ? null : _handleRegister,
                  child: authProv.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Text(l10n.createAccount),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
