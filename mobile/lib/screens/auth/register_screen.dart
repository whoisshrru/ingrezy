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
      backgroundColor: AppTheme.warmWhite,
      appBar: AppBar(
        backgroundColor: AppTheme.warmWhite,
        title: Text(
          l10n.createAccount,
          style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.cocoaBrown),
        ),
        actions: const [
          LanguageSelectorButton(),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 460),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppTheme.cardBorder),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.cocoaBrown.withValues(alpha: 0.05),
                        blurRadius: 20,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                Text(
                  '${l10n.appName} - ${l10n.createAccount}',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.cocoaBrown,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  l10n.registerSubtitle,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.cocoaBrownLight,
                  ),
                ),
                const SizedBox(height: 24),

                Text(
                  l10n.selectRole,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.cocoaBrown,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildRoleCard(
                      role: UserRole.CUSTOMER,
                      icon: Icons.shopping_basket_outlined,
                      label: l10n.roleCustomer,
                    ),
                    const SizedBox(width: 10),
                    _buildRoleCard(
                      role: UserRole.RETAILER,
                      icon: Icons.storefront_outlined,
                      label: l10n.roleRetailer,
                    ),
                    const SizedBox(width: 10),
                    _buildRoleCard(
                      role: UserRole.DELIVERY_PARTNER,
                      icon: Icons.directions_bike_outlined,
                      label: l10n.roleDelivery,
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Name
                TextFormField(
                  controller: _nameController,
                  style: const TextStyle(color: AppTheme.cocoaBrown),
                  decoration: InputDecoration(
                    labelText: l10n.fullName,
                    labelStyle: const TextStyle(color: AppTheme.cocoaBrownLight),
                    hintText: l10n.nameHint,
                    hintStyle: const TextStyle(color: AppTheme.cocoaBrownLight),
                    prefixIcon: const Icon(Icons.badge_outlined, color: AppTheme.cocoaBrownLight),
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
                  style: const TextStyle(color: AppTheme.cocoaBrown),
                  decoration: InputDecoration(
                    labelText: l10n.phoneNumber,
                    labelStyle: const TextStyle(color: AppTheme.cocoaBrownLight),
                    prefixIcon: const Icon(Icons.phone_outlined, color: AppTheme.cocoaBrownLight),
                    hintText: l10n.phoneHint,
                    hintStyle: const TextStyle(color: AppTheme.cocoaBrownLight),
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
                  style: const TextStyle(color: AppTheme.cocoaBrown),
                  decoration: InputDecoration(
                    labelText: l10n.emailOptional,
                    labelStyle: const TextStyle(color: AppTheme.cocoaBrownLight),
                    hintText: l10n.emailHint,
                    hintStyle: const TextStyle(color: AppTheme.cocoaBrownLight),
                    prefixIcon: const Icon(Icons.email_outlined, color: AppTheme.cocoaBrownLight),
                  ),
                ),
                const SizedBox(height: 16),

                // Password
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  style: const TextStyle(color: AppTheme.cocoaBrown),
                  decoration: InputDecoration(
                    labelText: l10n.password,
                    labelStyle: const TextStyle(color: AppTheme.cocoaBrownLight),
                    hintText: l10n.passwordCreateHint,
                    hintStyle: const TextStyle(color: AppTheme.cocoaBrownLight),
                    prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.cocoaBrownLight),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                        color: AppTheme.cocoaBrownLight,
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
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.spiceOrange,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
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
                      : Text(l10n.createAccount, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: 18),

                // Login link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "${l10n.alreadyHaveAccount} ",
                      style: const TextStyle(color: AppTheme.cocoaBrownLight),
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.pop(context);
                      },
                      child: Text(
                        l10n.login,
                        style: const TextStyle(
                          color: AppTheme.spiceOrange,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  ),
),
),
);
  }

  Widget _buildRoleCard({
    required UserRole role,
    required IconData icon,
    required String label,
  }) {
    final isSelected = _selectedRole == role;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedRole = role;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: 100,
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.creamBeige.withValues(alpha: 0.45) : AppTheme.warmWhite,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppTheme.spiceOrange : AppTheme.cardBorder,
              width: isSelected ? 2 : 1.2,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppTheme.spiceOrange.withValues(alpha: 0.16),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : [
                    BoxShadow(
                      color: AppTheme.cocoaBrown.withValues(alpha: 0.03),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.spiceOrange : Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isSelected ? AppTheme.spiceOrange : AppTheme.cardBorder,
                  ),
                ),
                child: Icon(
                  icon,
                  size: 20,
                  color: isSelected ? Colors.white : AppTheme.cocoaBrown,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? AppTheme.spiceOrange : AppTheme.cocoaBrown,
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
