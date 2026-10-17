import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/language_selector_sheet.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  UserRole _selectedRole = UserRole.CUSTOMER;

  @override
  void initState() {
    super.initState();
    // Default to Customer demo account for immediate localhost testing
    _identifierController.text = '9876543213';
    _passwordController.text = 'Password@123';
  }

  void _switchRole(UserRole role) {
    setState(() {
      _selectedRole = role;
      switch (role) {
        case UserRole.CUSTOMER:
          _identifierController.text = '9876543213';
          _passwordController.text = 'Password@123';
          break;
        case UserRole.RETAILER:
          _identifierController.text = '9876543211';
          _passwordController.text = 'Password@123';
          break;
        case UserRole.DELIVERY_PARTNER:
          _identifierController.text = '9876543212';
          _passwordController.text = 'Password@123';
          break;
        case UserRole.ADMIN:
          _identifierController.text = 'admin@ingrezy.com';
          _passwordController.text = 'Admin@123';
          break;
      }
    });
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _showServerSettingsDialog() {
    final l10n = AppLocalizations.of(context);
    final urlController = TextEditingController(text: ApiConfig.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.warmWhite,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          l10n.settings,
          style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.cocoaBrown),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Configure the server base URL for your environment:',
              style: TextStyle(fontSize: 13, color: AppTheme.cocoaBrownLight),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: urlController,
              style: const TextStyle(color: AppTheme.cocoaBrown),
              decoration: const InputDecoration(
                labelText: 'Base URL',
                hintText: 'e.g. http://10.0.2.2:5000 or http://192.168.1.5:5000',
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '• Android Emulator: http://10.0.2.2:5000\n• Physical Phone: http://<Your-PC-IP>:5000\n• Desktop / Web: http://localhost:5000',
              style: TextStyle(fontSize: 11, color: AppTheme.cocoaBrownLight),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              ApiConfig.setCustomBaseUrl('');
              Navigator.pop(ctx);
              setState(() {});
            },
            child: Text(l10n.retry, style: const TextStyle(color: AppTheme.cocoaBrownLight)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.spiceOrange,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              ApiConfig.setCustomBaseUrl(urlController.text);
              Navigator.pop(ctx);
              setState(() {});
            },
            child: Text(l10n.save),
          ),
        ],
      ),
    );
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final l10n = AppLocalizations.of(context);
    final authProv = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProv.login(
      identifier: _identifierController.text,
      password: _passwordController.text,
    );

    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProv.errorMessage ?? l10n.loginFailed),
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
        actions: [
          const LanguageSelectorButton(),
          IconButton(
            tooltip: l10n.settings,
            icon: const Icon(Icons.settings_outlined, color: AppTheme.cocoaBrownLight),
            onPressed: _showServerSettingsDialog,
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
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
                        // Logo / Branding
                        Center(
                          child: Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              color: AppTheme.creamBeige,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppTheme.creamBeigeDark, width: 1.5),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.spiceOrange.withValues(alpha: 0.12),
                                  blurRadius: 16,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.restaurant_menu_rounded,
                              color: AppTheme.spiceOrange,
                              size: 38,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          l10n.appName,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.cocoaBrown,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          l10n.appTagline,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppTheme.cocoaBrownLight,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Role Selector for quick login
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              l10n.selectRole,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.cocoaBrown,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppTheme.creamBeige.withValues(alpha: 0.6),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                '1-Tap Demo',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.cocoaBrown,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            _buildLoginRoleCard(
                              role: UserRole.CUSTOMER,
                              icon: Icons.shopping_basket_outlined,
                              label: l10n.roleCustomer,
                            ),
                            const SizedBox(width: 8),
                            _buildLoginRoleCard(
                              role: UserRole.RETAILER,
                              icon: Icons.storefront_outlined,
                              label: l10n.roleRetailer,
                            ),
                            const SizedBox(width: 8),
                            _buildLoginRoleCard(
                              role: UserRole.DELIVERY_PARTNER,
                              icon: Icons.directions_bike_outlined,
                              label: l10n.roleDelivery,
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),

                        Row(
                          children: [
                            const Expanded(child: Divider(color: AppTheme.cardBorder)),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              child: Text(
                                'Credentials',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.cocoaBrownLight.withValues(alpha: 0.8),
                                ),
                              ),
                            ),
                            const Expanded(child: Divider(color: AppTheme.cardBorder)),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Phone or Email Input
                        TextFormField(
                          controller: _identifierController,
                          keyboardType: TextInputType.emailAddress,
                          style: const TextStyle(color: AppTheme.cocoaBrown),
                          decoration: InputDecoration(
                            labelText: '${l10n.phoneNumber} / Email',
                            labelStyle: const TextStyle(color: AppTheme.cocoaBrownLight),
                            prefixIcon: const Icon(Icons.person_outline, color: AppTheme.cocoaBrownLight),
                            hintText: l10n.phoneHint,
                            hintStyle: const TextStyle(color: AppTheme.cocoaBrownLight),
                          ),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) {
                              return l10n.requiredField;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),

                        // Password Input
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          style: const TextStyle(color: AppTheme.cocoaBrown),
                          decoration: InputDecoration(
                            labelText: l10n.password,
                            labelStyle: const TextStyle(color: AppTheme.cocoaBrownLight),
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
                        const SizedBox(height: 24),

                        // Login Button
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.spiceOrange,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          onPressed: authProv.isLoading ? null : _handleLogin,
                          child: authProv.isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text(l10n.login, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        ),
                        const SizedBox(height: 18),

                        // Register link
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "${l10n.dontHaveAccount} ",
                              style: const TextStyle(color: AppTheme.cocoaBrownLight),
                            ),
                            GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const RegisterScreen()),
                                );
                              },
                              child: Text(
                                l10n.signUp,
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

  Widget _buildLoginRoleCard({
    required UserRole role,
    required IconData icon,
    required String label,
  }) {
    final isSelected = _selectedRole == role;
    return Expanded(
      child: GestureDetector(
        onTap: () => _switchRole(role),
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
                width: 38,
                height: 38,
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
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? AppTheme.spiceOrange : AppTheme.cocoaBrown,
                  height: 1.15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
