import 'package:flutter/material.dart';
import '../models/product_model.dart';
import '../services/product_service.dart';

class ProductProvider extends ChangeNotifier {
  List<ProductModel> _products = [];
  List<Map<String, dynamic>> _stores = [];
  String? _selectedStoreId;
  String _selectedCategory = 'All';
  String _searchQuery = '';
  String _selectedDietary = 'ALL';
  bool _isLoading = false;
  String? _errorMessage;

  List<ProductModel> get products => _products;
  List<Map<String, dynamic>> get stores => _stores;
  String? get selectedStoreId => _selectedStoreId;
  String get selectedCategory => _selectedCategory;
  String get searchQuery => _searchQuery;
  String get selectedDietary => _selectedDietary;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<String> get categories {
    final set = <String>{'All'};
    for (var p in _products) {
      if (p.category.isNotEmpty) set.add(p.category);
    }
    return set.toList();
  }

  Future<void> fetchStores() async {
    final response = await ProductService.getStores();
    if (response.isSuccess && response.data != null) {
      _stores = response.data!;
      if (_selectedStoreId == null && _stores.isNotEmpty) {
        final storeWithStock = _stores.firstWhere(
          (s) => s['_count'] != null && (s['_count']['inventory'] as num? ?? 0) > 0,
          orElse: () => _stores.first,
        );
        _selectedStoreId = storeWithStock['id'] as String?;
      }
      notifyListeners();
    }
  }

  void selectStore(String storeId) {
    if (_selectedStoreId != storeId) {
      _selectedStoreId = storeId;
      notifyListeners();
      fetchProducts();
    }
  }

  Future<void> fetchProducts() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    // If a store is selected, fetch store inventory to reflect true store prices/availability
    if (_selectedStoreId != null && _selectedStoreId!.isNotEmpty) {
      final res = await ProductService.getStoreInventory(_selectedStoreId!);
      if (res.isSuccess && res.data != null && res.data!.isNotEmpty) {
        _isLoading = false;
        _products = res.data!;
        _applyLocalFilters();
        notifyListeners();
        return;
      }
    }

    // Fallback to general catalog
    final response = await ProductService.getProducts(
      search: _searchQuery,
      category: _selectedCategory,
      dietaryType: _selectedDietary,
    );

    _isLoading = false;
    if (response.isSuccess && response.data != null) {
      _products = response.data!;
      _errorMessage = null;
    } else {
      _errorMessage = response.message;
    }
    notifyListeners();
  }

  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
    fetchProducts();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
    fetchProducts();
  }

  void setDietary(String dietary) {
    _selectedDietary = dietary;
    notifyListeners();
    fetchProducts();
  }

  void _applyLocalFilters() {
    if (_selectedCategory != 'All') {
      _products = _products
          .where((p) => p.category.toLowerCase() == _selectedCategory.toLowerCase())
          .toList();
    }
    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.toLowerCase().trim();
      _products = _products
          .where((p) =>
              p.name.toLowerCase().contains(q) ||
              (p.description != null && p.description!.toLowerCase().contains(q)))
          .toList();
    }
    if (_selectedDietary != 'ALL') {
      _products = _products
          .where((p) => p.dietaryType.name == _selectedDietary)
          .toList();
    }
  }
}
