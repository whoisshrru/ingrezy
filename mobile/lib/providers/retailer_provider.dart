import 'package:flutter/material.dart';
import '../models/order_model.dart';
import '../models/product_model.dart';
import '../services/retailer_service.dart';

class RetailerProvider extends ChangeNotifier {
  Map<String, dynamic>? _store;
  List<ProductModel> _inventory = [];
  List<OrderModel> _orders = [];
  String _activeTab = 'ALL'; // ALL, PLACED, CONFIRMED, PREPARING, READY_FOR_PICKUP
  bool _isLoading = false;
  String? _errorMessage;

  Map<String, dynamic>? get store => _store;
  List<ProductModel> get inventory => _inventory;
  List<OrderModel> get orders => _orders;
  String get activeTab => _activeTab;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  String? get storeId => _store?['id'] as String?;
  String get storeName => _store?['name'] as String? ?? 'Assigned Dark Store';

  List<OrderModel> get filteredOrders {
    if (_activeTab == 'ALL') return _orders;
    return _orders.where((o) => o.orderStatus.name == _activeTab).toList();
  }

  Future<void> loadDashboard() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    // 1. Fetch store profile
    final storeRes = await RetailerService.getStoreProfile();
    if (!storeRes.isSuccess || storeRes.data == null) {
      _isLoading = false;
      _errorMessage = storeRes.message;
      notifyListeners();
      return;
    }
    _store = storeRes.data;

    // 2. Fetch inventory and orders in parallel
    final currentStoreId = _store!['id'] as String;
    final results = await Future.wait([
      RetailerService.getStoreInventory(currentStoreId),
      RetailerService.getRetailerOrders(),
    ]);

    final invRes = results[0] as dynamic;
    final ordRes = results[1] as dynamic;

    if (invRes.isSuccess && invRes.data != null) {
      _inventory = invRes.data as List<ProductModel>;
    }
    if (ordRes.isSuccess && ordRes.data != null) {
      _orders = ordRes.data as List<OrderModel>;
    }

    _isLoading = false;
    notifyListeners();
  }

  void setActiveTab(String tab) {
    _activeTab = tab;
    notifyListeners();
  }

  Future<bool> updateStock({
    required String productId,
    int? stockQuantity,
    double? price,
    bool? isAvailable,
  }) async {
    if (storeId == null) return false;

    final response = await RetailerService.updateInventoryStock(
      storeId: storeId!,
      productId: productId,
      stockQuantity: stockQuantity,
      price: price,
      isAvailable: isAvailable,
    );

    if (response.isSuccess) {
      // Refresh inventory
      final invRes = await RetailerService.getStoreInventory(storeId!);
      if (invRes.isSuccess && invRes.data != null) {
        _inventory = invRes.data!;
      }
      notifyListeners();
      return true;
    } else {
      _errorMessage = response.message;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateOrderStatus({
    required String orderId,
    required String newStatus,
  }) async {
    final response = await RetailerService.updateOrderStatus(
      orderId: orderId,
      status: newStatus,
    );

    if (response.isSuccess && response.data != null) {
      final updatedOrder = response.data!;
      final idx = _orders.indexWhere((o) => o.id == orderId);
      if (idx != -1) {
        _orders[idx] = updatedOrder;
      }
      notifyListeners();
      return true;
    } else {
      _errorMessage = response.message;
      notifyListeners();
      return false;
    }
  }
}
