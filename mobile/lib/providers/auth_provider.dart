import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = true;
  String? _errorMessage;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  UserRole get currentRole => _user?.role ?? UserRole.CUSTOMER;
  String? get errorMessage => _errorMessage;

  Future<void> init() async {
    _isLoading = true;
    notifyListeners();

    final token = await ApiClient.getToken();
    if (token != null && token.isNotEmpty) {
      _user = await AuthService.getCachedUser();
      // Silently refresh profile
      final profileRes = await AuthService.getProfile();
      if (profileRes.isSuccess && profileRes.data != null) {
        _user = profileRes.data;
      }
    } else {
      _user = null;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login({
    required String identifier,
    required String password,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final response = await AuthService.login(
      identifier: identifier,
      password: password,
    );

    _isLoading = false;
    if (response.isSuccess && response.data != null) {
      _user = response.data;
      _errorMessage = null;
      notifyListeners();
      return true;
    } else {
      _errorMessage = response.message;
      if (response.errors.isNotEmpty) {
        _errorMessage = '$_errorMessage: ${response.errors.join(", ")}';
      }
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String phoneNumber,
    required String password,
    String? email,
    required UserRole role,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final response = await AuthService.register(
      name: name,
      phoneNumber: phoneNumber,
      password: password,
      email: email,
      role: role,
    );

    _isLoading = false;
    if (response.isSuccess && response.data != null) {
      _user = response.data;
      _errorMessage = null;
      notifyListeners();
      return true;
    } else {
      _errorMessage = response.message;
      if (response.errors.isNotEmpty) {
        _errorMessage = '$_errorMessage: ${response.errors.join(", ")}';
      }
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await AuthService.logout();
    _user = null;
    _errorMessage = null;
    notifyListeners();
  }
}
