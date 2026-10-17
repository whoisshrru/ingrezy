import 'package:flutter/material.dart';
import '../models/order_model.dart';
import '../services/order_service.dart';

class OrderProvider extends ChangeNotifier {
  List<OrderModel> _orders = [];
  OrderModel? _selectedOrder;
  Map<String, dynamic>? _activeDeliveryOtp;
  bool _isLoading = false;
  String? _errorMessage;

  List<OrderModel> get orders => _orders;
  OrderModel? get selectedOrder => _selectedOrder;
  Map<String, dynamic>? get activeDeliveryOtp => _activeDeliveryOtp;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchOrders() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final response = await OrderService.getOrders();
    _isLoading = false;

    if (response.isSuccess && response.data != null) {
      _orders = response.data!;
      _errorMessage = null;
    } else {
      _errorMessage = response.message;
    }
    notifyListeners();
  }

  Future<OrderModel?> checkout({
    required String addressId,
    String paymentMethod = 'COD',
    String? specialInstructions,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final response = await OrderService.checkout(
      addressId: addressId,
      paymentMethod: paymentMethod,
      specialInstructions: specialInstructions,
    );

    _isLoading = false;
    if (response.isSuccess && response.data != null) {
      final newOrder = response.data!;
      _orders.insert(0, newOrder);
      _selectedOrder = newOrder;
      notifyListeners();
      return newOrder;
    } else {
      _errorMessage = response.message;
      if (response.errors.isNotEmpty) {
        _errorMessage = '$_errorMessage: ${response.errors.join(", ")}';
      }
      notifyListeners();
      return null;
    }
  }

  Future<void> fetchOrderDetails(String orderId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final response = await OrderService.getOrderById(orderId);
    _isLoading = false;

    if (response.isSuccess && response.data != null) {
      _selectedOrder = response.data;
      _errorMessage = null;
    } else {
      _errorMessage = response.message;
    }
    notifyListeners();
  }

  Future<Map<String, dynamic>?> fetchDeliveryOtp(String orderId) async {
    final response = await OrderService.getDeliveryOtp(orderId);
    if (response.isSuccess && response.data != null) {
      _activeDeliveryOtp = response.data;
      notifyListeners();
      return _activeDeliveryOtp;
    }
    return null;
  }
}
