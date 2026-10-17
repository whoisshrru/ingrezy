import 'package:flutter/material.dart';
import '../models/delivery_model.dart';
import '../services/delivery_service.dart';

class DeliveryProvider extends ChangeNotifier {
  Map<String, dynamic>? _profileData;
  List<DeliveryModel> _assignments = [];
  bool _isLoading = false;
  String? _errorMessage;

  Map<String, dynamic>? get profileData => _profileData;
  List<DeliveryModel> get assignments => _assignments;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<DeliveryModel> get activeDeliveries => _assignments
      .where((d) =>
          d.status == DeliveryStatus.ASSIGNED ||
          d.status == DeliveryStatus.ACCEPTED ||
          d.status == DeliveryStatus.PICKED_UP ||
          d.status == DeliveryStatus.ARRIVED_AT_LOCATION)
      .toList();

  List<DeliveryModel> get completedDeliveries => _assignments
      .where((d) => d.status == DeliveryStatus.DELIVERED)
      .toList();

  Future<void> loadDashboard() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final results = await Future.wait([
      DeliveryService.getProfile(),
      DeliveryService.getAssignments(),
    ]);

    final profRes = results[0] as dynamic;
    final assignRes = results[1] as dynamic;

    if (profRes.isSuccess && profRes.data != null) {
      _profileData = profRes.data as Map<String, dynamic>;
    }
    if (assignRes.isSuccess && assignRes.data != null) {
      _assignments = assignRes.data as List<DeliveryModel>;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> acceptDelivery(String deliveryId) async {
    _isLoading = true;
    notifyListeners();

    final response = await DeliveryService.acceptAssignment(deliveryId);
    _isLoading = false;

    if (response.isSuccess) {
      await loadDashboard();
      return true;
    } else {
      _errorMessage = response.message;
      notifyListeners();
      return false;
    }
  }

  Future<bool> pickupDelivery(String deliveryId) async {
    _isLoading = true;
    notifyListeners();

    final response = await DeliveryService.pickupDelivery(deliveryId);
    _isLoading = false;

    if (response.isSuccess) {
      await loadDashboard();
      return true;
    } else {
      _errorMessage = response.message;
      notifyListeners();
      return false;
    }
  }

  Future<bool> completeWithOtp({
    required String deliveryId,
    required String otp,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final response = await DeliveryService.completeDeliveryWithOtp(
      deliveryId: deliveryId,
      otp: otp,
    );

    _isLoading = false;
    if (response.isSuccess) {
      await loadDashboard();
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

  Future<bool> updateGpsCoordinates(double latitude, double longitude) async {
    final response = await DeliveryService.updateLiveLocation(
      latitude: latitude,
      longitude: longitude,
    );
    return response.isSuccess;
  }
}
